import type { CCSProgram, ProgramCardType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import ProofWrapper from "../SOSProofer/ProofWrapper";
import SimulationWithGraph from "../SimulationWithGraph";
import ButtonHover from "../custom/ButtonHover";
import { usePrograms } from "@/utils/usePrograms";
import CardEditBox from "./CardEditBox";

export interface ProgramCardProps {
  card: ProgramCardType,
  index: number,
  ccsAst: CCSProgram,
  onUpdate: (updatedCard: ProgramCardType) => void,
  onDelete: () => void
}

export default function ProgramCard({ card, index, ccsAst, onUpdate, onDelete }: ProgramCardProps) {
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
            <CardEditBox currentName={card.name} onUpdate={handleRename}>
              <ButtonHover variant="ghost" size="icon" hoverContent={<p>Přejmenovat kartu</p>}
                className="h-8 w-8 text-muted-foreground/50 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-4 h-4" />
              </ButtonHover>
            </CardEditBox>
            <ButtonHover variant="ghost" size="icon" onClick={onDelete} hoverContent={<p>Odstranit kartu</p>}
              className="h-8 w-8 text-muted-foreground/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </ButtonHover>
          </>)}
          
        </div>
      </CardHeader>

      <CardContent>
        {card.type === 'sos' ? (
          <ProofWrapper program={ccsAst} onSettingsUpdate={onUpdate} allowEdit={activeProgram?.allowEdit}
            initSettings={{
              type: 'sos',
              name: card.name,
              processX: card.processX,
              processY: card.processY,
              action: card.action,
              //useStructRed: card.useStructRed,
              showHelp: card.showHelp
            }} />
        ) : (
          <SimulationWithGraph program={ccsAst} onSettingsUpdate={onUpdate} allowEdit={activeProgram?.allowEdit}
            initSettings={{ 
              type: 'lts', 
              name: card.name,
              process: card.process, 
              style: card.style, 
              useStructRed: card.useStructRed 
            }} />
        )}
      </CardContent>
    </Card>
  );
}