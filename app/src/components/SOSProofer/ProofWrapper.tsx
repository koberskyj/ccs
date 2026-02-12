import { useEffect, useState } from 'react';
import { ProofBuilder } from '@/components/SOSProofer/ProofBuilder';
import type { CCSExpression, CCSAction, CCSProgram } from '@/types';
import { Button } from '@/components/ui/button';
import { BookOpen, ChartGantt, Layers, Lightbulb, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AlertBox from '@/components/custom/AlertBox';
import { SOSRulesHelp } from './ProofRuleHelp';


function parseCCSAction(input: string): CCSAction|{ error: string } {
  if(!input || input.trim() === "") {
    return { error: "Akce nesmí být prázdná" };
  }

  const trimmedInput = input.trim();
  const isOutput = trimmedInput.startsWith("'");
  const rawLabel = isOutput ? trimmedInput.substring(1) : trimmedInput;
  if(rawLabel === "tau" || rawLabel === "τ") {
    if(isOutput) {
      return { error: "Tau nemůže být výstupní akcí" };
    }
    return { label: "tau", isOutput: false };
  }

  const labelRegex = /^[a-z][a-z0-9_]*$/;
  if(!labelRegex.test(rawLabel)) {
    return { error: "Neplatný název akce" };
  }
  return { label: rawLabel, isOutput };
}

function getExpressionByName(program: CCSProgram, name: string): CCSExpression | undefined {
  return program.find((def) => def.name === name)?.process;
}

interface ProofWrapperProps {
  program: CCSProgram;
}

export default function ProofWrapper({ program }: ProofWrapperProps) {
  const [sourceProcessName, setSourceProcessName] = useState<string>(program[0].name);
  const [targetProcessName, setTargetProcessName] = useState<string>(program[0].name);
  const [actionText, setActionText] = useState<string>('a');
  
  const [error, setError] = useState<string | null>(null);
  const [proofData, setProofData] = useState<{
    program: CCSProgram;
    source: CCSExpression;
    target: CCSExpression;
    action: CCSAction;
  } | null>(null);

  const [useStructRed, setUseStructRed] = useState<boolean>(false);
  useEffect(() => {
    const saved = localStorage.getItem('sos-proof-struct-red');
    if(saved !== null) {
      setUseStructRed(JSON.parse(saved));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('sos-proof-struct-red', JSON.stringify(useStructRed));
  }, [useStructRed]);

  const [showHints, setShowHints] = useState<boolean>(true);
  useEffect(() => {
    const saved = localStorage.getItem('sos-proof-hints');
    if(saved !== null) {
      setShowHints(JSON.parse(saved));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('sos-proof-hints', JSON.stringify(showHints));
  }, [showHints]);

  useEffect(() => {
    if(program.length > 0) {
      const exists = program.some(p => p.name === sourceProcessName);
      if(!exists) {
        setSourceProcessName(program[0].name);
      }
    } 
    else {
      setSourceProcessName('');
    }
  }, [program, sourceProcessName]);

  useEffect(() => {
    if(program.length > 0) {
      const exists = program.some(p => p.name === targetProcessName);
      if(!exists) {
        setTargetProcessName(program[0].name);
      }
    } 
    else {
      setTargetProcessName('');
    }
  }, [program, targetProcessName]);

  const handleReset = () => {
    setProofData(null);
    setError(null);
  };

  const handleStartProof = () => {
    handleReset();

    const sourceAST = getExpressionByName(program, sourceProcessName);
    const targetAST = getExpressionByName(program, targetProcessName);
    const actionObj = parseCCSAction(actionText);

    if('error' in actionObj) {
      setError(actionObj.error);
      return;
    }
    if(!sourceAST || !targetAST) {
      setError(`Proces ${!sourceAST ? sourceProcessName : targetProcessName} neexistuje.`);
      return;
    }

    setError(null);
    setProofData({
      program: program,
      source: sourceAST,
      target: targetAST,
      action: actionObj
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className='flex justify-between gap-2 flex-wrap'>
        <div>
          {error && <AlertBox type="error">{error}</AlertBox>}
        </div>
        <div className="flex items-center gap-4 mb-2">
            <Button variant="secondary" className="cursor-pointer py-5" onClick={() => setUseStructRed(!useStructRed)}>
              <Layers size={16} className={`${useStructRed ? 'text-primary' : ''}`} />
              <span className={`text-xs font-medium ${useStructRed ? 'text-primary' : ''}`}>
                Strukturální redukce {useStructRed ? '(Zap)' : '(Vyp)'}
              </span>
            </Button>

            <Button variant="secondary" className="cursor-pointer py-5" onClick={() => setShowHints(!showHints)}>
              <Lightbulb size={16} className={`${showHints ? 'text-primary' : ''}`} />
              <span className={`text-xs font-medium ${showHints ? 'text-primary' : ''}`}>
                Nápověda {showHints ? '(Zap)' : '(Vyp)'}
              </span>
            </Button>

            <SOSRulesHelp>
              <Button variant="secondary" className="cursor-pointer py-5">
                <BookOpen size={16} />
                <span className="text-xs font-medium">
                  Přehled pravidel SOS
                </span>
              </Button>
            </SOSRulesHelp>
        </div>
      </div>

      <div className="flex gap-4 items-end flex-wrap md:flex-nowrap mb-6">
        <div className="flex-1 space-y-2">
          <span className='pl-1 text-sm font-semibold'>Počáteční proces</span>
          <Select value={sourceProcessName} onValueChange={e => setSourceProcessName(e)}>
            <SelectTrigger>
              <SelectValue />
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

        <div className="w-48 space-y-2">
          <span className='pl-1 text-sm font-semibold'>Akce</span>
          <div className="relative">
            <Input 
              value={actionText} 
              onChange={e => setActionText(e.target.value)} 
              className="font-mono text-center pl-6 pr-6"
            />
            <span className="absolute left-2 top-1.5 text-muted-foreground">&mdash;</span>
            <span className="absolute right-2 top-1.5 text-muted-foreground">&rarr;</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <span className='pl-1 text-sm font-semibold'>Cílový proces</span>
          <Select value={targetProcessName} onValueChange={e => setTargetProcessName(e)}>
            <SelectTrigger>
              <SelectValue />
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

        <div className="flex gap-2 pb-0.5">
          <Button variant="outline" onClick={handleReset} size="icon" title="Resetovat">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button onClick={handleStartProof} className="w-32">
            <ChartGantt className="h-4 w-4 mr-2" />
            Dokázat
          </Button>
        </div>
      </div>

      {proofData && (
        <ProofBuilder 
          showHints={showHints}
          initialSource={proofData.source} 
          initialTarget={proofData.target} 
          initialAction={proofData.action} 
          program={proofData.program}
          useStructRed={useStructRed}
        /> 
      )}
    </div>
  )
};