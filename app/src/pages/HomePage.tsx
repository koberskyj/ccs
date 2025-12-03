import TextEditor from "@/components/TextEditor";
import { useState } from "react";

function Homepage() {
  const [ccsCode, setCcsCode] = useState("");

  const handleEditorChange = (newCode: string) => {
    setCcsCode(newCode);
  };
  
  return <div className='p-4'>
    <h1 className='text-2xl font-bold'>Home</h1>
    <TextEditor onTextChange={handleEditorChange} />

    <pre>{ccsCode}</pre>
  </div>;
}

export default Homepage;