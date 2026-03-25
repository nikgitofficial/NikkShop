// src/components/upload/ImageUploader.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { X, Star, Loader2, ImagePlus, AlertCircle } from "lucide-react";
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
              ? "border-black/40 bg-gray-100 scale-[1.01]"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
            ) : (
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                isDragActive ? "bg-gray-200" : "bg-gray-100"
              )}>
                <ImagePlus className={cn("w-6 h-6", isDragActive ? "text-gray-700" : "text-gray-400")} />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isUploading
                  ? `Uploading ${uploading.length} image${uploading.length > 1 ? "s" : ""}...`
                  : isDragActive
                  ? "Drop to upload"
                  : "Drag & drop images here"}
              </p>
              {!isUploading && (
                <p className="text-xs text-gray-400 mt-1">
                  or <span className="text-black underline cursor-pointer">browse</span> · PNG, JPG, WebP up to 5MB · {value.length}/{maxImages} used
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
                img.isPrimary ? "border-black shadow-md" : "border-gray-200"
              )}>
                <Image src={img.url} alt={img.alt || ""} fill className="object-cover" sizes="200px" />

                {/* Primary badge */}
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5" /> Primary
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className="p-2 bg-white rounded-lg text-gray-800 hover:bg-gray-100 transition-colors"
                      title="Set as primary"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
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
                className="mt-1.5 w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 placeholder:text-gray-300 outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !isUploading && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <AlertCircle className="w-3.5 h-3.5" />
          At least one product image is required
        </div>
      )}
    </div>
  );
}