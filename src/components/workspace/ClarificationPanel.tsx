"use client"

import { QuestionItem } from "@/domain/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { CUSTOM_OPTION_ID } from "@/domain/clarifications";
import { cn } from "@/lib/utils";

export function ClarificationPanel({
  questions,
  answers,
  onAnswer,
}: {
  questions: QuestionItem[];
  answers: Record<string, string | undefined>;
  onAnswer: (questionId: string, optionId: string) => void;
}) {
  if (!questions?.length) return null;
  return (
    <div className="space-y-6 pt-4 border-t border-white/5">
      <div className="flex items-center gap-2 text-muted-foreground uppercase text-xs font-mono tracking-widest pl-1">
        <span className="text-primary">{"/// "}</span>
        Clarification Required
      </div>

      {questions.map((q, idx) => {
        const current: string = answers[q.id] ?? "";
        const knownIds = new Set(q.options.map((o) => o.id));
        const isKnown = current !== "" && knownIds.has(current);
        const hasCustomText = current !== "" && !knownIds.has(current) && current !== CUSTOM_OPTION_ID;
        const isCustomSelected = current === CUSTOM_OPTION_ID || hasCustomText;
        const radioValue = isKnown ? current : (isCustomSelected ? CUSTOM_OPTION_ID : "");

        return (
          <div key={q.id} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg blur-sm" />
            <Card className="glass-panel border-l-2 border-l-primary/50 relative">
              <CardHeader className="pb-3 bg-white/5 border-b border-white/5">
                <div className="flex items-start gap-3">
                  <div className="font-mono text-xs text-primary/70 mt-0.5">0{idx + 1}</div>
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium leading-relaxed">{q.text}</CardTitle>
                    <CardDescription className="text-xs">Select or provide an answer.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <RadioGroup value={radioValue} onValueChange={(v) => {
                  if (v === CUSTOM_OPTION_ID) {
                    if (!isKnown && current && current !== CUSTOM_OPTION_ID) {
                      onAnswer(q.id, current);
                    } else {
                      onAnswer(q.id, CUSTOM_OPTION_ID);
                    }
                  } else {
                    onAnswer(q.id, v);
                  }
                }}>
                  <div className="grid gap-2">
                    {q.options.map((opt) => (
                      <Label
                        key={opt.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded border cursor-pointer transition-all duration-200 group/label",
                          radioValue === opt.id
                            ? "bg-primary/10 border-primary/50 text-foreground"
                            : "bg-transparent border-white/5 hover:bg-white/5 text-muted-foreground"
                        )}
                      >
                        <RadioGroupItem value={opt.id} className="border-primary text-primary" />
                        <span className="flex-1 text-sm font-normal">{opt.label}</span>
                        {opt.recommended && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="ml-1 border-primary/30 text-primary bg-primary/5 text-[10px] uppercase">Rec</Badge>
                              </TooltipTrigger>
                              {opt.why && (
                                <TooltipContent className="bg-black/90 border-primary/20 text-xs max-w-[280px]">
                                  <p>{opt.why}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </Label>
                    ))}
                    {/* Custom free-text option */}
                    <div className={cn(
                      "flex items-start gap-3 p-3 rounded border transition-all duration-200",
                      radioValue === CUSTOM_OPTION_ID
                        ? "bg-primary/10 border-primary/50"
                        : "bg-transparent border-white/5 hover:bg-white/5"
                    )}>
                      <div className="pt-1">
                        <RadioGroupItem value={CUSTOM_OPTION_ID} className="border-primary text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label className="cursor-pointer text-sm font-normal text-muted-foreground">
                          Custom Answer
                        </Label>
                        {radioValue === CUSTOM_OPTION_ID && (
                          <Input
                            value={!isKnown && current !== CUSTOM_OPTION_ID ? (current || "") : ""}
                            placeholder="Type your answer..."
                            maxLength={200}
                            autoFocus
                            className="bg-black/20 border-white/10 text-sm focus-visible:ring-primary/50"
                            onKeyDown={(e) => { e.stopPropagation(); }}
                            onKeyUp={(e) => { e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); }}
                            onChange={(e) => {
                              const next = e.target.value;
                              onAnswer(q.id, next === "" ? CUSTOM_OPTION_ID : next);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
