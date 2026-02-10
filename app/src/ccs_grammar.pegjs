/*
 * CCS Grammar pro Peggy.js
 */

{
  function node(type, props) {
    return { type, ...props, loc: location() };
  }
}

Start
  = _ prog:Program _ !. { return prog; }

Program
  = head:Definition tail:(_ Definition)* {
      return [head, ...tail.map(t => t[1])];
    }

Definition
  = name:ProcessId _ "=" _ expr:Expression {
      return node("Definition", { name, process: expr });
    }



Expression
  = head:ParallelComponent tail:(_ "+" _ ParallelComponent)* {
      if(tail.length === 0) {
        return head;
      }
      return tail.reduce((acc, curr) => 
        node("Summation", { left: acc, right: curr[3] }), head);
    }


ParallelComponent
  = head:RestrictionComponent tail:(_ "|" _ RestrictionComponent)* {
      if(tail.length === 0) {
        return head;
      }
      return tail.reduce((acc, curr) => 
        node("Parallel", { left: acc, right: curr[3] }), head);
    }

RestrictionComponent
  = base:PrefixComponent ops:(_ (Restriction / Relabeling))* {
      return ops.reduce((acc, op) => {
        const operation = op[1];
        if(operation.type === "Restriction") {
          return node("Restriction", { process: acc, labels: operation.labels });
        } 
        else {
          return node("Relabeling", { process: acc, relabels: operation.relabels });
        }
      }, base);
    }


PrefixComponent
  = action:Action _ "." _ next:PrefixComponent {
      return node("Prefix", { action, next });
    }
  / Primary



TightComponent
  = base:Primary ops:(_ (Restriction / Relabeling))* {
      return ops.reduce((acc, op) => {
        const operation = op[1];
        if(operation.type === "Restriction") {
          return node("Restriction", { process: acc, labels: operation.labels });
        } 
        else {
          return node("Relabeling", { process: acc, relabels: operation.relabels });
        }
      }, base);
    }

Restriction
  = "\\" _ "{" _ labels:LabelList _ "}" { 
      if(labels.includes("tau")) {
        error("Cannot restrict 'tau'.");
      }
      return { type: "Restriction", labels }; 
    }

Relabeling
  = "[" _ relabels:RelabelList _ "]" { return { type: "Relabeling", relabels }; }



Primary
  = "(" _ expr:Expression _ ")" { return expr; }
  / "0" { return node("Nil"); }
  / "Nil" { return node("Nil"); }
  / id:ProcessId { return node("ProcessRef", { name: id }); }



Action
  = "tau" { return { label: "tau", isOutput: false }; }
  / "'" name:LabelName { return { label: name, isOutput: true }; } 
  / name:LabelName { return { label: name, isOutput: false }; }

LabelName "label"
  = head:[a-z] tail:[a-zA-Z0-9_]* { return head + tail.join(""); }

ProcessId "process identifier"
  = head:[A-Z] tail:[a-zA-Z0-9_]* { return head + tail.join(""); }

LabelList
  = head:LabelName tail:(_ "," _ LabelName)* { return [head, ...tail.map(t => t[3])]; }

RelabelList
  = head:RelabelPair tail:(_ "," _ RelabelPair)* { return [head, ...tail.map(t => t[3])]; }

RelabelPair
  = newLabel:LabelName _ "/" _ oldLabel:LabelName { 
      if(oldLabel === "tau") {
        error("Cannot rename 'tau'.");
      }
      return { new: newLabel, old: oldLabel }; 
    }

_ "whitespace"
  = (White / Comment)*

White
  = [ \t\n\r]+

Comment
  = "//" [^\n]*
  / "/*" (!"*/" .)* "*/"