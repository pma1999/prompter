"use client"

import { MODELS } from "@/lib/models";
import { ModelFamily, ModelId } from "@/domain/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ImageIcon, MessageSquare, VideoIcon } from "lucide-react";

const FAMILY_CONFIG = {
  text: {
    icon: MessageSquare,
    badgeClass: "bg-indigo-600 text-white",
    cardClass: "",
    ringClass: "ring-indigo-500",
    label: "Text"
  },
  image: {
    icon: ImageIcon,
    badgeClass: "bg-gradient-to-r from-orange-500 to-pink-600 text-white",
    cardClass: "bg-gradient-to-br from-orange-500/10 to-pink-500/10",
    ringClass: "ring-pink-500",
    label: "Image"
  },
  video: {
    icon: VideoIcon,
    badgeClass: "bg-gradient-to-r from-purple-600 to-blue-600 text-white",
    cardClass: "bg-gradient-to-br from-purple-500/10 to-blue-500/10",
    ringClass: "ring-purple-500",
    label: "Video"
  }
} as const;

export function ModelSwitch({ value, onChange }: { value: ModelId; onChange: (id: ModelId) => void }) {
  const selected = MODELS.find((m) => m.id === value)!;
  const family: ModelFamily = selected.family;
  
  // Group models by family
  const modelsByFamily = MODELS.reduce((acc, model) => {
    if (!acc[model.family]) {
      acc[model.family] = [];
    }
    acc[model.family].push(model);
    return acc;
  }, {} as Record<ModelFamily, typeof MODELS>);

  const families = Object.keys(modelsByFamily) as ModelFamily[];
  const config = FAMILY_CONFIG[family];
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="default" className={config.badgeClass}>
          <Icon className="mr-1 size-4" />
          {config.label}
        </Badge>
        <div className="text-sm text-muted-foreground">Choose the model family and variant</div>
      </div>
      <Tabs value={family} onValueChange={() => {}} className="w-full">
        <TabsList className={cn(
          "grid w-full",
          families.length === 2 && "grid-cols-2",
          families.length === 3 && "grid-cols-3"
        )}>
          {families.map((fam) => {
            const famConfig = FAMILY_CONFIG[fam];
            const FamIcon = famConfig.icon;
            const firstModel = modelsByFamily[fam][0];
            return (
              <TabsTrigger
                key={fam}
                value={fam}
                onClick={() => onChange(firstModel.id)}
                className="flex items-center gap-1.5"
              >
                <FamIcon className="size-4" />
                <span className="hidden sm:inline">{famConfig.label}</span>
                <span className="sm:hidden">{famConfig.label.slice(0, 1)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {families.map((fam) => {
          const famConfig = FAMILY_CONFIG[fam];
          const models = modelsByFamily[fam];
          return (
            <TabsContent key={fam} value={fam}>
              <div className="grid sm:grid-cols-2 gap-3">
                {models.map((m) => (
                  <Card
                    key={m.id}
                    className={cn(
                      "cursor-pointer transition",
                      famConfig.cardClass,
                      value === m.id && `ring-2 ${famConfig.ringClass}`
                    )}
                    onClick={() => onChange(m.id)}
                  >
                    <CardContent className="p-4 space-y-1">
                      <div className="font-medium">{m.label}</div>
                      <div className="text-sm text-muted-foreground">{m.description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
