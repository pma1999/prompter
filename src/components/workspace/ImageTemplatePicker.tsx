"use client"

import { Badge } from "@/components/ui/badge";

const templates: { id: string; label: string; scaffold: string }[] = [
  { id: "photorealistic", label: "Photorealistic", scaffold: "A photorealistic [shot type] of [subject], [action], set in [environment]. The scene is illuminated by [lighting], creating a [mood] atmosphere. Captured with a [camera/lens], emphasizing [key textures]. [Aspect ratio]." },
  { id: "sticker", label: "Sticker", scaffold: "A [style] sticker of a [subject], featuring [key characteristics] and a [color palette]. [line style] and [shading style]. Background must be transparent." },
  { id: "logo", label: "Logo/Text", scaffold: "Create a [image type] for [brand/concept] with the text \"[text]\" in a [font style]. The design should be [style], with a [color scheme]." },
  { id: "product", label: "Product", scaffold: "A high-resolution, studio-lit product photograph of a [product] on a [background]. Lighting: [setup] to [purpose]. Camera angle: [angle] to showcase [feature]. Ultra-realistic, sharp focus on [detail]. [Aspect ratio]." },
  { id: "minimalist", label: "Minimalist", scaffold: "A minimalist composition featuring a single [subject] positioned in the [position] of the frame. Background is a vast, empty [color] canvas, creating significant negative space. Soft, subtle lighting. [Aspect ratio]." },
  { id: "comic", label: "Comic Panel", scaffold: "A single comic book panel in a [art style]. Foreground: [character and action]. Background: [setting]. Include [dialogue/caption] with text \"[Text]\". Lighting creates a [mood] mood. [Aspect ratio]." },
];

export function ImageTemplatePicker({ onInsert }: { onInsert: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((t) => (
        <Badge key={t.id} variant="secondary" className="cursor-pointer" onClick={() => onInsert(t.scaffold)}>
          {t.label}
        </Badge>
      ))}
    </div>
  );
}
