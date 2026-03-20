// src/components/ui/AvatarUpload.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  currentImage?: string;
  name?: string;
  size?: number;
  onUpload: (url: string) => void;
}

export function AvatarUpload({ currentImage, name, size = 96, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      onUpload(data.url);
      toast.success("Profile photo updated!");
    } catch (err: any) {
      toast.error(err.message);
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const displayImage = preview || currentImage;
  const initials = name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative inline-block">
      <div
        className="rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 cursor-pointer"
        style={{ width: size, height: size }}
        onClick={() => fileRef.current?.click()}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt="Profile"
            width={size}
            height={size}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold"
            style={{ fontSize: size / 3 }}>
            {initials}
          </div>
        )}
      </div>

      {/* Upload overlay */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-gray-800 transition-colors"
      >
        {uploading
          ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          : <Camera className="w-3.5 h-3.5 text-white" />
        }
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}