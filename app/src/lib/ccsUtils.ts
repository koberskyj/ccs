import type { CCSAction, CCSDefinition, CCSExpression, CCSNode, CCSProgram, ProofRuleName, ProofStatus, ProofStep } from "@/types";
import { t } from "i18next";
import type { Parser } from "peggy";


export function getPrecedence(node: CCSNode): number {
  switch(node.type) {
    case 'Nil': 
    case 'ProcessRef': 
      return 4;
    case 'Prefix': 
    case 'Restriction': 
    case 'Relabeling': 
      return 3;
    case 'Parallel': 
      return 2;
    case 'Summation': 
      return 1;
    default: 
      return 0;
  }
}

export function flatten(node: CCSExpression, type: 'Parallel' | 'Summation'): CCSExpression[] { // (A|B)|C => [A, B, C]
  if(node.type === type) {
    return [...flatten(node.left, type), ...flatten(node.right, type)];
  }
  return [node];
}

export function areActionsEqual(a1: CCSAction, a2: CCSAction) {
  return a1.label === a2.label && a1.isOutput === a2.isOutput;
}

export function areProcessesEqual(p1: CCSExpression, p2: CCSExpression): boolean {
  return ccsToString(p1, true) === ccsToString(p2, true);
}

export function findDefinition(name: string, program: CCSProgram): CCSExpression | null {
  const def = program.find(d => d.name === name);
  return def ? def.process : null;
}

export function ccsToString(rawNode: CCSNode, canonical: boolean = false): string {
  const rootNode = canonical ? normalizeCCS(rawNode) : rawNode;

  function printRecursive(node: CCSNode): string {
    const currentPrecedence = getPrecedence(node);

    const printChild = (child: CCSExpression) => {
      const childStr = printRecursive(child);
      const childPrecedence = getPrecedence(child);
      
      if(childPrecedence < currentPrecedence) {
        return `(${childStr})`;
      }

      // If more that 2 '|' or '+' on the same level, we'll put parentheses
      if(!canonical && childPrecedence === currentPrecedence && (child.type === 'Parallel' || child.type === 'Summation')) {
        return `(${childStr})`;
      }

      return childStr;
    };

    switch(node.type) {
      case 'Definition': 
        return `${node.name} = ${printRecursive(node.process)}`;

      case 'Nil': 
        return '0';

      case 'ProcessRef': 
        return node.name;

      case 'Prefix': {
        const actionStr = node.action.isOutput ? `'${node.action.label}` : node.action.label;
        return `${actionStr}.${printChild(node.next)}`;
      }

      case 'Restriction': {
        const labelsStr = node.labels.join(', ');
        return `${printChild(node.process)} \\ {${labelsStr}}`;
      }

      case 'Relabeling': {
        const relabelsStr = node.relabels.map(r => `${r.new}/${r.old}`).join(', ');
        return `${printChild(node.process)} [${relabelsStr}]`;
      }

      case 'Summation':
      case 'Parallel': {
        const operator = node.type === 'Parallel' ? ' | ' : ' + ';
        return `${printChild(node.left)}${operator}${printChild(node.right)}`;
      }
      default: 
        return '';
    }
  }

  return printRecursive(rootNode);
}

export function parseCCSAction(input: string): CCSAction|{ error: string } {
  if(!input || input.trim() === "") {
    return { error: t('sos.emptyActionError') };
  }

  const trimmedInput = input.trim();
  const isOutput = trimmedInput.startsWith("'");
  const rawLabel = isOutput ? trimmedInput.substring(1) : trimmedInput;
  if(rawLabel === "tau" || rawLabel === "τ") {
    if(isOutput) {
      return { error: t('sos.tauCannotBeOutput') };
    }
    return { label: "tau", isOutput: false };
  }

  const labelRegex = /^[a-z][a-z0-9_]*$/;
  if(!labelRegex.test(rawLabel)) {
    return { error: t('sos.invalidActionName') };
  }
  return { label: rawLabel, isOutput };
}

export function parseExpression(parser: Parser, program: CCSProgram, input: string): CCSExpression|{ error: string } {
  const trimmed = input.trim();
  if(!trimmed) {
    return { error: t('sos.emptyExpressionError') };
  }

  const existing = getExpressionByName(program, trimmed);
  if(existing) {
    return existing;
  }

  try {
    const processCode = `TmpProcessDef = ${trimmed}`;
    const ast: CCSProgram = parser.parse(processCode);
    if(ast && ast.length > 0) {
      return ast[0].process;
    }
    return { error: 'Neznámá chyba při parsování výrazu.' };
  } 
  catch (e: any) {
    return { error: e.message };
  }
}

export function getExpressionByName(program: CCSProgram, name: string): CCSExpression | undefined {
  return program.find((def) => def.name === name)?.process;
}

export function extractAllActions(program: CCSProgram): string[] {
  const actions = new Set<string>();

  const traverse = (node: CCSNode) => {
    switch(node.type) {
      case 'Definition':
        traverse(node.process);
        break;
      case 'Prefix':
        if(node.action.label !== 'tau') {
          actions.add(node.action.label);
        }
        traverse(node.next);
        break;
      case 'Summation':
      case 'Parallel':
        traverse(node.left);
        traverse(node.right);
        break;
      case 'Restriction':
        node.labels.forEach((l) => actions.add(l));
        traverse(node.process);
        break;
      case 'Relabeling':
        node.relabels.forEach((r) => {
          actions.add(r.old);
          actions.add(r.new);
        });
        traverse(node.process);
        break;
    }
  };

  program.forEach((def) => traverse(def));
  return Array.from(actions);
}

export function autoProve(step: ProofStep, program: CCSProgram, allActions: string[], maxDepth: number = 10, currentDepth: number = 0): ProofStep {
  if(currentDepth >= maxDepth) {
    return { ...step, status: 'invalid', errorMessage: t('sos.autoProofLimitReached') + ' (' + maxDepth + ')' };
  }

  const applicableRules = getSOSApplicableRules(step.source);
  for(const rule of applicableRules) {
    let extraDataOptions: any[] = [undefined];

    if(rule === 'COM_SYNC') {
      extraDataOptions = allActions.flatMap((action) => [
        { label: action, leftSends: true },
        { label: action, leftSends: false },
      ]);
    } 
    else if(rule === 'REL' && step.source.type === 'Relabeling') {
      const isTau = step.action.label === 'tau';
      if(isTau) {
        extraDataOptions = [{ oldLabel: 'tau' }];
      } 
      else {
        const expectedOuter = step.action.label;
        const mappedFrom = step.source.relabels.filter((r) => r.new === expectedOuter).map((r) => r.old);
        const isRenamed = step.source.relabels.some((r) => r.old === expectedOuter);
        const implicit = !isRenamed ? [expectedOuter] : [];

        extraDataOptions = [...mappedFrom, ...implicit].map((lbl) => ({ oldLabel: lbl }));
      }
    }

    for(const extraData of extraDataOptions) {
      const result = applySosRule(step.source, step.target, step.action, rule as ProofRuleName, program, false, extraData);

      if(result.status === 'invalid') {
        continue;
      }

      if(result.status === 'pending' && result.children.length > 0) {
        const provedChildren = result.children.map((child) =>
          autoProve(child, program, allActions, maxDepth, currentDepth + 1),
        );

        const allProved = provedChildren.every((c) => c.status === 'proved');
        if(allProved) {
          return {
            ...step,
            appliedRule: rule as ProofRuleName,
            status: 'proved',
            children: provedChildren,
          };
        }
      } 
      else if (result.status === 'proved') {
        return {
          ...step,
          appliedRule: rule as ProofRuleName,
          status: 'proved',
          children: [],
        };
      }
    }
  }

  return { ...step, status: 'invalid', errorMessage: t('sos.autoProofCannotProve') };
}



export function normalizeCCS(node: CCSDefinition): CCSDefinition;
export function normalizeCCS(node: CCSExpression): CCSExpression;
export function normalizeCCS(node: CCSNode): CCSNode;
export function normalizeCCS(node: CCSNode): CCSNode {
  if(node.type === 'Definition') {
    return {
      ...node,
      process: normalizeExpression(node.process)
    };
  }
  return normalizeExpression(node);
}

function normalizeExpression(node: CCSExpression): CCSExpression {
  if(node.type === 'Prefix') {
    return { ...node, next: normalizeExpression(node.next) };
  }
  
  if(node.type === 'Restriction') {
    const sortedLabels = [...node.labels].sort();
    return { 
      ...node, 
      process: normalizeExpression(node.process),
      labels: sortedLabels 
    };
  }
  
  if(node.type === 'Relabeling') {
    const sortedRelabels = [...node.relabels].sort((a, b) => a.old.localeCompare(b.old));
    return { 
      ...node, 
      process: normalizeExpression(node.process),
      relabels: sortedRelabels
    };
  }

  if(node.type === 'Parallel' || node.type === 'Summation') {
    const rawOperands = flatten(node, node.type);
    let operands: CCSExpression[] = rawOperands.map(op => normalizeExpression(op)).filter(op => op.type !== 'Nil');

    if(operands.length === 0) {
      return { type: 'Nil' };
    }

    if(node.type === 'Summation') {
      const uniqueMap = new Map<string, CCSExpression>();
      for(const op of operands) {
        uniqueMap.set(ccsToString(op, false), op);
      }
      operands = Array.from(uniqueMap.values());
    }

    if(operands.length === 1) {
      return operands[0];
    }

    operands.sort((a, b) => ccsToString(a, false).localeCompare(ccsToString(b, false)));

    const buildTree = (items: CCSExpression[]): CCSExpression => {
      if(items.length === 1) {
        return items[0];
      }
      const [first, ...rest] = items;
      return { type: node.type, left: first, right: buildTree(rest) };
    };
    return buildTree(operands);
  }

  return node;
}


export interface RuleApplicationResult {
  status: ProofStatus;
  children: ProofStep[];
  errorMessage?: string;
}

export function applySosRule(source: CCSExpression, target: CCSExpression, action: CCSAction, rule: ProofRuleName, program: CCSProgram, useStructRed: boolean, extraData?: any): RuleApplicationResult {

  const createStep = (s: CCSExpression, t: CCSExpression, a: CCSAction): ProofStep => ({
    id: Math.random().toString(36).substr(2, 9),
    source: s,
    target: t,
    action: a,
    status: 'pending',
    children: []
  });

  const fail = (msg: string): RuleApplicationResult => ({ 
    status: 'invalid', 
    errorMessage: msg, 
    children: [] 
  });

  const success = (): RuleApplicationResult => ({ 
    status: 'proved', 
    children: [] 
  });

  const addPremise = (s: CCSExpression, t: CCSExpression, a: CCSAction): RuleApplicationResult => ({
    status: 'pending',
    children: [createStep(useStructRed ? normalizeCCS(s) : s, useStructRed ? normalizeCCS(t) : t, a)]
  });


  // ACT
  if(rule === 'ACT') {
    if(source.type !== 'Prefix') {
      return fail(t('sos.notPrefixError'));
    }
    if(!areActionsEqual(source.action, action)) {
      return fail(`${t('sos.actionMismatchError')} (${source.action.isOutput ? "'" : ""}${source.action.label} vs ${action.isOutput ? "'" : ""}${action.label}).`);
    }
    if(!areProcessesEqual(source.next, target)) {
      return fail('Výsledný proces nesedí.');
    }
    return success();
  }

  // SUM
  if(rule === 'SUM_LEFT') {
    if(source.type !== 'Summation') {
      return fail(t('sos.notSumError'));
    }
    return addPremise(source.left, target, action);
  }
  if(rule === 'SUM_RIGHT') {
    if(source.type !== 'Summation') {
      return fail(t('sos.notSumError'));
    }
    return addPremise(source.right, target, action);
  }

  // COM (Parallel)
  if(rule === 'COM_LEFT') {
      if(source.type !== 'Parallel' || target.type !== 'Parallel') {
      return fail(t('sos.notParallelError'));
      }
      if(!areProcessesEqual(source.right, target.right)) {
      return fail(t('sos.rightSideChangedError'));
      }

      return addPremise(source.left, target.left, action);
  }
  if(rule === 'COM_RIGHT') {
      if(source.type !== 'Parallel' || target.type !== 'Parallel') {
      return fail(t('sos.notParallelError'));
      }
      if(!areProcessesEqual(source.left, target.left)) {
      return fail(t('sos.leftSideChangedError'));
      }
      return addPremise(source.right, target.right, action);
  }
  if(rule === 'COM_SYNC') {
      if(source.type !== 'Parallel' || target.type !== 'Parallel') {
        return fail(t('sos.notParallelError'));
      }
      if(action.label !== 'tau') {
        return fail(t('sos.syncMustBeTau'));
      }
      
      const syncLabel = extraData?.label;
      const leftSends = extraData?.leftSends;
      if(!syncLabel) {
        return fail(t('sos.syncLabelRequired'));
      }

      return {
        status: 'pending',
        children: [
          createStep(useStructRed ? normalizeCCS(source.left) : source.left, useStructRed ? normalizeCCS(target.left) : target.left, { label: syncLabel, isOutput: leftSends }),
          createStep(useStructRed ? normalizeCCS(source.right) : source.right, useStructRed ? normalizeCCS(target.right) : target.right, { label: syncLabel, isOutput: !leftSends })
        ]
      };
  }

  // CON
  if(rule === 'CON') {
    if(source.type !== 'ProcessRef') {
      return fail(t('sos.notProcessRefError'));
    }

    const def = findDefinition(source.name, program);
    if(!def) {
      return fail(t('sos.undefinedProcessRefError', { name: source.name }));
    }

    return addPremise(def, target, action);
  }

  // RES
  if(rule === 'RES') {
      if(source.type !== 'Restriction' || target.type !== 'Restriction') {
      return fail(t('sos.restrictionMismatchError'));
      }

      if(source.labels.includes(action.label)) {
      return fail(t('sos.restrictionForbiddenActionError', { label: action.label }));
      }

      const set1 = [...source.labels].sort();
      const set2 = [...target.labels].sort();
      if(set1.join(',') !== set2.join(',')) {
      return fail(t('sos.restrictionLabelsChangedError'));
      }
      
      return addPremise(source.process, target.process, action);
  }

  // REL
  if(rule === 'REL') {
    if(source.type !== 'Relabeling' || target.type !== 'Relabeling') {
      return fail(t('sos.notRelabelingError'));
    }
    
    const oldLabelName = extraData?.oldLabel;
    if(!oldLabelName && action.label !== 'tau') {
      return fail(t('sos.noOldLabelError'));
    }

    const set1 = [...source.relabels].sort();
    const set2 = [...target.relabels].sort();
    if(set1.map(s => s.old+'/'+s.new).join(',') !== set2.map(s => s.old+'/'+s.new).join(',')) {
      return fail(t('sos.relabelingLabelsChangedError'));
    }

    let innerAction: CCSAction;
    if(action.label === 'tau') {
      innerAction = { label: 'tau', isOutput: false };
    } 
    else {
      innerAction = { label: oldLabelName, isOutput: action.isOutput };
      const mapping = source.relabels.find(r => r.old === oldLabelName);
      const expectedOuter = mapping ? mapping.new : oldLabelName;
      
      if(expectedOuter !== action.label) {
        return fail(t('sos.invalidRelabelingError', { old: oldLabelName, expected: expectedOuter }));
      }
    }

    return addPremise(source.process, target.process, innerAction);
  }

  return fail(t('sos.unknownRuleError'));
}


export function getSOSApplicableRules(expression: CCSExpression): string[] {
  switch (expression.type) {
    case 'Prefix': 
      return ['ACT'];
    case 'Summation': 
      return ['SUM_LEFT', 'SUM_RIGHT'];
    case 'Parallel': 
      return ['COM_LEFT', 'COM_RIGHT', 'COM_SYNC'];
    case 'Restriction': 
      return ['RES'];
    case 'Relabeling': 
      return ['REL'];
    case 'ProcessRef': 
      return ['CON'];
    default: return [];
  }
}

export const ALL_SOS_RULES = [ 'ACT', 'SUM_LEFT', 'SUM_RIGHT', 'COM_LEFT', 'COM_RIGHT', 'COM_SYNC', 'RES', 'REL', 'CON' ];


export function ccsToLatex(node: CCSNode): string {
  let str = ccsToString(node);
  str = str.replace(/ \| /g, ' \\mid ');
  str = str.replace(/ \\ /g, ' \\setminus ');
  str = str.replace(/\btau\b/g, '\\tau');
  str = str.replace(/'([a-zA-Z0-9_]+)/g, '\\overline{$1}');
  return str;
}

function formatLatexTransition(step: ProofStep): string {
  const s = ccsToLatex(step.source);
  const t = ccsToLatex(step.target);
  const a = step.action.label === 'tau' ? '\\tau' : (step.action.isOutput ? `\\overline{${step.action.label}}` : step.action.label);
  return `${s} \\xrightarrow{${a}} ${t}`;
}

function generateLatexTree(step: ProofStep): string {
  let res = "";
  
  if(step.children.length === 0) {
    res += "\\AxiomC{}\n";
    if(step.appliedRule) {
      res += `\\LeftLabel{${step.appliedRule.replace('_', '\\_')} }\n`;
      res += `\\UnaryInfC{$${formatLatexTransition(step)}$}\n`;
    } 
    else {
      res += `\\UnaryInfC{$${formatLatexTransition(step)}$}\n`;
    }
  } 
  else if (step.children.length === 1) {
    res += generateLatexTree(step.children[0]);
    res += `\\LeftLabel{${step.appliedRule?.replace('_', '\\_') || ''} }\n`;
    res += `\\UnaryInfC{$${formatLatexTransition(step)}$}\n`;
  } 
  else if (step.children.length === 2) {
    res += generateLatexTree(step.children[0]);
    res += generateLatexTree(step.children[1]);
    res += `\\LeftLabel{${step.appliedRule?.replace('_', '\\_') || ''} }\n`;
    res += `\\BinaryInfC{$${formatLatexTransition(step)}$}\n`;
  }
  
  return res;
}

export function exportToLatex(rootStep: ProofStep): string {
  return `\\begin{prooftree}\n${generateLatexTree(rootStep)}\\end{prooftree}`;
}

export function exportToJson(rootStep: ProofStep): string {
  return JSON.stringify(rootStep, null, 2);
}

export function exportToText(step: ProofStep, depth: number = 0): string {
  const indent = "  ".repeat(depth);
  const s = ccsToString(step.source);
  const t = ccsToString(step.target);
  const a = step.action.label === 'tau' ? 'tau' : (step.action.isOutput ? `'${step.action.label}` : step.action.label);
  
  let res = `${indent}[${step.appliedRule || '-'}] ${s} -${a}-> ${t} (${step.status})\n`;
  step.children.forEach(child => {
    res += exportToText(child, depth + 1);
  });
  return res;
}