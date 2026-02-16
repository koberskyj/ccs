
import EditorWrap from "@/components/textEditor/EditorWrap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CCSProgram, ProgramCardType, CardSOS, CardLTS, ProgramSave } from "@/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePrograms } from "@/utils/usePrograms";
import ProgramCard from "./ProgramCard";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProgramWorkspace() {
  const { t } = useTranslation();
  const { activeProgram, selectedProgramIndex, updateProgram } = usePrograms();
  const [changeVersion, setChangeVersion] = useState<number>(0);
  const [localProgram, setLocalProgram] = useState<ProgramSave | null>(null);
  const [ccsAst, setCcsAst] = useState<CCSProgram | null>(null);
  

  useEffect(() => {
    setLocalProgram(activeProgram);
    if(activeProgram?.definition !== localProgram?.definition) {
      // setCcsAst(null); 
    }
    setChangeVersion(changeVersion + 1);
  }, [activeProgram]);

  const handleCodeUpdate = (ast: CCSProgram, codeString: string) => {
    setCcsAst(ast);

    if(localProgram && codeString !== localProgram.definition) {
      setLocalProgram({
        ...localProgram,
        definition: codeString
      });
    }
  };

  const addCard = (type: 'sos' | 'lts') => {
    if(!localProgram) {
      return;
    }

    const newCard: ProgramCardType = type === 'sos'
      ? { type: 'sos', name: 'Důkaz', processX: '', processY: '', action: '', showHelp: true } as CardSOS
      : { type: 'lts', name: 'Simulace', process: '', useStructRed: false, style: 'mixed' } as CardLTS;

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
      toast.info(`Změny v programu byly uloženy.`);
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

  const handleDiscard = () => {
    setLocalProgram(activeProgram);
    setChangeVersion(changeVersion + 1);
    toast.info(`Lokální změny byly zrušeny.`);
  };
  
  const isDirty = localProgram && (activeProgram ? JSON.stringify(localProgram) !== JSON.stringify(activeProgram) : false);
  useEffect(() => {
    if(isDirty && activeProgram?.allowEdit) {
      //toast.info(`Program byl upraven. Změny potvrdíte uložením programu.`);
    }
  }, [isDirty]);
  
  if (!localProgram || !activeProgram) {
    return <div className="text-center p-10 text-muted-foreground">Vyberte program ze seznamu.</div>;
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

              {isDirty && activeProgram.allowEdit && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Button variant="ghost" size="sm" onClick={handleDiscard} className="text-muted-foreground hover:text-red-600">
                    <RotateCcw className="w-4 h-4 mr-2" /> Zahodit změny
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" /> Uložit změny
                  </Button>
                </div>
              )}
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
              return <ProgramCard key={index + changeVersion} card={card} index={index} ccsAst={ccsAst} onUpdate={data => updateCard(index, data)} onDelete={() => removeCard(index)}/>;
            })}
          </div>

          {activeProgram.allowEdit && 
            <div className="pt-6">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/60 hover:bg-muted/90 transition-colors gap-4">
                  <p className="text-muted-foreground font-medium">Přidat novou kartu k programu</p>
                  <div className="flex gap-4">
                      <Button variant="outline" onClick={() => addCard('sos')} className="gap-2">Nový SOS Důkaz</Button>
                      <Button variant="outline" onClick={() => addCard('lts')} className="gap-2">Nová LTS Simulace</Button>
                  </div>
              </div>
            </div>
          }
        </>
      )}
    </>
  );
}