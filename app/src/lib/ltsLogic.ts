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

function hashString(str: string): string {
  let hash = 0;
  for(let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getStableNodeId(ccsStr: string): string {
  return `n_${hashString(ccsStr)}`;
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
  isExplorationMode?: boolean;
  exploredStates?: CCSExpression[];
  keepForwardSteps?: number;
}

export function generateLTS(ast: CCSProgram, startProcessName: string, config: LTSConfig = { maxDepth: 20, maxStates: 150 }): ElementDefinition[] {
  const nodes: ElementDefinition[] = [];
  const edgeMap = new Map<string, { source: string, target: string, actions: Set<string> }>();
  const visited = new Set<string>();
  
  const defs = new Map<string, CCSExpression>();
  ast.forEach(def => defs.set(def.name, def.process));

  const addNode = (expr: CCSExpression, isInit: boolean) => {
    const str = ccsToString(expr, config.useStructuralReduction);
    const id = getStableNodeId(str);
    const isNew = !visited.has(id);
    
    if(isNew) {
      visited.add(id);
      nodes.push({ data: { id, label: id, ccs: str, isInitial: isInit } });
    }
    return { id, isNew };
  };

  const queue: { expr: CCSExpression, depth: number }[] = [];

  if(config.isExplorationMode && config.exploredStates && config.exploredStates.length > 0) {
    config.exploredStates.forEach((expr, index) => {
      if(!expr) {
        return;
      }
      
      const { isNew } = addNode(expr, index === 0);
      if(isNew) {
        queue.push({ expr, depth: 0 });
      }
    });
  } 
  else {  
    const startExpr = { type: 'ProcessRef', name: startProcessName } as CCSExpression;
    
    if(defs.has(startProcessName)) {
      const { isNew } = addNode(startExpr, true);
      if(isNew) {
        queue.push({ expr: startExpr, depth: 0 });
      }
    }
  }

  const targetDepth = config.isExplorationMode ? (config.keepForwardSteps ?? 1) : config.maxDepth;
  while(queue.length > 0) {
    if(nodes.length >= config.maxStates) {
      break;
    }

    const { expr, depth } = queue.shift()!;
    const currentStr = ccsToString(expr, config.useStructuralReduction);
    const currentId = getStableNodeId(currentStr);

    if(depth >= targetDepth) {
      continue;
    }

    const transitions = getPossibleTransitions(expr, defs);

    for(const t of transitions) {
      const { id: targetId, isNew } = addNode(t.targetExpr, false);

      const edgeKey = `${currentId}_${targetId}`;
      if(!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          source: currentId,
          target: targetId,
          actions: new Set()
        });
      }

      edgeMap.get(edgeKey)!.actions.add(t.action);
      if(isNew) {
        queue.push({ expr: t.targetExpr, depth: depth + 1 });
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