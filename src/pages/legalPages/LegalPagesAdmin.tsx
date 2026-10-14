import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ExternalLink } from "lucide-react";

import LoadingSpinner from "../../components/LoadingSpinner";
import { PageHeader, Toggle, formatDate, inputClass, panelClass, primaryButton } from "../../components/ui";
import { appConfig } from "../../config/appConfig";
import { usePermissions } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/base/api";
import { legalPageService, type LegalPage } from "../../services/resources/resourceService";

// ========================================
// LEGAL PAGES
//
// Privacy and Disclaimer, linked from the
// website footer. Plain text: a blank
// line starts a new paragraph.
// ========================================

export default function LegalPagesAdmin() {
  const allowed = usePermissions("legalPages");

  const [pages, setPages] = useState<LegalPage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    legalPageService
      .list()
      .then((list) => {
        setPages(list);
        if (list[0]) {
          setActiveId(list[0]._id);
          setDraft(list[0]);
        }
      })
      .catch((error) => toast.error(getApiErrorMessage(error, "Failed to load legal pages")))
      .finally(() => setLoading(false));
  }, []);

  const select = (page: LegalPage) => {
    setActiveId(page._id);
    setDraft(page);
  };

  const save = async () => {
    if (!draft) return;
    try {
      setSaving(true);
      const saved = await legalPageService.update(draft._id, {
        title: draft.title.trim(),
        content: draft.content,
        published: draft.published,
      });
      setPages((list) => list.map((page) => (page._id === saved._id ? saved : page)));
      setDraft(saved);
      toast.success(`${saved.title} saved`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save the page"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-[#1266B1]">
        <LoadingSpinner size="lg" label="Loading" />
      </div>
    );
  }

  return (
    <>
      <PageHeader crumb="Legal pages" title="Legal pages" description="Privacy and Disclaimer, linked from the website footer." />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className={`${panelClass} h-fit p-2`}>
          {pages.map((page) => (
            <button
              key={page._id}
              onClick={() => select(page)}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                page._id === activeId ? "bg-blush font-semibold text-[#1266B1]" : "text-ink hover:bg-soft"
              }`}
            >
              {page.title}
              <small className="block text-[11px] font-normal text-muted">/{page.slug}</small>
            </button>
          ))}
        </div>

        {draft && (
          <div className={`${panelClass} space-y-4 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <small className="text-xs text-muted">Last updated {formatDate(draft.updatedAt)}</small>
              <a
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1266B1]"
                href={`${appConfig.siteUrl}/${draft.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Title</span>
              <input className={inputClass} disabled={!allowed.update} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">
                Text <span className="text-xs font-normal text-muted">a blank line starts a new paragraph</span>
              </span>
              <textarea
                className={`${inputClass} min-h-[360px] leading-relaxed`}
                disabled={!allowed.update}
                value={draft.content}
                onChange={(event) => setDraft({ ...draft, content: event.target.value })}
              />
            </label>
            <Toggle checked={draft.published} onChange={(value) => setDraft({ ...draft, published: value })} label="Published" hint="Hidden pages show “This page is being prepared.”" />
            {allowed.update && (
              <div className="flex justify-end">
                <button className={primaryButton} disabled={saving} onClick={save}>
                  {saving ? "Saving…" : "Save page"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
