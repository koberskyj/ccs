import CCSVisualizer from "@/components/CCSVisualizer";
import TextCCSParser from "@/components/TextCCSParser";
import { transformAstToCytoscape } from "@/lib/ccsToCytoscape";
import type { CCSProgram } from "@/types";
import { useState } from "react";

function Homepage() {
  const [ccsInput, setCcsInput] = useState<CCSProgram|null>(null);

  const handleInputChange = (input: CCSProgram) => {
    setCcsInput(input);
  };
  
  return <div className='p-4'>
    <h1 className='text-2xl font-bold'>Home</h1>
    <TextCCSParser onInputChange={handleInputChange} initValue={"P = a.'b.0 + c.P"} />
    <CCSVisualizer elements={ccsInput ? transformAstToCytoscape(ccsInput) : []} />
  </div>;
}

export default Homepage;