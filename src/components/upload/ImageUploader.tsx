// src/components/upload/ImageUploader.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Upload, X, Star, Loader2, ImagePlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

interface Props {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({ value, onChange, maxImages = 8 }: Props) {
  const [uploading, setUploading] = useState<string[]>([]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const id = `${file.name}-${Date.now()}`;
    setUploading((prev) => [...prev, id]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");
      return data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
      return null;
    } finally {
      setUploading((prev) => prev.filter((i) => i !== id));
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = maxImages - value.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const files = acceptedFiles.slice(0, remaining);
      const results = await Promise.all(files.map(uploadFile));
      const newImages: UploadedImage[] = results
        .filter(Boolean)
        .map((url, i) => ({
          url: url!,
          alt: "",
          isPrimary: value.length === 0 && i === 0,
        }));

      onChange([...value, ...newImages]);
    },
    [value, onChange, maxImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".avif"] },
    maxSize: 5 * 1024 * 1024,
    disabled: value.length >= maxImages || uploading.length > 0,
  });

  function removeImage(idx: number) {
    const updated = value.filter((_, i) => i !== idx);
    // Re-assign primary if removed
    if (value[idx].isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  }

  function setPrimary(idx: number) {
    onChange(value.map((img, i) => ({ ...img, isPrimary: i === idx })));
  }

  function updateAlt(idx: number, alt: string) {
    onChange(value.map((img, i) => (i === idx ? { ...img, alt } : img)));
  }

  const isUploading = uploading.length > 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {value.length < maxImages && (
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-purple-500/60 bg-purple-500/10 scale-[1.01]"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            ) : (
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                isDragActive ? "bg-purple-500/20" : "bg-white/5"
              )}>
                <ImagePlus className={cn("w-6 h-6", isDragActive ? "text-purple-400" : "text-white/30")} />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white/70">
                {isUploading
                  ? `Uploading ${uploading.length} image${uploading.length > 1 ? "s" : ""}...`
                  : isDragActive
                  ? "Drop to upload"
                  : "Drag & drop images here"}
              </p>
              {!isUploading && (
                <p className="text-xs text-white/30 mt-1">
                  or <span className="text-purple-400 underline">browse</span> · PNG, JPG, WebP up to 5MB · {value.length}/{maxImages} used
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((img, idx) => (
            <div key={img.url} className="group relative">
              <div className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                img.isPrimary ? "border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]" : "border-white/10"
              )}>
                <Image src={img.url} alt={img.alt || ""} fill className="object-cover" sizes="200px" />

                {/* Primary badge */}
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5" /> Primary
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className="p-2 bg-purple-500 rounded-lg text-white hover:bg-purple-600 transition-colors"
                      title="Set as primary"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-2 bg-red-500/80 rounded-lg text-white hover:bg-red-500 transition-colors"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alt text input */}
              <input
                type="text"
                placeholder="Alt text..."
                value={img.alt || ""}
                onChange={(e) => updateAlt(idx, e.target.value)}
                className="mt-1.5 w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white/60 placeholder:text-white/20 outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !isUploading && (
        <div className="flex items-center gap-2 text-xs text-white/30">
          <AlertCircle className="w-3.5 h-3.5" />
          At least one product image is required
        </div>
      )}
    </div>
  );
}
