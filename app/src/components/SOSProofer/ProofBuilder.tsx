import { useEffect, useState } from 'react';
import type { CCSExpression, CCSAction, CCSProgram, ProofStep, ProofRuleName, ProofStatus } from '@/types';
import ProofNode from '@/components/SOSProofer/ProofNode';
import { areActionsEqual, areProcessesEqual, ccsToString, findDefinition } from '@/lib/ccsUtils';
import CCSViewer from '../textEditor/CCSViewer';
import { cn } from '@/lib/utils';


interface ProofBuilderProps {
  initialSource: CCSExpression;
  initialTarget: CCSExpression;
  initialAction: CCSAction;
  program: CCSProgram;
  showHints: boolean;
}

export function getStatusColor(status: ProofStatus) {
  switch(status) {
    case 'proved': 
      return 'bg-green-50 text-green-600 font-bold';
    case 'invalid': 
      return 'bg-red-50 text-red-600 font-bold';
    default: 
      return 'bg-stone-100';
  }
}

export function ProofBuilder({ initialSource, initialTarget, initialAction, program, showHints }: ProofBuilderProps) {
  const [rootStep, setRootStep] = useState<ProofStep>({
    id: 'root',
    source: initialSource,
    target: initialTarget,
    action: initialAction,
    status: 'pending',
    children: []
  });

  useEffect(() => {
    setRootStep({
      id: 'root',
      source: initialSource,
      target: initialTarget,
      action: initialAction,
      status: 'pending',
      children: []
    });
  }, [initialSource, initialTarget, initialAction]);

  const recalculateTreeStatus = (node: ProofStep): ProofStep => {
    const updatedChildren = node.children.map(recalculateTreeStatus);
    const newNode = { ...node, children: updatedChildren };

    if(newNode.status == 'pending' && newNode.children.length > 0) {
      if(newNode.children.some(ch => ch.status === 'invalid')) {
        return { ...newNode, status: 'invalid', errorMessage: 'Premisa selhala.' };
      }
      if(newNode.children.every(ch => ch.status === 'proved')) {
        return { ...newNode, status: 'proved' };
      }
    }
    if((newNode.status === 'proved' || newNode.status === 'invalid') && newNode.appliedRule !== 'ACT') {
      const anyPending = newNode.children.some(ch => ch.status === 'pending');
      if(anyPending) {
        return { ...newNode, status: 'pending', errorMessage: undefined };
      }
    }

    return newNode;
  };

  const updateStepInTree = (root: ProofStep, targetId: string, updateFn: (node: ProofStep) => ProofStep): ProofStep => {
    if(root.id === targetId) {
      return updateFn(root);
    }
    return {
      ...root,
      children: root.children.map(child => updateStepInTree(child, targetId, updateFn))
    };
  };

  const handleApplyRule = (stepId: string, rule: ProofRuleName, extraData?: any) => {
    setRootStep(prevRoot => {

      const treeWithAppliedRule = updateStepInTree(prevRoot, stepId, (node) => {
        const newNode = { ...node, appliedRule: rule };
        const { source, target, action } = node;

        const fail = (msg: string) => ({ ...newNode, status: 'invalid' as const, errorMessage: msg, children: [] });
        const success = () => ({ ...newNode, status: 'proved' as const, children: [] });
        const addPremise = (s: CCSExpression, t: CCSExpression, a: CCSAction) => ({
             ...newNode, children: [createStep(s, t, a)] 
        });

        // ACT
        if(rule === 'ACT') {
          if(source.type !== 'Prefix') {
            return fail('Zdroj nemá prefix.');
          }
          if(!areActionsEqual(source.action, action)) {
            return fail(`Akce se neshoduje (${source.action.label} vs ${action.label}).`);
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
              ...newNode,
              children: [
                createStep(source.left, target.left, { label: syncLabel, isOutput: leftSends }),
                createStep(source.right, target.right, { label: syncLabel, isOutput: !leftSends })
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
      });

      return recalculateTreeStatus(treeWithAppliedRule);
    });
  };

  const handleReset = (stepId: string) => {
    setRootStep(prevRoot => {
      const resetTree = updateStepInTree(prevRoot, stepId, (node) => ({
        ...node,
        status: 'pending',
        appliedRule: undefined,
        errorMessage: undefined,
        children: []
      }));
      return recalculateTreeStatus(resetTree);
    });
  };

  const createStep = (s: CCSExpression, t: CCSExpression, a: CCSAction): ProofStep => ({
    id: Math.random().toString(36).substr(2, 9),
    source: s,
    target: t,
    action: a,
    status: 'pending',
    children: []
  });

  return (
    <div className="md:shadow rounded-xl md:border border-stone-300 animate-in fade-in duration-300">
      <div className="p-3 px-4 mx-0 md:mx-4 mb-2 flex justify-between items-center flex-wrap gap-2 rounded-lg md:rounded-none border md:border-0 md:border-b border-stone-300">
        <div className='flex items-center gap-2 flex-wrap font-mono'>
          <span className="text-sm text-foreground/90 shrink-0">Dokazujete:</span> 
          <div className='flex flex-wrap items-center px-1 gap-x-2 font-mono border border-primary/10 bg-primary/5 rounded-md'>
            <CCSViewer code={ccsToString(initialSource)} className='w-auto! wrap-break-word p-1' />
            <span className="shrink-0">&mdash; <span className={`text-[#1976d2] ${initialAction.isOutput ? 'overline' : ''}`}>{initialAction.isOutput ? `'${initialAction.label}` : initialAction.label}</span> &rarr;</span>
            <CCSViewer code={ccsToString(initialTarget)} className='w-auto! wrap-break-word p-1' />
          </div>
        </div>
        <div className={cn('text-xs text-gray-500 p-2 rounded-md uppercase', getStatusColor(rootStep.status))}>
          {rootStep.status === 'proved' ? 'Dokázáno' : (rootStep.status === 'invalid' ? 'Chyba důkazu' : 'Probíhá')}
        </div>
      </div>
      
      <div className="p-2 px-0 md:px-4 mx-0 md:mx-4 my-2">
        <ProofNode 
          step={rootStep} 
          program={program} 
          onApplyRule={handleApplyRule} 
          onReset={handleReset} 
          showHints={showHints}
          depth={0}
        />
      </div>
    </div>
  );
}

export default ProofBuilder;