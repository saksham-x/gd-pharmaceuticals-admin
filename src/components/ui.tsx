import { useRef, useState, type ReactNode } from "react";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "../services/base/api";
import LoadingSpinner from "./LoadingSpinner";

// ========================================
// SHARED UI
//
// Small pieces every staff portal page
// uses, styled after the staff portal in
// the design (breadcrumb, heading row,
// status pills, panels).
// ========================================

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-[#1266B1] focus:ring-3 focus:ring-[#1266B1]/12 disabled:cursor-not-allowed disabled:opacity-60";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#1266B1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e5698] disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-[#1266B1] transition hover:border-[#1266B1] hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50";

export const panelClass = "rounded-xl border border-line bg-surface";

// ========================================
// PAGE HEADER
// "G.D. Admin / Enquiries" over the title,
// with the page's main action on the right.
// ========================================

export function PageHeader({
  crumb,
  title,
  description,
  action,
}: {
  crumb: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <>
      <div className="text-[11px] text-muted">G.D. Admin / {crumb}</div>
      <div className="mt-1.5 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] font-medium tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
    </>
  );
}

// ========================================
// STATUS PILL
// ========================================

const TONES = {
  blue: "bg-[#eaf5ff] text-[#1266B1] dark:bg-[#1266B1]/25 dark:text-[#8cc4f5]",
  green: "bg-[#eaf8f1] text-[#147d64] dark:bg-[#147d64]/30 dark:text-[#86efac]",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-800",
  grey: "border border-line bg-soft text-muted",
  red: "bg-red-50 text-red-700",
} as const;

export type Tone = keyof typeof TONES;

export function Pill({ tone = "grey", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-md px-2 py-[3px] text-[10.5px] font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

// ========================================
// TOGGLE
// A labelled switch for yes/no fields.
// ========================================

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-soft px-3.5 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#1266B1]"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

// ========================================
// UPLOAD FIELD
// A URL box with an Upload button beside
// it: staff can paste a link or upload a
// file. Shows a preview for images.
// ========================================

export function UploadField({
  value,
  onChange,
  upload,
  accept,
  placeholder,
  preview,
}: {
  value: string;
  onChange: (url: string) => void;
  upload: (file: File) => Promise<string>;
  accept: string;
  placeholder?: string;
  // Image shown when the value is blank,
  // e.g. the photo the website ships with.
  preview?: { fallback?: string } | false;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      setUploading(true);
      onChange(await upload(file));
      toast.success("Uploaded");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Upload failed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const shown = value || (preview ? preview.fallback : "");

  return (
    <div>
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" className={secondaryButton} disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <LoadingSpinner size="sm" /> : "Upload"}
        </button>
        {value && (
          <button type="button" className={secondaryButton} onClick={() => onChange("")} aria-label="Clear">
            ×
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => pick(event.target.files?.[0])}
      />
      {preview !== false && preview && shown && (
        <div className="mt-2 flex items-center gap-3">
          <img src={shown} alt="" className="h-16 w-24 rounded-md border border-line object-cover" />
          {!value && <span className="text-xs text-muted">Using the photo the website ships with</span>}
        </div>
      )}
    </div>
  );
}

// "31 May 2026"
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  });
}

// "12 Jun, 10:42"
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kathmandu",
  });
}

// "2026-10-14" for <input type="date">,
// on Nepal's calendar day.
export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
