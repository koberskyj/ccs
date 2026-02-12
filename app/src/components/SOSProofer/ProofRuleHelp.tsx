import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function TransitionArrow({ label }: { label: React.ReactNode }) {
  return (
    <div className="inline-flex flex-col items-center justify-center relative mx-0.5 translate-y-[-0.2rem]">
      <span className="text-[0.8rem]/[0.8rem] mb-[-0.1rem]">
        {label}
      </span>
      <span className="text-lg/[0.4rem]">
        &#10230;
      </span>
    </div>
  );
};

export function MathSum({ sub, children }: { sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1">
      <div className="inline-flex flex-col items-center justify-center mr-0.5">
        <span className="text-lg leading-none">∑</span>
        <span className="text-[0.75rem] leading-none mt-0.5">{sub}</span>
      </div>
      {children}
    </div>
  );
};

export function Trans({ p, a, q }: { p: React.ReactNode, a: React.ReactNode, q: React.ReactNode }) {
  return (
    <div className="inline-flex items-center text-gray-900 font-sans">
      <span>{p}</span>
      <span className="px-1 translate-y-[-0.2rem]">
        <TransitionArrow label={<span className="">{a}</span>} />
      </span>
      <span>{q}</span>
    </div>
  );
};

export function InferenceRuleTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 text-base">
      {children}
    </div>
  );
};

export function InferenceRuleBox({ name, children }: { name: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all w-fit">
      <span className="text-xs text-foreground/70 w-full mb-2 border-b pb-1 [&>b]:font-bold">
        {name}
      </span>
      
      <div className="mt-1 p-3">
        {children}
      </div>
    </div>
  );
}

export function InferenceRule({ premise, conclusion, condition, note }: { premise?: React.ReactNode, conclusion: React.ReactNode, condition?: React.ReactNode, note?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="px-3 text-center min-h-[1.5em] flex items-end justify-center">
              {premise || <span className="opacity-0 w-8 h-1"></span>}
            </div>
            
            <div className="w-full h-px bg-foreground"></div>
            
            <div className="px-3 pt-0.5 text-center">
              {conclusion}
            </div>
          </div>
        </div>
        
        {condition && (
          <span className="text-[0.8rem] text-foreground/70 px-2">
            {condition}
          </span>
        )}

      </div>
      {note && (
        <span className="text-[0.75rem] text-foreground/60 translate-y-1 italic">
          {note}
        </span>
      )}
    </div>
  );
};

const alpha = <span>&alpha;</span>;
const tau = <span>&tau;</span>;
const a = <span>a</span>;
const a_bar = <span className="overline">a</span>;
const P = <span>P</span>;
const Q = <span>Q</span>;
const P_prime = <span>P'</span>;
const Q_prime = <span>Q'</span>;
const P_j = <span>P<sub>j</sub></span>;
const P_j_prime = <span>P'<sub>j</sub></span>;
const P_i = <span>P<sub>i</sub></span>;

export function RuleAct() {
  return (
    <InferenceRule
      conclusion={<Trans p={<>{alpha}.{P}</>} a={alpha} q={P} />}
    />
  )
}

export function RuleSum() {
  return (
    <InferenceRule 
      premise={<Trans p={P_j} a={alpha} q={P_j_prime} />}
      conclusion={
        <Trans 
          p={<MathSum sub={<span>i &#8712; I</span>}>{P_i}</MathSum>} 
          a={alpha} 
          q={P_j_prime} 
        />
      }
      condition={<span>kde <span>j &#8712; I</span></span>}
      note={<span>V aplkiaci: SUM Left / SUM Right</span>}
    />
  )
}

export function RuleCom1() {
  return (
    <InferenceRule 
      premise={<Trans p={P} a={alpha} q={P_prime} />}
      conclusion={<Trans p={<>{P} | {Q}</>} a={alpha} q={<>{P_prime} | {Q}</>} />}
      note={<span>V aplikaci: COM Left</span>}
    />
  )
}

export function RuleCom2() {
  return (
    <InferenceRule 
      premise={<Trans p={Q} a={alpha} q={Q_prime} />}
      conclusion={<Trans p={<>{P} | {Q}</>} a={alpha} q={<>{P} | {Q_prime}</>} />}
      note={<span>V aplikaci: COM Right</span>}
    />
  )
}

export function RuleCom3() {
  return (
    <InferenceRule
      premise={
        <div className="flex gap-4">
          <Trans p={P} a={a} q={P_prime} />
          <Trans p={Q} a={a_bar} q={Q_prime} />
        </div>
      }
      conclusion={<Trans p={<>{P} | {Q}</>} a={tau} q={<>{P_prime} | {Q_prime}</>} />}
      note={<span>V aplikaci: COM Sync</span>}
    />
  )
}

export function RuleRes() {
  return (
    <InferenceRule 
      premise={<Trans p={P} a={alpha} q={P_prime} />}
      conclusion={<Trans p={<>{P} \ {"{L}"}</>} a={alpha} q={<>{P_prime} \ {"{L}"}</>} />}
      condition={<span>{alpha}, <span className="overline">&alpha;</span> &notin; L</span>}
    />
  )
}

export function RuleRel() {
  return (
    <InferenceRule 
      premise={<Trans p={P} a={alpha} q={P_prime} />}
      conclusion={<Trans p={<>{P}[f]</>} a={<span>f({alpha})</span>} q={<>{P_prime}[f]</>} />}
    />
  )
}

export function RuleCon() {
  return (
    <InferenceRule 
      premise={<Trans p={P} a={alpha} q={P_prime} />}
      conclusion={<Trans p={<span>K</span>} a={alpha} q={P_prime} />}
      condition={<span>kde <span>K def P</span></span>}
    />
  )
}

export function SOSRulesHelp({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Definice strukturální operační sémantiky (SOS)</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 pb-4">
          
          <div>
            <h3 className="font-semibold mb-4 text-primary border-b border-foreground/20 pb-1.5">
              Základní operátory a volba
            </h3>
            <div className="flex gap-4 justify-start flex-wrap">
              <InferenceRuleBox name={<><b>ACT</b> (Prefix)</>}>
                <RuleAct />
              </InferenceRuleBox>
              
              <InferenceRuleBox name={<><b>SUM</b> (Součet)</>}>
                <RuleSum />
              </InferenceRuleBox>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-primary border-b border-foreground/20 pb-1.5">
              Paralelní kompozice
            </h3>
            <div className="flex gap-4 justify-start flex-wrap">
              <InferenceRuleBox name={<><b>COM1</b> (Levá větev)</>}>
                <RuleCom1 />
              </InferenceRuleBox>

              <InferenceRuleBox name={<><b>COM2</b> (Pravá větev)</>}>
                <RuleCom2 />
              </InferenceRuleBox>
              <InferenceRuleBox name={<><b>COM3</b> (Komunikace)</>}>
                <RuleCom3 />
              </InferenceRuleBox>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-primary border-b border-foreground/20 pb-1.5">
              Strukturální operátory
            </h3>
            <div className="flex gap-4 justify-start flex-wrap">
              <InferenceRuleBox name={<><b>RES</b> (Restrikce)</>}>
                <RuleRes />
              </InferenceRuleBox>
              <InferenceRuleBox name={<><b>REL</b> (Přejmenování)</>}>
                <RuleRel />
              </InferenceRuleBox>
              <InferenceRuleBox name={<><b>CON</b> (Konstanta)</>}>
                <RuleCon />
              </InferenceRuleBox>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}