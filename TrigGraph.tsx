import React from 'react';
import MathGraphEngine from './MathGraphEngine';

export interface CurveData {
  function?: string;
  type?: string;
  amplitude?: number;
  period?: string | number;
  phaseShift?: number;
  verticalShift?: number;
  reflection?: boolean;
  domain?: any;
  range?: number[];
  labeledPoints?: string[];
  xTicks?: number[];
  yTicks?: number[];
  
  // Absolute Value / Piecewise / Polynomial / Rational Specifics
  vertex?: { x: number; y: number };
  center?: { x: number; y: number };
  slope?: number;
  intercept?: number;
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  h?: number;
  k?: number;
  rx?: number;
  ry?: number;
  radius?: number;
  base?: number;
  coefficient?: number;
  horizontalScale?: number;
  
  // For piecewise
  pieces?: any[];
  
  // Extra elements
  openPoints?: any[];
  closedPoints?: any[];
  verticalAsymptotes?: number[];
  horizontalAsymptotes?: number[];
}

export interface UniversalGraphProps {
  graphData: CurveData;
  isOption?: boolean; // If true, render a compact version for multiple-choice thumbnails
}

export const TrigGraph: React.FC<UniversalGraphProps> = ({ graphData, isOption = false }) => {
  return <MathGraphEngine graphData={graphData} isOption={isOption} />;
};

export default TrigGraph;
