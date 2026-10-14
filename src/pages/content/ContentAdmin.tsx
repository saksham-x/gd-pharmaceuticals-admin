import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ArrowDown, ArrowUp, ExternalLink, Plus, RotateCcw, Trash2 } from "lucide-react";

import DialogBox from "../../components/DialogBox";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PageHeader, Toggle, UploadField, inputClass, panelClass, primaryButton, secondaryButton } from "../../components/ui";
import { appConfig } from "../../config/appConfig";
import { usePermissions } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/base/api";
import {
  getSiteContent,
  resetSection,
  saveSection,
  type ContentSection,
  type ContentValue,
  type SiteContent,
} from "../../services/content/contentService";
import { uploadDocument, uploadImage } from "../../services/upload/uploadService";

// ========================================
// WEBSITE CONTENT
//
// One tab per website page. The form is
// drawn from the shape of the API's
// default content, so a field added there
// shows up here without code changes:
// text → input, multi-line text →
// textarea, yes/no → switch, list → rows,
// list of cards → repeatable cards.
// ========================================

const TABS: { key: string; label: string; page: string; description: string }[] = [
  { key: "general", label: "General", page: "/", description: "Logo text, footer and contact details." },
  { key: "images", label: "Photos", page: "/", description: "Leave a photo blank to use the one the website ships with." },
  { key: "home", label: "Home", page: "/", description: "Hero, highlights strip and the home page sections." },
  { key: "about", label: "About", page: "/about", description: "Company story and values." },
  { key: "quality", label: "Quality", page: "/quality", description: "Process steps (also on the home page) and certificates." },
  { key: "products", label: "Products", page: "/products", description: "Catalogue page heading. Products themselves are on the Products page." },
  { key: "news", label: "News", page: "/news", description: "News & Events heading. News items are added under Notices & News." },
  { key: "careers", label: "Careers", page: "/careers", description: "Careers page copy. Roles are added under Careers." },
  { key: "investors", label: "Investors", page: "/investors", description: "Investor relations heading and empty-tab messages." },
  { key: "contact", label: "Contact", page: "/contact", description: "Contact page copy and the message shown after sending." },
];

// Clearer names than the field keys give.
const LABELS: Record<string, string> = {
  head: "Page header",
  brandName: "Logo name",
  brandTagline: "Logo tagline",
  footerText: "Footer text",
  address: "Footer address",
  officeAddress: "Head office address (Contact page)",
  contactPendingText: "Shown while phone and email are blank",
  notificationEmail: "Email new enquiries to",
  proof: "Hero highlights",
  floatLabel: "Photo card label",
  floatTitle: "Photo card title",
  ticker: "Highlights strip",
  aboutParagraphs: "Who we are — paragraphs",
  photoNote: "Photo note",
  photoTag: "Photo caption",
  ipoStatus: "Status pill under the notice",
  storyParagraphs: "Story paragraphs",
  pendingNote: "Status pill under the story",
  steps: "Process steps",
  certificates: "Certificates",
  fileUrl: "Certificate file",
  status: "Status pill",
  why: "Why join us — cards",
  chip: "Second chip",
  successText: "Message after sending",
  formNote: "Note under the button",
  noRolesText: "When no roles match",
};

const HINTS: Record<string, string> = {
  notificationEmail: "staff only — never shown on the website",
  contactPendingText: "blank hides it",
  ipoStatus: "blank hides it",
  pendingNote: "blank hides it",
  photoTag: "blank hides it",
  photoNote: "blank hides it",
  status: "blank hides it",
  successText: "{name} and {reference} are filled in",
  fileUrl: "blank keeps “View certificate” disabled",
};

const SITE_IMAGES: Record<string, string> = {
  hero: "hero",
  lab: "lab",
  quality: "quality",
  about: "about",
  careers: "careers",
  news: "about",
};

// "heroEyebrow" → "Hero eyebrow"
const humanize = (key: string) => {
  const words = key.replace(/([A-Z])/g, " $1").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const labelFor = (key: string) => LABELS[key] ?? humanize(key);

// Titles keep their line breaks, so they
// get a box tall enough to type one.
const isMultiline = (key: string, example: string) =>
  example.includes("\n") || example.length > 90 || /title|lead|paragraph|summary/i.test(key);

// A blank entry shaped like the default's
// first entry, for "Add".
function blankLike(value: ContentValue): ContentValue {
  if (typeof value === "string") return "";
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return [];
  return Object.fromEntries(Object.entries(value).map(([key, field]) => [key, blankLike(field)]));
}

// ========================================
// FIELD
// ========================================

type FieldProps = {
  name: string;
  value: ContentValue;
  example: ContentValue;
  onChange: (value: ContentValue) => void;
  disabled: boolean;
  section: string;
};

function Field({ name, value, example, onChange, disabled, section }: FieldProps) {
  const label = labelFor(name);
  const hint = HINTS[name];

  // Yes / no
  if (typeof example === "boolean") {
    return <Toggle checked={Boolean(value)} onChange={onChange} label={label} hint={hint} />;
  }

  // Text
  if (typeof example === "string") {
    const text = typeof value === "string" ? value : "";

    if (section === "images" || name === "fileUrl") {
      const isImage = section === "images";
      return (
        <div>
          <span className="mb-2 block text-sm font-medium text-ink">
            {label} {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
          </span>
          <UploadField
            value={text}
            onChange={onChange}
            upload={isImage ? uploadImage : uploadDocument}
            accept={isImage ? "image/*" : "application/pdf"}
            placeholder={isImage ? "https://… or upload a photo" : "https://… or upload a PDF"}
            preview={isImage ? { fallback: `${appConfig.siteUrl}/images/${SITE_IMAGES[name] ?? "hero"}.webp` } : false}
          />
        </div>
      );
    }

    const multiline = isMultiline(name, example);
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink">
          {label}{" "}
          {(hint || (multiline && example.includes("\n"))) && (
            <span className="text-xs font-normal text-muted">{hint ?? "press Enter where the line should break"}</span>
          )}
        </span>
        {multiline ? (
          <textarea
            className={`${inputClass} min-h-[72px] leading-relaxed`}
            rows={Math.min(6, Math.max(2, Math.ceil(text.length / 90) + text.split("\n").length - 1))}
            value={text}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <input className={inputClass} value={text} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
        )}
      </label>
    );
  }

  // List
  if (Array.isArray(example)) {
    const list = Array.isArray(value) ? value : [];
    const template = example[0] ?? "";
    const isCards = typeof template === "object" && !Array.isArray(template);

    const update = (index: number, item: ContentValue) => onChange(list.map((current, i) => (i === index ? item : current)));
    const remove = (index: number) => onChange(list.filter((_, i) => i !== index));
    const move = (index: number, by: number) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      onChange(next);
    };

    const controls = (index: number) =>
      !disabled && (
        <span className="flex shrink-0 gap-1">
          <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="rounded-md p-1.5 text-muted hover:bg-soft disabled:opacity-30">
            <ArrowUp className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Move down" disabled={index === list.length - 1} onClick={() => move(index, 1)} className="rounded-md p-1.5 text-muted hover:bg-soft disabled:opacity-30">
            <ArrowDown className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Remove" onClick={() => remove(index)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </span>
      );

    return (
      <div>
        <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
        <div className="space-y-2">
          {list.map((item, index) =>
            isCards ? (
              <div key={index} className="rounded-xl border border-line bg-soft p-3">
                <div className="mb-2 flex items-center justify-between">
                  <small className="text-xs font-bold text-[#147d64]">{String(index + 1).padStart(2, "0")}</small>
                  {controls(index)}
                </div>
                <div className="grid gap-3">
                  {Object.entries(template as ContentSection).map(([key, fieldExample]) => (
                    <Field
                      key={key}
                      name={key}
                      example={fieldExample}
                      value={(item as ContentSection)[key] ?? blankLike(fieldExample)}
                      onChange={(fieldValue) => update(index, { ...(item as ContentSection), [key]: fieldValue })}
                      disabled={disabled}
                      section={section}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div key={index} className="flex items-center gap-2">
                <input className={inputClass} value={String(item)} disabled={disabled} onChange={(event) => update(index, event.target.value)} />
                {controls(index)}
              </div>
            )
          )}
        </div>
        {!disabled && (
          <button type="button" className={`${secondaryButton} mt-2 py-2 text-xs`} onClick={() => onChange([...list, blankLike(template)])}>
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>
    );
  }

  // Group, e.g. the page header
  const group = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as ContentSection;
  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="px-1.5 text-xs font-bold tracking-[1.2px] text-[#147d64] uppercase">{label}</legend>
      <div className="grid gap-4">
        {Object.entries(example).map(([key, fieldExample]) => (
          <Field
            key={key}
            name={key}
            example={fieldExample}
            value={group[key] ?? fieldExample}
            onChange={(fieldValue) => onChange({ ...group, [key]: fieldValue })}
            disabled={disabled}
            section={section}
          />
        ))}
      </div>
    </fieldset>
  );
}

// ========================================
// PAGE
// ========================================

export default function ContentAdmin() {
  const allowed = usePermissions("content");

  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [defaults, setDefaults] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [tab, setTab] = useState(TABS[0].key);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    getSiteContent()
      .then(({ content, defaults: launch }) => {
        setSaved(content);
        setDraft(content);
        setDefaults(launch);
      })
      .catch((error) => toast.error(getApiErrorMessage(error, "Failed to load website content")));
  }, []);

  const dirtyTabs = useMemo(
    () => new Set(TABS.filter((item) => saved && draft && JSON.stringify(saved[item.key]) !== JSON.stringify(draft[item.key])).map((item) => item.key)),
    [saved, draft]
  );

  if (!draft || !defaults || !saved) {
    return (
      <>
        <PageHeader crumb="Website content" title="Website content" />
        <div className="flex justify-center py-20 text-[#1266B1]">
          <LoadingSpinner size="lg" label="Loading" />
        </div>
      </>
    );
  }

  const active = TABS.find((item) => item.key === tab) ?? TABS[0];
  const example = defaults[tab];
  const section = draft[tab];

  const save = async () => {
    try {
      setSaving(true);
      const content = await saveSection(tab, section);
      setSaved(content);
      setDraft((current) => ({ ...(current ?? content), [tab]: content[tab] }));
      toast.success(`${active.label} saved — the website shows it now`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save"));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    try {
      setSaving(true);
      const content = await resetSection(tab);
      setSaved(content);
      setDraft((current) => ({ ...(current ?? content), [tab]: content[tab] }));
      toast.success(`${active.label} restored to the launch text`);
      setConfirmReset(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to reset"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        crumb="Website content"
        title="Website content"
        description="The text and photos on every page of the website. Each tab saves on its own."
        action={
          <a className={secondaryButton} href={`${appConfig.siteUrl}${active.page}`} target="_blank" rel="noopener noreferrer">
            View page <ExternalLink className="h-4 w-4" />
          </a>
        }
      />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1.5">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`relative rounded-lg border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition ${
              tab === item.key ? "border-[#1266B1] bg-blush text-[#1266B1]" : "border-transparent text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            {item.label}
            {dirtyTabs.has(item.key) && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" title="Unsaved changes" />}
          </button>
        ))}
      </div>

      <div className={`${panelClass} p-5`}>
        <p className="mb-5 text-sm text-muted">{active.description}</p>

        <div className="grid gap-5">
          {Object.entries(example).map(([key, fieldExample]) => (
            <Field
              key={`${tab}.${key}`}
              name={key}
              example={fieldExample}
              value={section[key] ?? fieldExample}
              onChange={(value) => setDraft({ ...draft, [tab]: { ...section, [key]: value } })}
              disabled={!allowed.update}
              section={tab}
            />
          ))}
        </div>

        {allowed.update && (
          <div className="sticky bottom-0 -mx-5 mt-6 -mb-5 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-line bg-surface/95 px-5 py-4 backdrop-blur">
            <button type="button" className={secondaryButton} onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" /> Restore launch text
            </button>
            <div className="flex items-center gap-3">
              {dirtyTabs.has(tab) && (
                <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => setDraft({ ...draft, [tab]: saved[tab] })}>
                  Discard changes
                </button>
              )}
              <button className={primaryButton} disabled={saving || !dirtyTabs.has(tab)} onClick={save}>
                {saving ? "Saving…" : `Save ${active.label.toLowerCase()}`}
              </button>
            </div>
          </div>
        )}
      </div>

      <DialogBox
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={`Restore the ${active.label} tab?`}
        description="Every field on this tab goes back to the text the website launched with. Other tabs are untouched."
        size="sm"
        onConfirm={reset}
        confirmLabel="Restore"
        submitting={saving}
        submittingLabel="Restoring..."
        destructive
      >
        <p className="text-sm text-muted">Your edits on this tab are lost.</p>
      </DialogBox>
    </>
  );
}
