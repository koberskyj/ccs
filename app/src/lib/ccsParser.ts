import peggy from "peggy";
import grammarSource from "@/ccs_grammar.pegjs?raw";
import type { CCSNode, CCSProgram } from "@/types";

export function validateCCS(definitions: CCSProgram): string | null {
  const definedNames = new Set<string>();
  let error: string | null = null;

  for(const def of definitions) {
    if(definedNames.has(def.name)) {
      return `Process '${def.name}' is defined multiple times.`;
    }
    definedNames.add(def.name);
  }

  function checkExpr(expr: CCSNode) {
    if(error || !expr) {
      return;
    }

    switch(expr.type) {
      case "ProcessRef":
        if(!definedNames.has(expr.name)) {
          error = `Used undefined process '${expr.name}'.`;
        }
        break;

      case "Prefix":
        checkExpr(expr.next);
        break;

      case "Summation":
      case "Parallel":
        checkExpr(expr.left);
        checkExpr(expr.right);
        break;

      case "Restriction":
      case "Relabeling":
        checkExpr(expr.process);
        break;
    }
  }

  for(const def of definitions) {
    checkExpr(def.process);
    if(error) {
      return error;
    }
  }

  return null;
}

export default function ccsParser() {
  try {
    return peggy.generate(grammarSource);
  } catch (e) {
    console.error("Chyba při generování parseru: ", e);
    return null;
  }
}