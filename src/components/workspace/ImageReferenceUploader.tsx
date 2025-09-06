"use client"

import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AssetRef } from "@/domain/types";

interface ImageReferenceUploaderProps {
  assets: AssetRef[];
  onChangeAssets: (assets: AssetRef[]) => void;
}

const ACCEPTED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function ImageReferenceUploader({ assets, onChangeAssets }: ImageReferenceUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleAddFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const current = assets.length;
    const max = 4;
    const remaining = Math.max(0, max - current);
    const selected = Array.from(files).slice(0, remaining);

    const invalid = selected.filter((f) => !ACCEPTED_MIME.has(f.type));
    if (invalid.length) {
      toast.error("Unsupported image type. Use PNG, JPEG, WEBP, HEIC/HEIF.");
      return;
    }

    const newAssets: AssetRef[] = [];
    for (const file of selected) {
      try {
        const dataUri = await fileToDataUri(file);
        newAssets.push({
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          source: "uploaded",
          dataUri,
        });
      } catch {
        toast.error(`Failed to load ${file.name}`);
      }
    }

    const combined = [...assets, ...newAssets];
    const totalBytes = combined.reduce((s, a) => s + (a.sizeBytes || 0), 0);
    if (totalBytes > 18 * 1024 * 1024) {
      toast.warning("Total images exceed ~18MB. Consider fewer/smaller images.");
    }
    onChangeAssets(combined);
  }

  function handleRemove(id: string | undefined) {
    if (!id) return;
    onChangeAssets(assets.filter((a) => a.id !== id));
  }

  function handleClear() {
    onChangeAssets([]);
  }

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="text-base">Reference Images (optional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              className="hidden"
              multiple
              onChange={(e) => {
                const files = e.currentTarget.files;
                void handleAddFiles(files);
                // Reset input value so selecting the same file again triggers change
                e.currentTarget.value = "";
              }}
            />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Add images
            </Button>
            {assets.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {assets.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {assets.map((a) => (
              <div key={a.id || a.name} className="relative group border rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={a.name}
                  src={a.dataUri || a.url}
                  className="h-28 w-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 flex justify-between p-1 text-[10px] bg-gradient-to-b from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition">
                  <span className="truncate max-w-[70%]">{a.name}</span>
                  <button
                    className="px-1 rounded bg-black/60 hover:bg-black/80"
                    onClick={() => handleRemove(a.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Attach 1–4 images to ground or edit. Supported: PNG, JPEG, WEBP, HEIC/HEIF. Max ~20MB total.
        </p>
      </CardContent>
    </Card>
  );
}


