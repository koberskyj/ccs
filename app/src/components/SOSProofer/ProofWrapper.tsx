import { useEffect, useId, useMemo, useState } from 'react';
import type { CCSExpression, CCSAction, CCSProgram, CardSOS } from '@/types';
import { Button } from '@/components/ui/button';
import { AlignStartVertical, BookOpen, Lightbulb, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AlertBox from '@/components/custom/AlertBox';
import { useTranslation } from 'react-i18next';
import { SOSRulesHelp } from './ProofRuleHelp';
import ProofBuilder from './ProofBuilder';
import { parseCCSAction, parseExpression } from '@/lib/ccsUtils';
import ccsParser from '@/lib/ccsParser';
import { ProofDefinitions } from './ProofDefinitions';


interface ProofWrapperProps {
  program: CCSProgram;
  initSettings?: CardSOS;
  onSettingsUpdate?: (settings: CardSOS) => void;
  allowEdit?: boolean;
}

export default function ProofWrapper({ program, initSettings, onSettingsUpdate, allowEdit }: ProofWrapperProps) {
  const { t } = useTranslation();
  const [sourceInput, setSourceInput] = useState<string>(initSettings?.processX ?? (program.length > 0 ? program[0].name : ''));
  const [targetInput, setTargetInput] = useState<string>(initSettings?.processY ?? (program.length > 0 ? program[0].name : ''));
  const [actionText, setActionText] = useState<string>(initSettings?.action ?? 'a');
  //const [useStructRed, setUseStructRed] = useState<boolean>(initSettings?.useStructRed ?? false);
  const [showHints, setShowHints] = useState<boolean>(initSettings?.showHelp ?? true);
  const datalistId = useId();

  const [error, setError] = useState<string | null>(null);
  const [proofData, setProofData] = useState<{
    program: CCSProgram;
    source: CCSExpression;
    target: CCSExpression;
    action: CCSAction;
  } | null>(null);

  const parser = useMemo(() => {
    const parser = ccsParser();
    if(parser === null) {
      setError(t('textEditor.parserInitError'));
    }
    return parser;
  }, []);

  useEffect(() => {
    if(onSettingsUpdate) {
      onSettingsUpdate({
        type: 'sos',
        id: initSettings?.id!,
        name: initSettings?.name ?? t('core.proof'),
        processX: sourceInput,
        processY: targetInput,
        action: actionText,
        //useStructRed: useStructRed,
        showHelp: showHints
      });
    }
  }, [sourceInput, targetInput, actionText, showHints]);

  /*useEffect(() => {
    if(!initSettings?.useStructRed) {
      const stored = localStorage.getItem('default-sos-struct-red');
      if(stored && ['true', 'false'].includes(stored)) {
        setUseStructRed(stored === 'true');
      }
    }
    else {
      setUseStructRed(initSettings?.useStructRed);
    }
  }, [initSettings?.useStructRed]);*/

  useEffect(() => {
    if(!initSettings?.showHelp) {
      const stored = localStorage.getItem('default-sos-proof-hints');
      if(stored && ['true', 'false'].includes(stored)) {
        setShowHints(stored === 'true');
      }
    }
    else {
      setShowHints(initSettings?.showHelp);
    }
  }, [initSettings?.showHelp]);

  useEffect(() => {
    handleStartProof();
  }, [initSettings, program]);

  useEffect(() => {
    if(program.length > 0 && !sourceInput) {
      setSourceInput(program[0].name);
    }
  }, [program]);

  useEffect(() => {
    if(program.length > 0 && !targetInput) {
      setTargetInput(program[0].name);
    }
  }, [program]);

  const handleReset = () => {
    setProofData(null);
    setError(null);
  };

  const handleStartProof = () => {
    handleReset();

    const sourceAST = parseExpression(parser!, program, sourceInput);
    const targetAST = parseExpression(parser!, program, targetInput);
    const actionObj = parseCCSAction(actionText);

    if('error' in actionObj) {
      setError(actionObj.error);
      return;
    }
    if('error' in sourceAST) {
      setError(t('sos.errorSourceProcess', { error: sourceAST.error }));
      return;
    }
    if('error' in targetAST) {
      setError(t('sos.errorTargetProcess', { error: targetAST.error }));
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
      <datalist id={datalistId}>
        {program.map((def) => (
          <option key={def.name} value={def.name} />
        ))}
      </datalist>

      <div className='flex justify-between gap-2 flex-wrap'>
        <div>
          {error && <AlertBox type="error" className='max-w-[500px] mb-2'>{error}</AlertBox>}
        </div>
        <div className="flex items-center gap-4 mb-2">
          {/*<Button variant="secondary" className="cursor-pointer py-5" onClick={() => setUseStructRed(!useStructRed)}>
              <Layers size={16} className={`${useStructRed ? 'text-primary' : ''}`} />
              <span className={`text-xs font-medium ${useStructRed ? 'text-primary' : ''}`}>
                Strukturální redukce {useStructRed ? '(Zap)' : '(Vyp)'}
              </span>
            </Button>*/}

            <Button variant="secondary" className="cursor-pointer py-5" onClick={() => setShowHints(!showHints)} disabled={!allowEdit}>
            <Lightbulb size={16} className={`${showHints ? 'text-primary' : ''}`} />
            <span className={`text-xs font-medium ${showHints ? 'text-primary' : ''}`}>
              {t('core.hint')} {showHints ? '(' + t('core.on') + ')' : '(' + t('core.off') + ')'}
            </span>
          </Button>

          <SOSRulesHelp>
            <Button variant="secondary" className="cursor-pointer py-5">
              <BookOpen size={16} />
                <span className="text-xs font-medium">
                  {t('sos.ruleReference')}
                </span>
            </Button>
          </SOSRulesHelp>

          <ProofDefinitions definitions={program}>
            <Button variant="secondary" className="cursor-pointer py-5">
              <AlignStartVertical size={16} />
                <span className="text-xs font-medium">
                  {t('sos.processDefinitions')}
                </span>
            </Button>
          </ProofDefinitions>
        </div>
      </div>

      <div className="flex gap-4 items-end flex-wrap md:flex-nowrap mb-6">
        <div className="flex-1 space-y-2">
          <span className='pl-1 text-sm font-semibold'>{t('sos.sourceProcess')}</span>
          <Input 
            list={datalistId}
            value={sourceInput} 
            onChange={e => setSourceInput(e.target.value)} 
            disabled={!allowEdit} 
            placeholder={t('sos.sourceProcess')} 
            aria-label={t('sos.sourceProcess')} 
            className='hide-datalist-arrow'
          />
        </div>

        <div className="w-48 space-y-2">
          <span className='pl-1 text-sm font-semibold'>{t('core.action')}</span>
          <div className="relative">
            <Input value={actionText} onChange={e => setActionText(e.target.value)} className="font-mono text-center pl-6 pr-6" disabled={!allowEdit} aria-label={t('core.action')} />
            <span className="absolute left-2 top-1.5 text-muted-foreground">&mdash;</span>
            <span className="absolute right-2 top-1.5 text-muted-foreground">&rarr;</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <span className='pl-1 text-sm font-semibold'>{t('sos.targetProcess')}</span>
          <Input 
            list={datalistId}
            value={targetInput} 
            onChange={e => setTargetInput(e.target.value)} 
            disabled={!allowEdit} 
            placeholder={t('sos.targetProcess')}
            aria-label={t('sos.targetProcess')} 
            className='hide-datalist-arrow'
          />
        </div>

        <div className="flex gap-2 pb-0.5">
          <Button variant="outline" onClick={handleStartProof} className="w-32">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('core.reset')}
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
          //useStructRed={useStructRed}
        />
      )}
    </div>
  )
};