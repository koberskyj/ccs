import type { ProofRuleName, ProofStep } from "@/types";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check } from "lucide-react";
import DivHover from "../custom/DivHover";
import { InferenceRuleTooltip, RuleAct, RuleCom1, RuleCom2, RuleCom3, RuleCon, RuleRel, RuleRes, RuleSum, SOSRulesHelp } from "./ProofRuleHelp";


interface ProofControlsProps {
  step: ProofStep;
  showHints: boolean;
  onApplyRule: (stepId: string, rule: ProofRuleName, extraData?: any) => void;
}

export default function ProofControls({ step, onApplyRule, showHints }: ProofControlsProps) {

  const [selectedSyncLabel, setSelectedSyncLabel] = useState<string>('a');
  const [leftSends, setLeftSends] = useState<boolean>(true);
  const [relCandidate, setRelCandidate] = useState<string>('');

  const { type } = step.source;
  const { label } = step.action;

  const relCandidates = useMemo(() => {
    if(step.source.type !== 'Relabeling') {
      return [];
    }
    const outerLabel = step.action.label;
    if(outerLabel === 'tau') {
      return ['tau'];
    }

    const relabels = step.source.relabels;
    const explicitMap = relabels.filter(r => r.new === outerLabel).map(r => r.old);
    const isRenamedAway = relabels.some(r => r.old === outerLabel);
    
    const implicitMap = !isRenamedAway ? [outerLabel] : [];
    return Array.from(new Set([...explicitMap, ...implicitMap]));
  }, [step.source, step.action]);

  useEffect(() => {
    if(relCandidates.length > 0) {
      setRelCandidate(relCandidates[0]);
    }
  }, [relCandidates]);

  

  const [manualRule, setManualRule] = useState<ProofRuleName | "">("");
  const [manualParam, setManualParam] = useState<string>("");
  const [manualBool, setManualBool] = useState<boolean>(true);

  const ALL_RULES: { value: ProofRuleName; label: string }[] = [
    { value: "ACT", label: "ACT" },
    { value: "SUM_LEFT", label: "SUM Left" },
    { value: "SUM_RIGHT", label: "SUM Right" },
    { value: "COM_LEFT", label: "COM Left" },
    { value: "COM_RIGHT", label: "COM Right" },
    { value: "COM_SYNC", label: "COM Sync" },
    { value: "RES", label: "RES" },
    { value: "REL", label: "REL" },
    { value: "CON", label: "CON" },
  ];

  useEffect(() => {
    setManualRule("");
    setManualParam("");
    setManualBool(true);
  }, [step.id]);

  const needsLabelInput = manualRule === 'COM_SYNC' || manualRule === 'REL';
  const needsBoolInput = manualRule === 'COM_SYNC';
  const getPlaceholder = () => {
    if(manualRule === 'COM_SYNC') {
      return 'Sync akce';
    }
    if(manualRule === 'REL') {
      return 'Původní akce';
    }
    return 'Parametr';
  };

  const onManualApply = () => {
    if(!manualRule) return;
    let extraData = undefined;
    if(manualRule === 'COM_SYNC') {
      extraData = { label: manualParam, leftSends: manualBool };
    } else if (manualRule === 'REL') {
      extraData = { oldLabel: manualParam };
    }
    onApplyRule(step.id, manualRule, extraData);
  };

  if(showHints) {
    return (
      <div className="flex flex-wrap items-center gap-2">

        {type === 'Prefix' && (
          <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleAct /></InferenceRuleTooltip>}>
            <Button size="sm" variant="secondary" onClick={() => onApplyRule(step.id, 'ACT')}>ACT</Button>
          </DivHover>
        )}

        {type === 'Summation' && (
          <>
            <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleSum /></InferenceRuleTooltip>}>
              <Button size="sm" variant="secondary" onClick={() => onApplyRule(step.id, 'SUM_LEFT')}>SUM Left</Button>
            </DivHover>
            <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleSum /></InferenceRuleTooltip>}>
              <Button size="sm" variant="secondary" onClick={() => onApplyRule(step.id, 'SUM_RIGHT')}>SUM Right</Button>
            </DivHover>
          </>
        )}

        {type === 'Parallel' && (
          <>
            <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleCom1 /></InferenceRuleTooltip>}>
              <Button size="sm" variant="secondary" onClick={() => onApplyRule(step.id, 'COM_LEFT')}>COM Left</Button>
            </DivHover>
            <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleCom2 /></InferenceRuleTooltip>}>
              <Button size="sm" variant="secondary" onClick={() => onApplyRule(step.id, 'COM_RIGHT')}>COM Right</Button>
            </DivHover>
            
            {label === 'tau' && (
              <div className="flex items-center gap-2 bg-secondary p-1 px-2 rounded-md border shadow ml-2">
                <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleCom3 /></InferenceRuleTooltip>}>
                  <Badge className="bg-white text-foreground hover:bg-accent hover:text-accent-foreground">COM Sync</Badge>
                </DivHover>
                <span className="text-xs font-medium text-stone-800 pl-1">na:</span>
                <Input className="h-7 w-16 text-xs font-mono bg-white" value={selectedSyncLabel} onChange={e => setSelectedSyncLabel(e.target.value)} placeholder="akce" />
                <div className="flex items-center space-x-1">
                  <Checkbox id={`ls-${step.id}`} checked={leftSends} onCheckedChange={(c) => setLeftSends(c as boolean)} />
                  <label htmlFor={`ls-${step.id}`} className="text-xs cursor-pointer select-none">Levá posílá</label>
                </div>
                <Button size="icon" className="h-7 w-7" onClick={() => onApplyRule(step.id, 'COM_SYNC', { label: selectedSyncLabel, leftSends })}>
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            )}
          </>
        )}

        {type === 'Restriction' && (
          <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleRes /></InferenceRuleTooltip>}>
            <Button size="sm" variant="secondary" onClick={() => onApplyRule(step.id, 'RES')}>RES</Button>
          </DivHover>
        )}

        {type === 'Relabeling' && (
          <div className="flex items-center gap-2 bg-secondary p-1 px-2 rounded-md border shadow">
            <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleRel /></InferenceRuleTooltip>}>
              <Badge className="bg-white text-foreground hover:bg-accent hover:text-accent-foreground">REL</Badge>
            </DivHover>
            <DivHover delayDuration={750} hoverContent={<span>Zde si vyberte původní akci <br /> (před přejmenováním)</span>}>
              <span className="text-xs font-medium text-stone-800 pl-1">Původní akce:</span>
            </DivHover>
            {relCandidates.length > 0 ? (
              <Select value={relCandidate} onValueChange={setRelCandidate}>
                <SelectTrigger className="h-7 w-24 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relCandidates.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
                <span className="text-xs text-gray-600 italic px-2">Žádná shoda</span>
            )}

            <Button size="icon" className="h-7 w-7" onClick={() => onApplyRule(step.id, 'REL', { oldLabel: relCandidate })}>
              <Check className="h-3 w-3" />
            </Button>
          </div>
        )}

        {type === 'ProcessRef' && (
          <DivHover className="p-0" delayDuration={750} hoverContent={<InferenceRuleTooltip><RuleCon /></InferenceRuleTooltip>}>
            <Button size="sm" variant="secondary" onClick={() => onApplyRule(step.id, 'CON')}>CON</Button>
          </DivHover>
        )}
      </div>
    );
  }



  else {
    return (
      <div className="flex flex-wrap items-center gap-2 w-full">
        <SOSRulesHelp>
          <Button variant="secondary" size="icon" className="cursor-pointer">
            <BookOpen size={16} />
          </Button>
        </SOSRulesHelp>

        <Select value={manualRule} onValueChange={(v) => setManualRule(v as ProofRuleName)}>
          <SelectTrigger className="h-9 w-[120px] bg-white">
             <SelectValue placeholder="Vyberte pravidlo..." />
          </SelectTrigger>
          <SelectContent>
            {ALL_RULES.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {needsLabelInput && (
          <Input className="h-9 w-32 font-mono" placeholder={getPlaceholder()} value={manualParam} onChange={e => setManualParam(e.target.value)} />
        )}

        {needsBoolInput && (
          <div className="flex items-center gap-2 border px-3 h-9 rounded-md bg-white">
            <Checkbox id={`manual-ls-${step.id}`} checked={manualBool} onCheckedChange={(c) => setManualBool(c as boolean)} />
            <label htmlFor={`manual-ls-${step.id}`} className="text-sm cursor-pointer select-none">Levá posílá</label>
          </div>
        )}

        <Button disabled={!manualRule} onClick={onManualApply}>Aplikovat</Button>
      </div>
    );
  }
}