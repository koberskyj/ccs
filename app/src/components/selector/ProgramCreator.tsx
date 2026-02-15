import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import type { ProgramSave } from "@/types";
import AlertBox from "../custom/AlertBox";
import { validateProgramDefinition } from "@/lib/importUtils";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";


export function ProgramCreator({ children, onUpdate, program }: { children: React.ReactNode, onUpdate: (program: ProgramSave) => void, program?: ProgramSave }) {
  const [nameInput, setNameInput] = useState<string>(program?.name ?? "");
  const [descriptionInput, setDescriptionInput] = useState<string>(program?.description ?? "");
  const [allowEditInput, setAllowEditInput] = useState<boolean>(program?.allowEdit ?? true);
  const [isOpen, setIsOpen] = useState(false);
  const [ errorMessage, setErrorMessage ] = useState<string>("");

  const createProgram = () => {

    if(nameInput.length < 3) {
      setErrorMessage("Název programu musí být delší než 2 znaky.");
      return;
    }

    let definition: ProgramSave;
    if(program) {
      definition = program;
      definition.name = nameInput;
      definition.description = descriptionInput;
      definition.allowEdit = allowEditInput;
    } 
    else {
      definition = {
        name: nameInput,
        description: descriptionInput,
        allowEdit: allowEditInput,
        definition: "",
        cards: []
      }
    }

    const validationResult = validateProgramDefinition(definition);
    if(validationResult !== true) {
      setErrorMessage(validationResult);
      return;
    }
    setErrorMessage("");
    setIsOpen(false);
    onUpdate(definition);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">{program ? "Upravit program "+program.name : "Vytvořit program"}</DialogTitle>
        </DialogHeader>          
          <div>
            <label htmlFor="name" className="font-semibold">Název <span className="text-muted-foreground text-sm font-normal"></span></label>
            <Input type="text" id="name" placeholder="Krátký výstižný název" value={nameInput} onChange={e => setNameInput(e.target.value)} />
          </div>
          <div>
            <label htmlFor="description" className="font-semibold">Popisek <span className="text-muted-foreground text-sm font-normal"></span></label>
            <Input type="text" id="description" placeholder="K čemu program slouží?" value={descriptionInput} onChange={e => setDescriptionInput(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="allowEdit" checked={allowEditInput} onCheckedChange={(e: boolean) => setAllowEditInput(e)} className="inline" />
            <label htmlFor="allowEdit" className="text-sm font-semibold leading-none">Povolit úpravy <span className="text-muted-foreground text-sm font-normal">- povolí úpravy kartet a kódu programu. Toto nastavení lze kdykoli změnit.</span></label>

          </div>
          <div className="flex justify-between items-end gap-2 pt-2">
            <Button onClick={createProgram} className='w-fit'>Uložit</Button>
            {errorMessage.length > 0 && <AlertBox type="error">{errorMessage}</AlertBox>}
          </div>
      </DialogContent>
    </Dialog>
  );
}