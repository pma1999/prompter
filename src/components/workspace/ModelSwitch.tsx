"use client"

import { MODELS } from "@/lib/models";
import { ModelFamily, ModelId } from "@/domain/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ImageIcon, MessageSquare } from "lucide-react";

export function ModelSwitch({ value, onChange }: { value: ModelId; onChange: (id: ModelId) => void }) {
  const selected = MODELS.find((m) => m.id === value)!;
  const family: ModelFamily = selected.family;
  const textModels = MODELS.filter((m) => m.family === "text");
  const imageModels = MODELS.filter((m) => m.family === "image");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {family === "text" ? (
          <Badge variant="default" className="bg-indigo-600 text-white"><MessageSquare className="mr-1 size-4" /> Text</Badge>
        ) : (
          <Badge variant="default" className="bg-gradient-to-r from-orange-500 to-pink-600 text-white"><ImageIcon className="mr-1 size-4" /> Image</Badge>
        )}
        <div className="text-sm text-muted-foreground">Choose the model family and variant</div>
      </div>
      <Tabs value={family} onValueChange={() => {}} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="text" onClick={() => onChange(textModels[0].id)}>Text</TabsTrigger>
          <TabsTrigger value="image" onClick={() => onChange(imageModels[0].id)}>Image</TabsTrigger>
        </TabsList>
        <TabsContent value="text">
          <div className="grid sm:grid-cols-2 gap-3">
            {textModels.map((m) => (
              <Card key={m.id} className={cn("cursor-pointer transition", value === m.id && "ring-2 ring-indigo-500")} onClick={() => onChange(m.id)}>
                <CardContent className="p-4 space-y-1">
                  <div className="font-medium">{m.label}</div>
                  <div className="text-sm text-muted-foreground">{m.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="image">
          <div className="grid sm:grid-cols-2 gap-3">
            {imageModels.map((m) => (
              <Card key={m.id} className={cn("cursor-pointer transition bg-gradient-to-br from-orange-500/10 to-pink-500/10", value === m.id && "ring-2 ring-pink-500") } onClick={() => onChange(m.id)}>
                <CardContent className="p-4 space-y-1">
                  <div className="font-medium">{m.label}</div>
                  <div className="text-sm text-muted-foreground">{m.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
