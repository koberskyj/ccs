import type { CCSAction, CCSDefinition, CCSExpression, CCSNode, CCSProgram, ProofRuleName, ProofStatus, ProofStep } from "@/types";


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
      return fail('Zdroj nemá prefix.');
    }
    if(!areActionsEqual(source.action, action)) {
      return fail(`Akce se neshoduje (${source.action.isOutput ? "'" : ""}${source.action.label} vs ${action.isOutput ? "'" : ""}${action.label}).`);
    }
    if(!areProcessesEqual(source.next, target)) {
      return fail('Výsledný proces nesedí.');
    }
    return success();
  }

  // SUM
  if(rule === 'SUM_LEFT') {
    if(source.type !== 'Summation') {
      return fail('Nejedná se o sumu.');
    }
    return addPremise(source.left, target, action);
  }
  if(rule === 'SUM_RIGHT') {
    if(source.type !== 'Summation') {
      return fail('Nejedná se o sumu.');
    }
    return addPremise(source.right, target, action);
  }

  // COM (Parallel)
  if(rule === 'COM_LEFT') {
      if(source.type !== 'Parallel' || target.type !== 'Parallel') {
      return fail('Nejedná se o paralelní proces.');
      }
      if(!areProcessesEqual(source.right, target.right)) {
      return fail('Pravá strana se změnila.');
      }

      return addPremise(source.left, target.left, action);
  }
  if(rule === 'COM_RIGHT') {
      if(source.type !== 'Parallel' || target.type !== 'Parallel') {
      return fail('Nejedná se o paralelní proces.');
      }
      if(!areProcessesEqual(source.left, target.left)) {
      return fail('Levá strana se změnila.');
      }
      return addPremise(source.right, target.right, action);
  }
  if(rule === 'COM_SYNC') {
      if(source.type !== 'Parallel' || target.type !== 'Parallel') {
        return fail('Nejedná se o paralelní proces.');
      }
      if(action.label !== 'tau') {
        return fail('Synchronizace musí vést na tau akci.');
      }
      
      const syncLabel = extraData?.label;
      const leftSends = extraData?.leftSends;
      if(!syncLabel) {
        return fail('Chybí synchronizační akce.');
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
      return fail('Nejedná se o odkaz na proces.');
    }

    const def = findDefinition(source.name, program);
    if(!def) {
      return fail(`Definice ${source.name} nenalezena.`);
    }

    return addPremise(def, target, action);
  }

  // RES
  if(rule === 'RES') {
      if(source.type !== 'Restriction' || target.type !== 'Restriction') {
      return fail('Neshoda v restrikci.');
      }

      if(source.labels.includes(action.label)) {
      return fail(`Akce '${action.label}' je restrikcí zakázána.`);
      }

      const set1 = [...source.labels].sort();
      const set2 = [...target.labels].sort();
      if(set1.join(',') !== set2.join(',')) {
      return fail('Restrikční množina se nesmí měnit.');
      }
      
      return addPremise(source.process, target.process, action);
  }

  // REL
  if(rule === 'REL') {
    if(source.type !== 'Relabeling' || target.type !== 'Relabeling') {
      return fail('Nejedná se o přejmenování.');
    }
    
    const oldLabelName = extraData?.oldLabel;
    if(!oldLabelName && action.label !== 'tau') {
      return fail('Nebyla vybrána původní akce.');
    }

    const set1 = [...source.relabels].sort();
    const set2 = [...target.relabels].sort();
    if(set1.map(s => s.old+'/'+s.new).join(',') !== set2.map(s => s.old+'/'+s.new).join(',')) {
      return fail('Sada přejmenování se nesmí měnit.');
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
        return fail(`Neplatné přejmenování (${oldLabelName} -> ${expectedOuter}).`);
      }
    }

    return addPremise(source.process, target.process, innerAction);
  }

  return fail('Neznámé pravidlo.');
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