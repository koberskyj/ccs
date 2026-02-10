
import CodeMirror from '@uiw/react-codemirror';
import { syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { ccsHighlightStyle, ccsLanguage } from './TextEditor';

const minimalTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent !important",
    fontSize: "inherit",
    fontFamily: "'Consolas', monospace",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    overflow: "hidden !important",
  },
  ".cm-content": {
    padding: "0",
    caretColor: "transparent"
  },
  ".cm-line": {
    paddingLeft: '0'
  },
  "&.cm-focused": {
    outline: "none"
  }
});

interface CCSViewerProps {
  code: string;
  className?: string;
}

export default function CCSViewer({ code, className }: CCSViewerProps) {
  return (
    <div className={className} style={{ display: 'inline-block', width: '100%' }}>
      <CodeMirror
        value={code}
        readOnly={true}
        editable={false}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          bracketMatching: false,
          history: false,
          drawSelection: false,
        }}
        extensions={[
          ccsLanguage, 
          syntaxHighlighting(ccsHighlightStyle),
          minimalTheme,
          EditorView.lineWrapping
        ]}
      />
    </div>
  );
}