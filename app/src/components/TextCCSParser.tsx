import { useEffect, useMemo, useState } from "react";
import TextEditor from "./TextEditor";
import ccsParser from "@/lib/ccsParser";
import type { CCSProgram } from "@/types";

type TextCCSParserProps = {
  onInputChange?: (input: CCSProgram) => void;
  initValue?: string;
  highlightRange?: { from: number; to: number } | null;
};

export default function TextCCSParser({ onInputChange, initValue, highlightRange }: TextCCSParserProps) {
  const [ccsCode, setCcsCode] = useState(initValue ?? "");
  const [error, setError] = useState<string | null>(null);
  
  const parser = useMemo(() => {
    const parser = ccsParser();
    if(parser === null) {
      setError("CCS parser was not initialized.");
    }
    return parser;
  }, []);

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
        onInputChange?.(ast);
        setError(null);
      } 
      catch(e: any) {
        if(e.location) {
          setError(`Line ${e.location.start.line}, Col ${e.location.start.column}: ${e.message}`);
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
    <div>
      <h1>CCS Parser</h1>
      <TextEditor onTextChange={handleEditorChange} initValue={ccsCode} highlightRange={highlightRange} />
      {error && (
        <div className="text-red-500 mt-2 text-sm">
          ⚠ {error}
        </div>
      )}
    </div>
  )
}