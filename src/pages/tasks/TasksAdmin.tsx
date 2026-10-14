import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";

import DialogBox from "../../components/DialogBox";
import FormField from "../../components/FormField";
import LoadingSpinner from "../../components/LoadingSpinner";
import RowActionsMenu from "../../components/RowActionsMenu";
import { PageHeader, Pill, formatDate, inputClass, panelClass, primaryButton, toDateInput } from "../../components/ui";
import { usePermissions } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/base/api";
import { getEnquiries, getOwners, type Enquiry, type Owner } from "../../services/enquiry/enquiryService";
import {
  createTask,
  deleteTask,
  getTasks,
  toggleTaskDone,
  updateTask,
  type Task,
  type TaskPayload,
  type TaskStatus,
} from "../../services/task/taskService";

const EMPTY: TaskPayload = { title: "", dueDate: "", priority: "Normal", assignee: "", enquiry: "", notes: "" };

const TABS: { value: TaskStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
];

const todayKey = () => toDateInput(new Date().toISOString());

export default function TasksAdmin() {
  const allowed = usePermissions("tasks");

  const [tab, setTab] = useState<TaskStatus>("open");
  const [mine, setMine] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [owners, setOwners] = useState<Owner[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Task | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setTasks(await getTasks(tab, mine));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load tasks"));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [tab, mine]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getOwners().then(setOwners).catch(() => setOwners([]));
    // For linking a task to an enquiry;
    // accounts without enquiry access
    // simply get no list.
    getEnquiries().then(setEnquiries).catch(() => setEnquiries([]));
  }, []);

  const openAdd = () => {
    setForm(EMPTY);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setForm({
      title: task.title,
      dueDate: toDateInput(task.dueDate),
      priority: task.priority,
      assignee: task.assignee?._id ?? "",
      enquiry: task.enquiry?._id ?? "",
      notes: task.notes,
    });
    setEditingId(task._id);
    setFormOpen(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = { ...form, title: form.title.trim() };
      if (editingId) {
        await updateTask(editingId, payload);
        toast.success("Task updated");
      } else {
        await createTask(payload);
        toast.success("Task added");
      }
      setFormOpen(false);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save the task"));
    } finally {
      setSaving(false);
    }
  };

  const tick = async (task: Task) => {
    try {
      setBusyId(task._id);
      await toggleTaskDone(task._id);
      toast.success(task.done ? "Task reopened" : "Task marked done");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the task"));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteTask(toDelete._id);
      toast.success("Task deleted");
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete the task"));
    }
  };

  const today = todayKey();

  return (
    <>
      <PageHeader
        crumb="Tasks"
        title="Tasks"
        description="Follow-ups for enquiries and website work."
        action={
          allowed.create && (
            <button className={primaryButton} onClick={openAdd}>
              <Plus className="h-4 w-4" /> New task
            </button>
          )
        }
      />

      <div className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-1.5">
          <div className="flex gap-1.5">
            {TABS.map((item) => (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  tab === item.value ? "border-[#1266B1] bg-blush text-[#1266B1]" : "border-line bg-surface text-ink hover:border-[#1266B1]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={mine} onChange={(event) => setMine(event.target.checked)} className="accent-[#1266B1]" />
            Mine and unassigned only
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-14 text-[#1266B1]">
            <LoadingSpinner size="lg" label="Loading tasks" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted">Nothing here.</p>
        ) : (
          <div className="pb-1.5">
            {tasks.map((task) => {
              const due = toDateInput(task.dueDate);
              const overdue = !task.done && due && due < today;
              return (
                <div key={task._id} className="flex items-start gap-2.5 border-t border-line px-4 py-3 first:border-t-0">
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={!allowed.update || busyId === task._id}
                    onChange={() => tick(task)}
                    aria-label={task.done ? "Reopen task" : "Mark done"}
                    className="mt-[3px] h-4 w-4 shrink-0 accent-[#1266B1]"
                  />
                  <button className="min-w-0 flex-1 text-left" onClick={() => allowed.update && openEdit(task)}>
                    <b className={`block text-[13px] font-semibold ${task.done ? "text-muted line-through" : "text-ink"}`}>{task.title}</b>
                    <small className="text-[11px] text-muted">
                      <span className={overdue ? "font-semibold text-red-700" : ""}>
                        {task.dueDate ? (due === today ? "Today" : formatDate(task.dueDate)) : "No due date"}
                        {overdue ? " · overdue" : ""}
                      </span>
                      {" · "}
                      <span className={task.priority === "High" ? "text-red-700" : ""}>{task.priority}</span>
                      {" · "}
                      {task.assignee?.name ?? "Anyone"}
                      {task.enquiry && ` · ${task.enquiry.reference}`}
                    </small>
                  </button>
                  {task.priority === "High" && !task.done && <Pill tone="red">High</Pill>}
                  <RowActionsMenu
                    label={`Actions for ${task.title}`}
                    busy={busyId === task._id}
                    actions={[
                      ...(allowed.update ? [{ key: "edit", label: "Edit", icon: "✎", onSelect: () => openEdit(task) }] : []),
                      ...(allowed.delete
                        ? [{ key: "delete", label: "Delete", icon: "🗑", tone: "danger" as const, dividerBefore: true, onSelect: () => setToDelete(task) }]
                        : []),
                    ]}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DialogBox
        open={formOpen}
        onClose={() => setFormOpen(false)}
        eyebrow="Tasks"
        title={editingId ? "Edit task" : "New task"}
        onSubmit={save}
        confirmLabel={editingId ? "Save changes" : "Add task"}
        submitting={saving}
        closeOnBackdrop={false}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Title" required className="sm:col-span-2">
            <input className={inputClass} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Call Himal Trade Link" />
          </FormField>
          <FormField label="Due date">
            <input className={inputClass} type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </FormField>
          <FormField label="Priority">
            <select className={inputClass} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPayload["priority"] })}>
              <option>Normal</option>
              <option>High</option>
            </select>
          </FormField>
          <FormField label="Assigned to">
            <select className={inputClass} value={form.assignee} onChange={(event) => setForm({ ...form, assignee: event.target.value })}>
              <option value="">Anyone</option>
              {owners.map((owner) => (
                <option key={owner._id} value={owner._id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Enquiry">
            <select className={inputClass} value={form.enquiry} onChange={(event) => setForm({ ...form, enquiry: event.target.value })}>
              <option value="">None</option>
              {enquiries.map((enquiry) => (
                <option key={enquiry._id} value={enquiry._id}>
                  {enquiry.reference} — {enquiry.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            <textarea className={`${inputClass} min-h-[80px]`} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </FormField>
        </div>
      </DialogBox>

      <DialogBox
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete this task?"
        description={toDelete?.title}
        size="sm"
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        destructive
      >
        <p className="text-sm text-muted">This cannot be undone.</p>
      </DialogBox>
    </>
  );
}
