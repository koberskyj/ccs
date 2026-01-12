import type { CCSNode, CCSProgram } from "@/types";
import type { ElementDefinition } from "cytoscape";


let idCounter = 0;
const getId = (): string => `n_${idCounter++}`;

function traverse(node: CCSNode, parentId: string | null = null): ElementDefinition[] {
  if(!node) {
    return [];
  }

  const currentId = getId();
  const elements: ElementDefinition[] = [];
  
  let label = '';
  let classes = node.type.toLowerCase();

  switch (node.type) {
    case 'Definition':
      label = node.name;
      classes += ' process-name';
      break;
      
    case 'Prefix':
      if(node.action.label === 'tau') {
        label = 'τ';
        classes += ' keyword';
      } 
      else if(node.action.isOutput) {
        label = `'${node.action.label}`;
        classes += ' output-action';
      } 
      else {
        label = node.action.label;
        classes += ' input-action';
      }
      break;
      
    case 'Summation':
      label = '+';
      classes += ' operator';
      break;
      
    case 'Parallel':
      label = '|';
      classes += ' operator';
      break;
      
    case 'Nil':
      label = '0';
      classes += ' keyword';
      break;
      
    case 'ProcessRef':
      label = node.name;
      classes += ' process-name';
      break;
      
    case 'Restriction':
      label = `\\ {${node.labels.join(',')}}`;
      classes += ' operator';
      break;
      
    case 'Relabeling':
      label = '[f]'; 
      classes += ' operator';
      break;
  }

  elements.push({
    data: { 
      id: currentId, 
      label: label, 
      type: node.type,
      locStart: node.loc ? node.loc.start.offset : null,
      locEnd: node.loc ? node.loc.end.offset : null
    },
    classes: classes
  });

  if(parentId) {
    elements.push({
      data: { 
        source: parentId, 
        target: currentId
      }
    });
  }

  switch(node.type) {
    case 'Definition':
      elements.push(...traverse(node.process, currentId));
      break;
    case 'Summation':
    case 'Parallel':
      elements.push(...traverse(node.left, currentId));
      elements.push(...traverse(node.right, currentId));
      break;
    case 'Prefix':
      elements.push(...traverse(node.next, currentId));
      break;
    case 'Restriction':
    case 'Relabeling':
      elements.push(...traverse(node.process, currentId));
      break;
  }

  return elements;
};

export function transformAstToSyntaxTree(astRoot: CCSProgram | CCSNode | null): ElementDefinition[] {
  idCounter = 0;
  if(!astRoot) {
    return [];
  }

  const rootId = getId();
  const elements: ElementDefinition[] = [];

  if(Array.isArray(astRoot)) {
    elements.push({
      data: { id: rootId, label: 'Program' },
      classes: 'root-node'
    });
    astRoot.forEach(def => {
      elements.push(...traverse(def, rootId));
    });
  } 
  else {
    return traverse(astRoot);
  }

  return elements;
};