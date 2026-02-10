import { ArrowRight, RotateCcw, ArrowLeft, Target } from 'lucide-react';
import type { CCSExpression } from '@/types';
import { Button } from './ui/button';
import CCSViewer from './textEditor/CCSViewer';
import { useMemo } from 'react';
import { ccsToString } from '@/lib/ccsUtils';
import AlertBox from './custom/AlertBox';

type Transition = { action: string, id: number, target: CCSExpression };

type Props = {
  currentCCS: string;
  transitions: Array<Transition>;
  historyLength: number;
  onStep: (id: number) => void;
  onBack: () => void;
  onReset: () => void;
  onTransitionHover: (id: number | null) => void;
  getTargetLabel: (ccs: string) => string;
  forceStructuralReduction: boolean|undefined;
  isOffGraph: boolean
};

export default function SimulationPanel({ currentCCS, transitions, historyLength, onStep, onBack, onReset, onTransitionHover, getTargetLabel, forceStructuralReduction, isOffGraph }: Props) {

  const uniqueTransitions = useMemo(() => {
    const uniqueMap = new Map<string, Transition>();

    transitions.forEach(t => {
      const targetStr = ccsToString(t.target, forceStructuralReduction);
      const key = `${t.action} -> ${targetStr}`;

      if(!uniqueMap.has(key)) {
        uniqueMap.set(key, t);
      }
    });

    return Array.from(uniqueMap.values());
  }, [transitions, forceStructuralReduction]);
  
  return (
    <div className="p-3 text-sm bg-card/60 backdrop-blur-sm rounded-lg shadow-xl transition-opacity duration-200 border max-w-[350px] max-h-[500px] overflow-y-auto">
      <div className="">
        {/*<h3 className="text-lg font-bold text-stone-800">Simulace</h3>*/}

        <div className="flex justify-between gap-2">
          <Button onClick={onBack} disabled={historyLength === 0} size="sm">
            <ArrowLeft size={14} /> Zpět
          </Button>
          <Button onClick={onReset} variant="destructive" size="sm">
            <RotateCcw size={14} /> Reset
          </Button>
        </div>
      </div>
      
      <div className="grow overflow-y-auto pt-4 flex flex-col gap-6">
        {isOffGraph &&  
          <AlertBox type="warning" className="border-none shadow-none bg-amber-100 max-w-[210px]">
            Další kroky se v grafu nezobrazí, stále se ale počítají.
          </AlertBox>
        }
        <div>
            <div className="text-xs px-2 uppercase tracking-wider text-foreground/90 font-bold mb-1">Aktuální proces</div>
            <div className="font-mono wrap-break-word border border-primary/15 bg-primary/8 p-2 rounded-md">
              <CCSViewer code={currentCCS} />
            </div>
        </div>

        <div>
            <div className="text-xs px-2 uppercase tracking-wider text-foreground/90 font-bold mb-1">Dostupné přechody</div>
            
            {uniqueTransitions.length === 0 ? (
              <div className="text-center py-8 text-foreground bg-foreground/5 border border-foreground/10 rounded font-mono uppercase">
                  Deadlock
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                  {uniqueTransitions.map((t) => {
                    const targetStr = ccsToString(t.target, forceStructuralReduction);
                    const targetLabel = getTargetLabel(targetStr);
                    
                    return (
                        <button key={t.id} onClick={() => onStep(t.id)} onMouseEnter={() => onTransitionHover(t.id)} onMouseLeave={() => onTransitionHover(null)}
                          className="text-left px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg hover:bg-foreground/10 hover:border-foreground/20 transition-all group relative overflow-hidden">
                          <div className="flex items-center justify-between z-10 relative">

                              <span className="font-bold font-mono **:text-foreground/90! **:font-normal px-2 py-0.5 rounded text-sm">
                                <CCSViewer code={t.action} />
                              </span>
                              
                              <ArrowRight size={16} className="text-primary mx-2" />
                              
                              <div className="flex items-center gap-1.5 text-foreground/90 group-hover:text-foreground max-w-[120px]">
                                  <Target size={12} className="opacity-50" />
                                  <span className="font-mono truncate" title={targetStr}>{targetLabel}</span>
                              </div>
                          </div>
                        </button>
                    );
                  })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}