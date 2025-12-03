import { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';

const ccsHighlightStyle = HighlightStyle.define([
  {
    tag: t.labelName, // Výstupní akce (samotný text 'a')
    textDecoration: "overline",
    textDecorationThickness: "2px",
    color: "#d32f2f", 
  },
  {
    tag: t.variableName, // Vstupní akce
    color: "#1976d2", 
  },
  {
    tag: t.processingInstruction,
    color: "transparent",
    fontSize: "0.1px",
    letterSpacing: "-0.5em"
  },
  {
    tag: t.invalid,
    color: "red",
    borderBottom: "2px dotted red"
  },
  {
    tag: t.keyword,
    color: "#7e57c2"
  },
  {
    tag: t.typeName, // Procesní konstanty
    color: "#00796b"
  },
  {
    tag: t.lineComment,
    color: "#999",
    fontStyle: "italic"
  }
]);

const ccsLanguage = StreamLanguage.define({
  startState: () => ({ isOutput: false, expectingDot: false }),
  token: (stream, state) => {
    if(stream.eatSpace()) {
      return null;
    }

    if(stream.match("//")) {
      stream.skipToEnd();
      return "lineComment";
    }

    // Zpracování tečky
    if (state.expectingDot) {
      if(stream.match(/^\./)) {
        state.expectingDot = false;
        return "operator";
      }
      if (stream.match(/^[+|)]/)) {
        state.expectingDot = false;
        return "operator";
      }
      if (stream.peek() === "'" || /^[a-z]/.test(stream.peek() ?? "")) {
         stream.next();
         return "invalid";
      }
    }

    // Zpracování apostrofu
    if (stream.peek() === "'") {
       const nextChar = stream.string.charAt(stream.pos + 1);
       const isValidAction = /^[a-z]/.test(nextChar);

       if (isValidAction) {
          state.isOutput = true;
          stream.next();
          return "processingInstruction"; 
       }
       else {
          stream.next(); 
          state.isOutput = false;
          return "invalid";
        }
    }

    // Vstupní/výstupní akce
    if (stream.match(/^[a-z][a-zA-Z0-9_]*/)) {
      state.expectingDot = true;

      if(state.isOutput) {
        state.isOutput = false;
        return "labelName";
      }
      return "variableName";
    }

    // Operátory
    if (stream.match(/^[.+|\\=(){}\[\]]/)) {
      return "operator";
    }

    // Klíčová slova
    if (stream.match(/^(def|nil|0)/i)) {
      return "keyword";
    }

    // Procesní Konstanty
    if (stream.match(/^[A-Z][a-zA-Z0-9_]*/)) {
      return "typeName";
    }

    if (stream.match(/^τ/)) {
      return "variableName";
    }

    stream.next();
    return null;
  }
});

export default function TextEditor({ onTextChange }: { onTextChange?: (text: string) => void }) {
  const [value, setValue] = useState("Agent = a.'b.0 + 'BadSyntax; // Testovací highliter"); 

  const onChange = useCallback((val: string, viewUpdate: any) => {
    setValue(val);
    if (onTextChange) {
      onTextChange(val);
    }
  }, [onTextChange]);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h3>CCS Editor</h3>
      <CodeMirror 
        value={value} 
        height="200px"
        style={{ border: '1px solid #ccc', fontSize: '1.2em' }} 
        basicSetup={{
          closeBrackets: false,
        }}
        extensions={[
            ccsLanguage, 
            syntaxHighlighting(ccsHighlightStyle)
        ]} 
        onChange={onChange} 
      />
    </div>
  );
}