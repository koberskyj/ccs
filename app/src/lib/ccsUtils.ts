import type { CCSAction, CCSExpression, CCSNode, CCSProgram } from "@/types";


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

export function ccsToString(node: CCSNode, canonical: boolean = false): string {
  const currentPrecedence = getPrecedence(node);

  const printChild = (child: CCSExpression) => {
    const childStr = ccsToString(child, canonical);
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
      return `${node.name} = ${ccsToString(node.process, canonical)}`;

    case 'Nil': 
      return '0';

    case 'ProcessRef': 
      return node.name;

    case 'Prefix': {
      const actionStr = node.action.isOutput ? `'${node.action.label}` : node.action.label;
      return `${actionStr}.${printChild(node.next)}`;
    }

    case 'Restriction': {
      const labels = canonical ? [...node.labels].sort() : node.labels;
      return `${printChild(node.process)} \\ {${labels.join(', ')}}`;
    }

    case 'Relabeling': {
      let relabels = node.relabels;
      if(canonical) {
        relabels = [...node.relabels].sort((a, b) => a.old.localeCompare(b.old));
      }
      const relabelsStr = relabels.map(r => `${r.new}/${r.old}`).join(', ');
      return `${printChild(node.process)} [${relabelsStr}]`;
    }

    case 'Summation':
    case 'Parallel': {
      let operands: CCSExpression[];

      if(canonical) {
        operands = flatten(node as CCSExpression, node.type);

        // Nil filter
        const nonNilOperands = operands.filter(op => op.type !== 'Nil');
        if(nonNilOperands.length === 0) {
          return '0';
        }
        operands = nonNilOperands;

        // Sort
        let processedOps = operands.map(op => ({
          node: op,
          str: ccsToString(op, canonical),
          precedence: getPrecedence(op)
        }));
        processedOps.sort((a, b) => a.str.localeCompare(b.str));

        // Deduplication for summation
        if(node.type === 'Summation') {
          const uniqueOps: typeof processedOps = [];
          const seen = new Set<string>();
          for(const op of processedOps) {
            if(!seen.has(op.str)) {
              seen.add(op.str);
              uniqueOps.push(op);
            }
          }
          processedOps = uniqueOps;
        }

        const finalStrings = processedOps.map(op => {
          return op.precedence < currentPrecedence ? `(${op.str})` : op.str;
        });
        
        const operator = node.type === 'Parallel' ? ' | ' : ' + ';
        return finalStrings.join(operator);

      } 
      else {
        return `${printChild(node.left)} ${node.type === 'Parallel' ? '|' : '+'} ${printChild(node.right)}`;
      }
    }

    default: 
      return '';
  }
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