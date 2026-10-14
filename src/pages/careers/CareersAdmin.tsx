import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";

import CustomTable, { type TableColumn } from "../../components/CustomTable";
import DialogBox from "../../components/DialogBox";
import FormField from "../../components/FormField";
import RowActionsMenu from "../../components/RowActionsMenu";
import { PageHeader, Pill, Toggle, inputClass, primaryButton } from "../../components/ui";
import { usePermissions } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/base/api";
import { careerService, type Career } from "../../services/resources/resourceService";

// Responsibilities are edited one per line.
type Form = Omit<Career, "_id" | "updatedAt" | "responsibilities"> & { responsibilities: string };

const EMPTY: Form = {
  title: "",
  department: "",
  location: "Kathmandu",
  type: "Full time",
  summary: "",
  responsibilities: "",
  badge: "",
  active: true,
  order: 0,
};

export default function CareersAdmin() {
  const allowed = usePermissions("careers");

  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Career | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setCareers(await careerService.list());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load roles"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((previous) => ({ ...previous, [key]: value }));

  const openAdd = () => {
    setForm({ ...EMPTY, order: careers.length + 1 });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (career: Career) => {
    const { _id, updatedAt: _updated, responsibilities, ...rest } = career;
    setForm({ ...rest, responsibilities: responsibilities.join("\n") });
    setEditingId(_id);
    setFormOpen(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        title: form.title.trim(),
        order: Number(form.order) || 0,
        responsibilities: form.responsibilities.split("\n").map((line) => line.trim()).filter(Boolean),
      };
      if (editingId) {
        await careerService.update(editingId, payload);
        toast.success("Role updated");
      } else {
        await careerService.create(payload);
        toast.success("Role added");
      }
      setFormOpen(false);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save the role"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (career: Career) => {
    try {
      setBusyId(career._id);
      await careerService.toggle(career._id, "active");
      toast.success(career.active ? "Role closed" : "Role opened");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the role"));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await careerService.remove(toDelete._id);
      toast.success("Role deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete the role"));
    }
  };

  const actions = (career: Career) => (
    <RowActionsMenu
      label={`Actions for ${career.title}`}
      busy={busyId === career._id}
      actions={[
        ...(allowed.update ? [{ key: "edit", label: "Edit", icon: "✎", onSelect: () => openEdit(career) }] : []),
        ...(allowed.update
          ? [
              {
                key: "toggle",
                label: career.active ? "Close role" : "Open role",
                icon: career.active ? "✕" : "✓",
                tone: career.active ? ("default" as const) : ("success" as const),
                onSelect: () => toggle(career),
              },
            ]
          : []),
        ...(allowed.delete
          ? [{ key: "delete", label: "Delete", icon: "🗑", tone: "danger" as const, dividerBefore: true, onSelect: () => setToDelete(career) }]
          : []),
      ]}
    />
  );

  const columns: TableColumn<Career>[] = [
    { key: "title", header: "Role", hideOnMobile: true, cellClassName: "font-semibold text-ink", render: (row) => row.title },
    { key: "department", header: "Department", render: (row) => row.department || "—" },
    { key: "location", header: "Location", render: (row) => row.location || "—" },
    { key: "type", header: "Type", render: (row) => row.type || "—" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          <Pill tone={row.active ? "green" : "grey"}>{row.active ? "Open" : "Closed"}</Pill>
          {row.badge && <Pill tone="amber">{row.badge}</Pill>}
        </span>
      ),
    },
    { key: "actions", header: "", align: "right", width: "60px", hideOnMobile: true, render: actions },
  ];

  return (
    <>
      <PageHeader
        crumb="Careers"
        title="Careers"
        description="Open roles on the Careers page. Applications arrive as Careers enquiries."
        action={
          allowed.create && (
            <button className={primaryButton} onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add role
            </button>
          )
        }
      />

      <CustomTable
        columns={columns}
        rows={careers}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No roles yet"
        onRowClick={allowed.update ? openEdit : undefined}
        mobileTitle={(row) => row.title}
        mobileActions={actions}
      />

      <DialogBox
        open={formOpen}
        onClose={() => setFormOpen(false)}
        eyebrow="Careers"
        title={editingId ? "Edit role" : "Add role"}
        size="lg"
        onSubmit={save}
        confirmLabel={editingId ? "Save changes" : "Add role"}
        submitting={saving}
        closeOnBackdrop={false}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Job title" required className="sm:col-span-2">
            <input className={inputClass} required value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Quality Assurance Associate" />
          </FormField>
          <FormField label="Department">
            <input className={inputClass} value={form.department} onChange={(event) => set("department", event.target.value)} placeholder="Quality" />
          </FormField>
          <FormField label="Location">
            <input className={inputClass} value={form.location} onChange={(event) => set("location", event.target.value)} />
          </FormField>
          <FormField label="Employment type">
            <input className={inputClass} value={form.type} onChange={(event) => set("type", event.target.value)} list="career-types" />
            <datalist id="career-types">
              <option value="Full time" />
              <option value="Part time" />
              <option value="Contract" />
              <option value="Internship" />
            </datalist>
          </FormField>
          <FormField label="Badge" hint="optional yellow label">
            <input className={inputClass} value={form.badge} onChange={(event) => set("badge", event.target.value)} placeholder="e.g. Urgent" />
          </FormField>
          <FormField label="Summary" className="sm:col-span-2">
            <textarea className={`${inputClass} min-h-[80px]`} value={form.summary} onChange={(event) => set("summary", event.target.value)} />
          </FormField>
          <FormField label="What you'll do" hint="one per line" className="sm:col-span-2">
            <textarea className={`${inputClass} min-h-[110px]`} value={form.responsibilities} onChange={(event) => set("responsibilities", event.target.value)} />
          </FormField>
          <FormField label="Order" hint="lower comes first">
            <input className={inputClass} type="number" value={form.order} onChange={(event) => set("order", Number(event.target.value))} />
          </FormField>
          <div className="self-end">
            <Toggle checked={form.active} onChange={(value) => set("active", value)} label="Open" hint="Listed on the Careers page" />
          </div>
        </div>
      </DialogBox>

      <DialogBox
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete this role?"
        description={toDelete?.title}
        size="sm"
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        destructive
      >
        <p className="text-sm text-muted">Closing it keeps it here for later instead.</p>
      </DialogBox>
    </>
  );
}
