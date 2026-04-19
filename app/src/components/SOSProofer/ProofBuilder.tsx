import { useEffect, useRef, useState } from 'react';
import type { CCSExpression, CCSAction, CCSProgram, ProofStep, ProofRuleName, ProofStatus } from '@/types';
import ProofNode from '@/components/SOSProofer/ProofNode';
import { applySosRule, autoProve, ccsToString, exportToJson, exportToLatex, exportToText, extractAllActions } from '@/lib/ccsUtils';
import CCSViewer from '../custom/CCSViewer';
import { cn } from '@/lib/utils';
import { TransitionArrow } from './ProofRuleHelp';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { BookText, Download, Printer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { useReactToPrint } from 'react-to-print';

interface ProofBuilderProps {
  initialSource: CCSExpression;
  initialTarget: CCSExpression;
  initialAction: CCSAction;
  program: CCSProgram;
  showHints: boolean;
  //useStructRed: boolean;
}

export function getStatusColor(status: ProofStatus) {
  switch(status) {
    case 'proved': 
      return 'bg-green-50 text-green-600 font-bold';
    case 'invalid': 
      return 'bg-red-50 text-red-600 font-bold';
    default: 
      return 'bg-stone-100 text-stone-800';
  }
}

export function ProofBuilder({ initialSource, initialTarget, initialAction, program, showHints }: ProofBuilderProps) {
  const { t } = useTranslation();
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [rootStep, setRootStep] = useState<ProofStep>({
    id: 'root',
    source: /*useStructRed ? normalizeCCS(initialSource) :*/ initialSource,
    target: /*useStructRed ? normalizeCCS(initialTarget) :*/ initialTarget,
    action: initialAction,
    status: 'pending',
    children: []
  });

  useEffect(() => {
    setRootStep({
      id: 'root',
      source: /*useStructRed ? normalizeCCS(initialSource) :*/ initialSource,
      target: /*useStructRed ? normalizeCCS(initialTarget) :*/ initialTarget,
      action: initialAction,
      status: 'pending',
      children: []
    });
  }, [initialSource, initialTarget, initialAction, showHints]);

  const recalculateTreeStatus = (node: ProofStep): ProofStep => {
    const updatedChildren = node.children.map(recalculateTreeStatus);
    const newNode = { ...node, children: updatedChildren };

    if(newNode.status == 'pending' && newNode.children.length > 0) {
      if(newNode.children.some(ch => ch.status === 'invalid')) {
        return { ...newNode, status: 'invalid', errorMessage: t('sos.invalidSubproof') };
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

        const result = applySosRule(node.source, node.target, node.action, rule, program, /*useStructRed*/ false, extraData);
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

  const handleAutoProve = () => {
    const allActions = extractAllActions(program);
    const initialStep: ProofStep = {
      id: 'root',
      source: initialSource,
      target: initialTarget,
      action: initialAction,
      status: 'pending',
      children: []
    };
    
    const provedTree = autoProve(initialStep, program, allActions, 30); 
    setRootStep(provedTree);
  };

  const processDefinitions: Record<string, string> = {};
  program.forEach(node => {
    if(node.type === 'Definition') {
      processDefinitions[node.name] = ccsToString(node.process); 
    }
  });

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'latex' | 'json' | 'text') => {
    switch (format) {
      case 'latex':
        handleDownload(exportToLatex(rootStep), 'proof.tex', 'text/plain');
        break;
      case 'json':
        handleDownload(exportToJson(rootStep), 'proof.json', 'application/json');
        break;
      case 'text':
        handleDownload(exportToText(rootStep), 'proof.txt', 'text/plain');
        break;
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: 'SOS_Proof',
  });

  return (
    <div className="md:shadow rounded-xl md:border border-stone-300 animate-in fade-in duration-300">
      <div className="p-3 px-4 mx-0 md:mx-4 mb-2 flex justify-between items-center flex-wrap gap-2 rounded-lg md:rounded-none border md:border-0 md:border-b border-stone-300">
        <div className='flex items-center gap-2 flex-wrap font-mono'>
          <span className="text-sm text-foreground/90 shrink-0">{t('sos.proving')}:</span> 
          <div className='flex flex-wrap items-center px-1 font-mono border border-primary/10 bg-primary/5 rounded-md'>
            <CCSViewer code={ccsToString(/*useStructRed ? normalizeCCS(initialSource) :*/ initialSource)} className='w-auto! wrap-break-word p-1' definitions={processDefinitions} />
            <div className="-translate-y-1.25">
              <TransitionArrow label={<CCSViewer code={initialAction.label} />} />
            </div>
            <CCSViewer code={ccsToString(/*useStructRed ? normalizeCCS(initialTarget) :*/ initialTarget)} className='w-auto! wrap-break-word p-1' definitions={processDefinitions} />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {showHints && rootStep.status === 'pending' && (
            <Button variant="outline" size="sm" onClick={handleAutoProve} className="h-8 shadow-none border-none">
              <BookText className="h-4 w-4 mr-2" />
              {t('sos.startProof')}
            </Button>
          )}
          <div className={cn('text-xs text-gray-500 p-2 rounded-md uppercase', getStatusColor(rootStep.status))}>
            {rootStep.status === 'proved' ? t('sos.proved') : (rootStep.status === 'invalid' ? t('sos.invalidProof') : t('sos.inProgress'))}
          </div>

          <div className="relative z-10 ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 shadow-none border-none" aria-label={t('core.export')}>
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('latex')}>
                  {t('core.exportAs', { name: 'LaTeX' })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('text')}>
                  {t('core.exportAs', { name: 'Text' })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  {t('core.exportAs', { name: 'JSON' })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint} className="border-t mt-1 pt-1">
                  <Printer className="h-4 w-4 mr-1" /> {t('core.printOrPDF')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <div ref={printComponentRef} className="p-2 px-0 md:px-4 mx-0 md:mx-4 my-2 proof-print-area">
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