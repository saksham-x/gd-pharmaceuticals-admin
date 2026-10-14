import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, Search } from "lucide-react";

import CustomTable, { type TableColumn } from "../../components/CustomTable";
import DialogBox from "../../components/DialogBox";
import FormField from "../../components/FormField";
import RowActionsMenu from "../../components/RowActionsMenu";
import {
  PageHeader,
  Pill,
  formatDateTime,
  inputClass,
  panelClass,
  primaryButton,
  type Tone,
} from "../../components/ui";
import { usePermissions } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/base/api";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  createManualEnquiry,
  deleteEnquiry,
  getEnquiries,
  getOwners,
  updateEnquiry,
  type Enquiry,
  type EnquiryStatus,
  type EnquiryType,
  type ManualEnquiryPayload,
  type Owner,
} from "../../services/enquiry/enquiryService";

// The design's status colours.
export function statusTone(status: EnquiryStatus): Tone {
  switch (status) {
    case "New":
      return "blue";
    case "Contacted":
      return "green";
    case "Assigned":
      return "violet";
    case "In Progress":
      return "amber";
    default:
      return "grey";
  }
}

const EMPTY_MANUAL: ManualEnquiryPayload = {
  name: "",
  email: "",
  phone: "",
  type: "General enquiry",
  message: "",
  owner: "",
  status: "New",
};

type View = "list" | "board";

export default function EnquiriesAdmin() {
  const allowed = usePermissions("enquiries");
  const [searchParams, setSearchParams] = useSearchParams();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [view, setView] = useState<View>("list");

  // Detail dialog: the enquiry and the
  // edits not yet saved.
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [draft, setDraft] = useState({ status: "New" as EnquiryStatus, owner: "", notes: "", type: "General enquiry" as EnquiryType });
  const [saving, setSaving] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState(EMPTY_MANUAL);

  const [toDelete, setToDelete] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setEnquiries(await getEnquiries({ search: search.trim() || undefined, status, type }));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load enquiries"));
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, type]);

  // Typing waits a moment before asking.
  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    getOwners()
      .then(setOwners)
      .catch(() => setOwners([]));
  }, []);

  const openDetail = (enquiry: Enquiry) => {
    setSelected(enquiry);
    setDraft({ status: enquiry.status, owner: enquiry.owner?._id ?? "", notes: enquiry.notes, type: enquiry.type });
  };

  // ?open=<id> from the dashboard.
  useEffect(() => {
    const id = searchParams.get("open");
    if (!id || loading) return;
    const match = enquiries.find((enquiry) => enquiry._id === id);
    if (match) openDetail(match);
    searchParams.delete("open");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, enquiries, loading]);

  const saveDetail = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const updated = await updateEnquiry(selected._id, {
        status: draft.status,
        owner: draft.owner || null,
        notes: draft.notes,
        type: draft.type,
      });
      setEnquiries((list) => list.map((item) => (item._id === updated._id ? updated : item)));
      toast.success("Enquiry updated");
      setSelected(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the enquiry"));
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (enquiry: Enquiry, next: EnquiryStatus) => {
    try {
      const updated = await updateEnquiry(enquiry._id, { status: next });
      setEnquiries((list) => list.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(`Marked ${next.toLowerCase()}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the enquiry"));
    }
  };

  const saveManual = async () => {
    try {
      setSaving(true);
      await createManualEnquiry({ ...manual, name: manual.name.trim(), email: manual.email.trim() });
      toast.success("Enquiry created");
      setManualOpen(false);
      setManual(EMPTY_MANUAL);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create the enquiry"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await deleteEnquiry(toDelete._id);
      setEnquiries((list) => list.filter((item) => item._id !== toDelete._id));
      toast.success("Enquiry deleted");
      setToDelete(null);
      setSelected(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete the enquiry"));
    } finally {
      setDeleting(false);
    }
  };

  const actions = (enquiry: Enquiry) => (
    <RowActionsMenu
      label={`Actions for ${enquiry.reference}`}
      actions={[
        { key: "open", label: "Open", icon: "↗", onSelect: () => openDetail(enquiry) },
        ...(allowed.update && enquiry.status !== "Contacted"
          ? [{ key: "contacted", label: "Mark contacted", icon: "✓", tone: "success" as const, onSelect: () => quickStatus(enquiry, "Contacted") }]
          : []),
        ...(allowed.update && enquiry.status !== "Closed"
          ? [{ key: "close", label: "Close", icon: "✕", onSelect: () => quickStatus(enquiry, "Closed") }]
          : []),
        ...(allowed.delete
          ? [{ key: "delete", label: "Delete", icon: "🗑", tone: "danger" as const, dividerBefore: true, onSelect: () => setToDelete(enquiry) }]
          : []),
      ]}
    />
  );

  const columns: TableColumn<Enquiry>[] = [
    { key: "ref", header: "Reference", hideOnMobile: true, cellClassName: "font-bold text-ink whitespace-nowrap", render: (row) => row.reference },
    {
      key: "name",
      header: "Contact / organisation",
      render: (row) => (
        <span>
          <span className="block text-ink">{row.name}</span>
          <span className="block text-[11px]">{row.email || row.phone}</span>
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cellClassName: "whitespace-nowrap",
      render: (row) => (
        <span>
          {row.type}
          {row.product && <span className="block text-[11px]">{row.product}</span>}
        </span>
      ),
    },
    { key: "owner", header: "Owner", render: (row) => row.owner?.name ?? "Unassigned" },
    { key: "status", header: "Status", hideOnMobile: true, render: (row) => <Pill tone={statusTone(row.status)}>{row.status}</Pill> },
    { key: "received", header: "Received", cellClassName: "whitespace-nowrap", render: (row) => formatDateTime(row.createdAt) },
    { key: "actions", header: "", align: "right", width: "60px", hideOnMobile: true, render: actions },
  ];

  // Sized to their options, beside the search box.
  const selectClass = `${inputClass.replace("w-full", "")} w-auto`;

  return (
    <>
      <PageHeader
        crumb="Enquiries"
        title="Enquiries"
        description="Messages from the website contact form, and enquiries logged by staff."
        action={
          allowed.create && (
            <button className={primaryButton} onClick={() => setManualOpen(true)}>
              <Plus className="h-4 w-4" /> Add new
            </button>
          )
        }
      />

      <div className={panelClass}>
        <div className="flex flex-wrap gap-2.5 p-4">
          <label className="flex min-w-[200px] flex-1 items-center gap-2.5 rounded-lg border border-line px-3 focus-within:border-[#1266B1]">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search enquiries…"
              aria-label="Search enquiries"
              className="h-10 flex-1 bg-transparent text-sm text-ink outline-none"
            />
          </label>
          <select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
            <option>All</option>
            {ENQUIRY_STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select className={selectClass} value={type} onChange={(event) => setType(event.target.value)} aria-label="Type">
            <option value="All">All types</option>
            {ENQUIRY_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-between px-4 pb-2.5 text-[11px] text-muted">
          <span>{loading ? "Loading…" : `${enquiries.length} enquir${enquiries.length === 1 ? "y" : "ies"}`}</span>
          <span className="flex gap-1">
            {(["list", "board"] as View[]).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`px-1 capitalize ${view === item ? "font-bold text-[#1266B1]" : "text-muted"}`}
              >
                {item}
              </button>
            ))}
          </span>
        </div>

        {view === "list" ? (
          <CustomTable
            columns={columns}
            rows={enquiries}
            rowKey={(row) => row._id}
            loading={loading}
            minWidth="880px"
            emptyTitle="No enquiries match these filters"
            onRowClick={openDetail}
            mobileTitle={(row) => row.name}
            mobileSubtitle={(row) => row.reference}
            mobileBadge={(row) => <Pill tone={statusTone(row.status)}>{row.status}</Pill>}
            mobileActions={actions}
            className="[&>div]:rounded-none [&>div]:border-x-0 [&>div]:border-b-0"
          />
        ) : (
          <div className="grid gap-3 overflow-x-auto px-4 pb-4" style={{ gridTemplateColumns: `repeat(${ENQUIRY_STATUSES.length}, minmax(190px, 1fr))` }}>
            {ENQUIRY_STATUSES.map((column) => {
              const items = enquiries.filter((enquiry) => enquiry.status === column);
              return (
                <div key={column} className="rounded-[10px] bg-soft p-2.5">
                  <h4 className="mx-1 mt-0.5 mb-2.5 flex justify-between text-xs font-semibold text-ink">
                    {column}
                    <span className="text-muted">{items.length}</span>
                  </h4>
                  {items.map((enquiry) => (
                    <button
                      key={enquiry._id}
                      onClick={() => openDetail(enquiry)}
                      className="mb-2 block w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-xs transition hover:border-[#1266B1]"
                    >
                      <b className="block text-ink">{enquiry.name}</b>
                      <small className="text-muted">
                        {enquiry.reference} · {enquiry.type}
                      </small>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL */}
      <DialogBox
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        eyebrow={selected ? `${selected.reference} · ${selected.source === "staff" ? "Logged by staff" : "Website"}` : ""}
        title={selected?.name ?? ""}
        description={selected ? `Received ${formatDateTime(selected.createdAt)}` : ""}
        size="lg"
        onSubmit={allowed.update ? saveDetail : undefined}
        confirmLabel="Save changes"
        submitting={saving}
      >
        {selected && (
          <div className="space-y-5">
            <dl className="grid gap-x-6 gap-y-2 rounded-xl bg-soft p-4 text-sm sm:grid-cols-[120px_1fr]">
              <dt className="text-muted">Email</dt>
              <dd className="text-ink">{selected.email ? <a className="text-[#1266B1]" href={`mailto:${selected.email}`}>{selected.email}</a> : "—"}</dd>
              <dt className="text-muted">Phone</dt>
              <dd className="text-ink">{selected.phone ? <a className="text-[#1266B1]" href={`tel:${selected.phone}`}>{selected.phone}</a> : "—"}</dd>
              {selected.product && (
                <>
                  <dt className="text-muted">Product</dt>
                  <dd className="text-ink">{selected.product}</dd>
                </>
              )}
              <dt className="text-muted">Message</dt>
              <dd className="whitespace-pre-wrap text-ink">{selected.message || "—"}</dd>
            </dl>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Status">
                <select className={inputClass} disabled={!allowed.update} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as EnquiryStatus })}>
                  {ENQUIRY_STATUSES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Owner">
                <select className={inputClass} disabled={!allowed.update} value={draft.owner} onChange={(event) =>
                    setDraft({
                      ...draft,
                      owner: event.target.value,
                      // Picking an owner moves a new enquiry along the board.
                      status: event.target.value && draft.status === "New" ? "Assigned" : draft.status,
                    })
                  }>
                  <option value="">Unassigned</option>
                  {owners.map((owner) => (
                    <option key={owner._id} value={owner._id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Type">
                <select className={inputClass} disabled={!allowed.update} value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as EnquiryType })}>
                  {ENQUIRY_TYPES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Internal notes" hint="never shown to the sender">
              <textarea
                className={`${inputClass} min-h-[100px]`}
                disabled={!allowed.update}
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                placeholder="Call summary, next steps…"
              />
            </FormField>
          </div>
        )}
      </DialogBox>

      {/* MANUAL */}
      <DialogBox
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        eyebrow="Enquiries"
        title="New enquiry"
        description="Log a phone, email or walk-in enquiry."
        onSubmit={saveManual}
        confirmLabel="Create enquiry"
        submitting={saving}
        closeOnBackdrop={false}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Contact / organisation" required className="sm:col-span-2">
            <input className={inputClass} required value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} placeholder="e.g. Everest Pharmacy" />
          </FormField>
          <FormField label="Email">
            <input className={inputClass} type="email" value={manual.email} onChange={(event) => setManual({ ...manual, email: event.target.value })} />
          </FormField>
          <FormField label="Phone">
            <input className={inputClass} value={manual.phone} onChange={(event) => setManual({ ...manual, phone: event.target.value })} />
          </FormField>
          <FormField label="Type">
            <select className={inputClass} value={manual.type} onChange={(event) => setManual({ ...manual, type: event.target.value as EnquiryType })}>
              {ENQUIRY_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Owner">
            <select className={inputClass} value={manual.owner} onChange={(event) => setManual({ ...manual, owner: event.target.value })}>
              <option value="">Unassigned</option>
              {owners.map((owner) => (
                <option key={owner._id} value={owner._id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Message" className="sm:col-span-2">
            <textarea className={`${inputClass} min-h-[90px]`} value={manual.message} onChange={(event) => setManual({ ...manual, message: event.target.value })} />
          </FormField>
        </div>
      </DialogBox>

      {/* DELETE */}
      <DialogBox
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete this enquiry?"
        description={toDelete ? `${toDelete.reference} from ${toDelete.name} will be removed permanently.` : ""}
        size="sm"
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        submitting={deleting}
        submittingLabel="Deleting..."
        destructive
      >
        <p className="text-sm text-muted">Tasks linked to it stay, without the link.</p>
      </DialogBox>
    </>
  );
}
