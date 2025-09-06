"use client"

import { QuestionItem } from "@/domain/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        const value = answers[q.id] ?? "";
        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-sm">{q.text}</CardTitle>
              <CardDescription>Choose one option. Unanswered defaults to the recommended choice.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={value} onValueChange={(v) => onAnswer(q.id, v)}>
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
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
