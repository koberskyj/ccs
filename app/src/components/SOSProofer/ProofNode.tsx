
import type { CCSProgram, ProofStep, ProofRuleName, ProofStatus } from "@/types";
import { ccsToString } from "@/lib/ccsUtils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, CornerDownRight } from "lucide-react";
import CCSViewer from "../textEditor/CCSViewer";
import ProofControls from "./ProofControls";
import AlertBox from "../custom/AlertBox";
import ButtonHover from "../custom/ButtonHover";

export function getStatusStyle(status: ProofStatus) {
  switch(status) {
    case 'proved':
      return 'border-y-green-300 border-r-green-300 bg-green-50/50';
    case 'invalid':
      return 'border-y-red-300 border-r-red-300 bg-red-50/50';
    default:
      return 'border-l-4 border-l-transparent border-gray-200 bg-white';
  }
}

interface ProofNodeProps {
  step: ProofStep;
  program: CCSProgram;
  showHints: boolean;
  depth: number;
  onApplyRule: (stepId: string, rule: ProofRuleName, extraData?: any) => void;
  onReset: (stepId: string) => void;
}

export default function ProofNode({ step, program, showHints, depth, onApplyRule, onReset }: ProofNodeProps) {

  return (
    <div className="relative group">
      {depth > 0 && <div className="absolute left-[-16px] top-6 w-[15px] h-px bg-gray-300 hidden md:block" />}

      <div className={cn("mb-2 relative animate-in fade-in transition-all duration-300 z-10 shadow-xs rounded-lg overflow-hidden border-y border-r bg-card", getStatusStyle(step.status))}>
        <div className="flex items-stretch">
          <div className={cn("w-1 shrink-0", step.status === 'proved' ? 'bg-green-500' : step.status === 'invalid' ? 'bg-red-500' : 'bg-primary')} />

          <div className="flex-1 p-3">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex flex-wrap items-center px-1 gap-x-2 font-mono">
                <CCSViewer code={ccsToString(step.source)} className='w-auto! wrap-break-word p-1' />
                <span className="shrink-0">&mdash; <span className={`text-[#1976d2] ${step.action.isOutput ? 'overline' : ''}`}>{step.action.isOutput ? `'${step.action.label}` : step.action.label}</span> &rarr;</span>
                <CCSViewer code={ccsToString(step.target)} className='w-auto! wrap-break-word p-1' />                  
              </div>

              {step.status === 'proved' && (
                <AlertBox type="success" className="border-none shadow-none bg-green-100">Dokázáno</AlertBox>
              )}
              {step.status === 'invalid' && (
                <AlertBox type="error" className="border-none shadow-none bg-red-100">{step.errorMessage}</AlertBox>
              )}
            </div>

            <div className="min-h-[40px] flex items-center">
              {step.status === 'pending' ? (
                <div className="w-full animate-in fade-in duration-300">
                  <ProofControls step={step} onApplyRule={onApplyRule} showHints={showHints} />
                </div>
              ) : (
                <div className="flex items-center justify-between w-full animate-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-sm text-foreground/90 shrink-0">Použité pravidlo:</span> 
                    <Badge variant="secondary" className="px-3 py-1 border-stone-300 bg-stone-100">
                      {step.appliedRule}
                    </Badge>
                  </div>
                  
                  <ButtonHover variant="ghost" size="sm" onClick={() => onReset(step.id)} className="h-8 w-8 p-0 border border-stone-300 bg-stone-100 hover:bg-stone-200" hoverContent="Resetovat tento krok">
                      <RotateCcw className="h-4 w-4" />
                  </ButtonHover>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {step.children.length > 0 && (
        <div className="pl-4 md:pl-8 space-y-2 relative">
           <div className="absolute left-2 md:left-4 -top-2 bottom-4 w-px bg-gray-300 border-l border-gray-300" />
           
           <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold pl-2">
              <CornerDownRight className="h-3 w-3" />
              <span className="font-mono text-[1rem]">{step.appliedRule}</span>
           </div>

          {step.children.map(child => (
            <ProofNode 
              key={child.id}
              step={child}
              program={program}
              showHints={showHints}
              depth={depth + 1}
              onApplyRule={onApplyRule}
              onReset={onReset} />
          ))}
        </div>
      )}
    </div>
  );
}