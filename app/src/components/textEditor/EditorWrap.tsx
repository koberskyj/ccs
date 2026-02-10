import { useEffect, useRef, useState } from "react";
import SyntaxTree from "./SyntaxTree";
import TextCCSParser from "./TextCCSParser";
import type { CCSProgram } from "@/types";

interface EditorWrapProps {
  onSubmit?: (input: CCSProgram) => void;
  initValue?: string;
}

const MIN_EDITOR_WIDTH = 750;
const GAP = 16;

export default function EditorWrap({ onSubmit, initValue }: EditorWrapProps) {
  const [ccsInput, setCcsInput] = useState<CCSProgram|null>(null);
  const [highlightRange, setHighlightRange] = useState<{from: number, to: number} | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [treeSize, setTreeSize] = useState({ width: 300, height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (input: CCSProgram) => {
    setCcsInput(input);
  }

  const handleSubmit = (input: CCSProgram) => {
    setCcsInput(input);
    onSubmit?.(input);
  }

  useEffect(() => {
    if(!containerRef.current) {
      return;
    }
    const resizeObserver = new ResizeObserver((entries) => {
      for(const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const shouldWrap = containerWidth > 0 && containerWidth < (MIN_EDITOR_WIDTH + treeSize.width + GAP);
  const wrappedHeight = treeSize.height;

  return (
    <div ref={containerRef} className={`flex gap-x-4 transition-all duration-100 ease-in-out ${shouldWrap ? "flex-col" : "flex-row justify-between"}`}>
      <TextCCSParser className={`grow min-h-[500px] ${shouldWrap ? "w-full" : ""}`} onCCSChange={handleInputChange} onCCSSubmit={handleSubmit} highlightRange={highlightRange} initValue={initValue} />

      <SyntaxTree parsedAst={ccsInput} onHoverNode={setHighlightRange} onContentResize={setTreeSize}
        className={`transition-all duration-100 shrink-0 ${shouldWrap ? "w-full pt-4" : "min-w-[300px]"}`}
        style={{
          width: shouldWrap ? '100%' : Math.min(treeSize.width, containerWidth * 0.5),
          height: shouldWrap ? wrappedHeight : 'auto'
        }}
      />
    </div>
  );
}