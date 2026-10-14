import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowRight, Bell, FileText, Inbox, ListChecks, type LucideIcon } from "lucide-react";

import CustomTable, { type TableColumn } from "../../components/CustomTable";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PageHeader, Pill, formatDate, formatDateTime, panelClass } from "../../components/ui";
import { useAdminSession } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../services/base/api";
import { getDashboard, type Dashboard as DashboardData } from "../../services/dashboard/dashboardService";
import type { Enquiry } from "../../services/enquiry/enquiryService";
import { toggleTaskDone, type Task } from "../../services/task/taskService";
import { statusTone } from "../enquiries/EnquiriesAdmin";

// ========================================
// STAT CARD
// ========================================

function Stat({
  to,
  icon: Icon,
  tone,
  label,
  value,
  note,
}: {
  to: string;
  icon: LucideIcon;
  tone: string;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-[#1266B1] hover:shadow-sm"
    >
      <span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] ${tone}`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <small className="block text-[11.5px] text-muted">{label}</small>
        <b className="mr-2 font-display text-2xl font-semibold text-ink">{value}</b>
        <em className="text-[11px] text-muted not-italic">{note}</em>
      </div>
      <ArrowRight className="ml-auto h-[15px] w-[15px] text-muted transition group-hover:text-[#1266B1]" />
    </Link>
  );
}

// "14 Sep" for a "2026-09-14" day key.
const shortDay = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function Dashboard() {
  const navigate = useNavigate();
  const session = useAdminSession();
  const can = (permission: string) => session?.permissions.includes(permission) ?? false;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await getDashboard());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load the dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tick = async (task: Task) => {
    try {
      await toggleTaskDone(task._id);
      toast.success(task.done ? "Task reopened" : "Task marked done");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the task"));
    }
  };

  if (loading || !data) {
    return (
      <>
        <PageHeader crumb="Dashboard" title="Dashboard" />
        <div className="flex justify-center py-20 text-[#1266B1]">
          {loading ? <LoadingSpinner size="lg" label="Loading" /> : <p className="text-muted">No data.</p>}
        </div>
      </>
    );
  }

  const { stats, volume } = data;
  const peak = Math.max(1, ...volume.map((day) => day.count));
  const labelEvery = Math.ceil(volume.length / 5);

  const columns: TableColumn<Enquiry>[] = [
    { key: "ref", header: "Reference", cellClassName: "font-bold text-ink whitespace-nowrap", render: (row) => row.reference },
    { key: "name", header: "Contact / organisation", render: (row) => row.name },
    { key: "type", header: "Type", cellClassName: "whitespace-nowrap", render: (row) => row.type },
    { key: "owner", header: "Owner", render: (row) => row.owner?.name ?? "Unassigned" },
    { key: "status", header: "Status", render: (row) => <Pill tone={statusTone(row.status)}>{row.status}</Pill> },
    { key: "received", header: "Received", cellClassName: "whitespace-nowrap", render: (row) => formatDateTime(row.createdAt) },
  ];

  const change =
    stats.enquiryChange === null ? "Last 30 days" : `${stats.enquiryChange >= 0 ? "+" : ""}${stats.enquiryChange}% vs prior 30 days`;

  return (
    <>
      <PageHeader crumb="Dashboard" title={`Welcome back${session ? `, ${session.name.split(" ")[0]}` : ""}`} />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat to="/enquiries" icon={Inbox} tone="bg-[#eaf5ff] text-[#1266B1] dark:bg-[#1266B1]/25 dark:text-[#8cc4f5]" label="New enquiries" value={stats.newEnquiries} note={change} />
        <Stat to="/tasks" icon={ListChecks} tone="bg-[#eaf8f1] text-[#147d64] dark:bg-[#147d64]/30 dark:text-[#86efac]" label="Open follow-ups" value={stats.openTasks} note={`${stats.dueToday} due today`} />
        <Stat to="/tasks" icon={Bell} tone="bg-red-50 text-red-700" label="Overdue tasks" value={stats.overdue} note={stats.overdue ? "Needs attention" : "All on track"} />
        <Stat to="/products" icon={FileText} tone="bg-violet-50 text-violet-700" label="Awaiting review" value={stats.awaitingReview} note="Unpublished items" />
      </div>

      <div className="my-3.5 grid gap-3.5 lg:grid-cols-[2fr_1fr]">
        <div className={panelClass}>
          <div className="flex items-start justify-between p-4">
            <div>
              <h3 className="font-display text-base font-medium text-ink">Enquiry volume</h3>
              <small className="text-[11px] text-muted">Last 30 days · {volume.reduce((sum, day) => sum + day.count, 0)} enquiries</small>
            </div>
          </div>
          <div className="mx-4 mt-2 flex h-[200px] items-end gap-1.5 border-b border-line">
            {volume.map((day, index) => (
              <div
                key={day.date}
                title={`${shortDay(day.date)}: ${day.count}`}
                className="chart-bar flex-1 rounded-t-[3px] bg-gradient-to-b from-[#1266B1] to-[#6aa6dd] transition hover:brightness-110"
                style={{
                  height: `${Math.max(day.count ? 4 : 1, (day.count / peak) * 100)}%`,
                  opacity: day.count ? 1 : 0.25,
                  animationDelay: `${250 + index * 20}ms`,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between px-4 pt-2 pb-4 text-[10px] text-muted">
            {volume
              .filter((_, index) => index % labelEvery === 0 || index === volume.length - 1)
              .map((day) => (
                <span key={day.date}>{shortDay(day.date)}</span>
              ))}
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex items-start justify-between p-4">
            <div>
              <h3 className="font-display text-base font-medium text-ink">My tasks</h3>
              <small className="text-[11px] text-muted">{data.myTasks.length} open</small>
            </div>
            {can("tasks.view") && (
              <Link to="/tasks" className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-[#1266B1] hover:bg-blush">
                View all
              </Link>
            )}
          </div>
          {data.myTasks.length === 0 ? (
            <p className="border-t border-line px-4 py-8 text-center text-sm text-muted">Nothing open — nice work.</p>
          ) : (
            data.myTasks.map((task) => {
              const overdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString());
              return (
                <label key={task._id} className="flex cursor-pointer items-start gap-2.5 border-t border-line px-4 py-3">
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={!can("tasks.update")}
                    onChange={() => tick(task)}
                    className="mt-[3px] h-4 w-4 accent-[#1266B1]"
                  />
                  <span>
                    <b className="block text-[13px] font-semibold text-ink">{task.title}</b>
                    <small className="text-[11px] text-muted">
                      <span className={overdue ? "text-red-700" : ""}>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                      {" · "}
                      <span className={task.priority === "High" ? "text-red-700" : ""}>{task.priority}</span>
                    </small>
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div className={panelClass}>
        <div className="flex items-start justify-between p-4">
          <div>
            <h3 className="font-display text-base font-medium text-ink">Recent enquiries</h3>
            <small className="text-[11px] text-muted">Latest submissions</small>
          </div>
          {can("enquiries.view") && (
            <Link to="/enquiries" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1266B1]">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <CustomTable
          columns={columns}
          rows={data.recentEnquiries}
          rowKey={(row) => row._id}
          minWidth="760px"
          emptyTitle="No enquiries yet"
          emptyMessage="Website contact form submissions will appear here."
          onRowClick={(row) => navigate(`/enquiries?open=${row._id}`)}
          mobileTitle={(row) => row.name}
          mobileSubtitle={(row) => row.reference}
          className="rounded-none shadow-none"
        />
      </div>
    </>
  );
}
