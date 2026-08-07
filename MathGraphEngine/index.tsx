import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, HelpCircle } from 'lucide-react';

// ============================================================================
// TOKENIZER & MATHEMATICAL PARSER
// ============================================================================

interface Token {
  type: 'NUMBER' | 'VAR' | 'OP' | 'LPAREN' | 'RPAREN' | 'FUNC' | 'COMMA' | 'COLON' | 'LBRACE' | 'RBRACE' | 'EOF' | 'PIPE';
  value: string;
}

function tokenize(str: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let inPipe = false;

  // Pre-process common symbols and superscripts
  str = str
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁴/g, '^4')
    .replace(/π/gi, 'pi')
    .replace(/θ/gi, 't'); // treat theta as parametric t

  const funcNames = new Set([
    'sin', 'cos', 'tan', 'csc', 'sec', 'cot', 
    'asin', 'acos', 'atan', 'arcsin', 'arccos', 'arctan',
    'abs', 'sqrt', 'ln', 'log', 'exp'
  ]);

  while (i < str.length) {
    const char = str[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < str.length && /[0-9.]/.test(str[i])) {
        numStr += str[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    if (/[a-zA-Z]/.test(char)) {
      let idStr = '';
      while (i < str.length && /[a-zA-Z0-9]/.test(str[i])) {
        idStr += str[i];
        i++;
      }
      const lowerId = idStr.toLowerCase();
      if (lowerId === 'pi') {
        tokens.push({ type: 'NUMBER', value: Math.PI.toString() });
      } else if (lowerId === 'e') {
        tokens.push({ type: 'NUMBER', value: Math.E.toString() });
      } else if (funcNames.has(lowerId)) {
        tokens.push({ type: 'FUNC', value: lowerId });
      } else if (lowerId === 'x' || lowerId === 'y' || lowerId === 't') {
        tokens.push({ type: 'VAR', value: lowerId });
      } else {
        // Break compound variables like "xy" into separate letters
        for (let j = 0; j < lowerId.length; j++) {
          const lChar = lowerId[j];
          tokens.push({ type: 'VAR', value: lChar });
        }
      }
      continue;
    }

    if (char === '|') {
      tokens.push({ type: 'PIPE', value: inPipe ? 'CLOSE' : 'OPEN' });
      inPipe = !inPipe;
      i++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }
    if (char === '{') {
      tokens.push({ type: 'LBRACE', value: '{' });
      i++;
      continue;
    }
    if (char === '}') {
      tokens.push({ type: 'RBRACE', value: '}' });
      i++;
      continue;
    }
    if (char === ':') {
      tokens.push({ type: 'COLON', value: ':' });
      i++;
      continue;
    }
    if (char === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    // Compound inequality and comparison operators
    if (char === '<' || char === '>' || char === '=' || char === '!') {
      let op = char;
      if (i + 1 < str.length && str[i + 1] === '=') {
        op += '=';
        i += 2;
      } else {
        i++;
      }
      tokens.push({ type: 'OP', value: op });
      continue;
    }

    if (['+', '-', '*', '/', '^'].includes(char)) {
      tokens.push({ type: 'OP', value: char });
      i++;
      continue;
    }

    // fallback / skip unrecognized characters
    i++;
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// Automatically inserts multiplication operators (e.g. 2x -> 2*x, (x+1)(x-1) -> (x+1)*(x-1))
function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const result: Token[] = [];
  for (let idx = 0; idx < tokens.length; idx++) {
    const curr = tokens[idx];
    result.push(curr);

    if (idx + 1 < tokens.length) {
      const next = tokens[idx + 1];

      const isCurrMultiplier = 
        curr.type === 'NUMBER' || 
        curr.type === 'VAR' || 
        curr.type === 'RPAREN' || 
        (curr.type === 'PIPE' && curr.value === 'CLOSE');

      const isNextMultiplied = 
        next.type === 'VAR' || 
        next.type === 'FUNC' || 
        next.type === 'LPAREN' || 
        (next.type === 'PIPE' && next.value === 'OPEN');

      if (isCurrMultiplier && isNextMultiplied) {
        result.push({ type: 'OP', value: '*' });
      }
    }
  }
  return result;
}

type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'unary'; op: string; expr: ASTNode }
  | { type: 'binary'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'function'; name: string; expr: ASTNode };

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(type?: string, value?: string): Token {
    const tok = this.peek();
    if (type && tok.type !== type) {
      throw new Error(`Expected token type ${type}, got ${tok.type}`);
    }
    if (value && tok.value !== value) {
      throw new Error(`Expected token value ${value}, got ${tok.value}`);
    }
    this.pos++;
    return tok;
  }

  public parse(): ASTNode {
    const node = this.parseExpression();
    if (this.peek().type !== 'EOF') {
      throw new Error(`Unexpected token ${this.peek().value} at end`);
    }
    return node;
  }

  private parseExpression(): ASTNode {
    let node = this.parseTerm();
    while (this.peek().type === 'OP' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseTerm();
      node = { type: 'binary', op, left: node, right };
    }
    return node;
  }

  private parseTerm(): ASTNode {
    let node = this.parsePower();
    while (this.peek().type === 'OP' && (this.peek().value === '*' || this.peek().value === '/')) {
      const op = this.consume().value;
      const right = this.parsePower();
      node = { type: 'binary', op, left: node, right };
    }
    return node;
  }

  private parsePower(): ASTNode {
    let node = this.parseUnary();
    if (this.peek().type === 'OP' && this.peek().value === '^') {
      this.consume();
      const right = this.parsePower(); // right-associative power
      node = { type: 'binary', op: '^', left: node, right };
    }
    return node;
  }

  private parseUnary(): ASTNode {
    const tok = this.peek();
    if (tok.type === 'OP' && (tok.value === '+' || tok.value === '-')) {
      this.consume();
      const expr = this.parseUnary();
      return { type: 'unary', op: tok.value, expr };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek();

    if (tok.type === 'NUMBER') {
      this.consume();
      return { type: 'number', value: parseFloat(tok.value) };
    }

    if (tok.type === 'VAR') {
      this.consume();
      return { type: 'variable', name: tok.value };
    }

    if (tok.type === 'FUNC') {
      this.consume();
      this.consume('LPAREN');
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return { type: 'function', name: tok.value, expr };
    }

    if (tok.type === 'LPAREN') {
      this.consume();
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return expr;
    }

    if (tok.type === 'PIPE' && tok.value === 'OPEN') {
      this.consume();
      const expr = this.parseExpression();
      this.consume('PIPE', 'CLOSE');
      return { type: 'function', name: 'abs', expr };
    }

    throw new Error(`Unexpected token in primary: ${tok.value || tok.type}`);
  }
}

function evaluateAST(node: ASTNode, x: number, y: number, t: number): number {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'variable':
      if (node.name === 'x') return x;
      if (node.name === 'y') return y;
      if (node.name === 't') return t;
      return 0;
    case 'unary': {
      const val = evaluateAST(node.expr, x, y, t);
      return node.op === '-' ? -val : val;
    }
    case 'binary': {
      const left = evaluateAST(node.left, x, y, t);
      const right = evaluateAST(node.right, x, y, t);
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        case '^': return Math.pow(left, right);
        default: return 0;
      }
    }
    case 'function': {
      const val = evaluateAST(node.expr, x, y, t);
      switch (node.name) {
        case 'sin': return Math.sin(val);
        case 'cos': return Math.cos(val);
        case 'tan': return Math.tan(val);
        case 'csc': return 1 / Math.sin(val);
        case 'sec': return 1 / Math.cos(val);
        case 'cot': return 1 / Math.tan(val);
        case 'asin': return Math.asin(val);
        case 'acos': return Math.acos(val);
        case 'atan': return Math.atan(val);
        case 'arcsin': return Math.asin(val);
        case 'arccos': return Math.acos(val);
        case 'arctan': return Math.atan(val);
        case 'abs': return Math.abs(val);
        case 'sqrt': return Math.sqrt(val);
        case 'ln': return Math.log(val);
        case 'log': return Math.log10(val);
        case 'exp': return Math.exp(val);
        default: return 0;
      }
    }
  }
}

// Parenthesis-aware string split helper
function splitParenthesisAware(str: string, delimiter: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenLevel = 0;
  let braceLevel = 0;
  let bracketLevel = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') parenLevel++;
    else if (char === ')') parenLevel--;
    else if (char === '{') braceLevel++;
    else if (char === '}') braceLevel--;
    else if (char === '[') bracketLevel++;
    else if (char === ']') bracketLevel--;

    if (char === delimiter && parenLevel === 0 && braceLevel === 0 && bracketLevel === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

// Piecewise component parser
function parsePiece(pieceStr: string) {
  const parts = pieceStr.split(':').map(s => s.trim());
  if (parts.length < 2) return null;
  
  let exprStr = parts[0];
  let condStr = parts[1];

  const hasInequality = (s: string) => /[<>=]/.test(s);
  if (hasInequality(exprStr) && !hasInequality(condStr)) {
    const temp = exprStr;
    exprStr = condStr;
    condStr = temp;
  }

  // Strip y= or f(x)= from expression if present to avoid parser crashes
  exprStr = exprStr.replace(/^(?:y|f\(x\))\s*=\s*/i, '');

  return { exprStr, condStr };
}

// Numerical condition parser & compiler
function parseCondition(condStr: string): (x: number, y: number) => boolean {
  const str = condStr.replace(/\s+/g, '');

  const doubleInequality = /^(-?[\d.]+)(<=?|>=?)([xyXY])(<=?|>=?)(-?[\d.]+)$/;
  const matchDouble = str.match(doubleInequality);
  if (matchDouble) {
    const val1 = parseFloat(matchDouble[1]);
    const op1 = matchDouble[2];
    const varName = matchDouble[3].toLowerCase();
    const op2 = matchDouble[4];
    const val2 = parseFloat(matchDouble[5]);

    return (x: number, y: number) => {
      const v = varName === 'x' ? x : y;
      let ok1 = false;
      let ok2 = false;

      if (op1 === '<') ok1 = val1 < v;
      else if (op1 === '<=') ok1 = val1 <= v;
      else if (op1 === '>') ok1 = val1 > v;
      else if (op1 === '>=') ok1 = val1 >= v;

      if (op2 === '<') ok2 = v < val2;
      else if (op2 === '<=') ok2 = v <= val2;
      else if (op2 === '>') ok2 = v > val2;
      else if (op2 === '>=') ok2 = v >= val2;

      return ok1 && ok2;
    };
  }

  const singleInequality = /^([xyXY])(<=?|>=?|!=|=)(-?[\d.]+)$/;
  const matchSingle = str.match(singleInequality);
  if (matchSingle) {
    const varName = matchSingle[1].toLowerCase();
    const op = matchSingle[2];
    const val = parseFloat(matchSingle[3]);

    return (x: number, y: number) => {
      const v = varName === 'x' ? x : y;
      if (op === '<') return v < val;
      if (op === '<=') return v <= val;
      if (op === '>') return v > val;
      if (op === '>=') return v >= val;
      if (op === '!=') return Math.abs(v - val) > 1e-9;
      if (op === '=') return Math.abs(v - val) < 1e-9;
      return true;
    };
  }

  const singleInequalityRight = /^(-?[\d.]+)(<=?|>=?)([xyXY])$/;
  const matchSingleRight = str.match(singleInequalityRight);
  if (matchSingleRight) {
    const val = parseFloat(matchSingleRight[1]);
    const op = matchSingleRight[2];
    const varName = matchSingleRight[3].toLowerCase();

    return (x: number, y: number) => {
      const v = varName === 'x' ? x : y;
      if (op === '<') return val < v;
      if (op === '<=') return val <= v;
      if (op === '>') return val > v;
      if (op === '>=') return val >= v;
      return true;
    };
  }

  return () => true;
}

interface PiecewiseBoundaryPoint {
  x: number;
  y: number;
  isClosed: boolean;
}

interface TrigStepCandidate {
  value: number;
  num: number;
  den: number;
}

const trigCandidates: TrigStepCandidate[] = [
  { value: Math.PI / 12, num: 1, den: 12 },
  { value: Math.PI / 6, num: 1, den: 6 },
  { value: Math.PI / 4, num: 1, den: 4 },
  { value: Math.PI / 2, num: 1, den: 2 },
  { value: Math.PI, num: 1, den: 1 },
  { value: 2 * Math.PI, num: 2, den: 1 },
  { value: 4 * Math.PI, num: 4, den: 1 },
  { value: 8 * Math.PI, num: 8, den: 1 },
  { value: 10 * Math.PI, num: 10, den: 1 },
  { value: 20 * Math.PI, num: 20, den: 1 },
];

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function getBestTrigStep(spanX: number): TrigStepCandidate {
  const target = spanX / 8;
  let best = trigCandidates[0];
  let minDiff = Math.abs(trigCandidates[0].value - target);
  for (let i = 1; i < trigCandidates.length; i++) {
    const diff = Math.abs(trigCandidates[i].value - target);
    if (diff < minDiff) {
      minDiff = diff;
      best = trigCandidates[i];
    }
  }
  return best;
}

interface CustomTrigLabel {
  isFraction: boolean;
  sign: string;
  numText: string;
  denText: string;
  fullText: string;
}

function getTrigLabelComponents(x: number, cand: TrigStepCandidate): CustomTrigLabel {
  const k = Math.round(x / cand.value);
  if (k === 0) {
    return { isFraction: false, sign: "", numText: "", denText: "", fullText: "0" };
  }
  
  let num = k * cand.num;
  let den = cand.den;
  const d = gcd(num, den);
  num = num / d;
  den = den / d;
  
  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);
  
  if (den === 1) {
    const numText = absNum === 1 ? "π" : absNum + "π";
    return { isFraction: false, sign, numText, denText: "1", fullText: sign + numText };
  } else {
    const numText = absNum === 1 ? "π" : absNum + "π";
    return { isFraction: true, sign, numText, denText: String(den), fullText: sign + numText + "/" + den };
  }
}

function parseValue(valStr: string): number {
  if (!valStr) return 0;
  const clean = valStr.trim().toLowerCase()
    .replace(/pi/g, String(Math.PI))
    .replace(/π/g, String(Math.PI));
  try {
    if (/^[0-9+\-*/().\s]+$/.test(clean)) {
      return new Function(`return ${clean}`)();
    }
  } catch (e) {
    console.error('Failed to parse value:', valStr, e);
  }
  return parseFloat(valStr) || 0;
}

function getEquationEndpoints(node: ASTNode, domainStr: string): PiecewiseBoundaryPoint[] {
  const points: PiecewiseBoundaryPoint[] = [];
  const str = (domainStr || '').replace(/\s+/g, '');

  // 1. Double inequality like "A <= x <= B" with expression support
  const doubleInequality = /^([^<=]+)(<=?|>=?)([xyXY])(<=?|>=?)([^>=]+)$/;
  const matchDouble = str.match(doubleInequality);
  if (matchDouble) {
    const val1 = parseValue(matchDouble[1]);
    const op1 = matchDouble[2];
    const varName = matchDouble[3].toLowerCase();
    const op2 = matchDouble[4];
    const val2 = parseValue(matchDouble[5]);

    if (varName === 'x') {
      const y1 = evaluateAST(node, val1, 0, 0);
      if (!isNaN(y1) && isFinite(y1)) {
        points.push({ x: val1, y: y1, isClosed: op1 === '<=' || op1 === '>=' });
      }
      const y2 = evaluateAST(node, val2, 0, 0);
      if (!isNaN(y2) && isFinite(y2)) {
        points.push({ x: val2, y: y2, isClosed: op2 === '<=' || op2 === '>=' });
      }
    }
  }

  // 2. Single inequality like "x >= A"
  const singleInequality = /^([xyXY])(<=?|>=?|!=|=)(.+)$/;
  const matchSingle = str.match(singleInequality);
  if (matchSingle) {
    const varName = matchSingle[1].toLowerCase();
    const op = matchSingle[2];
    const val = parseValue(matchSingle[3]);

    if (varName === 'x') {
      const y = evaluateAST(node, val, 0, 0);
      if (!isNaN(y) && isFinite(y)) {
        points.push({ x: val, y, isClosed: op === '<=' || op === '>=' || op === '=' });
      }
    }
  }

  // 3. Single inequality right-sided like "A <= x"
  const singleInequalityRight = /^([^<=]+)(<=?|>=?)([xyXY])$/;
  const matchSingleRight = str.match(singleInequalityRight);
  if (matchSingleRight) {
    const val = parseValue(matchSingleRight[1]);
    const op = matchSingleRight[2];
    const varName = matchSingleRight[3].toLowerCase();

    if (varName === 'x') {
      const y = evaluateAST(node, val, 0, 0);
      if (!isNaN(y) && isFinite(y)) {
        points.push({ x: val, y, isClosed: op === '<=' || op === '>=' });
      }
    }
  }

  const resolved: PiecewiseBoundaryPoint[] = [];
  points.forEach(pt => {
    const existing = resolved.find(r => Math.abs(r.x - pt.x) < 1e-4 && Math.abs(r.y - pt.y) < 1e-4);
    if (existing) {
      if (pt.isClosed) existing.isClosed = true;
    } else {
      resolved.push(pt);
    }
  });

  return resolved;
}

function getPiecewiseEndpoints(pieces: { condStr: string; node: ASTNode }[]): PiecewiseBoundaryPoint[] {
  const points: PiecewiseBoundaryPoint[] = [];

  pieces.forEach(piece => {
    points.push(...getEquationEndpoints(piece.node, piece.condStr));
  });

  const resolved: PiecewiseBoundaryPoint[] = [];
  points.forEach(pt => {
    const existing = resolved.find(r => Math.abs(r.x - pt.x) < 1e-4 && Math.abs(r.y - pt.y) < 1e-4);
    if (existing) {
      if (pt.isClosed) existing.isClosed = true;
    } else {
      resolved.push(pt);
    }
  });

  return resolved;
}

// Parametric, Implicit, and Inequality parsers
function parseParametric(eqStr: string): { xNode: ASTNode; yNode: ASTNode } | null {
  const match = eqStr.match(/x\s*=\s*(.+?)\s*,\s*y\s*=\s*(.+)/i);
  if (match) {
    try {
      const xTokens = insertImplicitMultiplication(tokenize(match[1]));
      const yTokens = insertImplicitMultiplication(tokenize(match[2]));
      const xNode = new Parser(xTokens).parse();
      const yNode = new Parser(yTokens).parse();
      return { xNode, yNode };
    } catch (e) {
      return null;
    }
  }
  return null;
}

function parseImplicit(eqStr: string): { leftNode: ASTNode; rightNode: ASTNode } | null {
  const parts = eqStr.split('=');
  if (parts.length === 2) {
    try {
      const leftTokens = insertImplicitMultiplication(tokenize(parts[0]));
      const rightTokens = insertImplicitMultiplication(tokenize(parts[1]));
      const leftNode = new Parser(leftTokens).parse();
      const rightNode = new Parser(rightTokens).parse();
      return { leftNode, rightNode };
    } catch (e) {
      return null;
    }
  }
  return null;
}

function parseInequality(eqStr: string): { leftNode: ASTNode; rightNode: ASTNode; op: string } | null {
  const match = eqStr.match(/([<>=!]+)/);
  if (match) {
    const op = match[1];
    if (op === '<' || op === '>' || op === '<=' || op === '>=') {
      const parts = eqStr.split(op);
      if (parts.length === 2) {
        try {
          const leftTokens = insertImplicitMultiplication(tokenize(parts[0]));
          const rightTokens = insertImplicitMultiplication(tokenize(parts[1]));
          const leftNode = new Parser(leftTokens).parse();
          const rightNode = new Parser(rightTokens).parse();
          return { leftNode, rightNode, op };
        } catch (e) {
          return null;
        }
      }
    }
  }
  return null;
}

function roundNice(val: number): number {
  if (isNaN(val) || !isFinite(val)) return val;
  const rounded = Math.round(val);
  if (Math.abs(val - rounded) < 1e-4) {
    return rounded;
  }
  return parseFloat(val.toFixed(1));
}

function getDomainInterval(domainStr: string): { xMin: number; xMax: number } {
  const str = (domainStr || '').replace(/\s+/g, '');
  if (!str || str === 'all' || str === 'ح' || str.includes('R')) {
    return { xMin: -10, xMax: 10 };
  }

  // 1. Double inequality like "A <= x <= B" with expression support
  const doubleRegex = /^([^<=]+)(<=?|>=?)([xX])(<=?|>=?)([^>=]+)$/;
  const matchDouble = str.match(doubleRegex);
  if (matchDouble) {
    const val1 = parseValue(matchDouble[1]);
    const op1 = matchDouble[2];
    const op2 = matchDouble[4];
    const val2 = parseValue(matchDouble[5]);
    
    if (op1.startsWith('<') && op2.startsWith('<')) {
      return { xMin: val1, xMax: val2 };
    } else if (op1.startsWith('>') && op2.startsWith('>')) {
      return { xMin: val2, xMax: val1 };
    }
  }

  // 2. Single inequality like "x >= A"
  const singleRegex = /^([xX])(<=?|>=?)(.+)$/;
  const matchSingle = str.match(singleRegex);
  if (matchSingle) {
    const op = matchSingle[2];
    const val = parseValue(matchSingle[3]);
    if (op === '>' || op === '>=') {
      return { xMin: val, xMax: 15 };
    } else if (op === '<' || op === '<=') {
      return { xMin: -15, xMax: val };
    }
  }

  // 3. Single inequality right-sided like "A <= x"
  const singleRightRegex = /^([^<=]+)(<=?|>=?)([xX])$/;
  const matchSingleRight = str.match(singleRightRegex);
  if (matchSingleRight) {
    const val = parseValue(matchSingleRight[1]);
    const op = matchSingleRight[2];
    if (op === '<' || op === '<=') {
      return { xMin: val, xMax: 15 };
    } else if (op === '>' || op === '>=') {
      return { xMin: -15, xMax: val };
    }
  }

  return { xMin: -10, xMax: 10 };
}

function getRangeInterval(rangeStr: string): { yMin: number; yMax: number } {
  const str = (rangeStr || '').replace(/\s+/g, '');
  if (!str || str === 'all' || str === 'ح' || str.includes('R')) {
    return { yMin: -6, yMax: 6 };
  }

  // 1. Double inequality like "A <= y <= B"
  const doubleRegex = /^([^<=]+)(<=?|>=?)([yY])(<=?|>=?)([^>=]+)$/;
  const matchDouble = str.match(doubleRegex);
  if (matchDouble) {
    const val1 = parseValue(matchDouble[1]);
    const op1 = matchDouble[2];
    const op2 = matchDouble[4];
    const val2 = parseValue(matchDouble[5]);
    
    if (op1.startsWith('<') && op2.startsWith('<')) {
      return { yMin: val1, yMax: val2 };
    } else if (op1.startsWith('>') && op2.startsWith('>')) {
      return { yMin: val2, yMax: val1 };
    }
  }

  // 2. Single inequality like "y >= A"
  const singleRegex = /^([yY])(<=?|>=?)(.+)$/;
  const matchSingle = str.match(singleRegex);
  if (matchSingle) {
    const op = matchSingle[2];
    const val = parseValue(matchSingle[3]);
    if (op === '>' || op === '>=') {
      return { yMin: val, yMax: 6 };
    } else if (op === '<' || op === '<=') {
      return { yMin: -6, yMax: val };
    }
  }

  // 3. Single inequality right-sided like "A <= y"
  const singleRightRegex = /^([^<=]+)(<=?|>=?)([yY])$/;
  const matchSingleRight = str.match(singleRightRegex);
  if (matchSingleRight) {
    const val = parseValue(matchSingleRight[1]);
    const op = matchSingleRight[2];
    if (op === '<' || op === '<=') {
      return { yMin: val, yMax: 6 };
    } else if (op === '>' || op === '>=') {
      return { yMin: -6, yMax: val };
    }
  }

  return { yMin: -6, yMax: 6 };
}

function computeMathematicalRange(node: ASTNode, domainStr: string): string {
  const hasLowerBound = /(-?[\d.]+)(<=?|>=?)[xX]|[xX](>=?|>)(-?[\d.]+)/.test(domainStr);
  const hasUpperBound = /([xX])(<=?|<)(-?[\d.]+)|(-?[\d.]+)(>=?|>)([xX])/.test(domainStr);
  
  const { xMin, xMax } = getDomainInterval(domainStr);
  
  const yValues: number[] = [];
  const steps = 1000;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (xMax - xMin) * (i / steps);
    const y = evaluateAST(node, x, 0, 0);
    if (!isNaN(y) && isFinite(y)) {
      yValues.push(y);
    }
  }
  
  if (yValues.length === 0) return "all";
  
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  if (maxY - minY < 0.005) {
    return `y = ${roundNice(minY)}`;
  }
  
  let isBoundedBelow = true;
  let isBoundedAbove = true;
  
  if (!hasLowerBound) {
    const yFarLeft = evaluateAST(node, -100, 0, 0);
    if (!isNaN(yFarLeft) && isFinite(yFarLeft)) {
      if (yFarLeft > 100) isBoundedAbove = false;
      if (yFarLeft < -100) isBoundedBelow = false;
    }
  }
  
  if (!hasUpperBound) {
    const yFarRight = evaluateAST(node, 100, 0, 0);
    if (!isNaN(yFarRight) && isFinite(yFarRight)) {
      if (yFarRight > 100) isBoundedAbove = false;
      if (yFarRight < -100) isBoundedBelow = false;
    }
  }
  
  if (isBoundedBelow && !isBoundedAbove) {
    return `y >= ${roundNice(minY)}`;
  }
  if (isBoundedAbove && !isBoundedBelow) {
    return `y <= ${roundNice(maxY)}`;
  }
  if (isBoundedBelow && isBoundedAbove) {
    return `${roundNice(minY)} <= y <= ${roundNice(maxY)}`;
  }
  
  return "all";
}

// Unified mathematical representation of parsed shapes & equations
class ParsedEquation {
  public raw: string;
  public type: 'explicit_y' | 'explicit_x' | 'piecewise' | 'implicit' | 'parametric' | 'inequality' | 'vector' | 'ray' | 'segment';
  
  public node?: ASTNode;
  
  public pieces?: { 
    node: ASTNode; 
    condFn: (x: number, y: number) => boolean; 
    condStr: string;
    rangeStr?: string;
    rangeFn?: (x: number, y: number) => boolean;
  }[];
  public piecewiseEndpoints?: PiecewiseBoundaryPoint[];

  public domainStr?: string;
  public domainFn?: (x: number, y: number) => boolean;
  public domainEndpoints?: PiecewiseBoundaryPoint[];

  public leftNode?: ASTNode;
  public rightNode?: ASTNode;

  public xNode?: ASTNode;
  public yNode?: ASTNode;

  public inequalityOp?: string;

  public p1?: { x: number; y: number };
  public p2?: { x: number; y: number };

  public rangeStr?: string;
  public rangeFn?: (x: number, y: number) => boolean;

  constructor(eqStr: string, originalPieces?: any[], domainStr?: string, rangeStr?: string) {
    this.raw = eqStr.trim();
    
    if (domainStr) {
      this.domainStr = domainStr;
      this.domainFn = parseCondition(domainStr);
    }

    if (rangeStr) {
      this.rangeStr = rangeStr;
      this.rangeFn = parseCondition(rangeStr);
    }
    
    // 1. Geometric segment, ray, or vector
    const geomRegex = /^\s*(?:vector|ray|segment)?\s*\(?\s*\[?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]?\s*\)?\s*(?:->|to)\s*\(?\s*\[?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]?\s*\)?\s*$/i;
    const matchGeom = this.raw.match(geomRegex);
    if (matchGeom) {
      this.p1 = { x: parseFloat(matchGeom[1]), y: parseFloat(matchGeom[2]) };
      this.p2 = { x: parseFloat(matchGeom[3]), y: parseFloat(matchGeom[4]) };
      
      const lower = this.raw.toLowerCase();
      if (lower.includes('ray')) {
        this.type = 'ray';
      } else if (lower.includes('segment') || lower.includes('to')) {
        this.type = 'segment';
      } else {
        this.type = 'vector';
      }
      return;
    }

    const singleVecRegex = /^\s*vector\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)\s*$/i;
    const matchSingleVec = this.raw.match(singleVecRegex);
    if (matchSingleVec) {
      this.p1 = { x: 0, y: 0 };
      this.p2 = { x: parseFloat(matchSingleVec[1]), y: parseFloat(matchSingleVec[2]) };
      this.type = 'vector';
      return;
    }

    // 2. Piecewise structure
    if (this.raw.includes('{') && this.raw.includes('}')) {
      this.type = 'piecewise';
      const braceMatch = this.raw.match(/\{([\s\S]+?)\}/);
      if (braceMatch) {
        const inside = braceMatch[1];
        const pieceStrings = splitParenthesisAware(inside, ',');
        this.pieces = [];
        pieceStrings.forEach((ps, index) => {
          const parsed = parsePiece(ps);
          if (parsed) {
            try {
              const tokens = insertImplicitMultiplication(tokenize(parsed.exprStr));
              const node = new Parser(tokens).parse();
              const condFn = parseCondition(parsed.condStr);
              
              // Match with original pieces to read/write range
              const origPiece = originalPieces && originalPieces[index];
              let pieceRangeStr = origPiece?.range;
              
              if (!pieceRangeStr) {
                pieceRangeStr = computeMathematicalRange(node, parsed.condStr);
                if (origPiece) {
                  origPiece.range = pieceRangeStr; // Carry range field
                }
              }
              
              const rangeFn = parseCondition(pieceRangeStr);
              
              this.pieces!.push({
                node,
                condFn,
                condStr: parsed.condStr,
                rangeStr: pieceRangeStr,
                rangeFn
              });
            } catch (e) {
              console.error('Failed parsing piecewise element:', ps, e);
            }
          }
        });
        
        this.piecewiseEndpoints = getPiecewiseEndpoints(this.pieces);
      }
      return;
    }

    // 3. Parametric curve
    const param = parseParametric(this.raw);
    if (param) {
      this.type = 'parametric';
      this.xNode = param.xNode;
      this.yNode = param.yNode;
      return;
    }

    // 4. Inequality shading
    const ineq = parseInequality(this.raw);
    if (ineq) {
      this.type = 'inequality';
      this.leftNode = ineq.leftNode;
      this.rightNode = ineq.rightNode;
      this.inequalityOp = ineq.op;
      return;
    }

    // 5. Implicit curve vs Explicit Y or X
    const cleanRaw = this.raw.replace(/\s+/g, '');
    const isExplicitY = /^(?:y|f\(x\))=(.+)$/i.test(cleanRaw) && !/^(?:y|f\(x\))=(.*[yY].*)$/i.test(cleanRaw);
    const isExplicitX = /^x=(.+)$/i.test(cleanRaw) && !/^x=(.*[xX].*)$/i.test(cleanRaw);

    if (isExplicitY) {
      const rhs = this.raw.split('=')[1];
      try {
        const tokens = insertImplicitMultiplication(tokenize(rhs));
        this.node = new Parser(tokens).parse();
        this.type = 'explicit_y';
        if (!this.rangeStr) {
          this.rangeStr = computeMathematicalRange(this.node, domainStr || 'all');
          this.rangeFn = parseCondition(this.rangeStr);
        }
        if (domainStr && this.node) {
          this.domainEndpoints = getEquationEndpoints(this.node, domainStr);
        }
        return;
      } catch (e) {
        console.error('Failed explicit Y parsing:', e);
      }
    } else if (isExplicitX) {
      const rhs = this.raw.split('=')[1];
      try {
        const tokens = insertImplicitMultiplication(tokenize(rhs));
        this.node = new Parser(tokens).parse();
        this.type = 'explicit_x';
        return;
      } catch (e) {
        console.error('Failed explicit X parsing:', e);
      }
    }

    if (this.raw.includes('=')) {
      const impl = parseImplicit(this.raw);
      if (impl) {
        this.type = 'implicit';
        this.leftNode = impl.leftNode;
        this.rightNode = impl.rightNode;
        return;
      }
    }

    // Default fallback to explicit Y
    try {
      const tokens = insertImplicitMultiplication(tokenize(this.raw));
      this.node = new Parser(tokens).parse();
      this.type = 'explicit_y';
      if (!this.rangeStr) {
        this.rangeStr = computeMathematicalRange(this.node, domainStr || 'all');
        this.rangeFn = parseCondition(this.rangeStr);
      }
      if (domainStr && this.node) {
        this.domainEndpoints = getEquationEndpoints(this.node, domainStr);
      }
    } catch (e) {
      console.error('Complete parsing fallback:', this.raw, e);
      this.type = 'explicit_y';
      this.node = { type: 'number', value: 0 };
    }
  }

  public evaluateY(x: number): number {
    if (this.type === 'explicit_y' && this.node) {
      return evaluateAST(this.node, x, 0, 0);
    }
    if (this.type === 'piecewise' && this.pieces) {
      for (const piece of this.pieces) {
        if (piece.condFn(x, 0)) {
          return evaluateAST(piece.node, x, 0, 0);
        }
      }
    }
    return NaN;
  }

  public evaluateX(y: number): number {
    if (this.type === 'explicit_x' && this.node) {
      return evaluateAST(this.node, 0, y, 0);
    }
    return NaN;
  }

  public evaluateImplicit(x: number, y: number): number {
    if (this.type === 'implicit' && this.leftNode && this.rightNode) {
      return evaluateAST(this.leftNode, x, y, 0) - evaluateAST(this.rightNode, x, y, 0);
    }
    if (this.type === 'inequality' && this.leftNode && this.rightNode) {
      return evaluateAST(this.leftNode, x, y, 0) - evaluateAST(this.rightNode, x, y, 0);
    }
    return NaN;
  }

  public testInequality(x: number, y: number): boolean {
    if (this.type === 'inequality' && this.leftNode && this.rightNode && this.inequalityOp) {
      const val = this.evaluateImplicit(x, y);
      if (isNaN(val)) return false;
      
      switch (this.inequalityOp) {
        case '<': return val < 0;
        case '<=': return val <= 0;
        case '>': return val > 0;
        case '>=': return val >= 0;
        default: return false;
      }
    }
    return false;
  }
}

// ============================================================================
// NUMERICAL ANALYSIS ALGORITHMS (VERTEX, INTERCEPTS, ASYMPTOTES, DISCONTINUITIES)
// ============================================================================

function findTurningPointsAndVertices(f: (x: number) => number, xMin = -15, xMax = 15): { x: number; y: number; type: 'vertex' | 'local_min' | 'local_max'; label: string }[] {
  const points: { x: number; y: number; type: 'vertex' | 'local_min' | 'local_max'; label: string }[] = [];
  const dx = 0.01;
  const steps = Math.floor((xMax - xMin) / dx);

  let prevSlope: number | null = null;

  for (let i = 1; i < steps - 1; i++) {
    const x = xMin + i * dx;
    const y = f(x);
    if (isNaN(y) || !isFinite(y)) continue;

    const yPrev = f(x - dx);
    const yNext = f(x + dx);

    const slopeLeft = (y - yPrev) / dx;
    const slopeRight = (yNext - y) / dx;

    // Detect sharp absolute value corners (vertex)
    if (slopeLeft * slopeRight < -1e-5) {
      points.push({
        x,
        y,
        type: 'vertex',
        label: `الرأس (${x.toFixed(1)}, ${y.toFixed(1)})`
      });
    } else if (prevSlope !== null) {
      // Smooth turning point
      if (prevSlope * slopeRight < -1e-8) {
        const isMin = prevSlope < 0 && slopeRight > 0;
        points.push({
          x,
          y,
          type: isMin ? 'local_min' : 'local_max',
          label: isMin ? `نقطة صغرى (${x.toFixed(1)}, ${y.toFixed(1)})` : `نقطة عظمى (${x.toFixed(1)}, ${y.toFixed(1)})`
        });
      }
    }

    prevSlope = slopeRight;
  }

  const uniquePoints: typeof points = [];
  points.forEach(pt => {
    const duplicate = uniquePoints.find(u => Math.abs(u.x - pt.x) < 0.2);
    if (!duplicate) {
      uniquePoints.push(pt);
    }
  });

  return uniquePoints;
}

function findRoots(f: (x: number) => number, xMin = -15, xMax = 15): { x: number; y: number; label: string }[] {
  const roots: { x: number; y: number; label: string }[] = [];
  const step = 0.05;
  const steps = Math.floor((xMax - xMin) / step);

  for (let i = 0; i < steps; i++) {
    const x1 = xMin + i * step;
    const x2 = x1 + step;
    const y1 = f(x1);
    const y2 = f(x2);

    if (isNaN(y1) || isNaN(y2) || !isFinite(y1) || !isFinite(y2)) continue;

    if (y1 * y2 <= 0) {
      let left = x1;
      let right = x2;
      let mid = (left + right) / 2;
      for (let iter = 0; iter < 15; iter++) {
        mid = (left + right) / 2;
        const yMid = f(mid);
        if (Math.abs(yMid) < 1e-6) break;
        if (f(left) * yMid <= 0) {
          right = mid;
        } else {
          left = mid;
        }
      }
      roots.push({
        x: mid,
        y: 0,
        label: `مقطع س (${mid.toFixed(1)}, 0)`
      });
    }
  }

  const uniqueRoots: typeof roots = [];
  roots.forEach(r => {
    const duplicate = uniqueRoots.find(u => Math.abs(u.x - r.x) < 0.2);
    if (!duplicate) uniqueRoots.push(r);
  });

  return uniqueRoots;
}

function findVerticalAsymptotes(f: (x: number) => number, xMin = -15, xMax = 15): number[] {
  const asymptotes: number[] = [];
  const step = 0.02;
  const steps = Math.floor((xMax - xMin) / step);

  for (let i = 1; i < steps - 1; i++) {
    const x = xMin + i * step;
    const y = f(x);
    if (isNaN(y) || !isFinite(y)) {
      const yLeft = f(x - 1e-4);
      const yRight = f(x + 1e-4);
      if (Math.abs(yLeft) > 50 || Math.abs(yRight) > 50) {
        asymptotes.push(parseFloat(x.toFixed(1)));
      }
    } else {
      const yPrev = f(x - step);
      if (Math.abs(y - yPrev) > 100 && y * yPrev < 0) {
        asymptotes.push(parseFloat(x.toFixed(1)));
      }
    }
  }

  return Array.from(new Set(asymptotes)).sort((a, b) => a - b);
}

function findHorizontalAsymptotes(f: (x: number) => number): number[] {
  const asymptotes: number[] = [];
  
  const yInf = f(1000);
  const yInfHalf = f(500);
  if (!isNaN(yInf) && isFinite(yInf) && !isNaN(yInfHalf) && isFinite(yInfHalf)) {
    if (Math.abs(yInf - yInfHalf) < 0.05 && Math.abs(yInf) < 50) {
      asymptotes.push(parseFloat(yInf.toFixed(2)));
    }
  }

  const yNegInf = f(-1000);
  const yNegInfHalf = f(-500);
  if (!isNaN(yNegInf) && isFinite(yNegInf) && !isNaN(yNegInfHalf) && isFinite(yNegInfHalf)) {
    if (Math.abs(yNegInf - yNegInfHalf) < 0.05 && Math.abs(yNegInf) < 50) {
      asymptotes.push(parseFloat(yNegInf.toFixed(2)));
    }
  }

  return Array.from(new Set(asymptotes));
}

function findHoles(f: (x: number) => number, xMin = -15, xMax = 15): { x: number; y: number }[] {
  const holes: { x: number; y: number }[] = [];
  const eps = 1e-4;

  for (let c = xMin; c <= xMax; c += 0.5) {
    const yDirect = f(c);
    if (isNaN(yDirect) || !isFinite(yDirect)) {
      const yLeft = f(c - eps);
      const yRight = f(c + eps);

      if (!isNaN(yLeft) && isFinite(yLeft) && !isNaN(yRight) && isFinite(yRight)) {
        if (Math.abs(yLeft - yRight) < 0.01) {
          holes.push({ x: c, y: (yLeft + yRight) / 2 });
        }
      }
    }
  }
  return holes;
}

// Auto view centering & scale calculation based on curve features
function autoComputeViewport(eq: ParsedEquation): [number, number, number, number] {
  let xMin = -6, xMax = 6, yMin = -6, yMax = 6;

  if (eq.type === 'explicit_y' && eq.node) {
    const turningPoints = findTurningPointsAndVertices(x => eq.evaluateY(x), -15, 15);
    if (turningPoints.length > 0) {
      const tp = turningPoints[0];
      xMin = tp.x - 6;
      xMax = tp.x + 6;
      yMin = tp.y - 6;
      yMax = tp.y + 6;
      if (tp.type === 'local_max') {
        yMin = tp.y - 6;
        yMax = tp.y + 6;
      }
    }
  } else if (eq.type === 'vector' || eq.type === 'ray' || eq.type === 'segment') {
    if (eq.p1 && eq.p2) {
      const midX = (eq.p1.x + eq.p2.x) / 2;
      const midY = (eq.p1.y + eq.p2.y) / 2;
      const dx = Math.abs(eq.p2.x - eq.p1.x);
      const dy = Math.abs(eq.p2.y - eq.p1.y);
      const maxSpan = Math.max(dx, dy, 4);
      xMin = midX - maxSpan * 1.5;
      xMax = midX + maxSpan * 1.5;
      yMin = midY - maxSpan * 1.5;
      yMax = midY + maxSpan * 1.5;
    }
  } else if (eq.type === 'implicit') {
    const match = eq.raw.replace(/\s+/g, '').match(/x\^2\+y\^2=(\d+)/);
    if (match) {
      const r = Math.sqrt(parseFloat(match[1]));
      xMin = -r * 1.5; xMax = r * 1.5;
      yMin = -r * 1.5; yMax = r * 1.5;
    }
  }

  return [xMin, xMax, yMin, yMax];
}

interface MathProperties {
  typeLabel: string;
  domainLabel: string;
  rangeLabel: string;
  vertex?: { x: number; y: number };
  slopeLabel?: string;
  symmetryLabel?: string;
  intercepts: { x: number; y: number; label: string }[];
  asymptotes: { x?: number; y?: number; label: string }[];
  holes: { x: number; y: number }[] | null;
}

function analyzeEquation(eq: ParsedEquation): MathProperties {
  const props: MathProperties = {
    typeLabel: 'اقتران رياضي',
    domainLabel: 'س ∈ ح',
    rangeLabel: 'ص ∈ ح',
    intercepts: [],
    asymptotes: [],
    holes: []
  };

  if (eq.type === 'explicit_y' && eq.node) {
    const f = (x: number) => eq.evaluateY(x);
    const clean = eq.raw.replace(/\s+/g, '').toLowerCase();

    if (clean.includes('abs(') || clean.includes('|')) {
      props.typeLabel = 'اقتران قيمة مطلقة';
      const turning = findTurningPointsAndVertices(f, -15, 15);
      const vertex = turning.find(t => t.type === 'vertex') || turning[0];
      if (vertex) {
        props.vertex = { x: vertex.x, y: vertex.y };
        props.symmetryLabel = `س = ${vertex.x.toFixed(1)}`;
        
        const slopeLeft = (f(vertex.x - 1) - f(vertex.x)) / -1;
        const slopeRight = (f(vertex.x + 1) - f(vertex.x)) / 1;
        props.slopeLabel = `م = ${slopeRight.toFixed(1)}، ${slopeLeft.toFixed(1)}`;
        
        if (slopeRight > 0) {
          props.rangeLabel = `ص ≥ ${vertex.y.toFixed(1)}`;
        } else {
          props.rangeLabel = `ص ≤ ${vertex.y.toFixed(1)}`;
        }
      }
    } else if (clean.includes('^2') || clean.includes('²')) {
      props.typeLabel = 'اقتران تربيعي';
      const turning = findTurningPointsAndVertices(f, -15, 15);
      const tp = turning.find(t => t.type === 'local_min' || t.type === 'local_max') || turning[0];
      if (tp) {
        props.vertex = { x: tp.x, y: tp.y };
        props.symmetryLabel = `س = ${tp.x.toFixed(1)}`;
        const yOffset = f(tp.x + 1);
        if (yOffset > tp.y) {
          props.rangeLabel = `ص ≥ ${tp.y.toFixed(1)}`;
        } else {
          props.rangeLabel = `ص ≤ ${tp.y.toFixed(1)}`;
        }
      }
    } else if (clean.includes('^3') || clean.includes('³')) {
      props.typeLabel = 'اقتران تكعيبي';
    } else if (clean.includes('/') && clean.includes('x')) {
      props.typeLabel = 'اقتران نسبي (كسري)';
      const vertAsy = findVerticalAsymptotes(f, -12, 12);
      vertAsy.forEach(xVal => {
        props.asymptotes.push({ x: xVal, label: `خط تقارب رأسي: س = ${xVal}` });
      });
      const horizAsy = findHorizontalAsymptotes(f);
      horizAsy.forEach(yVal => {
        props.asymptotes.push({ y: yVal, label: `خط تقارب أفقي: ص = ${yVal}` });
      });
      props.holes = findHoles(f, -12, 12);
    } else if (clean.includes('sin') || clean.includes('cos') || clean.includes('tan')) {
      props.typeLabel = 'اقتران دائري / مثلثي';
    } else if (clean.includes('log') || clean.includes('ln')) {
      props.typeLabel = 'اقتران لوغاريتمي';
    } else if (clean.includes('exp') || clean.includes('^x')) {
      props.typeLabel = 'اقتران أسي';
    } else {
      if (clean.includes('x')) {
        props.typeLabel = 'اقتران خطي';
        const m = f(1) - f(0);
        props.slopeLabel = `م = ${m.toFixed(1)}`;
      } else {
        props.typeLabel = 'اقتران ثابت';
      }
    }

    const yInt = f(0);
    if (!isNaN(yInt) && isFinite(yInt)) {
      props.intercepts.push({ x: 0, y: yInt, label: `مقطع ص (0, ${yInt.toFixed(1)})` });
    }
    const roots = findRoots(f, -15, 15);
    roots.forEach(r => {
      props.intercepts.push({ x: r.x, y: r.y, label: `مقطع س (${r.x.toFixed(1)}, 0)` });
    });
  } else if (eq.type === 'piecewise') {
    props.typeLabel = 'اقتران متشعب';
    props.domainLabel = 'متعدد الفترات';
    props.rangeLabel = 'تلقائي حسب القطع';
  } else if (eq.type === 'implicit') {
    props.typeLabel = 'معادلة ضمنية';
  } else if (eq.type === 'inequality') {
    props.typeLabel = 'متباينة رياضية';
  } else if (eq.type === 'vector') {
    props.typeLabel = 'متجه هندسي';
  } else if (eq.type === 'segment') {
    props.typeLabel = 'قطعة مستقيمة';
  } else if (eq.type === 'ray') {
    props.typeLabel = 'شعاع هندسي';
  }

  if (eq.rangeStr && eq.rangeStr !== 'all') {
    props.rangeLabel = eq.rangeStr
      .replace(/y/g, 'ص')
      .replace(/>=/g, '≥')
      .replace(/<=/g, '≤')
      .replace(/!=/g, '≠')
      .replace(/=/g, '=');
  }

  return props;
}

// ============================================================================
// VECTOR-SHARP CANVAS RENDERING LAYER
// ============================================================================

function getBoundaryIntersection(
  x1: number, y1: number,
  x2: number, y2: number,
  width: number, height: number
) {
  const candidates: { x: number; y: number; t: number }[] = [];

  // Intersect with x = 0
  if (Math.abs(x2 - x1) > 1e-6) {
    const t = (0 - x1) / (x2 - x1);
    if (t >= 0 && t <= 1) {
      candidates.push({ x: 0, y: y1 + t * (y2 - y1), t });
    }
    // Intersect with x = width
    const tW = (width - x1) / (x2 - x1);
    if (tW >= 0 && tW <= 1) {
      candidates.push({ x: width, y: y1 + tW * (y2 - y1), t: tW });
    }
  }

  // Intersect with y = 0
  if (Math.abs(y2 - y1) > 1e-6) {
    const t = (0 - y1) / (y2 - y1);
    if (t >= 0 && t <= 1) {
      candidates.push({ x: x1 + t * (x2 - x1), y: 0, t });
    }
    // Intersect with y = height
    const tH = (height - y1) / (y2 - y1);
    if (tH >= 0 && tH <= 1) {
      candidates.push({ x: x1 + tH * (x2 - x1), y: height, t: tH });
    }
  }

  // Filter candidates that are within the viewport bounds (with a tiny tolerance)
  const valid = candidates.filter(c => 
    c.x >= -1 && c.x <= width + 1 &&
    c.y >= -1 && c.y <= height + 1
  );

  if (valid.length > 0) {
    // Return the one closest to x1, y1 (smallest t)
    valid.sort((a, b) => a.t - b.t);
    return valid[0];
  }
  return null;
}

function canDrawArrowhead(x: number, y: number, drawnList: { x: number; y: number }[]) {
  for (const pt of drawnList) {
    const dist = Math.hypot(pt.x - x, pt.y - y);
    if (dist < 30) return false; // Minimum 30 pixels distance
  }
  return true;
}

function drawSegmentArrowheads(
  ctx: CanvasRenderingContext2D,
  segment: { cx: number; cy: number; x: number; y: number }[],
  width: number,
  height: number,
  arrowSize: number,
  color: string,
  isStartOpen: boolean,
  isEndOpen: boolean,
  drawnArrowheads: { x: number; y: number }[]
) {
  if (segment.length < 2) return;

  const isInside = (p: { cx: number; cy: number }) => 
    p.cx >= 0 && p.cx <= width && p.cy >= 0 && p.cy <= height;

  // 1. Check endpoints first if they are open-ended and near the boundary
  const pStart = segment[0];
  if (isStartOpen) {
    const nearBoundary = 
      pStart.cx <= 5 || pStart.cx >= width - 5 || 
      pStart.cy <= 5 || pStart.cy >= height - 5;
    if (nearBoundary && isInside(pStart)) {
      if (canDrawArrowhead(pStart.cx, pStart.cy, drawnArrowheads)) {
        const pNext = segment[Math.min(5, segment.length - 1)];
        const angle = Math.atan2(pStart.cy - pNext.cy, pStart.cx - pNext.cx);
        drawArrowhead(ctx, pStart.cx, pStart.cy, angle, arrowSize, color);
        drawnArrowheads.push({ x: pStart.cx, y: pStart.cy });
      }
    }
  }

  const pEnd = segment[segment.length - 1];
  if (isEndOpen) {
    const nearBoundary = 
      pEnd.cx <= 5 || pEnd.cx >= width - 5 || 
      pEnd.cy <= 5 || pEnd.cy >= height - 5;
    if (nearBoundary && isInside(pEnd)) {
      if (canDrawArrowhead(pEnd.cx, pEnd.cy, drawnArrowheads)) {
        const pPrev = segment[Math.max(0, segment.length - 6)];
        const angle = Math.atan2(pEnd.cy - pPrev.cy, pEnd.cx - pPrev.cx);
        drawArrowhead(ctx, pEnd.cx, pEnd.cy, angle, arrowSize, color);
        drawnArrowheads.push({ x: pEnd.cx, y: pEnd.cy });
      }
    }
  }

  // 2. Detect crossings between consecutive points
  for (let i = 0; i < segment.length - 1; i++) {
    const pt1 = segment[i];
    const pt2 = segment[i + 1];

    const in1 = isInside(pt1);
    const in2 = isInside(pt2);

    if (in1 !== in2) {
      // Crossing detected!
      const intersect = getBoundaryIntersection(pt1.cx, pt1.cy, pt2.cx, pt2.cy, width, height);
      if (intersect) {
        if (canDrawArrowhead(intersect.x, intersect.y, drawnArrowheads)) {
          // Determine angle pointing OUTWARD
          let angle: number;
          if (in1 && !in2) {
            // Exit: pointing from pt1 to pt2
            angle = Math.atan2(pt2.cy - pt1.cy, pt2.cx - pt1.cx);
          } else {
            // Entry: pointing from pt2 to pt1 (outward)
            angle = Math.atan2(pt1.cy - pt2.cy, pt1.cx - pt2.cx);
          }
          drawArrowhead(ctx, intersect.x, intersect.y, angle, arrowSize, color);
          drawnArrowheads.push({ x: intersect.x, y: intersect.y });
        }
      }
    }
  }
}

function drawExplicitCurveY(
  ctx: CanvasRenderingContext2D,
  eq: ParsedEquation,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  mapX: (x: number) => number,
  mapY: (y: number) => number,
  color: string,
  isOption: boolean,
  isDark: boolean,
  condFn?: (x: number, y: number) => boolean,
  nodeOverride?: ASTNode,
  rangeFn?: (x: number, y: number) => boolean
) {
  const steps = 1800; // Super dense adaptive sampling
  const dx = (xMax - xMin) / steps;
  
  const pList: { cx: number; cy: number; x: number; y: number }[] = [];
  const activeNode = nodeOverride || eq.node;

  if (!activeNode) return;
  
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * dx;
    if (condFn && !condFn(x, 0)) continue;
    
    const y = evaluateAST(activeNode, x, 0, 0);
    const isValid = !isNaN(y) && isFinite(y);
    if (isValid && y >= yMin - (yMax - yMin) * 10 && y <= yMax + (yMax - yMin) * 10) {
      if (rangeFn && !rangeFn(x, y)) continue;
      pList.push({
        cx: mapX(x),
        cy: mapY(y),
        x,
        y
      });
    }
  }

  if (pList.length === 0) return;

  // Draw the segments
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = isOption ? 1.8 : 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  
  let first = true;
  let prevYVal = 0;

  pList.forEach(pt => {
    if (first) {
      ctx.moveTo(pt.cx, pt.cy);
      first = false;
    } else {
      const yDiff = Math.abs(pt.y - prevYVal);
      // Singularity / Vertical Asymptote detection
      if (yDiff > (yMax - yMin) * 2.5) {
        ctx.moveTo(pt.cx, pt.cy);
      } else {
        ctx.lineTo(pt.cx, pt.cy);
      }
    }
    prevYVal = pt.y;
  });
  ctx.stroke();
  ctx.restore();

  // Partition pList into continuous mathematical segments
  const segments: typeof pList[] = [];
  let currentSegment: typeof pList = [];
  let prevPt: (typeof pList)[0] | null = null;

  pList.forEach(pt => {
    if (!prevPt) {
      currentSegment.push(pt);
    } else {
      const yDiff = Math.abs(pt.y - prevPt.y);
      if (yDiff > (yMax - yMin) * 2.5) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
        }
        currentSegment = [pt];
      } else {
        currentSegment.push(pt);
      }
    }
    prevPt = pt;
  });
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  // Draw arrowheads if open-ended
  const leftOpen = condFn ? condFn(xMin - 0.1, 0) : true;
  const rightOpen = condFn ? condFn(xMax + 0.1, 0) : true;
  const arrowSize = isOption ? 8 : 11;
  const width = mapX(xMax);
  const height = mapY(yMin);

  const drawnArrowheads: { x: number; y: number }[] = [];

  segments.forEach((segment, sIdx) => {
    const isStartOpen = sIdx === 0 ? leftOpen : true;
    const isEndOpen = sIdx === segments.length - 1 ? rightOpen : true;

    drawSegmentArrowheads(
      ctx,
      segment,
      width,
      height,
      arrowSize,
      color,
      isStartOpen,
      isEndOpen,
      drawnArrowheads
    );
  });
}

function drawExplicitCurveX(
  ctx: CanvasRenderingContext2D,
  eq: ParsedEquation,
  yMin: number,
  yMax: number,
  mapX: (x: number) => number,
  mapY: (y: number) => number,
  color: string,
  isOption: boolean,
  isDark: boolean,
  rangeFn?: (x: number, y: number) => boolean
) {
  const steps = 1800;
  const dy = (yMax - yMin) / steps;
  
  const pList: { cx: number; cy: number; x: number; y: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const y = yMin + i * dy;
    const x = eq.evaluateX(y);
    const isValid = !isNaN(x) && isFinite(x);
    if (isValid) {
      if (rangeFn && !rangeFn(x, y)) continue;
      pList.push({
        cx: mapX(x),
        cy: mapY(y),
        x,
        y
      });
    }
  }

  if (pList.length === 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = isOption ? 1.8 : 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  let first = true;
  let prevXVal = 0;

  pList.forEach(pt => {
    if (first) {
      ctx.moveTo(pt.cx, pt.cy);
      first = false;
    } else {
      const xDiff = Math.abs(pt.x - prevXVal);
      if (xDiff > 50) {
        ctx.moveTo(pt.cx, pt.cy);
      } else {
        ctx.lineTo(pt.cx, pt.cy);
      }
    }
    prevXVal = pt.x;
  });
  ctx.stroke();
  ctx.restore();

  // Partition pList into continuous mathematical segments
  const segments: typeof pList[] = [];
  let currentSegment: typeof pList = [];
  let prevPt: (typeof pList)[0] | null = null;

  pList.forEach(pt => {
    if (!prevPt) {
      currentSegment.push(pt);
    } else {
      const xDiff = Math.abs(pt.x - prevPt.x);
      if (xDiff > 50) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
        }
        currentSegment = [pt];
      } else {
        currentSegment.push(pt);
      }
    }
    prevPt = pt;
  });
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  const arrowSize = isOption ? 8 : 11;
  const height = mapY(yMin);
  const width = ctx.canvas.width / (window.devicePixelRatio || 1);

  const drawnArrowheads: { x: number; y: number }[] = [];

  segments.forEach((segment, sIdx) => {
    const isStartOpen = sIdx === 0;
    const isEndOpen = sIdx === segments.length - 1;

    drawSegmentArrowheads(
      ctx,
      segment,
      width,
      height,
      arrowSize,
      color,
      isStartOpen,
      isEndOpen,
      drawnArrowheads
    );
  });
}

function drawParametricCurve(ctx: CanvasRenderingContext2D, eq: ParsedEquation, mapX: (x: number) => number, mapY: (y: number) => number) {
  if (!eq.xNode || !eq.yNode) return;

  const hasTrig = /sin|cos|tan/i.test(eq.raw);
  const tMin = hasTrig ? 0 : -15;
  const tMax = hasTrig ? 2 * Math.PI : 15;
  
  ctx.beginPath();
  let first = true;
  const steps = 1200;
  const dt = (tMax - tMin) / steps;

  for (let i = 0; i <= steps; i++) {
    const t = tMin + i * dt;
    const x = evaluateAST(eq.xNode, 0, 0, t);
    const y = evaluateAST(eq.yNode, 0, 0, t);

    if (!isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)) {
      if (first) {
        ctx.moveTo(mapX(x), mapY(y));
        first = false;
      } else {
        ctx.lineTo(mapX(x), mapY(y));
      }
    }
  }
  ctx.stroke();
}

// Marching Squares contouring for hyper-precise implicit function plots (circles, ellipses, hyperbolas)
function drawImplicitCurve(ctx: CanvasRenderingContext2D, eq: ParsedEquation, xMin: number, xMax: number, yMin: number, yMax: number, mapX: (x: number) => number, mapY: (y: number) => number) {
  const rows = 140;
  const cols = 140;
  
  const dx = (xMax - xMin) / cols;
  const dy = (yMax - yMin) / rows;
  
  const grid: number[][] = [];
  for (let i = 0; i <= cols; i++) {
    grid[i] = [];
    const x = xMin + i * dx;
    for (let j = 0; j <= rows; j++) {
      const y = yMin + j * dy;
      const val = eq.evaluateImplicit(x, y);
      grid[i][j] = isNaN(val) ? 0 : val;
    }
  }

  ctx.beginPath();

  const lerp = (v1: number, v2: number, p1: number, p2: number) => {
    if (Math.abs(v1 - v2) < 1e-9) return (p1 + p2) / 2;
    return p1 + (-v1 / (v2 - v1)) * (p2 - p1);
  };

  for (let i = 0; i < cols; i++) {
    const xA = xMin + i * dx;
    const xB = xA + dx;
    
    for (let j = 0; j < rows; j++) {
      const yA = yMin + j * dy;
      const yB = yA + dy;

      const v1 = grid[i][j];       // bottom left
      const v2 = grid[i + 1][j];   // bottom right
      const v3 = grid[i + 1][j + 1]; // top right
      const v4 = grid[i][j + 1];   // top left

      let cellCase = 0;
      if (v1 >= 0) cellCase |= 1;
      if (v2 >= 0) cellCase |= 2;
      if (v3 >= 0) cellCase |= 4;
      if (v4 >= 0) cellCase |= 8;

      const pBottom = { x: 0, y: yA };
      const pRight = { x: xB, y: 0 };
      const pTop = { x: 0, y: yB };
      const pLeft = { x: xA, y: 0 };

      if ((v1 >= 0) !== (v2 >= 0)) pBottom.x = lerp(v1, v2, xA, xB);
      if ((v2 >= 0) !== (v3 >= 0)) pRight.y = lerp(v2, v3, yA, yB);
      if ((v3 >= 0) !== (v4 >= 0)) pTop.x = lerp(v4, v3, xA, xB);
      if ((v4 >= 0) !== (v1 >= 0)) pLeft.y = lerp(v1, v4, yA, yB);

      switch (cellCase) {
        case 1: case 14:
          ctx.moveTo(mapX(pLeft.x), mapY(pLeft.y));
          ctx.lineTo(mapX(pBottom.x), mapY(pBottom.y));
          break;
        case 2: case 13:
          ctx.moveTo(mapX(pBottom.x), mapY(pBottom.y));
          ctx.lineTo(mapX(pRight.x), mapY(pRight.y));
          break;
        case 3: case 12:
          ctx.moveTo(mapX(pLeft.x), mapY(pLeft.y));
          ctx.lineTo(mapX(pRight.x), mapY(pRight.y));
          break;
        case 4: case 11:
          ctx.moveTo(mapX(pRight.x), mapY(pRight.y));
          ctx.lineTo(mapX(pTop.x), mapY(pTop.y));
          break;
        case 5: case 10:
          ctx.moveTo(mapX(pLeft.x), mapY(pLeft.y));
          ctx.lineTo(mapX(pTop.x), mapY(pTop.y));
          ctx.moveTo(mapX(pBottom.x), mapY(pBottom.y));
          ctx.lineTo(mapX(pRight.x), mapY(pRight.y));
          break;
        case 6: case 9:
          ctx.moveTo(mapX(pBottom.x), mapY(pBottom.y));
          ctx.lineTo(mapX(pTop.x), mapY(pTop.y));
          break;
        case 7: case 8:
          ctx.moveTo(mapX(pLeft.x), mapY(pLeft.y));
          ctx.lineTo(mapX(pTop.x), mapY(pTop.y));
          break;
      }
    }
  }
  ctx.stroke();
}

// Beautiful scanline polygon shading algorithm for high-performance inequality regions
function drawInequalityShading(ctx: CanvasRenderingContext2D, eq: ParsedEquation, xMin: number, xMax: number, yMin: number, yMax: number, width: number, mapX: (x: number) => number, mapY: (y: number) => number, isDark: boolean) {
  ctx.save();
  // Soft pastel fill color
  ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)';
  ctx.lineWidth = 4; // matching horizontal step size

  const xSteps = Math.ceil(width / 3.5);
  const ySteps = 240; // fine vertical grid scan

  const dy = (yMax - yMin) / ySteps;

  for (let s = 0; s <= xSteps; s++) {
    const canvasX = s * 3.5;
    const x = xMin + (canvasX / width) * (xMax - xMin);

    let insideSegment = false;
    let segStartY = 0;

    for (let j = 0; j <= ySteps; j++) {
      const y = yMin + j * dy;
      const isTrue = eq.testInequality(x, y);

      if (isTrue) {
        if (!insideSegment) {
          segStartY = y;
          insideSegment = true;
        }
      } else {
        if (insideSegment) {
          ctx.beginPath();
          ctx.moveTo(canvasX, mapY(segStartY));
          ctx.lineTo(canvasX, mapY(y));
          ctx.stroke();
          insideSegment = false;
        }
      }
    }
    if (insideSegment) {
      ctx.beginPath();
      ctx.moveTo(canvasX, mapY(segStartY));
      ctx.lineTo(canvasX, mapY(yMax));
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawVector(ctx: CanvasRenderingContext2D, p1: { x: number; y: number }, p2: { x: number; y: number }, mapX: (x: number) => number, mapY: (y: number) => number, color: string) {
  const x1 = mapX(p1.x);
  const y1 = mapY(p1.y);
  const x2 = mapX(p2.x);
  const y2 = mapY(p2.y);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - y1, x2 - x1);
  drawArrowhead(ctx, x2, y2, angle, 12, color);
  ctx.restore();
}

function drawSegment(ctx: CanvasRenderingContext2D, p1: { x: number; y: number }, p2: { x: number; y: number }, mapX: (x: number) => number, mapY: (y: number) => number, color: string) {
  const x1 = mapX(p1.x);
  const y1 = mapY(p1.y);
  const x2 = mapX(p2.x);
  const y2 = mapY(p2.y);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x1, y1, 3.0, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x2, y2, 3.0, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawRay(ctx: CanvasRenderingContext2D, p1: { x: number; y: number }, p2: { x: number; y: number }, xMin: number, xMax: number, yMin: number, yMax: number, mapX: (x: number) => number, mapY: (y: number) => number, color: string) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return;

  const x1 = mapX(p1.x);
  const y1 = mapY(p1.y);
  
  const xBoundary = dx > 0 ? xMax : xMin;
  const yBoundary = dy > 0 ? yMax : yMin;

  const tx = dx !== 0 ? (xBoundary - p1.x) / dx : Infinity;
  const ty = dy !== 0 ? (yBoundary - p1.y) / dy : Infinity;
  let t = Math.min(tx, ty);
  if (t < 0 || !isFinite(t)) t = 100;

  const edgeX = p1.x + t * dx;
  const edgeY = p1.y + t * dy;

  const x2 = mapX(edgeX);
  const y2 = mapY(edgeY);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Draw start endpoint
  ctx.beginPath();
  ctx.arc(x1, y1, 3.0, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  // Draw arrowhead at viewport edge
  const angle = Math.atan2(y2 - y1, x2 - x1);
  drawArrowhead(ctx, x2, y2, angle, 12, color);
  ctx.restore();
}

function drawArrowhead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x - size * 0.7 * Math.cos(angle), y - size * 0.7 * Math.sin(angle));
  ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function calculateNiceStep(range: number): number {
  if (range >= 2.5 && range <= 45) {
    return 1;
  }
  const steps = [0.1, 0.5, 1, 5, 10, 50, 100];
  const target = range / 8;
  return steps.reduce((prev, curr) => Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev);
}

// ============================================================================
// MAIN REACT COMPONENT
// ============================================================================

interface MathGraphEngineProps {
  graphData: any;
  isOption?: boolean;
}

export const MathGraphEngine: React.FC<MathGraphEngineProps> = ({ graphData, isOption = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: isOption ? 145 : 300, height: isOption ? 95 : 190 });
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [span, setSpan] = useState({ x: 12, y: 12 });
  const [hoveredFeature, setHoveredFeature] = useState<any>(null);

  const [prevGraphData, setPrevGraphData] = useState<any>(null);

  // Parse all equations from the received graph JSON using high-performance useMemo
  const parsedEquations = React.useMemo<ParsedEquation[]>(() => {
    if (!graphData) return [];
    
    const list: ParsedEquation[] = [];
    
    // 1. Direct equation or function properties
    const graphObj = graphData.graph ? graphData.graph : graphData;
    const topEq = graphObj.equation || graphObj.function;
    const topDomain = graphObj.domain || 'all';
    const topRange = graphObj.range;
    if (topEq) {
      list.push(new ParsedEquation(topEq, undefined, topDomain, topRange));
    }

    // 2. Pieces array (for piecewise definitions)
    const pieces = graphData.pieces || 
                   (graphData.graph && graphData.graph.pieces) || 
                   graphData.functions || 
                   (graphData.graph && graphData.graph.functions);
    if (pieces && Array.isArray(pieces)) {
      const pStrs = pieces.map((p: any) => {
        const eqStr = p.equation || p.function || '0';
        const domStr = p.domain || 'all';
        return `${eqStr} : ${domStr}`;
      });
      list.push(new ParsedEquation(`y = { ${pStrs.join(', ')} }`, pieces));
    }

    // 3. Objects array (multi-shape support)
    const objects = graphData.objects || (graphData.graph && graphData.graph.objects) || [];
    if (Array.isArray(objects)) {
      objects.forEach((obj: any) => {
        const eqStr = obj.equation || (obj.data && obj.data.equation) || obj.function || (obj.data && obj.data.function);
        if (eqStr) {
          list.push(new ParsedEquation(eqStr));
        } else {
          const type = (obj.type || '').toLowerCase();
          if (type === 'horizontalline' || type === 'horizontal_line') {
            const yVal = obj.y !== undefined ? obj.y : (obj.intercept !== undefined ? obj.intercept : 0);
            list.push(new ParsedEquation(`y = ${yVal}`));
          } else if (type === 'verticalline' || type === 'vertical_line') {
            const xVal = obj.x !== undefined ? obj.x : 0;
            list.push(new ParsedEquation(`x = ${xVal}`));
          } else if (type === 'ray') {
            const p1 = obj.startPoint || (obj.points && obj.points[0]) || { x: 0, y: 0 };
            const p2 = obj.endPoint || (obj.points && obj.points[1]) || { x: 1, y: 1 };
            list.push(new ParsedEquation(`ray(${p1.x}, ${p1.y}) -> (${p2.x}, ${p2.y})`));
          } else if (type === 'segment') {
            const p1 = obj.startPoint || (obj.points && obj.points[0]) || { x: 0, y: 0 };
            const p2 = obj.endPoint || (obj.points && obj.points[1]) || { x: 1, y: 1 };
            list.push(new ParsedEquation(`segment(${p1.x}, ${p1.y}) -> (${p2.x}, ${p2.y})`));
          } else if (type === 'vector') {
            const p1 = obj.startPoint || (obj.points && obj.points[0]) || { x: 0, y: 0 };
            const p2 = obj.endPoint || (obj.points && obj.points[1]);
            if (p2) {
              list.push(new ParsedEquation(`vector(${p1.x}, ${p1.y}) -> (${p2.x}, ${p2.y})`));
            }
          }
        }
      });
    }

    return list;
  }, [graphData]);

  // Adjust interactive state instantly during render when props change
  if (graphData !== prevGraphData) {
    setPrevGraphData(graphData);

    const graphObj = graphData.graph ? graphData.graph : graphData;
    const vp = graphObj?.viewport || {};
    const topDomain = graphObj?.domain;
    const topRange = graphObj?.range;

    let xMin = typeof vp.xMin === 'number' ? vp.xMin : -6;
    let xMax = typeof vp.xMax === 'number' ? vp.xMax : 6;
    let yMin = typeof vp.yMin === 'number' ? vp.yMin : -6;
    let yMax = typeof vp.yMax === 'number' ? vp.yMax : 6;

    // Check if domain and/or range are explicitly specified in the graph metadata
    const hasCustomDomain = topDomain && topDomain !== 'all' && topDomain !== 'ح' && !topDomain.includes('R');
    const hasCustomRange = topRange && topRange !== 'all' && topRange !== 'ح' && !topRange.includes('R');

    if (xMin === -6 && xMax === 6 && yMin === -6 && yMax === 6) {
      if (hasCustomDomain || hasCustomRange) {
        if (hasCustomDomain) {
          const dom = getDomainInterval(topDomain);
          const dx = dom.xMax - dom.xMin;
          xMin = dom.xMin - dx * 0.12;
          xMax = dom.xMax + dx * 0.12;
        } else {
          xMin = -6;
          xMax = 6;
        }

        if (hasCustomRange) {
          const rng = getRangeInterval(topRange);
          const dy = rng.yMax - rng.yMin;
          const paddingY = dy > 0 ? dy * 0.18 : 1.0;
          yMin = rng.yMin - paddingY;
          yMax = rng.yMax + paddingY;
        } else {
          yMin = -6;
          yMax = 6;
        }
      } else if (parsedEquations.length > 0) {
        const [axMin, axMax, ayMin, ayMax] = autoComputeViewport(parsedEquations[0]);
        xMin = axMin; xMax = axMax; yMin = ayMin; yMax = ayMax;
      }
    }

    // Ensure all points, ticks, vertices, asymptotes, and objects in graphData fit within viewport
    let extXMin = xMin;
    let extXMax = xMax;
    let extYMin = yMin;
    let extYMax = yMax;

    const includeCoord = (px?: number, py?: number) => {
      if (typeof px === 'number' && isFinite(px)) {
        if (px < extXMin) extXMin = px;
        if (px > extXMax) extXMax = px;
      }
      if (typeof py === 'number' && isFinite(py)) {
        if (py < extYMin) extYMin = py;
        if (py > extYMax) extYMax = py;
      }
    };

    const xTicks = graphObj?.xTicks || graphData?.xTicks;
    if (Array.isArray(xTicks)) xTicks.forEach(x => includeCoord(x, 0));
    const yTicks = graphObj?.yTicks || graphData?.yTicks;
    if (Array.isArray(yTicks)) yTicks.forEach(y => includeCoord(0, y));

    const pts = [
      ...(graphObj?.points || graphData?.points || []),
      ...(graphObj?.openPoints || graphData?.openPoints || []),
      ...(graphObj?.closedPoints || graphData?.closedPoints || []),
      ...(graphObj?.labeledPoints || graphData?.labeledPoints || [])
    ];
    pts.forEach((p: any) => {
      if (p && typeof p === 'object') {
        includeCoord(p.x, p.y);
      }
    });

    const v = graphData?.vertex || graphObj?.vertex;
    if (v) includeCoord(v.x, v.y);
    const c = graphData?.center || graphObj?.center;
    if (c) includeCoord(c.x, c.y);

    if (extXMin < xMin || extXMax > xMax || extYMin < yMin || extYMax > yMax) {
      const dx = extXMax - extXMin;
      const dy = extYMax - extYMin;
      xMin = extXMin - (dx > 0 ? dx * 0.15 : 1.5);
      xMax = extXMax + (dx > 0 ? dx * 0.15 : 1.5);
      yMin = extYMin - (dy > 0 ? dy * 0.15 : 1.5);
      yMax = extYMax + (dy > 0 ? dy * 0.15 : 1.5);
    }

    setCenter({ x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 });
    setSpan({ x: xMax - xMin, y: yMax - yMin });
  }

  // Handle dynamic container resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || (isOption ? 145 : 300),
          height: height || (isOption ? 95 : 190)
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isOption]);

  // ============================================================================
  // INTERACTIVE MOUSE / TOUCH EVENTS (PAN & ZOOM)
  // ============================================================================
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Keep grid completely fixed
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Keep grid completely fixed
  };

  const handleMouseUpOrLeave = () => {
    // Keep grid completely fixed
  };

  // Touch support for mobile panning
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Keep grid completely fixed
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Keep grid completely fixed
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  const handleZoomIn = () => {
    setSpan(prev => ({ x: prev.x * 0.8, y: prev.y * 0.8 }));
  };

  const handleZoomOut = () => {
    setSpan(prev => ({ x: prev.x * 1.2, y: prev.y * 1.2 }));
  };

  const handleResetView = () => {
    const graphObj = graphData.graph ? graphData.graph : graphData;
    const topDomain = graphObj?.domain;
    const topRange = graphObj?.range;
    const hasCustomDomain = topDomain && topDomain !== 'all' && topDomain !== 'ح' && !topDomain.includes('R');
    const hasCustomRange = topRange && topRange !== 'all' && topRange !== 'ح' && !topRange.includes('R');

    let rxMin = -6, rxMax = 6, ryMin = -6, ryMax = 6;

    if (hasCustomDomain || hasCustomRange) {
      if (hasCustomDomain) {
        const dom = getDomainInterval(topDomain);
        const dx = dom.xMax - dom.xMin;
        rxMin = dom.xMin - dx * 0.12;
        rxMax = dom.xMax + dx * 0.12;
      }
      if (hasCustomRange) {
        const rng = getRangeInterval(topRange);
        const dy = rng.yMax - rng.yMin;
        const paddingY = dy > 0 ? dy * 0.18 : 1.0;
        ryMin = rng.yMin - paddingY;
        ryMax = rng.yMax + paddingY;
      }
      setCenter({ x: (rxMin + rxMax) / 2, y: (ryMin + ryMax) / 2 });
      setSpan({ x: rxMax - rxMin, y: ryMax - ryMin });
    } else if (parsedEquations.length > 0) {
      const [axMin, axMax, ayMin, ayMax] = autoComputeViewport(parsedEquations[0]);
      setCenter({ x: (axMin + axMax) / 2, y: (ayMin + ayMax) / 2 });
      setSpan({ x: axMax - axMin, y: ayMax - ayMin });
    } else {
      setCenter({ x: 0, y: 0 });
      setSpan({ x: 12, y: 12 });
    }
  };

  // Analyze the first parsed equation to show detailed math properties
  const mathProps = parsedEquations.length > 0 ? analyzeEquation(parsedEquations[0]) : null;

  // Render execution loop on viewport state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport setup
    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.direction = 'ltr';

    const xMin = center.x - span.x / 2;
    const xMax = center.x + span.x / 2;
    const yMin = center.y - span.y / 2;
    const yMax = center.y + span.y / 2;

    const scaleX = width / span.x;
    const scaleY = height / span.y;

    const mapX = (x: number) => (x - xMin) * scaleX;
    const mapY = (y: number) => height - (y - yMin) * scaleY; // Cartesian screen inversion

    // global visual styles from data
    const isDark = (graphData?.style?.theme || 'light') === 'dark';

    // 1. CLEAR & BACKGROUND
    ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2. GRID LINES (MAJOR & MINOR)
    const hasTrig = parsedEquations.some(eq => /sin|cos|tan/i.test(eq.raw));

    let stepX = calculateNiceStep(span.x);
    let trigCand: TrigStepCandidate | null = null;
    if (hasTrig) {
      trigCand = getBestTrigStep(span.x);
      stepX = trigCand.value;
    }
    const stepY = calculateNiceStep(span.y);

    ctx.save();
    // Minor Grid
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9';
    ctx.lineWidth = 1;
    const minorStepX = hasTrig ? stepX / 4 : stepX / 5;
    const minorStepY = stepY / 5;

    const minorStartX = Math.floor(xMin / minorStepX) * minorStepX;
    for (let x = minorStartX; x <= xMax; x += minorStepX) {
      ctx.beginPath();
      ctx.moveTo(mapX(x), 0);
      ctx.lineTo(mapX(x), height);
      ctx.stroke();
    }
    const minorStartY = Math.floor(yMin / minorStepY) * minorStepY;
    for (let y = minorStartY; y <= yMax; y += minorStepY) {
      ctx.beginPath();
      ctx.moveTo(0, mapY(y));
      ctx.lineTo(width, mapY(y));
      ctx.stroke();
    }

    // Major Grid
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.09)' : '#e2e8f0';
    ctx.lineWidth = 1.2;
    const majorStartX = Math.floor(xMin / stepX) * stepX;
    for (let x = majorStartX; x <= xMax; x += stepX) {
      ctx.beginPath();
      ctx.moveTo(mapX(x), 0);
      ctx.lineTo(mapX(x), height);
      ctx.stroke();
    }
    const majorStartY = Math.floor(yMin / stepY) * stepY;
    for (let y = majorStartY; y <= yMax; y += stepY) {
      ctx.beginPath();
      ctx.moveTo(0, mapY(y));
      ctx.lineTo(width, mapY(y));
      ctx.stroke();
    }
    ctx.restore();

    // 3. CARTESIAN AXES (X & Y)
    const originPx = mapX(0);
    const originPy = mapY(0);

    const axisX = Math.max(12, Math.min(width - 12, originPx));
    const axisY = Math.max(12, Math.min(height - 12, originPy));

    ctx.save();
    ctx.strokeStyle = isDark ? '#4b5563' : '#64748b';
    ctx.lineWidth = 2.2;
    ctx.fillStyle = isDark ? '#4b5563' : '#64748b';

    // Draw solid axes
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, height);
    ctx.stroke();

    // Arrows on axes
    drawArrowhead(ctx, width, axisY, 0, 8, isDark ? '#4b5563' : '#64748b');
    drawArrowhead(ctx, 0, axisY, Math.PI, 8, isDark ? '#4b5563' : '#64748b');
    drawArrowhead(ctx, axisX, 0, -Math.PI / 2, 8, isDark ? '#4b5563' : '#64748b');
    drawArrowhead(ctx, axisX, height, Math.PI / 2, 8, isDark ? '#4b5563' : '#64748b');

    // Labels & Ticks
    ctx.font = isOption ? '500 11px "KaTeX_Main", "Times New Roman", Georgia, serif' : '500 13px "KaTeX_Main", "Times New Roman", Georgia, serif';
    ctx.fillStyle = isDark ? '#9ca3af' : '#475569';
    const labelOffset = isOption ? 4 : 6;

    // X Ticks & Labels
    for (let x = majorStartX; x <= xMax; x += stepX) {
      if (Math.abs(x) < 1e-9) continue;
      const px = mapX(x);

      if (hasTrig && trigCand) {
        const comp = getTrigLabelComponents(x, trigCand);
        if (comp.isFraction) {
          ctx.save();
          
          const fracFont = isOption ? '500 10px "KaTeX_Main", "Times New Roman", Georgia, serif' : '500 11px "KaTeX_Main", "Times New Roman", Georgia, serif';
          ctx.font = fracFont;
          
          const numWidth = ctx.measureText("\u200E" + comp.numText).width;
          const denWidth = ctx.measureText("\u200E" + comp.denText).width;
          const fractionBarWidth = Math.max(numWidth, denWidth) + 4;
          
          const signText = comp.sign;
          const signWidth = signText ? ctx.measureText("\u200E" + signText).width + 2 : 0;
          const totalWidth = signWidth + fractionBarWidth;
          
          const startX = px - totalWidth / 2;
          const fracFontSize = isOption ? 10 : 11;
          const centerY = axisY + labelOffset + fracFontSize + 1;
          
          let currentX = startX;
          if (signText) {
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText("\u200E" + signText, currentX, centerY);
            currentX += signWidth;
          }
          
          // Draw fraction bar line
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(currentX, centerY);
          ctx.lineTo(currentX + fractionBarWidth, centerY);
          ctx.stroke();
          
          // Draw numerator
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText("\u200E" + comp.numText, currentX + fractionBarWidth / 2, centerY - 1);
          
          // Draw denominator
          ctx.textBaseline = 'top';
          ctx.fillText("\u200E" + comp.denText, currentX + fractionBarWidth / 2, centerY + 2);
          
          ctx.restore();
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText("\u200E" + comp.fullText, px, axisY + labelOffset);
        }
      } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const label = parseFloat(x.toFixed(3)).toString();
        ctx.fillText("\u200E" + label, px, axisY + labelOffset);
      }
    }

    // Y Ticks & Labels
    for (let y = majorStartY; y <= yMax; y += stepY) {
      if (Math.abs(y) < 1e-9) continue;
      const py = mapY(y);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText("\u200E" + parseFloat(y.toFixed(3)).toString(), axisX - labelOffset, py);
    }

    // Origin zero label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText("\u200E0", axisX, axisY + labelOffset);

    // Draw x and y axis labels in italic serif style (Math typography)
    ctx.font = isOption ? 'italic 500 12px "KaTeX_Math", "Times New Roman", Georgia, serif' : 'italic 500 15px "KaTeX_Math", "Times New Roman", Georgia, serif';
    ctx.fillStyle = isDark ? '#d1d5db' : '#1e293b';
    
    // x-axis label near the left arrowhead (far left of the x-axis)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x', isOption ? 4 : 8, axisY - (isOption ? 4 : 6));

    // y-axis label near the positive arrowhead
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('y', axisX + (isOption ? 4 : 8), 4);

    ctx.restore();

    // 4. RENDERING EQUATIONS & REGIONS
    // Clip graphics to canvas drawing region
    ctx.save();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    parsedEquations.forEach((eq, idx) => {
      // Dynamic colors for multiple curves
      const colors = ['#2563eb', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b'];
      const color = colors[idx % colors.length];

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = isOption ? 1.8 : 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Inequality shading has priority (draw behind lines)
      if (eq.type === 'inequality') {
        drawInequalityShading(ctx, eq, xMin, xMax, yMin, yMax, width, mapX, mapY, isDark);
        // Strictly inequality has dashed boundary, non-strict is solid
        if (eq.inequalityOp === '<' || eq.inequalityOp === '>') {
          ctx.setLineDash([6, 6]);
        }
        drawImplicitCurve(ctx, eq, xMin, xMax, yMin, yMax, mapX, mapY);
      } else if (eq.type === 'explicit_y') {
        drawExplicitCurveY(ctx, eq, xMin, xMax, yMin, yMax, mapX, mapY, color, isOption, isDark, eq.domainFn, undefined, eq.rangeFn);
      } else if (eq.type === 'explicit_x') {
        drawExplicitCurveX(ctx, eq, yMin, yMax, mapX, mapY, color, isOption, isDark, eq.rangeFn);
      } else if (eq.type === 'piecewise') {
        if (eq.pieces) {
          eq.pieces.forEach(piece => {
            drawExplicitCurveY(
              ctx,
              eq,
              xMin,
              xMax,
              yMin,
              yMax,
              mapX,
              mapY,
              color,
              isOption,
              isDark,
              piece.condFn,
              piece.node,
              piece.rangeFn
            );
          });
        }
      } else if (eq.type === 'parametric') {
        drawParametricCurve(ctx, eq, mapX, mapY);
      } else if (eq.type === 'implicit') {
        drawImplicitCurve(ctx, eq, xMin, xMax, yMin, yMax, mapX, mapY);
      } else if (eq.type === 'vector' && eq.p1 && eq.p2) {
        drawVector(ctx, eq.p1, eq.p2, mapX, mapY, color);
      } else if (eq.type === 'segment' && eq.p1 && eq.p2) {
        drawSegment(ctx, eq.p1, eq.p2, mapX, mapY, color);
      } else if (eq.type === 'ray' && eq.p1 && eq.p2) {
        drawRay(ctx, eq.p1, eq.p2, xMin, xMax, yMin, yMax, mapX, mapY, color);
      }

      ctx.restore();
    });

    // 5. KEY FEATURE MARKERS (VERTEX, HOLES, BOUNDARY DOTS, ASYMPTOTES)
    parsedEquations.forEach((eq, idx) => {
      const colors = ['#2563eb', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b'];
      const color = colors[idx % colors.length];

      // Draw dashed asymptotes
      if (eq.type === 'explicit_y') {
        const f = (x: number) => eq.evaluateY(x);
        const vertAsy = findVerticalAsymptotes(f, xMin, xMax);
        ctx.save();
        ctx.strokeStyle = '#ef4444'; // Red dashed asymptotes
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        vertAsy.forEach(xVal => {
          ctx.beginPath();
          ctx.moveTo(mapX(xVal), 0);
          ctx.lineTo(mapX(xVal), height);
          ctx.stroke();
        });

        const horizAsy = findHorizontalAsymptotes(f);
        horizAsy.forEach(yVal => {
          ctx.beginPath();
          ctx.moveTo(0, mapY(yVal));
          ctx.lineTo(width, mapY(yVal));
          ctx.stroke();
        });
        ctx.restore();

        // Draw symmetric axis line
        const turning = findTurningPointsAndVertices(f, xMin, xMax);
        const vertex = turning.find(t => t.type === 'vertex' || t.type === 'local_min' || t.type === 'local_max');
        if (vertex && (eq.raw.includes('abs') || eq.raw.includes('|') || eq.raw.includes('^2') || eq.raw.includes('²'))) {
          ctx.save();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(mapX(vertex.x), 0);
          ctx.lineTo(mapX(vertex.x), height);
          ctx.stroke();
          ctx.restore();
        }

        // Key Points, Turning Points, Holes and JSON explicit points
        const holes = findHoles(f, xMin, xMax);

        // Explicitly defined open/closed points from JSON
        const jsonOpenPoints = graphData.openPoints || (graphData.graph && graphData.graph.openPoints) || [];
        const jsonClosedPoints = graphData.closedPoints || (graphData.graph && graphData.graph.closedPoints) || [];

        // Helper to check if a specific x has a hole in either automatically detected holes or JSON open points
        const hasHoleAtX = (x: number): boolean => {
          // Check auto-detected holes
          const hasAutoHole = holes.some(h => Math.abs(h.x - x) < 0.15);
          if (hasAutoHole) return true;
          
          // Check JSON open points
          const hasJsonOpen = jsonOpenPoints.some((pt: any) => {
            let px = NaN;
            if (pt && typeof pt === 'object') {
              px = pt.x !== undefined ? Number(pt.x) : (Array.isArray(pt) ? Number(pt[0]) : NaN);
            }
            return !isNaN(px) && Math.abs(px - x) < 0.15;
          });
          return hasJsonOpen;
        };

        // Render turning points
        turning.forEach(tp => {
          if (tp.x >= xMin && tp.x <= xMax && tp.y >= yMin && tp.y <= yMax) {
            const yVal = f(tp.x);
            const hasImage = !isNaN(yVal) && isFinite(yVal) && !hasHoleAtX(tp.x);

            ctx.save();
            ctx.beginPath();
            ctx.arc(mapX(tp.x), mapY(tp.y), 3.5, 0, 2 * Math.PI);
            if (hasImage) {
              // Shaded/filled dot because the number has an image in the domain
              ctx.fillStyle = color || '#8b5cf6';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.stroke();
            } else {
              // Hollow/empty dot because the number has no image in the domain
              ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
              ctx.fill();
              ctx.strokeStyle = color || '#ef4444';
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }
            ctx.restore();
          }
        });

        // Render automatically detected holes (that are not already turning points)
        holes.forEach(hole => {
          // If a turning point is already drawn at this x, we skip it to avoid double drawing
          const isTp = turning.some(tp => Math.abs(tp.x - hole.x) < 0.15);
          if (!isTp && hole.x >= xMin && hole.x <= xMax && hole.y >= yMin && hole.y <= yMax) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(mapX(hole.x), mapY(hole.y), 3.5, 0, 2 * Math.PI);
            ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = color || '#ef4444'; // Red outline or curve color for holes
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.restore();
          }
        });

        // Draw open points (holes) from JSON explicitly if they are not already drawn
        jsonOpenPoints.forEach((pt: any) => {
          let xVal = NaN;
          let yVal = NaN;
          if (pt && typeof pt === 'object') {
            if (pt.x !== undefined && pt.y !== undefined) {
              xVal = Number(pt.x);
              yVal = Number(pt.y);
            } else if (Array.isArray(pt) && pt.length >= 2) {
              xVal = Number(pt[0]);
              yVal = Number(pt[1]);
            }
          }
          if (!isNaN(xVal) && !isNaN(yVal) && xVal >= xMin && xVal <= xMax && yVal >= yMin && yVal <= yMax) {
            // Avoid drawing duplicate if already drawn as a turning point hole
            const isTp = turning.some(tp => Math.abs(tp.x - xVal) < 0.15);
            const isAutoHole = holes.some(h => Math.abs(h.x - xVal) < 0.15);
            if (!isTp && !isAutoHole) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(mapX(xVal), mapY(yVal), 3.5, 0, 2 * Math.PI);
              ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
              ctx.fill();
              ctx.strokeStyle = color || '#ef4444';
              ctx.lineWidth = 1.6;
              ctx.stroke();
              ctx.restore();
            }
          }
        });

        // Draw closed points from JSON explicitly
        jsonClosedPoints.forEach((pt: any) => {
          let xVal = NaN;
          let yVal = NaN;
          if (pt && typeof pt === 'object') {
            if (pt.x !== undefined && pt.y !== undefined) {
              xVal = Number(pt.x);
              yVal = Number(pt.y);
            } else if (Array.isArray(pt) && pt.length >= 2) {
              xVal = Number(pt[0]);
              yVal = Number(pt[1]);
            }
          }
          if (!isNaN(xVal) && !isNaN(yVal) && xVal >= xMin && xVal <= xMax && yVal >= yMin && yVal <= yMax) {
            // Avoid drawing duplicate if already drawn as a turning point solid
            const isTp = turning.some(tp => Math.abs(tp.x - xVal) < 0.15);
            if (!isTp) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(mapX(xVal), mapY(yVal), 3.5, 0, 2 * Math.PI);
              ctx.fillStyle = color || '#8b5cf6';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.stroke();
              ctx.restore();
            }
          }
        });
      }

      // Piecewise or Explicit Boundary Endpoints (Open/Closed dots)
      const endpoints = eq.type === 'piecewise' ? eq.piecewiseEndpoints : eq.domainEndpoints;
      if (endpoints) {
        endpoints.forEach(pt => {
          if (pt.x >= xMin && pt.x <= xMax && pt.y >= yMin && pt.y <= yMax) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(mapX(pt.x), mapY(pt.y), 3.5, 0, 2 * Math.PI);
            if (pt.isClosed) {
              ctx.fillStyle = color;
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.stroke();
            } else {
              ctx.fillStyle = isDark ? '#0b0f19' : '#ffffff';
              ctx.fill();
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }
            ctx.restore();
          }
        });
      }
    });

    ctx.restore(); // restore clipping region
  }, [dimensions, center, span, parsedEquations, graphData, isOption]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full flex flex-col items-stretch overflow-hidden select-none bg-slate-50 dark:bg-slate-950 font-sans"
      id="graph-engine-container"
    >
      {/* 1. INTERACTIVE CANVAS GRID */}
      <canvas
        ref={canvasRef}
        className="w-full flex-1 touch-pan-y touch-pinch-zoom"
        dir="ltr"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
        onWheel={handleWheel}
        id="graph-canvas-element"
      />

      {/* 2. DOCK CONTROLS (ZOOM/PAN/RESET) - Hidden because the grid is fixed */}
    </div>
  );
};

export default MathGraphEngine;
