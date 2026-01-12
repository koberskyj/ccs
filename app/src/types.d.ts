
export type CCSNodeType = 
  | 'Program' 
  | 'Definition' 
  | 'Prefix' 
  | 'Summation' 
  | 'Parallel' 
  | 'Restriction' 
  | 'Relabeling' 
  | 'Nil' 
  | 'ProcessRef';

export interface SourceLocation {
  start: { offset: number; line: number; column: number };
  end: { offset: number; line: number; column: number };
}

export interface CCSAction {
  label: string;
  isOutput: boolean;
}

interface BaseNode {
  type: CCSNodeType;
  loc?: SourceLocation;
}

export interface CCSDefinition extends BaseNode {
  type: 'Definition';
  name: string;
  process: CCSExpression;
}

export interface CCSPrefix extends BaseNode {
  type: 'Prefix';
  action: CCSAction;
  next: CCSExpression;
}

export interface CCSSummation extends BaseNode {
  type: 'Summation';
  left: CCSExpression;
  right: CCSExpression;
}

export interface CCSParallel extends BaseNode {
  type: 'Parallel';
  left: CCSExpression;
  right: CCSExpression;
}

export interface CCSRestriction extends BaseNode {
  type: 'Restriction';
  process: CCSExpression;
  labels: string[];
}

export interface RelabelPair {
  new: string;
  old: string;
}

export interface CCSRelabeling extends BaseNode {
  type: 'Relabeling';
  process: CCSExpression;
  relabels: RelabelPair[];
}

export interface CCSNil extends BaseNode {
  type: 'Nil';
}

export interface CCSProcessRef extends BaseNode {
  type: 'ProcessRef';
  name: string;
}

export type CCSExpression = 
  | CCSPrefix 
  | CCSSummation 
  | CCSParallel 
  | CCSRestriction 
  | CCSRelabeling 
  | CCSNil 
  | CCSProcessRef;

export type CCSNode = CCSDefinition | CCSExpression;
export type CCSProgram = CCSDefinition[];