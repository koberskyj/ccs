import peggy from "peggy";
import grammarSource from "@/ccs_grammar.pegjs?raw";

export default function ccsParser() {
  try {
    return peggy.generate(grammarSource);
  } catch (e) {
    console.error("Chyba při generování parseru: ", e);
    return null;
  }
}