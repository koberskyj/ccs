import { useEffect, useMemo, useState } from "react";
import TextEditor from "./TextEditor";
import ccsParser, { validateCCS } from "@/lib/ccsParser";
import type { CCSProgram } from "@/types";
import AlertBox from "../custom/AlertBox";
import { cn } from "@/lib/utils";

type TextCCSParserProps = {
  onCCSChange?: (input: CCSProgram, codeString: string) => void;
  onCCSSubmit?: (input: CCSProgram, codeString: string) => void;
  initValue?: string;
  highlightRange?: { from: number; to: number } | null;
  disabled?: boolean;
} & React.ComponentProps<"div">;

export default function TextCCSParser({ onCCSSubmit, onCCSChange, initValue, highlightRange, disabled, className, ...props }: TextCCSParserProps) {
  const [ccsCode, setCcsCode] = useState(initValue ?? "");
  const [error, setError] = useState<React.ReactNode | null>(null);
  
  const parser = useMemo(() => {
    const parser = ccsParser();
    if(parser === null) {
      setError("CCS parser was not initialized.");
    }
    return parser;
  }, []);

  /*const onParseClick = () => {
    if(!parser) {
      setError("CCS parser was not initialized.");
      return;
    }
    try {
      const ast: CCSProgram = parser.parse(ccsCode);
      const semanticError = validateCCS(ast);
      if(semanticError) {
        setError(semanticError);
        return;
      }

      onCCSSubmit?.(ast);
      setError(null);
    } 
    catch(e: any) {
      if(e.location) {
        setError(`Line ${e.location.start.line}: ${e.message}`);
      } 
      else {
        setError(e.message);
      }
    }
  }*/

  const handleEditorChange = (newCode: string) => {
    setCcsCode(newCode);
  };

  useEffect(() => {
    if(!parser) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const ast: CCSProgram = parser.parse(ccsCode);
        const semanticError = validateCCS(ast);
        if(semanticError) {
          setError(semanticError);
          return;
        }
        
        onCCSChange?.(ast, ccsCode);
        onCCSSubmit?.(ast, ccsCode);
        setError(null);
      } 
      catch(e: any) {
        if(e.location) {
          setError(<><b>Line {e.location.start.line}:</b> {e.message}</>);
        } 
        else {
          setError(e.message);
        }
      }
    }, 300); // Debounce

    return () => {
      clearTimeout(timeoutId);
    }
  }, [ccsCode, parser]);

  return (
    <div className={cn("flex flex-col min-w-0", className)} {...props}>
      <TextEditor className="flex-1 w-full h-full font-mono text-sm overflow-auto" onTextChange={handleEditorChange} initValue={ccsCode} highlightRange={highlightRange} disabled={disabled} />

      <div className="shrink-0 flex justify-between items-end mt-2">
        {error ? <AlertBox type="error" className="shrink-0">{error}</AlertBox> : <span></span>}
        {/* <Button onClick={onParseClick} disabled={error !== null}>Parse</Button> */}
      </div>
    </div>
  )
}