/* eslint-disable react-refresh/only-export-components */
import React, { useRef, useState, useEffect } from 'react';
import katex from 'katex';

interface ScalableMathProps {
    html: string;
    isBlock?: boolean;
}

/**
 * مكون يقوم بتصيير معادلة رياضية ويصغر حجمها تلقائياً فقط إذا تجاوزت عرض الحاوية الأب
 */
const ScalableMath: React.FC<ScalableMathProps> = ({ html, isBlock = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [fontSize, setFontSize] = useState<string>('1.12em');

    useEffect(() => {
        const container = containerRef.current;
        const inner = innerRef.current;
        if (!container || !inner) return;

        const getBlockParent = (el: HTMLElement): HTMLElement => {
            let parent = el.parentElement;
            const inlineTags = ['SPAN', 'U', 'EM', 'STRONG', 'B', 'I', 'INS', 'DEL', 'A'];
            while (parent) {
                if (!inlineTags.includes(parent.tagName)) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return document.body;
        };

        const blockParent = getBlockParent(container);
        let frameId: number | null = null;

        const checkScale = () => {
            if (!container || !inner || !blockParent) return;

            const baseFontSize = 1.12;
            inner.style.fontSize = `${baseFontSize}em`;
            
            const style = window.getComputedStyle(blockParent);
            const paddingLeft = parseFloat(style.paddingLeft) || 0;
            const paddingRight = parseFloat(style.paddingRight) || 0;
            
            const safetyMargin = isBlock ? 32 : 48; 
            const availableWidth = blockParent.clientWidth - paddingLeft - paddingRight - safetyMargin;
            
            const innerWidth = inner.scrollWidth;

            if (innerWidth > availableWidth && availableWidth > 0) {
                const ratio = availableWidth / innerWidth;
                const scaledFont = Math.max(0.45, baseFontSize * ratio - 0.02);
                const finalSize = `${scaledFont}em`;
                inner.style.fontSize = finalSize;
                setFontSize(finalSize);
            } else {
                inner.style.fontSize = `${baseFontSize}em`;
                setFontSize(`${baseFontSize}em`);
            }
        };

        checkScale();

        const timer1 = setTimeout(checkScale, 50);
        const timer2 = setTimeout(checkScale, 150);

        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined' && blockParent) {
            observer = new ResizeObserver(() => {
                if (frameId !== null) {
                    cancelAnimationFrame(frameId);
                }
                frameId = requestAnimationFrame(() => {
                    checkScale();
                });
            });
            observer.observe(blockParent);
        }

        const handleResize = () => {
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
            }
            frameId = requestAnimationFrame(() => {
                checkScale();
            });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (observer) {
                observer.disconnect();
            }
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
            }
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [html, isBlock]);

    return (
        <div 
            ref={containerRef} 
            dir="ltr"
            className={`overflow-visible ${isBlock ? 'my-2 w-full text-center' : 'inline-block mx-1'}`}
            style={{ 
                display: isBlock ? 'block' : 'inline-block',
                direction: 'ltr',
                unicodeBidi: 'isolate',
                textAlign: isBlock ? 'center' : 'left'
            }}
        >
            <div
                ref={innerRef}
                dir="ltr"
                className="inline-block ltr-math align-middle whitespace-nowrap px-1"
                style={{ 
                    fontSize, 
                    whiteSpace: 'nowrap',
                    direction: 'ltr',
                    unicodeBidi: 'isolate',
                    textAlign: 'left'
                }}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
};

/**
 * Clean up common plain math symbols to valid KaTeX LaTeX syntax
 */
function cleanMathToLatex(mathStr: string): string {
    let s = mathStr.trim();

    // Remove trailing dot if attached at the end of equation
    if (s.endsWith('.')) {
        s = s.slice(0, -1).trim();
    }
    
    // Replace superscript unicode characters
    s = s
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/⁴/g, '^4')
        .replace(/⁵/g, '^5')
        .replace(/⁶/g, '^6')
        .replace(/⁷/g, '^7')
        .replace(/⁸/g, '^8')
        .replace(/⁹/g, '^9')
        .replace(/⁰/g, '^0')
        .replace(/⁻¹/g, '^{-1}')
        .replace(/⁻²/g, '^{-2}');

    // Replace common math symbols
    s = s
        .replace(/→|->|\u2192/g, ' \\to ')
        .replace(/≠/g, ' \\neq ')
        .replace(/≤|<=/g, ' \\le ')
        .replace(/≥|>=/g, ' \\ge ')
        .replace(/±/g, ' \\pm ')
        .replace(/π/g, ' \\pi ')
        .replace(/∞/g, ' \\infty ')
        .replace(/∈/g, ' \\in ')
        .replace(/∉/g, ' \\notin ')
        .replace(/∪/g, ' \\cup ')
        .replace(/∩/g, ' \\cap ')
        .replace(/∅/g, ' \\emptyset ')
        .replace(/×/g, ' \\times ')
        .replace(/÷/g, ' \\div ');

    // Handle fractions: (A)/(B) or (A) / (B) -> \frac{A}{B}
    s = s.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
    s = s.replace(/\(([^)]+)\)\s*\/\s*([a-zA-Z0-9_\-^]+)/g, '\\frac{$1}{$2}');
    s = s.replace(/([a-zA-Z0-9_\-^]+)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');

    // Handle square roots: √x or √(x+1) -> \sqrt{x} or \sqrt{x+1}
    s = s.replace(/√\s*\(([^)]+)\)/g, '\\sqrt{$1}');
    s = s.replace(/√\s*([a-zA-Z0-9]+)/g, '\\sqrt{$1}');

    // Handle limits: lim x→2 or lim x->2 or lim_{x->2} or \lim_{x->2}
    s = s.replace(/\\?lim\s*(?:_\{?\s*)?([a-zA-Z0-9]+)\s*(?:\\to|->|\u2192|→)\s*([^}\s)]+)\}?/gi, '\\lim_{$1 \\to $2}');

    // Handle trig/log functions: sin(x) -> \sin(x)
    s = s.replace(/\b(sin|cos|tan|csc|sec|cot|log|ln)\b(?!\s*\\)/gi, (m, fn) => `\\${fn.toLowerCase()}`);

    // Clean up spaces
    s = s.replace(/\s+/g, ' ');

    // Prepend \displaystyle if math contains limits, fractions, roots or cases
    if ((s.includes('\\lim') || s.includes('\\frac') || s.includes('\\sqrt') || s.includes('\\begin')) && !s.includes('\\displaystyle')) {
        s = '\\displaystyle ' + s;
    }

    return s;
}

/**
 * Auto converts plain math patterns in text to LaTeX $...$
 */
export function autoConvertPlainMathToLatex(text: string): string {
    if (!text || typeof text !== 'string') return text;

    // Check if text already contains LaTeX delimiters
    const hasLatex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g.test(text);

    if (hasLatex) {
        const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
        return parts.map(part => {
            if (!part) return '';
            if (
                part.startsWith('$$') || 
                part.startsWith('$') || 
                part.startsWith('\\[') || 
                part.startsWith('\\(')
            ) {
                return part;
            }
            return convertTextChunk(part);
        }).join('');
    }

    return convertTextChunk(text);
}

function convertTextChunk(chunk: string): string {
    if (!chunk || !chunk.trim()) return chunk;

    const trimmed = chunk.trim();
    const hasArabic = /[\u0600-\u06FF]/.test(chunk);

    if (!hasArabic) {
        // Pure math choice or expression
        const isMathChoice = 
            /^(?:f|g|h|P|R|C|V|Q|y|y')\s*(?:\([^)]+\))?\s*['″]*\s*=\s*.+/i.test(trimmed) ||
            /^\(?\s*-?\s*\d+\s*,\s*-?\s*\d+\s*\)?$/i.test(trimmed) || 
            /^[([]\s*-?\s*(?:\d+|[a-zA-Z]|\\infty|∞)\s*,\s*-?\s*(?:\d+|[a-zA-Z]|\\infty|∞)\s*[)]$/i.test(trimmed) ||
            /^(?:lim|sin|cos|tan|csc|sec|cot|log|ln|sqrt|√)/i.test(trimmed) ||
            /[=+\-*/^|√\\≤≥±π∞∈]/.test(trimmed) ||
            (/^\d+[\s.]*$/.test(trimmed) === false && /[0-9=+\-*/^|()\\[\]]/.test(trimmed));

        if (isMathChoice && !/^[A-Za-z]$/.test(trimmed) && !/^(true|false|none|all)$/i.test(trimmed)) {
            return `$${cleanMathToLatex(chunk)}$`;
        }
    }

    let result = chunk;

    // Pattern 1: Absolute value equations & inequalities: e.g. | x - 3 | <= 4 or |2x + 1| = 5
    result = result.replace(
        /(\|[^\n|]+\|\s*(?:<=|>=|=|<|>|≤|≥|≠|\+|-|\*|\/)?\s*[^.\u0600-\u06FF\n,،;?؟]*)/g,
        (match) => {
            if (match.includes('$')) return match;
            const cleaned = cleanMathToLatex(match);
            return cleaned ? `$${cleaned}$` : match;
        }
    );

    // Pattern 2: Functions & Equations/Inequalities with variables: f(x) = ..., x - 3 <= 4, 2x + 1 = 5
    result = result.replace(
        /\b((?:f|g|h|P|R|C|V|Q|y|y'|x)\s*(?:\([^)]+\))?\s*['″]*\s*(?:<=|>=|=|<|>|≤|≥|≠)\s*[^.\u0600-\u06FF\n,،;?؟]+)/gi,
        (match) => {
            if (match.includes('$')) return match;
            const cleaned = cleanMathToLatex(match);
            return cleaned ? `$${cleaned}$` : match;
        }
    );

    // Pattern 3: Limits: lim x→2 or غاية x->2
    result = result.replace(
        /\b((?:lim|غاي|غاية)\s*(?:_{)?\s*[a-zA-Z0-9]+\s*(?:\\to|→|->|\u2192)\s*[-+]?[a-zA-Z0-9∞\u221e]+\s*}?\s*(?:\([^)]+\)|[^\s\u0600-\u06FF\n,،;?؟]+)?)/gi,
        (match) => {
            if (match.includes('$')) return match;
            const cleaned = cleanMathToLatex(match);
            return cleaned ? `$${cleaned}$` : match;
        }
    );

    // Pattern 4: Fractions: (x^2 - 4) / (x - 2)
    result = result.replace(
        /((?:\([^)]+\)|[a-zA-Z0-9_\-^]+)\s*\/\s*(?:\([^)]+\)|[a-zA-Z0-9_\-^]+))/g,
        (match) => {
            if (match.includes('$')) return match;
            const cleaned = cleanMathToLatex(match);
            return cleaned ? `$${cleaned}$` : match;
        }
    );

    // Pattern 5: Coordinates & Intervals: (4, -2) or (-4, -2) or [0, ∞)
    result = result.replace(
        /((?:\(|\[)\s*-?\s*(?:[0-9a-zA-Z∞\u221e]|\\[a-zA-Z]+)+\s*,\s*-?\s*(?:[0-9a-zA-Z∞\u221e]|\\[a-zA-Z]+)+\s*(?:\)|\]))/g,
        (match) => {
            if (match.includes('$')) return match;
            const cleaned = cleanMathToLatex(match);
            return cleaned ? `$${cleaned}$` : match;
        }
    );

    // Pattern 6: Embedded trig/log: sin(x), cos(2x)
    result = result.replace(
        /\b((?:sin|cos|tan|csc|sec|cot|log|ln)\s*\([^)]+\))/gi,
        (match) => {
            if (match.includes('$')) return match;
            const cleaned = cleanMathToLatex(match);
            return cleaned ? `$${cleaned}$` : match;
        }
    );

    // Pattern 7: Square roots: √x, √(x+1)
    result = result.replace(
        /(√\s*\([^)]+\)|√\s*[a-zA-Z0-9]+)/g,
        (match) => {
            if (match.includes('$')) return match;
            const cleaned = cleanMathToLatex(match);
            return cleaned ? `$${cleaned}$` : match;
        }
    );

    // Pattern 8: Polynomials with superscripts: x²+5x+6
    result = result.replace(
        /\b([a-zA-Z]\s*(?:\^|²|³|⁴|⁵|⁶|⁷|⁸|⁹|⁰)\s*(?:[+-]\s*[0-9a-zA-Z²³⁴⁵⁶⁷⁸⁹⁰^]+)*)/g,
        (match) => {
            if (match.includes('$')) return match;
            const cleaned = cleanMathToLatex(match);
            return cleaned ? `$${cleaned}$` : match;
        }
    );

    return result;
}

/**
 * Parses LaTeX text and renders HTML/KaTeX React nodes
 */
function parseTextAndRenderNodes(text: string, forceBlock = false): React.ReactNode {
    if (!text || typeof text !== 'string') return text;

    const regex = /(<u>[\s\S]*?<\/u>|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/gi;
    const parts = text.split(regex);

    if (parts.length === 1) {
        return text;
    }

    return (
        <>
            {parts.map((part, index) => {
                if (!part) return null;

                const lowerPart = part.toLowerCase();

                // Underline tag <u>
                if (lowerPart.startsWith('<u>') && lowerPart.endsWith('</u>')) {
                    const content = part.substring(3, part.length - 4);
                    return (
                        <u key={index} className="underline underline-offset-4 decoration-2">
                            {parseTextAndRenderNodes(content, forceBlock)}
                        </u>
                    );
                }

                // Display Math ($$...$$ or \[...\])
                if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\[') && part.endsWith('\\]'))) {
                    let math = part.slice(2, -2).trim();
                    if (!math.includes('\\displaystyle') && (math.includes('\\lim') || math.includes('\\frac') || math.includes('\\sqrt') || math.includes('\\begin') || math.includes('\\sum') || math.includes('\\int'))) {
                        math = '\\displaystyle ' + math;
                    }
                    try {
                        const html = katex.renderToString(math, {
                            displayMode: false,
                            throwOnError: false,
                            trust: true
                        });
                        return <ScalableMath key={index} html={html} isBlock={true} />;
                    } catch {
                        return <span key={index} className="font-mono text-red-500">{part}</span>;
                    }
                }

                // Inline Math ($...$ or \(...\))
                if ((part.startsWith('$') && part.endsWith('$')) || (part.startsWith('\\(') && part.endsWith('\\)'))) {
                    let math = part.slice(part.startsWith('$') ? 1 : 2, part.endsWith('$') ? -1 : -2).trim();
                    const requiresBlock = math.includes('\\begin{cases}') || 
                                          math.includes('\\begin{align}') || 
                                          math.includes('\\begin{matrix}') || 
                                          math.includes('\\begin{array}') ||
                                          math.includes('\\begin{split}') ||
                                          math.includes('\\begin{gather}') ||
                                          math.includes('\\\\');
                    if (!math.includes('\\displaystyle') && (math.includes('\\lim') || math.includes('\\frac') || math.includes('\\sqrt') || math.includes('\\begin') || math.includes('\\sum') || math.includes('\\int'))) {
                        math = '\\displaystyle ' + math;
                    }
                    try {
                        const html = katex.renderToString(math, {
                            displayMode: false,
                            throwOnError: false,
                            trust: true
                        });
                        return <ScalableMath key={index} html={html} isBlock={requiresBlock || forceBlock} />;
                    } catch {
                        return <span key={index} className="font-mono text-red-500">{part}</span>;
                    }
                }

                return <span key={index}>{part}</span>;
            })}
        </>
    );
}

export interface MathRendererProps {
    text?: string;
    children?: React.ReactNode;
    className?: string;
    inline?: boolean;
    isBlock?: boolean;
}

/**
 * Unified MathRenderer component for rendering equations and mixed text across JoSchool11
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
    text,
    children,
    className = '',
    isBlock = false
}) => {
    const rawContent = text ?? (typeof children === 'string' ? children : '');

    if (!rawContent && children) {
        return <span className={className}>{children}</span>;
    }

    if (!rawContent || typeof rawContent !== 'string') {
        return <span className={className}>{rawContent}</span>;
    }

    const processedText = autoConvertPlainMathToLatex(rawContent);
    const renderedNodes = parseTextAndRenderNodes(processedText, isBlock);

    return (
        <span className={`math-renderer-container ${className}`}>
            {renderedNodes}
        </span>
    );
};

export const renderTextWithUnderline = (text: string): React.ReactNode => {
    if (!text || typeof text !== 'string') return text;
    return <MathRenderer text={text} />;
};

export default MathRenderer;
