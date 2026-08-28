"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Upload, Video, X } from "lucide-react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface CampaignMediaStepProps {
  image: File | null;
  onImageChange: (image: File | null) => void;
  existingImageUrl?: string | null;
  onExistingImageRemove?: () => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  lang: "he" | "en";
}

export default function CampaignMediaStep({ image, onImageChange, existingImageUrl, onExistingImageRemove, videoUrl, onVideoUrlChange, lang }: CampaignMediaStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const previewUrl = useMemo(() => image ? URL.createObjectURL(image) : "", [image]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseImage(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type)) {
      setError(lang === "en" ? "Choose a JPG, PNG, or WebP image." : "יש לבחור תמונת JPG, PNG או WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(lang === "en" ? "The image must be smaller than 5 MB." : "התמונה חייבת להיות קטנה מ־5MB.");
      return;
    }
    onImageChange(file);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <h2 className="font-bold text-gray-700">{lang === "en" ? "Campaign image and video" : "תמונות וסרטוני קמפיין"}</h2>
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center transition-colors hover:border-raz-teal md:p-8">
        {previewUrl || existingImageUrl ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
            {/* Blob and persisted remote previews are intentionally rendered without image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl || existingImageUrl || ""} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => image ? onImageChange(null) : onExistingImageRemove?.()} className="micro-hint micro-hint-below absolute top-2 end-2 rounded-full bg-black/60 text-white p-1.5" aria-label={lang === "en" ? "Remove image" : "הסר תמונה"}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <ImageIcon size={36} className="text-gray-300" />
        )}
        <div>
          <p className="font-medium text-gray-600 text-sm">{lang === "en" ? "Header image" : "תמונת כותרת"}</p>
          <p className="text-xs text-gray-400">{lang === "en" ? "16:9 recommended · JPG, PNG, WebP · up to 5 MB" : "מומלץ 16:9 · JPG, PNG, WebP · עד 5MB"}</p>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseImage(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="bg-raz-teal text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
          <Upload size={16} />
          {image || existingImageUrl ? (lang === "en" ? "Replace image" : "החלף תמונה") : (lang === "en" ? "Upload image" : "העלה תמונה")}
        </button>
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      </div>
      <label className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
        <Video size={22} className="text-raz-teal flex-shrink-0" />
        <span className="flex-1">
          <span className="text-sm font-medium text-gray-700 mb-1 block">{lang === "en" ? "Video link" : "קישור לסרטון"}</span>
          <input value={videoUrl} onChange={(event) => onVideoUrlChange(event.target.value)} placeholder="YouTube, Vimeo, or direct HTTPS video URL" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-raz-teal text-left" dir="ltr" inputMode="url" />
        </span>
      </label>
    </div>
  );
}
