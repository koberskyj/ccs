import { useState, useCallback, useMemo } from 'react';
import CodeMirror, { Decoration, EditorView } from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';

export const ccsHighlightStyle = HighlightStyle.define([
  {
    tag: t.typeName, // Procesní konstanty
    color: "#00796b",
    fontWeight: "bold"
  },
  {
    tag: t.keyword, // 0, Nil, def, tau
    color: "#7e57c2"
  },
  {
    tag: t.variableName, // Vstupní akce
    color: "#1976d2"
  },
  {
    tag: t.labelName, // Výstupní akce
    color: "#d32f2f",
    textDecoration: "overline",
    textDecorationThickness: "2px"
  },
  {
    tag: t.operator, // ., +, |, \, =
    color: "#546e7a"
  },
  {
    tag: t.punctuation, // (), {}, [], ,
    color: "#546e7a"
  },
  {
    tag: t.lineComment,
    color: "#90a4ae",
    fontStyle: "italic"
  },
  {
    tag: t.invalid,
    color: "red",
    borderBottom: "1px dotted red"
  }
]);

export const ccsLanguage = StreamLanguage.define({
  token: (stream) => {
    // Whitespace
    if(stream.eatSpace()) {
      return null;
    }

    // Komentáře
    if (stream.match("//")) {
      stream.skipToEnd();
      return "lineComment";
    }

    // Výstupní akce
    if (stream.match(/^'[a-z][a-zA-Z0-9_]*/)) {
      return "labelName"; 
    }

    // Tau
    if (stream.match(/^tau\b/)) {
      return "atom";
    }

    // Vstupní akce
    if (stream.match(/^[a-z][a-zA-Z0-9_]*/)) {
      return "variableName";
    }

    // Procesní konstanty
    if (stream.match(/^[A-Z][a-zA-Z0-9_]*/)) {
      return "typeName";
    }

    // Klíčová slova
    if (stream.match(/^(Nil|0|def)\b/)) {
      return "keyword";
    }

    // Operátory
    if (stream.match(/^[.|=+\\\/]/)) {
      return "operator";
    }

    // Interpunkce
    if (stream.match(/^[\(\)\{\}\[\],]/)) {
      return "punctuation";
    }

    // Fallback
    stream.next();
    return "invalid";
  }
});

const highlightTheme = EditorView.baseTheme({
  ".cm-ast-highlight": { 
    backgroundColor: "rgba(255, 235, 59, 0.3)" 
  } 
});

export type TextEditorProps = {
  initValue?: string;
  onTextChange?: (text: string) => void;
  highlightRange?: { from: number; to: number } | null;
}

export default function TextEditor({ initValue, onTextChange, highlightRange }: TextEditorProps) {
  const [value, setValue] = useState(initValue ?? "");

  const onChange = useCallback((val: string) => {
    setValue(val);
    if (onTextChange) {
      onTextChange(val);
    }
  }, [onTextChange]);

  const highlightExtension = useMemo(() => {
    if(!highlightRange) {
      return [];
    }

    const mark = Decoration.mark({ class: "cm-ast-highlight" });
    const decorations = Decoration.set([
      mark.range(highlightRange.from, highlightRange.to)
    ]);

    return EditorView.decorations.of(decorations);
  }, [highlightRange]);

  return (
    <div>
      <CodeMirror 
        value={value} 
        height="200px"
        style={{ border: '1px solid #ccc', fontSize: '1.2em' }} 
        basicSetup={{
          closeBrackets: false,
        }}
        extensions={[
            ccsLanguage, 
            syntaxHighlighting(ccsHighlightStyle),
            highlightTheme,
            highlightExtension
        ]} 
        onChange={onChange} 
      />
    </div>
  );
}