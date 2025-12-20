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
    <div className="space-y-4 sm:space-y-6 pt-4 border-t border-white/5">
      {/* Header */}
      <div className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] sm:text-xs font-mono tracking-widest pl-1">
        <span className="text-primary">{"/// "}</span>
        <span className="hidden xs:inline">Clarification Required</span>
        <span className="xs:hidden">Clarify</span>
      </div>

      {/* Questions */}
      {questions.map((q, idx) => {
        const current: string = answers[q.id] ?? "";
        const knownIds = new Set(q.options.map((o) => o.id));
        const isKnown = current !== "" && knownIds.has(current);
        const hasCustomText = current !== "" && !knownIds.has(current) && current !== CUSTOM_OPTION_ID;
        const isCustomSelected = current === CUSTOM_OPTION_ID || hasCustomText;
        const radioValue = isKnown ? current : isCustomSelected ? CUSTOM_OPTION_ID : "";

        return (
          <div key={q.id} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg blur-sm" />
            <Card className="glass-panel border-l-2 border-l-primary/50 relative">
              {/* Card Header */}
              <CardHeader className="p-3 sm:pb-2 sm:p-4 bg-muted/5 border-b border-border/10 dark:bg-white/5 dark:border-white/5">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="font-mono text-[10px] sm:text-xs text-primary/70 mt-0.5 flex-shrink-0">
                    0{idx + 1}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 min-w-0">
                    <CardTitle className="text-xs sm:text-sm font-medium leading-relaxed">
                      {q.text}
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs hidden xs:block">
                      Select or provide an answer.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Card Content */}
              <CardContent className="p-3 sm:pt-3 sm:p-4">
                <RadioGroup
                  value={radioValue}
                  onValueChange={(v) => {
                    if (v === CUSTOM_OPTION_ID) {
                      if (!isKnown && current && current !== CUSTOM_OPTION_ID) {
                        onAnswer(q.id, current);
                      } else {
                        onAnswer(q.id, CUSTOM_OPTION_ID);
                      }
                    } else {
                      onAnswer(q.id, v);
                    }
                  }}
                >
                  <div className="grid gap-1.5 sm:gap-2">
                    {q.options.map((opt) => (
                      <Label
                        key={opt.id}
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded border cursor-pointer transition-all duration-200 group/label touch-target-sm",
                          radioValue === opt.id
                            ? "bg-primary/10 border-primary/50 text-foreground"
                            : "bg-transparent border-white/5 hover:bg-white/5 active:bg-white/10 text-muted-foreground"
                        )}
                      >
                        <RadioGroupItem
                          value={opt.id}
                          className="border-primary text-primary flex-shrink-0"
                        />
                        <span className="flex-1 text-xs sm:text-sm font-normal leading-snug">
                          {opt.label}
                        </span>
                        {opt.recommended && (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="ml-1 border-primary/30 text-primary bg-primary/5 text-[9px] sm:text-[10px] uppercase flex-shrink-0 px-1 sm:px-1.5"
                                >
                                  <span className="hidden xs:inline">Rec</span>
                                  <span className="xs:hidden">★</span>
                                </Badge>
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
                    <div
                      className={cn(
                        "flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded border transition-all duration-200",
                        radioValue === CUSTOM_OPTION_ID
                          ? "bg-primary/10 border-primary/50"
                          : "bg-transparent border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className="pt-0.5 sm:pt-1 flex-shrink-0">
                        <RadioGroupItem
                          value={CUSTOM_OPTION_ID}
                          className="border-primary text-primary"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                        <Label className="cursor-pointer text-xs sm:text-sm font-normal text-muted-foreground">
                          Custom Answer
                        </Label>
                        {radioValue === CUSTOM_OPTION_ID && (
                          <Input
                            value={!isKnown && current !== CUSTOM_OPTION_ID ? current || "" : ""}
                            placeholder="Type your answer..."
                            maxLength={200}
                            autoFocus
                            className="bg-black/20 border-white/10 text-xs sm:text-sm focus-visible:ring-primary/50 h-9 sm:h-10"
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
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
