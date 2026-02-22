import { useMemo, useState, useEffect, useRef } from 'react';
import LTSGraph from './LTSGraph';
import SimulationPanel from './SimulationPanel';
import { generateLTS } from '@/lib/ltsLogic';
import type { CardLTS, CCSExpression, CCSProcessRef, CCSProgram, EdgeHighlightRequest, ViewMode } from '@/types';
import { useSimulation } from '@/utils/useSimulation';
import { Layers, Locate, RefreshCcw, Settings } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ccsToString } from '@/lib/ccsUtils';
import { Button } from './ui/button';
import ButtonHover from './custom/ButtonHover';
import { useTranslation } from 'react-i18next';

function normalize(str: string) {
  return str.replace(/\s+/g, '');
}

type SimulationWithGraphProps = {
  program: CCSProgram;
  initSettings?: CardLTS;
  hideSettings?: boolean;
  onSettingsUpdate?: (settings: CardLTS) => void;
  allowEdit?: boolean;
};

export default function SimulationWithGraph({program, initSettings, hideSettings=true, onSettingsUpdate, allowEdit}: SimulationWithGraphProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>(initSettings?.style || 'id');
  const [useStructRed, setUseStructRed] = useState<boolean>(initSettings?.useStructRed ?? false);
  const [isDynamicMode, setIsDynamicMode] = useState<boolean>(false);
  const [isCentering, setIsCentering] = useState<boolean>(false);
  const [selectedProcessName, setSelectedProcessName] = useState<string>(
    initSettings?.process || (program.length > 0 ? program[0].name : '')
  );

  const numIdMap = useRef<Map<string, string>>(new Map());
  const nextIdCounter = useRef<number>(1);
  const [exploredStates, setExploredStates] = useState<Map<string, CCSExpression>>(new Map());
  const [activeNodeId, setActiveNodeId] = useState<string|undefined>(undefined);

  const handleReset = () => {
    sim.reset();
    setExploredStates(new Map());
    numIdMap.current.clear();
    nextIdCounter.current = 1;
  };

  useEffect(() => {
    if(onSettingsUpdate) {
      onSettingsUpdate({
        type: 'lts',
        name: initSettings?.name ?? t('core.simulation'),
        process: selectedProcessName,
        style: viewMode,
        useStructRed: useStructRed
      });
    }
  }, [selectedProcessName, viewMode, useStructRed]);

  useEffect(() => {
    if(initSettings?.process) {
      setSelectedProcessName(initSettings?.process);
      return;
    }

    if(program.length > 0) {
      const exists = program.some(p => p.name === selectedProcessName);
      if(!exists) {
        setSelectedProcessName(program[0].name);
      }
    } 
    else {
      setSelectedProcessName('');
    }
  }, [program, initSettings?.process]);

  useEffect(() => {
    if(!initSettings?.useStructRed) {
      const stored = localStorage.getItem('default-lts-struct-red');
      if(stored && ['true', 'false'].includes(stored)) {
        setUseStructRed(stored === 'true');
      }
    }
    else {
      setUseStructRed(initSettings?.useStructRed);
    }
  }, [initSettings?.useStructRed]);

  useEffect(() => {
    if(!initSettings?.style) {
      const stored = localStorage.getItem('default-lts-view-mode');
      if(stored && ['id', 'mixed', 'full'].includes(stored)) {
        setViewMode(stored as ViewMode);
      }
    }
    else {
      setViewMode(initSettings?.style);
    }
  }, [initSettings?.style]);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const sim = useSimulation(program, selectedProcessName);

  const rawCurrentCCS = useMemo(() => {
    return sim.currentExpr ? ccsToString(sim.currentExpr, useStructRed) : "";
  }, [sim.currentExpr, useStructRed]);


  const elements = useMemo(() => {
    let rawElements = [];
    
    if(isDynamicMode) {
      const exploredExprs = Array.from(exploredStates.values());
      const safeExplored = exploredExprs.length > 0 ? exploredExprs : (sim.currentExpr ? [sim.currentExpr] : []);
      rawElements = generateLTS(program, selectedProcessName, { 
        maxDepth: 50, 
        maxStates: 200, 
        useStructuralReduction: useStructRed,
        isExplorationMode: true,
        exploredStates: safeExplored,
        keepForwardSteps: 2
      });
    } 
    else {
      rawElements = generateLTS(program, selectedProcessName, { maxDepth: 50, maxStates: 200, useStructuralReduction: useStructRed, isExplorationMode: false });
    }

    return rawElements.map(el => {
      if(el.data.source) {
        return el;
      }
      
      const originalId = el.data.id!;
      if(!numIdMap.current.has(originalId)) {
        numIdMap.current.set(originalId, String(nextIdCounter.current++));
      }
      
      const numId = numIdMap.current.get(originalId);
      return {
        ...el,
        data: {
          ...el.data,
          numId: numId
        }
      };
    });
  }, [program, selectedProcessName, useStructRed, isDynamicMode, exploredStates]);
  
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
        label = ccs.length < 5 ? ccs : id; 
      }
      
      labelMap.set(ccs, label);
      idMap.set(normCCS, id);
    });

    return { nodeLabelMap: labelMap, ccsToIdMap: idMap, initialNodeId: initId };
  }, [elements, viewMode]);

  const getTargetLabel = (targetCCS: string) => {
    if(nodeLabelMap.has(targetCCS)) {
      if(numIdMap.current.has(nodeLabelMap.get(targetCCS)!)) {
        return numIdMap.current.get(nodeLabelMap.get(targetCCS)!)!;
      }
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
      const definition = program.find(d => d.name === (sim.currentExpr as CCSProcessRef).name);
      
      if(definition) {
        const bodyStr = ccsToString(definition.process, useStructRed);
        return `${exprStr} = ${bodyStr}`;
      }
    }
    return exprStr;
  }, [sim.currentExpr, useStructRed, program]);

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
    let sourceId = ccsToIdMap.get(normalize(rawCurrentCCS)); 
    if(!sourceId && sim.history.length === 0 && initialNodeId) {
      sourceId = initialNodeId;
    }

    const targetId = ccsToIdMap.get(normalize(targetCCS));
    if(!sourceId || !targetId) {
      return null;
    }

    return { sourceId, targetId, action: transition.action };

  }, [hoveredTransId, sim.availableTransitions, rawCurrentCCS, useStructRed, ccsToIdMap, initialNodeId, sim.history.length]);

  useEffect(() => {
    setActiveNodeId(ccsToIdMap.get(normalize(rawCurrentCCS)));
    if(!activeNodeId && sim.history.length === 0 && initialNodeId) {
      setActiveNodeId(initialNodeId);
    }
  }, [rawCurrentCCS, sim.history.length, initialNodeId, ccsToIdMap]);

  if(isDynamicMode && sim.currentExpr && rawCurrentCCS && !exploredStates.has(rawCurrentCCS)) {
    const newMap = new Map(exploredStates);
    newMap.set(rawCurrentCCS, sim.currentExpr);
    setExploredStates(newMap); 
  }

  const isOffGraph = !activeNodeId && (sim.history.length > 0 || !initialNodeId);

  return (
    <div className="relative">
      <div className="">

        {hideSettings && (
          <div className="absolute flex flex-wrap gap-4 items-center mb-2 mt-1 z-10">
            <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur-sm  text-secondary-foreground/85 p-1 px-2 rounded-md shadow-sm">
              <span className="text-xs font-medium uppercase px-1">{t('core.process')}:</span>
              <Select value={selectedProcessName} disabled={!allowEdit} onValueChange={(value) => { 
                setSelectedProcessName(value);
                handleReset();
              }}>
                <SelectTrigger className="w-[120px] max-w-64 bg-white/80 h-8 text-sm">
                  <SelectValue placeholder="Proces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup className="max-h-64">
                    {program.map((def) => (
                      <SelectItem key={def.name} value={def.name}>
                        {def.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button variant="secondary" className="bg-secondary/80 backdrop-blur-sm  cursor-pointer py-5" onClick={() => setUseStructRed(!useStructRed)} disabled={!allowEdit}>
              <Layers size={16} className={`${useStructRed ? 'text-primary' : ''}`} />
              <span className={`text-xs font-medium ${useStructRed ? 'text-primary' : ''}`}>
                {t('simulation.structuralReduction')} {useStructRed ? '(' + t('core.on') + ')' : '(' + t('core.off') + ')'}
              </span>
            </Button>

            <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur-sm  p-1 rounded-md shadow-sm">
              <Settings size={16} className="ml-2 mr-1" />
              {(['id', 'mixed', 'full'] as const).map((m) => (
                <button key={m} onClick={() => changeViewMode(m)}
                  className={`px-3 py-1 my-1 text-xs rounded-md transition-colors font-medium ${viewMode === m ? 'bg-card/80 shadow text-primary/80' : 'text-secondary-foreground/80 hover:bg-card/90'}`}>
                    {m === 'id' ? 'ID' : m === 'mixed' ? 'Mix' : 'CCS'}
                </button>
              ))}
            </div>

            <Button variant="secondary" className="bg-secondary/80 backdrop-blur-sm  cursor-pointer py-5" onClick={() => { setIsDynamicMode(!isDynamicMode); !isDynamicMode && setIsCentering(true);}}>
              <RefreshCcw size={16} className={`${isDynamicMode ? 'text-primary' : ''}`} />
              <span className={`text-xs font-medium ${isDynamicMode ? 'text-primary' : ''}`}>
                {t('simulation.dynamicMode')} {isDynamicMode ? '(' + t('core.on') + ')' : '(' + t('core.off') + ')'}
              </span>
            </Button>

            <ButtonHover hoverContent={<>{t('simulation.centering')} {isCentering ? '(' + t('core.on') + ')' : '(' + t('core.off') + ')'}</>} variant="secondary" className="bg-secondary/80 backdrop-blur-sm  cursor-pointer py-5" onClick={() => setIsCentering(!isCentering)}>
              <Locate size={16} className={`${isCentering ? 'text-primary' : ''}`} />
            </ButtonHover>
          </div>
        )}

        <div className='h-[700px]'>
          <LTSGraph 
            elements={elements} 
            activeNodeId={activeNodeId || null} 
            edgeHighlight={edgeHighlightRequest}
            viewMode={viewMode}
            isCentering={isCentering}
          />
        </div>

        <div className='absolute bottom-0 left-0'>
          <SimulationPanel
            currentCCS={currentCanonicalCCS}
            transitions={sim.availableTransitions}
            historyLength={sim.history.length}
            onStep={sim.step}
            onBack={sim.back}
            onReset={handleReset}
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