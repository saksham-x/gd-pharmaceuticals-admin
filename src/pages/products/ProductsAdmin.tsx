import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ExternalLink, Plus } from "lucide-react";

import CustomTable, { type TableColumn } from "../../components/CustomTable";
import DialogBox from "../../components/DialogBox";
import FormField from "../../components/FormField";
import RowActionsMenu from "../../components/RowActionsMenu";
import { PageHeader, Pill, Toggle, inputClass, primaryButton } from "../../components/ui";
import { appConfig } from "../../config/appConfig";
import { usePermissions } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/base/api";
import { productService, type Product } from "../../services/resources/resourceService";

type Form = Omit<Product, "_id" | "updatedAt">;

const DEFAULT_INFO =
  "Use only as directed by a qualified healthcare professional. Approved composition, strength and prescribing information will be added from the product label.";

const EMPTY: Form = {
  name: "",
  slug: "",
  genericName: "",
  form: "Tablets",
  dosageForm: "Tablet",
  subtitle: "Tablet",
  packSize: "",
  composition: "",
  registration: "",
  medicineInfo: DEFAULT_INFO,
  color: "blue",
  featured: true,
  published: true,
  order: 0,
};

// The pack drawn on the website card, so
// staff see what they are publishing.
function PackPreview({ name, subtitle, color }: Pick<Form, "name" | "subtitle" | "color">) {
  const accent = color === "green" ? "#147d64" : "#1266b1";
  const bg =
    color === "green"
      ? "linear-gradient(135deg,#eaf8f1 0%,#d3f0e1 100%)"
      : "linear-gradient(135deg,#eaf5ff 0%,#dceeff 100%)";

  return (
    <div className="grid h-36 place-items-center overflow-hidden rounded-xl" style={{ background: bg }}>
      <div
        className="relative h-[84px] w-[150px] -rotate-3 overflow-hidden rounded-md bg-white shadow-[0_14px_14px_rgba(23,50,77,.14)]"
        style={{ color: accent }}
      >
        <small className="absolute top-3 left-3 text-[7px] font-bold">G.D.</small>
        <b className="absolute top-7 left-3 font-display text-lg leading-none font-bold">{name || "NAME"}</b>
        <span className="absolute top-[54px] left-3 text-[8px] text-[#526579]">{subtitle}</span>
        <i className="absolute inset-y-0 right-0 w-2.5" style={{ background: accent }} />
      </div>
    </div>
  );
}

export default function ProductsAdmin() {
  const allowed = usePermissions("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setProducts(await productService.list());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((previous) => ({ ...previous, [key]: value }));

  const openAdd = () => {
    setForm({ ...EMPTY, order: products.length + 1 });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    const { _id, updatedAt: _updated, ...rest } = product;
    setForm(rest);
    setEditingId(_id);
    setFormOpen(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = { ...form, name: form.name.trim(), order: Number(form.order) || 0 };
      if (editingId) {
        await productService.update(editingId, payload);
        toast.success("Product updated");
      } else {
        await productService.create(payload);
        toast.success("Product added");
      }
      setFormOpen(false);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save the product"));
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (product: Product) => {
    try {
      setBusyId(product._id);
      await productService.toggle(product._id, "published");
      toast.success(product.published ? "Hidden from the website" : "Published");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the product"));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await productService.remove(toDelete._id);
      toast.success("Product deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete the product"));
    } finally {
      setDeleting(false);
    }
  };

  const actions = (product: Product) => (
    <RowActionsMenu
      label={`Actions for ${product.name}`}
      busy={busyId === product._id}
      actions={[
        ...(allowed.update ? [{ key: "edit", label: "Edit", icon: "✎", onSelect: () => openEdit(product) }] : []),
        ...(allowed.update
          ? [
              {
                key: "publish",
                label: product.published ? "Hide from website" : "Publish",
                icon: product.published ? "✕" : "✓",
                tone: product.published ? ("default" as const) : ("success" as const),
                onSelect: () => togglePublished(product),
              },
            ]
          : []),
        { key: "view", label: "View on website", icon: "↗", onSelect: () => window.open(`${appConfig.siteUrl}/products/${product.slug}`, "_blank") },
        ...(allowed.delete
          ? [{ key: "delete", label: "Delete", icon: "🗑", tone: "danger" as const, dividerBefore: true, onSelect: () => setToDelete(product) }]
          : []),
      ]}
    />
  );

  const columns: TableColumn<Product>[] = [
    { key: "order", header: "#", width: "48px", hideOnMobile: true, render: (row) => row.order },
    {
      key: "name",
      header: "Product",
      hideOnMobile: true,
      render: (row) => (
        <span className="flex items-center gap-2.5">
          <span className="h-7 w-1.5 rounded-full" style={{ background: row.color === "green" ? "#147d64" : "#1266b1" }} />
          <span>
            <span className="block font-semibold text-ink">{row.name}</span>
            <span className="block text-[11px]">{row.subtitle}</span>
          </span>
        </span>
      ),
    },
    { key: "form", header: "Dosage form", render: (row) => row.form },
    { key: "composition", header: "Composition", render: (row) => row.composition || <span className="text-faint">Pending</span> },
    { key: "registration", header: "Registration", render: (row) => row.registration || <span className="text-faint">To be confirmed</span> },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          <Pill tone={row.published ? "green" : "grey"}>{row.published ? "Published" : "Hidden"}</Pill>
          {row.featured && <Pill tone="blue">Home page</Pill>}
        </span>
      ),
    },
    { key: "actions", header: "", align: "right", width: "60px", hideOnMobile: true, render: actions },
  ];

  return (
    <>
      <PageHeader
        crumb="Products"
        title="Products"
        description="The catalogue on the website. Hidden products stay here until they are approved."
        action={
          allowed.create && (
            <button className={primaryButton} onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add product
            </button>
          )
        }
      />

      <CustomTable
        columns={columns}
        rows={products}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No products yet"
        emptyMessage="Add the first catalogue entry."
        onRowClick={allowed.update ? openEdit : undefined}
        mobileTitle={(row) => row.name}
        mobileSubtitle={(row) => row.subtitle}
        mobileActions={actions}
      />

      <DialogBox
        open={formOpen}
        onClose={() => setFormOpen(false)}
        eyebrow="Products"
        title={editingId ? `Edit ${form.name || "product"}` : "Add product"}
        size="xl"
        onSubmit={save}
        confirmLabel={editingId ? "Save changes" : "Add product"}
        submitting={saving}
        closeOnBackdrop={false}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Brand name" required>
              <input className={inputClass} required value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="HEMAK" />
            </FormField>
            <FormField label="Web address" hint="blank: from the name">
              <input className={inputClass} value={form.slug} onChange={(event) => set("slug", event.target.value)} placeholder="hemak" />
            </FormField>
            <FormField label="Generic name" hint="also searchable">
              <input className={inputClass} value={form.genericName} onChange={(event) => set("genericName", event.target.value)} />
            </FormField>
            <FormField label="Catalogue group" required hint="filter, e.g. Tablets">
              <input className={inputClass} required value={form.form} onChange={(event) => set("form", event.target.value)} list="product-forms" />
              <datalist id="product-forms">
                {Array.from(new Set(["Tablets", "Capsules", "Syrups", "Suspensions", "Injections", "Ointments", ...products.map((p) => p.form)])).map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </FormField>
            <FormField label="Dosage form" hint="detail page">
              <input className={inputClass} value={form.dosageForm} onChange={(event) => set("dosageForm", event.target.value)} placeholder="Tablet" />
            </FormField>
            <FormField label="Card subtitle" hint="e.g. Syrup · 100 ml">
              <input className={inputClass} value={form.subtitle} onChange={(event) => set("subtitle", event.target.value)} />
            </FormField>
            <FormField label="Pack size">
              <input className={inputClass} value={form.packSize} onChange={(event) => set("packSize", event.target.value)} placeholder="Pack details to be confirmed" />
            </FormField>
            <FormField label="Registration number" hint="blank: To be confirmed">
              <input className={inputClass} value={form.registration} onChange={(event) => set("registration", event.target.value)} />
            </FormField>
            <FormField label="Composition & strength" hint="blank: pending label approval" className="sm:col-span-2">
              <input className={inputClass} value={form.composition} onChange={(event) => set("composition", event.target.value)} />
            </FormField>
            <FormField label="Medicine information" className="sm:col-span-2">
              <textarea className={`${inputClass} min-h-[90px]`} value={form.medicineInfo} onChange={(event) => set("medicineInfo", event.target.value)} />
            </FormField>
          </div>

          <div className="space-y-4">
            <PackPreview name={form.name} subtitle={form.subtitle} color={form.color} />
            <FormField label="Pack colour">
              <select className={inputClass} value={form.color} onChange={(event) => set("color", event.target.value as Form["color"])}>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
              </select>
            </FormField>
            <FormField label="Order" hint="lower comes first">
              <input className={inputClass} type="number" value={form.order} onChange={(event) => set("order", Number(event.target.value))} />
            </FormField>
            <Toggle checked={form.published} onChange={(value) => set("published", value)} label="Published" hint="Shown on the website" />
            <Toggle checked={form.featured} onChange={(value) => set("featured", value)} label="On the home page" hint="In “Our products”" />
            {editingId && (
              <a className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1266B1]" href={`${appConfig.siteUrl}/products/${form.slug}`} target="_blank" rel="noopener noreferrer">
                View on website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </DialogBox>

      <DialogBox
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title={`Delete ${toDelete?.name ?? "product"}?`}
        description="It disappears from the website and cannot be restored. Hiding it keeps it here instead."
        size="sm"
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        submitting={deleting}
        submittingLabel="Deleting..."
        destructive
      >
        <p className="text-sm text-muted">This cannot be undone.</p>
      </DialogBox>
    </>
  );
}
