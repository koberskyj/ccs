import type { ElementDefinition } from 'cytoscape';
import type { CCSProgram, CCSExpression } from '@/types';
import { ccsToString } from './ccsUtils';

function getActionBaseName(actionLabel: string): string {
  if(actionLabel === 'tau') {
    return 'tau';
  }
  return actionLabel.startsWith("'") ? actionLabel.slice(1) : actionLabel;
}

function isOutputAction(actionLabel: string): boolean {
  return actionLabel.startsWith("'");
}

function areComplementary(a1: string, a2: string): boolean {
  if(a1 === 'tau' || a2 === 'tau') {
    return false;
  }
  const base1 = getActionBaseName(a1);
  const base2 = getActionBaseName(a2);
  const isOut1 = isOutputAction(a1);
  const isOut2 = isOutputAction(a2);
  
  return base1 === base2 && isOut1 !== isOut2;
}

type Transition = {
  action: string;
  targetExpr: CCSExpression;
  visitedRefs?: Set<string>;
};
type ProcessDefs = Map<string, CCSExpression>;

export function getPossibleTransitions(expr: CCSExpression, defs: ProcessDefs, visitedRefs: Set<string> = new Set()): Transition[] {
  if(!expr) {
    return [];
  }

  switch (expr.type) {
    case 'Nil':
      return [];

    case 'Prefix': // ACT
      const label = `${expr.action.isOutput ? "'" : ""}${expr.action.label}`;
      return [{ action: label, targetExpr: expr.next }];

    case 'Summation': // SUM
      return [
        ...getPossibleTransitions(expr.left, defs, visitedRefs),
        ...getPossibleTransitions(expr.right, defs, visitedRefs)
      ];

    case 'ProcessRef': // CON/DEF
      if(visitedRefs.has(expr.name)) {
        return []; 
      }
      const newVisited = new Set(visitedRefs);
      newVisited.add(expr.name);

      const body = defs.get(expr.name);
      if(!body) {
        return [];
      }

      return getPossibleTransitions(body, defs, newVisited);

    case 'Parallel': {
      const leftTrans = getPossibleTransitions(expr.left, defs, visitedRefs);
      const rightTrans = getPossibleTransitions(expr.right, defs, visitedRefs);
      const transitions: Transition[] = [];

      // COM1
      leftTrans.forEach(t => {
        transitions.push({
          action: t.action,
          targetExpr: { type: 'Parallel', left: t.targetExpr, right: expr.right }
        });
      });

      // COM2
      rightTrans.forEach(t => {
        transitions.push({
          action: t.action,
          targetExpr: { type: 'Parallel', left: expr.left, right: t.targetExpr }
        });
      });

      // COM3
      leftTrans.forEach(tL => {
        rightTrans.forEach(tR => {
          if (areComplementary(tL.action, tR.action)) {
            transitions.push({
              action: 'tau',
              targetExpr: { 
                type: 'Parallel', 
                left: tL.targetExpr, 
                right: tR.targetExpr 
              }
            });
          }
        });
      });

      return transitions;
    }
      
    case 'Restriction': { // RES
      const subTransitions = getPossibleTransitions(expr.process, defs, visitedRefs);
      
      return subTransitions
        .filter(t => {
          if(t.action === 'tau') {
            return true;
          }
          
          const baseName = getActionBaseName(t.action);
          return !expr.labels.includes(baseName);
        }).map(t => ({
          action: t.action,
          targetExpr: { 
            type: 'Restriction', 
            process: t.targetExpr, 
            labels: expr.labels 
          } as CCSExpression
        }));
    }

    case 'Relabeling': { // REL
      const subTransitions = getPossibleTransitions(expr.process, defs, visitedRefs);

      return subTransitions.map(t => {
        let newActionLabel = t.action;

        if(t.action !== 'tau') {
          const baseName = getActionBaseName(t.action);
          const isOutput = isOutputAction(t.action);

          const relabelPair = expr.relabels.find(r => r.old === baseName);

          if(relabelPair) {
            newActionLabel = (isOutput ? "'" : "") + relabelPair.new;
          }
        }

        return {
          action: newActionLabel,
          targetExpr: {
            type: 'Relabeling',
            process: t.targetExpr,
            relabels: expr.relabels
          } as CCSExpression
        };
      });
    }
    
    default:
      return [];
  }
}

interface LTSConfig {
  maxDepth: number;
  maxStates: number;
  useStructuralReduction?: boolean;
}

export function generateLTS(ast: CCSProgram, startProcessName: string, config: LTSConfig = { maxDepth: 20, maxStates: 150, useStructuralReduction: false }): ElementDefinition[] {
  const nodes: ElementDefinition[] = [];
  const edgeMap = new Map<string, { source: string, target: string, actions: Set<string> }>();
  
  const defs = new Map<string, CCSExpression>();
  ast.forEach(def => defs.set(def.name, def.process));

  const startExpr = defs.get(startProcessName);
  if(!startExpr) {
    return [];
  }

  const queue: { expr: CCSExpression, depth: number }[] = [];
  const visited = new Set<string>();
  const stateIdMap = new Map<string, string>();
  const rootCCS = ccsToString({ type: 'ProcessRef', name: startProcessName } as any, config.useStructuralReduction);
  
  queue.push({ expr: { type: 'ProcessRef', name: startProcessName } as any, depth: 0 });
  
  const startNodeId = '1';
  stateIdMap.set(rootCCS, startNodeId);
  visited.add(rootCCS);

  nodes.push({
    data: { 
      id: startNodeId, 
      label: startNodeId,
      ccs: rootCCS,
      isInitial: true
    }
  });

  let stateCounter = 1;
  while(queue.length > 0) {
    if(nodes.length >= config.maxStates) {
      break;
    }

    const { expr, depth } = queue.shift()!;
    const currentStr = ccsToString(expr, config.useStructuralReduction);
    const currentId = stateIdMap.get(currentStr)!;

    if(depth >= config.maxDepth) {
      continue;
    }

    const transitions = getPossibleTransitions(expr, defs);

    for(const t of transitions) {
      const targetStr = ccsToString(t.targetExpr, config.useStructuralReduction);
      let targetId = stateIdMap.get(targetStr);

      if(!targetId) {
        if(!visited.has(targetStr)) {
          stateCounter++;
          targetId = `${stateCounter}`;
          stateIdMap.set(targetStr, targetId);
          visited.add(targetStr);

          nodes.push({
            data: { 
              id: targetId, 
              label: targetId,
              ccs: targetStr,
              isInitial: false
            }
          });
          queue.push({ expr: t.targetExpr, depth: depth + 1 });
        }
      }

      if(targetId) {
        const edgeKey = `${currentId}_${targetId}`;
        if(!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            source: currentId,
            target: targetId,
            actions: new Set()
          });
        }

        edgeMap.get(edgeKey)!.actions.add(t.action);
      }
    }
  }

  const edges: ElementDefinition[] = [];
  edgeMap.forEach((val, key) => {
    const actionList = Array.from(val.actions);
    const label = actionList.join(', ');
    
    edges.push({
      data: {
        id: `e_${key}`,
        source: val.source,
        target: val.target,
        label: label,
        actions: actionList
      }
    });
  });

  return [...nodes, ...edges];
}