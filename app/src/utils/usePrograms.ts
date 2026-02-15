import { useContext } from "react";
import { ProgramsContext } from "@/utils/ProgramsContext";


export function usePrograms() {
  const context = useContext(ProgramsContext);
  if(context === undefined) {
    throw new Error('usePrograms must be used within a ProgramsProvider.');
  }
  return context;
};