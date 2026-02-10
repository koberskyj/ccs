
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CCSExpression, CCSProgram } from '@/types';
import { getPossibleTransitions } from '@/lib/ltsLogic';
import { ccsToString } from '@/lib/ccsUtils';

type SimulationState = {
  currentExpr: CCSExpression | null;
  history: CCSExpression[];
  availableTransitions: Array<{ action: string, target: CCSExpression, id: number }>;
  isFinished: boolean;
};

export function useSimulation(ast: CCSProgram, startProcessName: string) {

  const defs = useMemo(() => {
    const map = new Map<string, CCSExpression>();
    ast.forEach(d => map.set(d.name, d.process));
    return map;
  }, [ast]);

  const [simState, setSimState] = useState<SimulationState>({
    currentExpr: null,
    history: [],
    availableTransitions: [],
    isFinished: false
  });

  const calculateNextState = useCallback((expr: CCSExpression, history: CCSExpression[]): SimulationState => {
    const transitions = getPossibleTransitions(expr, defs);
    return {
      currentExpr: expr,
      history: history,
      availableTransitions: transitions.map((t, idx) => ({
        action: t.action,
        target: t.targetExpr,
        id: idx
      })),
      isFinished: transitions.length === 0
    };
  }, [defs]);

  const reset = useCallback(() => {
    if(!defs.has(startProcessName)) {
      return;
    }
    
    const startExpr: CCSExpression = { 
      type: 'ProcessRef', 
      name: startProcessName 
    };

    setSimState(calculateNextState(startExpr, []));
  }, [startProcessName, defs, calculateNextState]);

  const step = (transitionIndex: number) => {
    if(!simState.currentExpr) {
      return;
    }

    const selected = simState.availableTransitions[transitionIndex];
    const newHistory = [...simState.history, simState.currentExpr];
    setSimState(calculateNextState(selected.target, newHistory));
  };

  const back = () => {
    if(simState.history.length === 0) {
      return;
    }
    
    const previousExpr = simState.history[simState.history.length - 1];
    const newHistory = simState.history.slice(0, -1);
    setSimState(calculateNextState(previousExpr, newHistory));
  };

  useEffect(() => {
    reset();
  }, [reset]);

  return {
    ...simState,
    currentCCSString: simState.currentExpr ? ccsToString(simState.currentExpr) : "",
    step,
    back,
    reset
  };
}