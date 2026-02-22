import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import type { ProgramSave } from "@/types";
import { Textarea } from "../ui/textarea";
import AlertBox from "../custom/AlertBox";
import { validateProgramDefinition } from "@/lib/importUtils";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ImportProgram({ children, onUpdate }: { children: React.ReactNode, onUpdate: (program: ProgramSave) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result;
      if(typeof content === "string") {
        setText(content);
        setErrorMessage("");
      }
    };
    reader.onerror = () => {
      setErrorMessage(t('core.fileReadError'));
    };
    reader.readAsText(file);
    
    e.target.value = "";
  };

  const importProgram = () => {
    try {
      const parsedDefinition = JSON.parse(text);
      
      const validationResult = validateProgramDefinition(parsedDefinition);
      if(validationResult !== true) {
        setErrorMessage(validationResult);
        return;
      }

      setErrorMessage("");
      setIsOpen(false);
      onUpdate(parsedDefinition);
      setText("");
    } 
    catch (e) {
      setErrorMessage(t('core.importFailed'));
      console.error(e);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">{t('selector.importProgram')}</DialogTitle>
        </DialogHeader>          
        
        <div className="space-y-2">

          <div>
            <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload size={16} /> {t('selector.uploadFile')}
            </Button>
          </div>

          <div className="text-sm text-foreground/60 p-2">--- {t('core.or').toLocaleUpperCase()} ---</div>

          <Textarea value={text} onChange={e => setText(e.target.value)} className="h-50 font-mono text-sm" placeholder={t('selector.pasteJson')} />
          
          <div className="flex justify-between items-end gap-2 pt-6">
            <Button onClick={importProgram} className='w-fit'>{t('core.import')}</Button>
            {errorMessage.length > 0 && <AlertBox type="error">{errorMessage}</AlertBox>}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}