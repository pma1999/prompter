"use client"

import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, X, ImagePlus, Trash2 } from "lucide-react";
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

function estimateBase64Bytes(dataUri: string): number {
  const base64 = dataUri.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function compressImageToJpegDataUri(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<string> {
  try {
    const bmp = await createImageBitmap(file).catch(() => undefined);
    if (bmp) {
      const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unsupported");
      ctx.drawImage(bmp, 0, 0, w, h);
      const out = canvas.toDataURL("image/jpeg", quality);
      try {
        bmp.close();
      } catch {}
      return out;
    }
  } catch {}

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unsupported");
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL("image/jpeg", quality);
        URL.revokeObjectURL(url);
        resolve(out);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    img.src = url;
  });
}

export function ImageReferenceUploader({
  assets,
  onChangeAssets,
}: ImageReferenceUploaderProps) {
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
        let dataUri: string | undefined;
        if (file.type === "image/heic" || file.type === "image/heif") {
          if (file.size > 6 * 1024 * 1024) {
            toast.error(
              "HEIC/HEIF image too large; please convert to JPEG/PNG or choose a smaller file."
            );
            continue;
          }
          dataUri = await fileToDataUri(file);
        } else {
          dataUri = await compressImageToJpegDataUri(file);
        }
        const estBytes = estimateBase64Bytes(dataUri);
        newAssets.push({
          id: crypto.randomUUID(),
          name: file.name,
          mimeType:
            file.type === "image/heic" || file.type === "image/heif"
              ? file.type
              : "image/jpeg",
          sizeBytes: estBytes,
          source: "uploaded",
          dataUri,
        });
      } catch {
        toast.error(`Failed to load ${file.name}`);
      }
    }

    const combined = [...assets, ...newAssets];
    const totalBytes = combined.reduce((s, a) => s + (a.sizeBytes || 0), 0);
    const MAX_INLINE_BYTES = 4 * 1024 * 1024;
    if (totalBytes > MAX_INLINE_BYTES) {
      const trimmed: AssetRef[] = [];
      let acc = 0;
      for (const a of combined) {
        const sz = a.sizeBytes || 0;
        if (acc + sz > MAX_INLINE_BYTES) break;
        trimmed.push(a);
        acc += sz;
      }
      if (trimmed.length === 0) {
        toast.error("Images too large after compression. Please use smaller images.");
        return;
      }
      toast.message("Images trimmed to fit upload limit (~4MB).");
      onChangeAssets(trimmed);
      return;
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
    <div className="glass-panel border-l-2 border-l-primary/30 p-0.5 sm:p-1 relative overflow-hidden transition-all duration-300 rounded-lg">
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
          e.currentTarget.value = "";
        }}
      />

      {assets.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 hover:bg-white/5 active:bg-white/10 transition-colors group touch-target rounded-lg"
        >
          <div className="size-8 sm:size-10 rounded-full border border-dashed border-white/20 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary bg-black/20 transition-colors">
            <ImagePlus className="size-4 sm:size-5" />
          </div>
          <div className="text-left">
            <div className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              Add Reference Images
            </div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground">
              Up to 4 images (max 4MB)
            </div>
          </div>
        </button>
      ) : (
        <div className="p-2 sm:p-3 bg-black/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Refs ({assets.length}/4)
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-6 sm:h-7 px-2 text-[9px] sm:text-[10px] hover:text-primary gap-1"
              >
                <Plus className="size-3" />
                <span className="hidden xs:inline">ADD</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 sm:h-7 px-2 text-[9px] sm:text-[10px] hover:text-destructive gap-1"
              >
                <Trash2 className="size-3" />
                <span className="hidden xs:inline">CLEAR</span>
              </Button>
            </div>
          </div>

          {/* Grid - responsive columns */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {assets.map((a) => (
              <div
                key={a.id || a.name}
                className="relative group/img aspect-square border border-white/10 rounded overflow-hidden bg-black"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={a.name}
                  src={a.dataUri || a.url}
                  className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity"
                />
                <button
                  className="absolute top-1 right-1 size-6 sm:size-5 bg-black/80 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 group-hover/img:opacity-100 transition-opacity border border-white/20 hover:border-red-500 hover:text-red-500 touch-target-sm"
                  onClick={() => handleRemove(a.id)}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
