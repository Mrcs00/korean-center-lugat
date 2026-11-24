"use client";

import { useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ALLOWED_EXT, removeFiles, signedUrl, uploadFiles, validateFile } from "@/lib/platform/api";
import { fileSizeLabel } from "@/lib/platform/format";
import type { FileRef } from "@/lib/platform/types";
import { useToast } from "./Toast";

const isImage = (f: FileRef) => (f.type ?? "").startsWith("image/");

/** Opens a stored file in a new tab through a short-lived private link. */
export async function openStoredFile(path: string): Promise<void> {
  const url = await signedUrl(path);
  window.open(url, "_blank", "noopener");
}

export function FileList({ files, onRemove }: { files: FileRef[]; onRemove?: (f: FileRef) => void }) {
  const toast = useToast();
  if (files.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {files.map((f) => (
        <li key={f.path} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
          {isImage(f) ? <ImageIcon size={18} className="text-muted shrink-0" /> : <FileText size={18} className="text-muted shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{f.name}</p>
            {f.size ? <p className="text-[11px] text-muted-soft">{fileSizeLabel(f.size)}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => openStoredFile(f.path).catch((e: Error) => toast.error(e.message))}
            aria-label="Ochish"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:bg-black/[0.05]"
          >
            <Download size={16} />
          </button>
          {onRemove && (
            <button type="button" onClick={() => onRemove(f)} aria-label="Olib tashlash" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-red hover:bg-red-soft">
              <X size={16} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

// Upload files (documents, photos, audio) to the private bucket right away.
export function FileUploader({
  value,
  onChange,
  prefix,
  disabled,
  label = "Fayl yoki rasm qo'shish",
}: {
  value: FileRef[];
  onChange: (files: FileRef[]) => void;
  prefix: string; // storage folder, e.g. "sub/<homeworkId>/<studentId>"
  disabled?: boolean;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const pick = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const problem = files.map(validateFile).find(Boolean);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadFiles(prefix, files);
      onChange([...value, ...uploaded]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async (f: FileRef) => {
    onChange(value.filter((x) => x.path !== f.path));
    void removeFiles([f.path]); // best effort; the database rules decide if it is allowed
  };

  return (
    <div className="flex flex-col gap-2.5">
      <FileList files={value} onRemove={disabled ? undefined : remove} />
      {!disabled && (
        <div>
          <input ref={input} type="file" multiple hidden accept={ALLOWED_EXT.map((e) => `.${e}`).join(",")} onChange={(e) => pick(e.target.files)} />
          <Button type="button" variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />} {busy ? "Yuklanmoqda..." : label}
          </Button>
          <p className="text-[11px] text-muted-soft mt-1.5">Har bir fayl 10 MB gacha (PDF, rasm, Word, Excel, audio...).</p>
        </div>
      )}
    </div>
  );
}
