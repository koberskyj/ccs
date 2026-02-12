import { useMemo, useState, useEffect } from 'react';
import LTSGraph from './LTSGraph';
import SimulationPanel from './SimulationPanel';
import { generateLTS } from '@/lib/ltsLogic';
import type { CCSProcessRef, CCSProgram, EdgeHighlightRequest, ViewMode } from '@/types';
import { useSimulation } from '@/utils/useSimulation';
import { Layers, Settings } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ccsToString } from '@/lib/ccsUtils';
import { Button } from './ui/button';

function normalize(str: string) {
  return str.replace(/\s+/g, '');
}

type SimulationWithGraphProps = {
  ast: CCSProgram;
  startProcessName?: string;
  initialViewMode?: ViewMode;
  forceStructuralReduction?: boolean;
};

export default function SimulationWithGraph({ast, startProcessName: propStartProcessName, initialViewMode, forceStructuralReduction}: SimulationWithGraphProps) {
  
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode || 'id');
  const [useStructRed, setUseStructRed] = useState<boolean>(forceStructuralReduction ?? false);
  const [selectedProcessName, setSelectedProcessName] = useState<string>(
    propStartProcessName || (ast.length > 0 ? ast[0].name : '')
  );

  useEffect(() => {
    if(propStartProcessName) {
      setSelectedProcessName(propStartProcessName);
      return;
    }

    if(ast.length > 0) {
      const exists = ast.some(p => p.name === selectedProcessName);
      if(!exists) {
        setSelectedProcessName(ast[0].name);
      }
    } 
    else {
      setSelectedProcessName('');
    }
  }, [ast, propStartProcessName]);

  useEffect(() => {
    if(propStartProcessName) {
      setSelectedProcessName(propStartProcessName);
    }
  }, [propStartProcessName]);

  useEffect(() => {
    if(!initialViewMode) {
      const stored = localStorage.getItem('lts_view_mode');
      if(stored && ['id', 'mixed', 'full'].includes(stored)) {
        setViewMode(stored as ViewMode);
      }
    }
  }, [initialViewMode]);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if(!initialViewMode) {
      localStorage.setItem('lts_view_mode', mode);
    }
  };

  const sim = useSimulation(ast, selectedProcessName);

  

  const elements = useMemo(() => {
    return generateLTS(ast, selectedProcessName, { maxDepth: 50, maxStates: 200, useStructuralReduction: useStructRed });
  }, [ast, selectedProcessName, useStructRed]);
  
  const { nodeLabelMap, ccsToIdMap, initialNodeId } = useMemo(() => {
    const labelMap = new Map<string, string>();
    const idMap = new Map<string, string>();
    let initId: string | null = null;
    
    elements.forEach(el => {
      if(el.data.source) {
        return;
      }
      
      const id = el.data.id;
      const ccs = el.data.ccs;
      if(!id || !ccs) {
        return;
      }

      const normCCS = normalize(ccs);
      if(el.data.isInitial) {
        initId = id;
      }

      let label = id;
      if(viewMode === 'full') {
        label = ccs;
      }
      else if(viewMode === 'mixed') {
        label = ccs.length < 15 ? ccs : id; 
      }
      
      labelMap.set(ccs, label);
      idMap.set(normCCS, id);
    });

    return { nodeLabelMap: labelMap, ccsToIdMap: idMap, initialNodeId: initId };
  }, [elements, viewMode]);

  const getTargetLabel = (targetCCS: string) => {
    if(nodeLabelMap.has(targetCCS)) {
      return nodeLabelMap.get(targetCCS)!;
    }
    return viewMode === 'id' ? '?' : targetCCS;
  };

  const currentCanonicalCCS = useMemo(() => {
    if(!sim.currentExpr) {
    return "";
    }
    const exprStr = ccsToString(sim.currentExpr, useStructRed);

    if(sim.currentExpr.type === 'ProcessRef') {
      const definition = ast.find(d => d.name === (sim.currentExpr as CCSProcessRef).name);
      
      if(definition) {
        const bodyStr = ccsToString(definition.process, useStructRed);
        return `${exprStr} = ${bodyStr}`;
      }
    }
    return exprStr;
  }, [sim.currentExpr, useStructRed, ast]);

  let activeNodeId = ccsToIdMap.get(normalize(currentCanonicalCCS));
  if(!activeNodeId && sim.history.length === 0 && initialNodeId) {
    activeNodeId = initialNodeId;
  }

  const [hoveredTransId, setHoveredTransId] = useState<number | null>(null);
  const edgeHighlightRequest = useMemo<EdgeHighlightRequest | null>(() => {
    if(hoveredTransId === null) {
      return null;
    }
    const transition = sim.availableTransitions.find(t => t.id === hoveredTransId);
    if(!transition) {
      return null;
    }

    const targetCCS = ccsToString(transition.target, useStructRed);
    const sourceCCS = sim.currentExpr ? ccsToString(sim.currentExpr, useStructRed) : "";
    let sourceId = ccsToIdMap.get(normalize(sourceCCS));
    if(!sourceId && sim.history.length === 0 && initialNodeId) {
      sourceId = initialNodeId;
    }

    const targetId = ccsToIdMap.get(normalize(targetCCS));
    if(!sourceId || !targetId) {
      return null;
    }

    return { sourceId, targetId, action: transition.action };

  }, [hoveredTransId, sim.availableTransitions, sim.currentExpr, useStructRed, ccsToIdMap, initialNodeId, sim.history.length])

  const isOffGraph = !activeNodeId && (sim.history.length > 0 || !initialNodeId);

  return (
    <div className="relative">
      <div className="">

        <div className="flex flex-wrap gap-4 items-center mb-2 relative">
          {!propStartProcessName && (
            <div className="flex items-center gap-2 bg-secondary text-secondary-foreground p-1 px-2 rounded-md shadow-sm">
              <span className="text-xs font-medium uppercase text-secondary-foreground px-1">Proces:</span>
              <Select value={selectedProcessName} onValueChange={(value) => { 
                setSelectedProcessName(value);
                sim.reset();
              }}>
                <SelectTrigger className="w-[180px] max-w-64 bg-white h-8 text-sm">
                  <SelectValue placeholder="Proces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup className="max-h-64">
                    {ast.map((def) => (
                      <SelectItem key={def.name} value={def.name}>
                        {def.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {!initialViewMode && (
            <div className="flex items-center gap-2 bg-secondary text-secondary-foreground p-1 rounded-md shadow-sm">
              <Settings size={16} className="ml-2 mr-1" />
              {(['id', 'mixed', 'full'] as const).map((m) => (
                <button key={m} onClick={() => changeViewMode(m)} 
                  className={`px-3 py-1 my-1 text-xs rounded-md transition-colors font-medium ${viewMode === m ? 'bg-card shadow text-primary' : 'text-secondary-foreground hover:bg-card/90'}`}>
                    {m === 'id' ? 'ID' : m === 'mixed' ? 'Mix' : 'CCS'}
                </button>
              ))}
            </div>
          )}

          {forceStructuralReduction === undefined && (
            <Button variant="secondary" className="cursor-pointer py-5" onClick={() => setUseStructRed(!useStructRed)}>
              <Layers size={16} className={`${useStructRed ? 'text-primary' : ''}`} />
              <span className={`text-xs font-medium ${useStructRed ? 'text-primary' : ''}`}>
                Strukturální redukce {useStructRed ? '(Zap)' : '(Vyp)'}
              </span>
            </Button>
          )}
          
          <div className="grow"></div>
          <div className="text-xs text-gray-400">
            Stavů: {elements.filter(e => !e.data.source).length}
          </div>
        </div>

        <div className='h-[600px]'>
          <LTSGraph 
            elements={elements} 
            activeNodeId={activeNodeId || null} 
            edgeHighlight={edgeHighlightRequest}
            viewMode={viewMode}
          />
        </div>

        <div className='absolute bottom-0 left-0'>
          <SimulationPanel
            currentCCS={currentCanonicalCCS}
            transitions={sim.availableTransitions}
            historyLength={sim.history.length}
            onStep={sim.step}
            onBack={sim.back}
            onReset={sim.reset}
            onTransitionHover={setHoveredTransId}
            getTargetLabel={getTargetLabel}
            forceStructuralReduction={useStructRed}
            isOffGraph={isOffGraph}
          />
        </div>
      </div>
    </div>
  );
}