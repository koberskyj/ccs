
import EditorWrap from "@/components/textEditor/EditorWrap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CCSProgram, ProgramCardType, CardSOS, CardLTS, ProgramSave } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePrograms } from "@/utils/usePrograms";
import ProgramCard from "./ProgramCard";
import { Pencil, RotateCcw, Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { ProgramCreator } from "./ProgramCreator";
import ButtonHover from "../custom/ButtonHover";
import { ConfirmModal } from "../custom/ConfirmModal";

export default function ProgramWorkspace() {
  const { t } = useTranslation();
  const { activeProgram, selectedProgramIndex, isDirty, updateProgram, setIsDirty } = usePrograms();
  const [changeVersion, setChangeVersion] = useState<number>(0);
  const [localProgram, setLocalProgram] = useState<ProgramSave | null>(null);
  const [prevActiveIndex, setPrevActiveIndex] = useState<number | null>(null);
  const [ccsAst, setCcsAst] = useState<CCSProgram | null>(null);

  if(selectedProgramIndex !== prevActiveIndex) {
    setPrevActiveIndex(selectedProgramIndex);
    if(activeProgram) {
      const cloned = structuredClone(activeProgram);
      cloned.cards = cloned.cards.map(card => card.id ? card : { ...card, id: crypto.randomUUID() });
      setLocalProgram(cloned);
    } 
    else {
      setLocalProgram(null);
    }
    setChangeVersion(prev => prev + 1);
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if(isDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if(activeProgram) {
      const cloned = structuredClone(activeProgram);
      // Backward compatibility with programs with no id
      cloned.cards = cloned.cards.map(card => card.id ? card : { ...card, id: crypto.randomUUID() });
      setLocalProgram(cloned);
    } 
    else {
      setLocalProgram(null);
    }

    setChangeVersion(prev => prev + 1);
  }, [activeProgram]);

  const handleCodeUpdate = (ast: CCSProgram, codeString: string) => {
    setCcsAst(ast);
    setLocalProgram(prev => {
      if(prev && codeString !== prev.definition) {
        return { ...prev, definition: codeString };
      }
      return prev;
    });
  };

  const handleNameChange = (updated: ProgramSave) => {
    setLocalProgram(prev => {
      if(!prev) {
        return prev;
      }

      return { 
        ...prev, 
        name: updated.name, 
        description: updated.description, 
        allowEdit: updated.allowEdit
      }
    });
  };

  const addCard = (type: 'sos' | 'lts', defaultData?: any) => {
    if(!localProgram) {
      return;
    }

    const newCard: ProgramCardType = type === 'sos'
      ? { 
          type: 'sos', 
          id: crypto.randomUUID(),
          name: defaultData?.name || t('core.proof'), 
          processX: defaultData?.processX || '', 
          processY: defaultData?.processY || '', 
          action: defaultData?.action || '', 
          showHelp: defaultData?.showHelp || true 
        } as CardSOS
      : { 
          type: 'lts', 
          id: crypto.randomUUID(),
          name: defaultData?.name || t('core.simulation'), 
          process: defaultData?.process || '', 
          useStructRed: defaultData?.useStructRed || false, 
          style: defaultData?.style || 'mixed' 
        } as CardLTS;

    setLocalProgram({
      ...localProgram,
      cards: [...localProgram.cards, newCard]
    });
  };

  const updateCard = (index: number, updatedCard: ProgramCardType) => {
    if(!localProgram) {
      return;
    }

    if(JSON.stringify(localProgram.cards[index]) === JSON.stringify(updatedCard)) {
      return;
    }
    
    const newCards = [...localProgram.cards];
    newCards[index] = updatedCard;

    setLocalProgram({
      ...localProgram,
      cards: newCards
    });
  };

  const handleSave = () => {
    if(selectedProgramIndex != null && localProgram) {
      updateProgram(selectedProgramIndex, localProgram);
      toast.info(t('selector.programSaved'));
    }
  };

  const removeCard = (index: number) => {
    if(!localProgram) {
      return;
    }

    const newCards = localProgram.cards.filter((_, i) => i !== index);
    setLocalProgram({
      ...localProgram,
      cards: newCards
    });
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    if(!localProgram) {
      return;
    }

    const newCards = [...localProgram.cards];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if(targetIndex < 0 || targetIndex >= newCards.length) {
      return;
    }

    const temp = newCards[index];
    newCards[index] = newCards[targetIndex];
    newCards[targetIndex] = temp;

    setLocalProgram({
      ...localProgram,
      cards: newCards
    });
  };

  const handleDiscard = () => {
    setLocalProgram(activeProgram);
    setChangeVersion(changeVersion + 1);
    toast.info(t('selector.changesDiscarded'));
  };
  
  const isDirtyLocal = useMemo(() => {
    if(!localProgram || !activeProgram) {
      return false;
    }
    const sanitize = (prog: ProgramSave) => ({
      ...prog,
      cards: prog.cards.map(({ id, ...rest }) => rest)
    });
    return JSON.stringify(sanitize(localProgram)) !== JSON.stringify(sanitize(activeProgram));
  }, [localProgram, activeProgram]);

  useEffect(() => {
    setIsDirty(isDirtyLocal);
    return () => setIsDirty(false);
  }, [isDirtyLocal, setIsDirty]);
  
  if (!localProgram || !activeProgram) {
    return <div className="text-center p-10 text-muted-foreground">{t('selector.noActiveProgram')}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <Card key={activeProgram.name + selectedProgramIndex} className="relative group transition-transform animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          <CardHeader>
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  {t('core.program', { name: localProgram.name })}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{localProgram.description}</p>
              </div>

              {
                <div className="flex gap-2 items-center">
                  <ProgramCreator program={localProgram} onUpdate={handleNameChange}>
                    <ButtonHover hoverContent={<p>{localProgram.allowEdit ? t('selector.renameProgram') : t('selector.unlockProgram')}</p>} variant="ghost" size="icon" aria-label={t('selector.renameProgram')}
                        className='h-8 w-8 text-muted-foreground/50 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity'>
                      {localProgram.allowEdit ? <Pencil className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </ButtonHover>
                  </ProgramCreator>

                  {isDirtyLocal && (
                    <>
                      <ConfirmModal title={t('selector.reallyDiscardChanges')} confirmText={t('selector.discardChanges')} onConfirm={handleDiscard} destructive={true}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600" aria-label={t('selector.discardChanges')}>
                          <RotateCcw className="w-4 h-4 mr-2" /> {t('selector.discardChanges')}
                        </Button>
                      </ConfirmModal>
                      <Button onClick={handleSave} aria-label={t('selector.saveChanges')}>
                        <Save className="w-4 h-4 mr-2" /> {t('selector.saveChanges')}
                      </Button>
                    </>
                  )}
                </div>
              }
            </div>
          </CardHeader>
          <CardContent>
            <EditorWrap key={changeVersion} initValue={activeProgram.definition} onSubmit={handleCodeUpdate} disabled={!activeProgram.allowEdit} />
          </CardContent>
        </Card>
      </div>

      {ccsAst && (
        <>
          <div className="space-y-6">
            {localProgram.cards.map((card, index) => {
              return <ProgramCard 
                key={card.id || index + changeVersion}
                card={card} 
                index={index} 
                ccsAst={ccsAst} 
                totalCards={localProgram.cards.length}
                onUpdate={data => updateCard(index, data)} 
                onDelete={() => removeCard(index)}
                onMoveUp={() => moveCard(index, 'up')}
                onMoveDown={() => moveCard(index, 'down')}
                onCreateProofCard={(processX, processY, action) => addCard('sos', { processX, action, processY })}
              />;
            })}
          </div>

          {activeProgram.allowEdit && 
            <div className="pt-6">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/60 hover:bg-muted/90 transition-colors gap-4">
                  <p className="text-stone-700 font-medium">{t('selector.addNewCard')}</p>
                  <div className="flex gap-4">
                      <Button variant="outline" onClick={() => addCard('sos')} className="gap-2">{t('selector.newSOSProof')}</Button>
                      <Button variant="outline" onClick={() => addCard('lts')} className="gap-2">{t('selector.newLTSSimulation')}</Button>
                  </div>
              </div>
            </div>
          }
        </>
      )}
    </>
  );
}