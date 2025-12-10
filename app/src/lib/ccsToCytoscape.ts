import type { ElementDefinition } from 'cytoscape';
import type { CCSProgram, CCSExpression } from '@/types';

function generateId(): string {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function getActionLabel(action: any): string {
  if(typeof action === 'string') {
    return action;
  }

  return action.name || action.label || action.value || 'unknown'; 
}

export function transformAstToCytoscape(ast: CCSProgram): ElementDefinition[] {
  const nodes: ElementDefinition[] = [];
  const edges: ElementDefinition[] = [];
  const processedNodes = new Set<string>();
  let nodeCounter = 0;

  // Vytvoření hlavních uzlů
  ast.forEach(def => {
    if(!processedNodes.has(def.name)) {
      nodes.push({ 
        data: { id: def.name, label: def.name, type: 'process' } 
      });
      processedNodes.add(def.name);
    }
  });

  // Průchod definicemi
  ast.forEach(def => {
    processNode(def.process, def.name);
  });

  // Rekurzivní zpracování výrazů
  function processNode(expression: CCSExpression, sourceId: string) {
    if(!expression) {
      return;
    }

    switch(expression.type) {
      case 'Prefix': { // a.P
        const { action, next } = expression;
        const actionLabel = getActionLabel(action);
        
        if(next.type === 'ProcessRef') { // a.V1
          edges.push({
            data: { source: sourceId, target: next.name, label: actionLabel }
          });
        } 
        else if(next.type === 'Nil') { // a.0
          const nilId = 'Nil';
          if(!processedNodes.has(nilId)) {
            nodes.push({ data: { id: nilId, label: '0', type: 'nil' } });
            processedNodes.add(nilId);
          }
          edges.push({ data: { source: sourceId, target: nilId, label: actionLabel } });
        } 
        else { // a.(...)
          const childIndex = nodeCounter++;
          const intermediateId = `${sourceId}_${expression.type}_${childIndex}`;
          
          nodes.push({ 
            data: { id: intermediateId, label: '', type: 'intermediate' } 
          });
          
          edges.push({
            data: { source: sourceId, target: intermediateId, label: actionLabel }
          });
          
          processNode(next, intermediateId);
        }
        break;
      }

      case 'Summation': { // P + Q
        processNode(expression.left, sourceId);
        processNode(expression.right, sourceId);
        break;
      }

      case 'ProcessRef': {
        // TODO např. V1 = V2 -> epsilon hranu nebo alias
        break;
      }

      case 'Parallel':
      case 'Restriction':
      case 'Relabeling': {
        const opId = generateId();
        let label = '';
        
        if(expression.type === 'Parallel') {
          label = '|';
        }
        else if(expression.type === 'Restriction') {
          label = '\\';
        }
        else {
          label = '[]';
        }

        nodes.push({ 
          data: { id: opId, label: label, type: 'operator' } 
        });
        
        edges.push({ 
          data: { source: sourceId, target: opId, label: '' } // bez labelu
        });
        
        // TODO pokračování s rekurzí
        break;
      }
      
      case 'Nil': { // Samostatný Nil
        const nilId = 'Nil';
        if(!processedNodes.has(nilId)) {
            nodes.push({ data: { id: nilId, label: '0', type: 'nil' } });
            processedNodes.add(nilId);
        }
        break;
      }
    }
  }

  return [...nodes, ...edges];
}