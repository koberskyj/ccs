import { useEffect, useState } from 'react';
import type { CCSExpression, CCSAction, CCSProgram, ProofStep, ProofRuleName, ProofStatus } from '@/types';
import ProofNode from '@/components/SOSProofer/ProofNode';
import { applySosRule, ccsToString, normalizeCCS } from '@/lib/ccsUtils';
import CCSViewer from '../textEditor/CCSViewer';
import { cn } from '@/lib/utils';
import { TransitionArrow } from './ProofRuleHelp';


interface ProofBuilderProps {
  initialSource: CCSExpression;
  initialTarget: CCSExpression;
  initialAction: CCSAction;
  program: CCSProgram;
  showHints: boolean;
  useStructRed: boolean;
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

export function ProofBuilder({ initialSource, initialTarget, initialAction, program, showHints, useStructRed }: ProofBuilderProps) {
  const [rootStep, setRootStep] = useState<ProofStep>({
    id: 'root',
    source: useStructRed ? normalizeCCS(initialSource) : initialSource,
    target: useStructRed ? normalizeCCS(initialTarget) : initialTarget,
    action: initialAction,
    status: 'pending',
    children: []
  });

  useEffect(() => {
    setRootStep({
      id: 'root',
      source: useStructRed ? normalizeCCS(initialSource) : initialSource,
      target: useStructRed ? normalizeCCS(initialTarget) : initialTarget,
      action: initialAction,
      status: 'pending',
      children: []
    });
  }, [initialSource, initialTarget, initialAction, useStructRed, showHints]);

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

        const result = applySosRule(node.source, node.target, node.action, rule, program, useStructRed, extraData);
        return {
          ...node,
          appliedRule: rule,
          status: result.status,
          errorMessage: result.errorMessage,
          children: result.children
        };
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

  return (
    <div className="md:shadow rounded-xl md:border border-stone-300 animate-in fade-in duration-300">
      <div className="p-3 px-4 mx-0 md:mx-4 mb-2 flex justify-between items-center flex-wrap gap-2 rounded-lg md:rounded-none border md:border-0 md:border-b border-stone-300">
        <div className='flex items-center gap-2 flex-wrap font-mono'>
          <span className="text-sm text-foreground/90 shrink-0">Dokazujete:</span> 
          <div className='flex flex-wrap items-center px-1 font-mono border border-primary/10 bg-primary/5 rounded-md'>
            <CCSViewer code={ccsToString(useStructRed ? normalizeCCS(initialSource) : initialSource)} className='w-auto! wrap-break-word p-1' />
            <div className="-translate-y-1.25">
              <TransitionArrow label={<CCSViewer code={initialAction.label} />} />
            </div>
            <CCSViewer code={ccsToString(useStructRed ? normalizeCCS(initialTarget) : initialTarget)} className='w-auto! wrap-break-word p-1' />
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