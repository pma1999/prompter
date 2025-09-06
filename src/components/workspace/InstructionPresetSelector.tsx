"use client"

import { INSTRUCTION_PRESETS } from "@/lib/instructionPresets";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function InstructionPresetSelector({ value, onChange, family }: { value: string; onChange: (id: string) => void; family: "text" | "image" }) {
  const options = INSTRUCTION_PRESETS.filter((p) => p.family === family || p.family === "any");
  return (
    <RadioGroup value={value} onValueChange={onChange} className="grid gap-2">
      {options.map((p) => (
        <Card key={p.id} className="p-3 cursor-pointer" onClick={() => onChange(p.id)}>
          <CardHeader className="p-0 space-y-1">
            <div className="flex items-center gap-2">
              <RadioGroupItem id={`preset-${p.id}`} value={p.id} />
              <Label htmlFor={`preset-${p.id}`} className="font-medium cursor-pointer">{p.label}</Label>
            </div>
            <CardTitle className="sr-only">{p.label}</CardTitle>
            <CardDescription>{p.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </RadioGroup>
  );
}
