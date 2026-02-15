import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AlertBox from "../custom/AlertBox";

interface CardEditBoxProps {
  currentName: string;
  onUpdate: (newName: string) => void;
  children: React.ReactNode;
}

export default function CardEditBox({ currentName, onUpdate, children }: CardEditBoxProps) {
  const [open, setOpen] = useState(false);
  const [nameInput, setNameInput] = useState(currentName);
  const [error, setError] = useState("");

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setNameInput(currentName);
      setError("");
    }
  };

  const handleSave = () => {
    if(!nameInput.trim()) {
      setError("Název nesmí být prázdný.");
      return;
    }
    onUpdate(nameInput);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Přejmenovat kartu</DialogTitle>
        </DialogHeader>          
          <div>
            <label htmlFor="name" className="font-semibold">Název karty <span className="text-muted-foreground text-sm font-normal"></span></label>
            <Input type="text" id="name" placeholder="Nový název karty" value={nameInput} onChange={e => setNameInput(e.target.value)} />
          </div>
          <div className="flex justify-between items-end gap-2 pt-2">
            <Button onClick={handleSave} className='w-fit'>Uložit</Button>
            {error.length > 0 && <AlertBox type="error">{error}</AlertBox>}
          </div>
      </DialogContent>
    </Dialog>
  );
}