import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";

import CustomTable, { type TableColumn } from "../../components/CustomTable";
import DialogBox from "../../components/DialogBox";
import FormField, { FormLabel } from "../../components/FormField";
import RowActionsMenu from "../../components/RowActionsMenu";
import { PageHeader, Pill, Toggle, UploadField, formatDate, inputClass, primaryButton, toDateInput } from "../../components/ui";
import { appConfig } from "../../config/appConfig";
import { usePermissions } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/base/api";
import { NOTICE_CATEGORIES, noticeService, type Notice, type NoticeCategory } from "../../services/resources/resourceService";
import { uploadDocument, uploadImage } from "../../services/upload/uploadService";

type Form = Omit<Notice, "_id" | "updatedAt">;

const EMPTY: Form = {
  title: "",
  summary: "",
  type: "Company notice",
  date: "",
  category: "notice",
  subject: "",
  outcome: "",
  documentUrl: "",
  showOnNews: false,
  newsTitle: "",
  newsSummary: "",
  image: "",
  showOnHome: false,
  published: true,
};

const categoryLabel = (value: NoticeCategory) => NOTICE_CATEGORIES.find((item) => item.value === value)?.label ?? value;

export default function NoticesAdmin() {
  const allowed = usePermissions("notices");

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Notice | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setNotices(await noticeService.list());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load notices"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((previous) => ({ ...previous, [key]: value }));

  const openAdd = () => {
    setForm({ ...EMPTY, date: toDateInput(new Date().toISOString()) });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (notice: Notice) => {
    const { _id, updatedAt: _updated, ...rest } = notice;
    setForm({ ...rest, date: toDateInput(notice.date) });
    setEditingId(_id);
    setFormOpen(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      // Midnight in Nepal, so the website
      // shows the same calendar day.
      const payload = { ...form, title: form.title.trim(), date: `${form.date}T00:00:00+05:45` };
      if (editingId) {
        await noticeService.update(editingId, payload);
        toast.success("Notice updated");
      } else {
        await noticeService.create(payload);
        toast.success("Notice added");
      }
      setFormOpen(false);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save the notice"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (notice: Notice) => {
    try {
      setBusyId(notice._id);
      await noticeService.toggle(notice._id, "published");
      toast.success(notice.published ? "Hidden from the website" : "Published");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the notice"));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await noticeService.remove(toDelete._id);
      toast.success("Notice deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete the notice"));
    }
  };

  const actions = (notice: Notice) => (
    <RowActionsMenu
      label={`Actions for ${notice.title}`}
      busy={busyId === notice._id}
      actions={[
        ...(allowed.update ? [{ key: "edit", label: "Edit", icon: "✎", onSelect: () => openEdit(notice) }] : []),
        ...(allowed.update
          ? [{ key: "publish", label: notice.published ? "Hide from website" : "Publish", icon: notice.published ? "✕" : "✓", onSelect: () => toggle(notice) }]
          : []),
        ...(notice.documentUrl ? [{ key: "pdf", label: "Open PDF", icon: "↗", onSelect: () => window.open(notice.documentUrl, "_blank") }] : []),
        ...(allowed.delete
          ? [{ key: "delete", label: "Delete", icon: "🗑", tone: "danger" as const, dividerBefore: true, onSelect: () => setToDelete(notice) }]
          : []),
      ]}
    />
  );

  const columns: TableColumn<Notice>[] = [
    { key: "date", header: "Date", cellClassName: "whitespace-nowrap", render: (row) => formatDate(row.date) },
    {
      key: "title",
      header: "Notice",
      hideOnMobile: true,
      render: (row) => (
        <span>
          <span className="block font-semibold text-ink">{row.title}</span>
          <span className="line-clamp-1 block max-w-md text-[11px]">{row.summary}</span>
        </span>
      ),
    },
    { key: "category", header: "Investors tab", render: (row) => categoryLabel(row.category) },
    { key: "pdf", header: "PDF", render: (row) => (row.documentUrl ? <Pill tone="green">Attached</Pill> : <Pill tone="amber">Missing</Pill>) },
    {
      key: "where",
      header: "Shown",
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          <Pill tone={row.published ? "green" : "grey"}>{row.published ? "Investors" : "Hidden"}</Pill>
          {row.published && row.showOnHome && <Pill tone="blue">Home</Pill>}
          {row.published && row.showOnNews && <Pill tone="violet">News</Pill>}
        </span>
      ),
    },
    { key: "actions", header: "", align: "right", width: "60px", hideOnMobile: true, render: actions },
  ];

  return (
    <>
      <PageHeader
        crumb="Notices & News"
        title="Notices & News"
        description="Company notices and investor documents. Each one shows on its Investors tab, and can also appear on the home page and News & Events."
        action={
          allowed.create && (
            <button className={primaryButton} onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add notice
            </button>
          )
        }
      />

      <CustomTable
        columns={columns}
        rows={notices}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No notices yet"
        onRowClick={allowed.update ? openEdit : undefined}
        mobileTitle={(row) => row.title}
        mobileSubtitle={(row) => formatDate(row.date)}
        mobileActions={actions}
      />

      <DialogBox
        open={formOpen}
        onClose={() => setFormOpen(false)}
        eyebrow="Notices & News"
        title={editingId ? "Edit notice" : "Add notice"}
        size="lg"
        onSubmit={save}
        confirmLabel={editingId ? "Save changes" : "Add notice"}
        submitting={saving}
        closeOnBackdrop={false}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Title" required className="sm:col-span-2">
            <input className={inputClass} required value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Special General Meeting notice" />
          </FormField>
          <FormField label="Summary" className="sm:col-span-2">
            <textarea className={`${inputClass} min-h-[70px]`} value={form.summary} onChange={(event) => set("summary", event.target.value)} />
          </FormField>
          <FormField label="Label" hint="before the date">
            <input className={inputClass} value={form.type} onChange={(event) => set("type", event.target.value)} />
          </FormField>
          <FormField label="Date" required>
            <input className={inputClass} type="date" required value={form.date} onChange={(event) => set("date", event.target.value)} />
          </FormField>
          <FormField label="Investors tab">
            <select className={inputClass} value={form.category} onChange={(event) => set("category", event.target.value as NoticeCategory)}>
              {NOTICE_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Subject">
            <input className={inputClass} value={form.subject} onChange={(event) => set("subject", event.target.value)} placeholder="Capital and a proposed IPO" />
          </FormField>
          <FormField label="Outcome" className="sm:col-span-2">
            <input className={inputClass} value={form.outcome} onChange={(event) => set("outcome", event.target.value)} placeholder="Requires confirmation" />
          </FormField>
          <div className="sm:col-span-2">
            <FormLabel label="Approved PDF" hint="blank shows “PDF unavailable”" />
            <UploadField value={form.documentUrl} onChange={(url) => set("documentUrl", url)} upload={uploadDocument} accept="application/pdf" placeholder="https://… or upload a PDF" preview={false} />
          </div>

          <div className="space-y-3 sm:col-span-2">
            <Toggle checked={form.published} onChange={(value) => set("published", value)} label="Published" hint="Shown on the Investors page" />
            <Toggle checked={form.showOnHome} onChange={(value) => set("showOnHome", value)} label="Home page" hint="The newest one is shown in the Investor centre section" />
            <Toggle checked={form.showOnNews} onChange={(value) => set("showOnNews", value)} label="News & Events" hint="As a photo card on the News page" />
          </div>

          {form.showOnNews && (
            <>
              <FormField label="News headline" hint="blank: the title" className="sm:col-span-2">
                <input className={inputClass} value={form.newsTitle} onChange={(event) => set("newsTitle", event.target.value)} />
              </FormField>
              <FormField label="News text" hint="blank: the summary" className="sm:col-span-2">
                <textarea className={`${inputClass} min-h-[70px]`} value={form.newsSummary} onChange={(event) => set("newsSummary", event.target.value)} />
              </FormField>
              <div className="sm:col-span-2">
                <FormLabel label="Card photo" hint="blank: the default photo" />
                <UploadField
                  value={form.image}
                  onChange={(url) => set("image", url)}
                  upload={uploadImage}
                  accept="image/*"
                  placeholder="https://… or upload a photo"
                  preview={{ fallback: `${appConfig.siteUrl}/images/about.webp` }}
                />
              </div>
            </>
          )}
        </div>
      </DialogBox>

      <DialogBox
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete this notice?"
        description={toDelete?.title}
        size="sm"
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        destructive
      >
        <p className="text-sm text-muted">It is removed from every page. Hiding it keeps it here instead.</p>
      </DialogBox>
    </>
  );
}
