import CCSVisualizer from "@/components/CCSVisualizer";
import SyntaxTree from "@/components/SyntaxTree";
import TextCCSParser from "@/components/TextCCSParser";
import { transformAstToCytoscape } from "@/lib/ccsToCytoscape";
import type { CCSProgram } from "@/types";
import { useState } from "react";

function Homepage() {
  const [ccsInput, setCcsInput] = useState<CCSProgram|null>(null);
  const [highlightRange, setHighlightRange] = useState<{from: number, to: number} | null>(null);

  const handleInputChange = (input: CCSProgram) => {
    setCcsInput(input);
  };
  
  return <div className='p-4'>
    <h1 className='text-2xl font-bold'>Home</h1>
    <TextCCSParser onInputChange={handleInputChange} highlightRange={highlightRange} initValue={"P = a.'b.0 + c.P"} />
    <SyntaxTree parsedAst={ccsInput} onHoverNode={setHighlightRange} />
    <CCSVisualizer elements={ccsInput ? transformAstToCytoscape(ccsInput) : []} />
  </div>;
}

export default Homepage;