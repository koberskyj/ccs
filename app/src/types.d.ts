
export type ViewMode = 'id' | 'mixed' | 'full';

export interface NodeInfo {
  id: string;
  ccs: string;
  label: string;
}

export type EdgeHighlightRequest = {
  sourceId: string;
  targetId: string;
  action: string;
} | null;

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


export type ProofRuleName = 'ACT' | 'SUM_LEFT' | 'SUM_RIGHT' | 'COM_LEFT' | 'COM_RIGHT' | 'COM_SYNC' | 'RES' | 'REL' | 'CON';
export type ProofStatus = 'pending' | 'proved' | 'invalid';

export interface ProofStep {
  id: string;
  source: CCSExpression;
  target: CCSExpression;
  action: CCSAction;
  status: ProofStatus;
  appliedRule?: ProofRuleName;
  children: ProofStep[];
  errorMessage?: string;
  syncLabel?: string; 
}

export type ProgramSave = {
  name: string;
  description?: string;
  allowEdit: boolean;
  definition: string;
  cards: ProgramCardType[];
}

export type ProgramCardType = CardSOS | CardLTS;

export type CardSOS = {
  type: 'sos';
  name: string;
  processX: string;
  processY: string;
  action: string;
  //useStructRed?: boolean;
  showHelp?: boolean
};

export type CardLTS = {
  type: 'lts';
  name: string;
  process: string;
  useStructRed?: boolean;
  style?: ViewMode;
};