import type { CCSProgram, ProgramCardType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import ProofWrapper from "../SOSProofer/ProofWrapper";
import SimulationWithGraph from "../ltsGraph/SimulationWithGraph";
import ButtonHover from "../custom/ButtonHover";
import { usePrograms } from "@/utils/usePrograms";
import CardEditBox from "./CardEditBox";
import { useTranslation } from "react-i18next";

export interface ProgramCardProps {
  card: ProgramCardType,
  index: number,
  ccsAst: CCSProgram,
  totalCards: number,
  onUpdate: (updatedCard: ProgramCardType) => void,
  onDelete: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
  onCreateProofCard?: (sourceCCS: string, targetCCS: string, action: string) => void
}

export default function ProgramCard({ card, index, ccsAst, totalCards, onUpdate, onDelete, onMoveUp, onMoveDown, onCreateProofCard }: ProgramCardProps) {
  const { t } = useTranslation();
  const { activeProgram, selectedProgramIndex } = usePrograms();

  const handleRename = (newName: string) => {
    const updatedCard = { ...card, name: newName };
    onUpdate(updatedCard);
  };

  return (
    <Card key={index + (activeProgram?.name || '') + selectedProgramIndex} 
        className="relative group transition-transform animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
        style={{ animationDelay: `${index * 150}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          {card.name}
        </CardTitle>
        
        <div className="flex items-center gap-2">
          {activeProgram?.allowEdit && (<>
            <ButtonHover variant="ghost" size="icon" onClick={onMoveUp} disabled={index === 0} hoverContent={<p>{t('selector.moveUp', 'Posunout nahoru')}</p>} aria-label={t('selector.moveUp', 'Posunout nahoru')}
              className="h-8 w-8 text-muted-foreground/50 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30">
              <ChevronUp className="w-4 h-4" />
            </ButtonHover>

            <ButtonHover variant="ghost" size="icon" onClick={onMoveDown} disabled={index === totalCards - 1} hoverContent={<p>{t('selector.moveDown', 'Posunout dolů')}</p>} aria-label={t('selector.moveDown', 'Posunout dolů')}
              className="h-8 w-8 text-muted-foreground/50 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30">
              <ChevronDown className="w-4 h-4" />
            </ButtonHover>

            <CardEditBox currentName={card.name} onUpdate={handleRename}>
              <ButtonHover variant="ghost" size="icon" hoverContent={<p>{t('selector.renameCard')}</p>} aria-label={t('selector.renameCard')}
                className="h-8 w-8 text-muted-foreground/50 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-4 h-4" />
              </ButtonHover>
            </CardEditBox>
            <ButtonHover variant="ghost" size="icon" onClick={onDelete} hoverContent={<p>{t('selector.deleteCard')}</p>} aria-label={t('selector.deleteCard')}
              className="h-8 w-8 text-muted-foreground/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </ButtonHover>
          </>)}
          
        </div>
      </CardHeader>

      <CardContent>
        {card.type === 'sos' ? (
          <ProofWrapper program={ccsAst} onSettingsUpdate={onUpdate} allowEdit={activeProgram?.allowEdit}
            initSettings={card} />
        ) : (
          <SimulationWithGraph program={ccsAst} onSettingsUpdate={onUpdate} allowEdit={activeProgram?.allowEdit}
            onCreateProofCard={onCreateProofCard}
            initSettings={card} />
        )}
      </CardContent>
    </Card>
  );
}