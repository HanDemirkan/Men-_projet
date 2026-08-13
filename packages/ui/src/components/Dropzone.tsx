"use client";

import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import { cn } from "../lib/cn";

export interface DropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  previewUrl?: string | null;
  isUploading?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

// Presentational only - knows nothing about upload endpoints/services. The
// caller owns `previewUrl`/`isUploading` state and what `onFileSelected`
// does with the chosen file.
export function Dropzone({
  onFileSelected,
  accept = "image/png,image/jpeg,image/webp",
  previewUrl,
  isUploading = false,
  label = "Görsel yükle",
  hint = "PNG, JPEG veya WEBP - sürükleyip bırakın ya da tıklayın",
  className,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (files: FileList | null): void => {
    const file = files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOver(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30",
        isDragOver && "border-primary bg-primary/5",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleInputChange}
        aria-label={label}
      />

      {previewUrl ? (
        // Generic UI package (no Next.js dependency here) - `next/image` isn't available.
        <img
          src={previewUrl}
          alt=""
          className="absolute inset-0 h-full w-full rounded-lg object-cover"
        />
      ) : null}

      <div
        className={cn(
          "relative z-10 flex flex-col items-center gap-2",
          previewUrl && "rounded-md bg-background/90 px-4 py-3",
        )}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-foreground">{isUploading ? "Yükleniyor..." : label}</p>
        {!isUploading ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>

      {!previewUrl && !isUploading ? (
        <ImagePlus className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
      ) : null}
    </div>
  );
}
