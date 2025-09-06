"use client"

import { QuestionItem } from "@/domain/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { CUSTOM_OPTION_ID } from "@/domain/clarifications";

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
    <div className="space-y-3">
      {questions.map((q) => {
        const current: string = answers[q.id] ?? "";
        const knownIds = new Set(q.options.map((o) => o.id));
        const isKnown = current !== "" && knownIds.has(current);
        const hasCustomText = current !== "" && !knownIds.has(current) && current !== CUSTOM_OPTION_ID;
        const isCustomSelected = current === CUSTOM_OPTION_ID || hasCustomText;
        const radioValue = isKnown ? current : (isCustomSelected ? CUSTOM_OPTION_ID : "");
        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-sm">{q.text}</CardTitle>
              <CardDescription>Choose one option or write your own. Unanswered defaults to the recommended choice.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={radioValue} onValueChange={(v) => {
                if (v === CUSTOM_OPTION_ID) {
                  // Selecting custom: if there's already custom text, keep it; else mark sentinel
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
                    <Label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value={opt.id} />
                      <span>{opt.label}</span>
                      {opt.recommended && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="ml-1">Recommended</Badge>
                            </TooltipTrigger>
                            {opt.why && (
                              <TooltipContent>
                                <p className="max-w-[280px] text-xs">{opt.why}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </Label>
                  ))}
                  {/* Custom free-text option */}
                  <div className="flex items-start gap-2">
                    <div className="pt-1">
                      <RadioGroupItem value={CUSTOM_OPTION_ID} />
                    </div>
                    <div className="flex-1">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <span>Other (write your own)</span>
                      </Label>
                      {radioValue === CUSTOM_OPTION_ID && (
                        <div className="mt-2">
                          <Input
                            value={!isKnown && current !== CUSTOM_OPTION_ID ? (current || "") : ""}
                            placeholder="Write your own answer..."
                            maxLength={200}
                            autoFocus
                            onKeyDown={(e) => { e.stopPropagation(); }}
                            onKeyUp={(e) => { e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); }}
                            onChange={(e) => {
                              const next = e.target.value;
                              if (next === "") {
                                onAnswer(q.id, CUSTOM_OPTION_ID);
                              } else {
                                onAnswer(q.id, next);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
