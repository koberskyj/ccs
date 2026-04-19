import { useState, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { syntaxHighlighting } from '@codemirror/language';
import { EditorView, hoverTooltip } from '@codemirror/view';
import { ccsHighlightStyle, ccsLanguage } from '../textEditor/TextEditor';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

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
  },
  ".cm-tooltip": {
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none"
  },
  ".cm-tooltip-arrow": {
    display: "none"
  }
});

interface CCSViewerProps {
  code: string;
  className?: string;
  definitions?: Record<string, string>;
}

interface TooltipData {
  dom: HTMLElement;
  word: string;
  definition: string;
}

export default function CCSViewer({ code, className, definitions = {} }: CCSViewerProps) {
  const { t } = useTranslation();
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const processHoverTooltip = useMemo(() => {
    return hoverTooltip((view, pos, side) => {
      const { from, to, text } = view.state.doc.lineAt(pos);
      let start = pos, end = pos;
      
      while(start > from && /[A-Za-z0-9_]/.test(text[start - 1 - from])) {
        start--;
      }
      while(end < to && /[A-Za-z0-9_]/.test(text[end - from])) {
        end++;
      }
      if((start === pos && side < 0) || start === end) {
        return null;
      }
      
      const word = text.slice(start - from, end - from);
      const isProcess = /^[A-Z][a-zA-Z0-9_]*/.test(word);
      
      if(isProcess && definitions[word]) {
        return {
          pos: start,
          end: end,
          above: true,
          create() {
            const dom = document.createElement("div");
            setTooltipData({ dom, word, definition: definitions[word] });
            
            return {
              dom,
              destroy() {
                setTooltipData(null);
              }
            };
          }
        };
      }
      return null;
    });
  }, [definitions]);

  const extensions = useMemo(() => [
    ccsLanguage, 
    syntaxHighlighting(ccsHighlightStyle),
    minimalTheme,
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ "aria-label": code }),
    processHoverTooltip
  ], [code, processHoverTooltip]);

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
        extensions={extensions}
      />

      {tooltipData && createPortal(
        <div className="min-w-10 w-max animate-in fade-in-0 zoom-in-95 duration-200 px-4 py-3 text-sm bg-popover/90 text-popover-foreground border border-foreground/20 shadow-lg backdrop-blur-sm rounded-lg -translate-y-2" style={{ transform: 'translateX(-45%)' }}>
          <div className="font-mono border-b border-stone-400 pb-1 mb-2 font-bold text-xs uppercase tracking-wider flex justify-between">
            <span>{t('core.processDefinition')} {tooltipData.word}</span>
          </div>
          <div className="font-mono wrap-break-word border border-primary/8 bg-[color-mix(in_srgb,var(--primary)_15%,white)] p-2 rounded-md">
            <CCSViewer code={tooltipData.word + " = " + tooltipData.definition} />
          </div>
        </div>,
        tooltipData.dom
      )}
    </div>
  );
}