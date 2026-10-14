import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import CustomTable, {
  type TableColumn,
} from "../../components/CustomTable";

import DialogBox from "../../components/DialogBox";

import { getApiErrorMessage } from "../../services/base/api";

import {
  getActivityLogFilters,
  getActivityLogs,
} from "../../services/activityLog/activityLogService";

import type {
  ActivityAction,
  ActivityLog,
  ActivityLogFilters,
  ActivityLogPage,
  ActivityLogQuery,
} from "../../services/activityLog/activityLog.types";

// ========================================
// DEFAULTS
// ========================================

const PAGE_SIZE = 25;

const EMPTY_QUERY: ActivityLogQuery = {
  page: 1,
  limit: PAGE_SIZE,
  search: "",
  actor: "",
  resource: "",
  action: "",
  from: "",
  to: "",
};

// How long typing in the search box waits
// before asking the API.
const SEARCH_DELAY_MS = 300;

// ========================================
// LABELS
// ========================================

const ACTIONS: Record<
  ActivityAction,
  { label: string; verb: string; pill: string }
> = {
  create: {
    label: "Created",
    verb: "created",
    pill: "bg-green-100 text-green-700",
  },
  update: {
    label: "Updated",
    verb: "updated",
    pill: "bg-blue-100 text-blue-700",
  },
  delete: {
    label: "Deleted",
    verb: "deleted",
    pill: "bg-red-100 text-red-700",
  },
  login: {
    label: "Logged in",
    verb: "logged in",
    pill: "bg-blush text-[#1266B1]",
  },
  login_failed: {
    label: "Failed login",
    verb: "failed to log in",
    pill: "bg-yellow-100 text-yellow-700",
  },
};

// ========================================
// SHARED STYLES
// ========================================

const fieldClass =
  "w-full rounded-xl border border-[#1266B1]/20 bg-soft px-4 py-3 text-sm text-ink outline-none focus:border-[#1266B1]";

const pagerButton =
  "rounded-full border border-[#1266B1] px-5 py-2 text-xs uppercase tracking-[2px] text-[#1266B1] transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40";

// ========================================
// FORMATTING
// ========================================

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

// "3 minutes ago", "yesterday"...
const formatRelative = (value: string) => {
  const seconds = Math.round(
    (new Date(value).getTime() - Date.now()) /
      1000
  );

  const units: [Intl.RelativeTimeFormatUnit, number][] =
    [
      ["year", 31536000],
      ["month", 2592000],
      ["week", 604800],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
    ];

  const format = new Intl.RelativeTimeFormat(
    undefined,
    { numeric: "auto" }
  );

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return format.format(
        Math.round(seconds / size),
        unit
      );
    }
  }

  return "just now";
};

// A readable name for the role key
// stored on the entry.
const formatRole = (role: string) =>
  role
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word[0].toUpperCase() + word.slice(1)
    )
    .join(" ");

export default function ActivityLogsAdmin() {
  const [query, setQuery] =
    useState<ActivityLogQuery>(EMPTY_QUERY);

  // The search box updates this at once;
  // `query.search` follows after a pause.
  const [searchInput, setSearchInput] =
    useState("");

  const [result, setResult] =
    useState<ActivityLogPage | null>(null);

  const [filters, setFilters] =
    useState<ActivityLogFilters | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [selected, setSelected] =
    useState<ActivityLog | null>(null);

  const resourceLabel = (key: string) =>
    filters?.resources.find(
      (resource) => resource.key === key
    )?.label ?? key;

  // ============================
  // FETCH
  // ============================

  useEffect(() => {
    getActivityLogFilters()
      .then(setFilters)
      .catch((error: unknown) => {
        console.error(
          "Fetch log filters error:",
          error
        );
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    getActivityLogs(query)
      .then((page) => {
        if (!cancelled) {
          setResult(page);
        }
      })
      .catch((error: unknown) => {
        console.error(
          "Fetch activity logs error:",
          error
        );

        if (!cancelled) {
          toast.error(
            getApiErrorMessage(
              error,
              "Failed to load activity logs"
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    // A slow older request must not
    // overwrite a newer one.
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((previous) =>
        previous.search === searchInput.trim()
          ? previous
          : {
              ...previous,
              search: searchInput.trim(),
              page: 1,
            }
      );
    }, SEARCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Any filter change starts again from
  // the first page.
  const setFilter = (
    field: Exclude<
      keyof ActivityLogQuery,
      "page" | "limit" | "search"
    >,
    value: string
  ) => {
    setQuery((previous) => ({
      ...previous,
      [field]: value,
      page: 1,
    }));
  };

  const resetFilters = () => {
    setSearchInput("");
    setQuery(EMPTY_QUERY);
  };

  const hasFilters =
    searchInput !== "" ||
    query.actor !== "" ||
    query.resource !== "" ||
    query.action !== "" ||
    query.from !== "" ||
    query.to !== "";

  // ============================
  // ROW PIECES
  // ============================

  const actionBadge = (log: ActivityLog) => (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs uppercase tracking-[1px] ${
        ACTIONS[log.action].pill
      }`}
    >
      {ACTIONS[log.action].label}
    </span>
  );

  const whenCell = (log: ActivityLog) => (
    <span title={formatDateTime(log.createdAt)}>
      <span className="block whitespace-nowrap text-ink">
        {formatRelative(log.createdAt)}
      </span>

      <span className="block whitespace-nowrap text-xs text-muted">
        {formatDateTime(log.createdAt)}
      </span>
    </span>
  );

  const actorCell = (log: ActivityLog) => (
    <span className="block min-w-0">
      <span className="block truncate font-medium text-ink">
        {log.actorName || "Unknown"}
      </span>

      <span className="block truncate text-xs text-muted">
        {log.actorEmail}
        {log.actorRole &&
          ` · ${formatRole(log.actorRole)}`}
      </span>
    </span>
  );

  const targetCell = (log: ActivityLog) => {
    if (log.resource === "auth") {
      return (
        <span className="text-muted">—</span>
      );
    }

    return (
      <span className="block min-w-0">
        <span className="block text-ink">
          {resourceLabel(log.resource)}
        </span>

        <span className="block truncate text-xs text-muted">
          {log.targetLabel ??
            (log.targetId
              ? `#${log.targetId.slice(-6)}`
              : "")}
        </span>
      </span>
    );
  };

  const detailsButton = (log: ActivityLog) => (
    <button
      type="button"
      onClick={() => setSelected(log)}
      className="rounded-full px-4 py-2 text-xs uppercase tracking-[1px] text-[#1266B1] transition hover:bg-blush"
    >
      Details
    </button>
  );

  // "Asha updated Blogs "Summer glow"".
  const sentence = (log: ActivityLog) => {
    const who =
      log.actorName || log.actorEmail;

    if (log.resource === "auth") {
      return `${who} ${ACTIONS[log.action].verb}.`;
    }

    const what = log.targetLabel
      ? ` "${log.targetLabel}"`
      : "";

    return `${who} ${
      ACTIONS[log.action].verb
    } ${resourceLabel(log.resource)}${what}.`;
  };

  // ============================
  // COLUMNS
  // ============================

  const columns: TableColumn<ActivityLog>[] =
    [
      {
        key: "when",
        header: "When",
        width: "170px",
        render: whenCell,
      },
      {
        key: "actor",
        header: "Admin",
        hideOnMobile: true,
        render: actorCell,
      },
      {
        key: "action",
        header: "Action",
        width: "140px",
        hideOnMobile: true,
        render: actionBadge,
      },
      {
        key: "target",
        header: "Page / Item",
        render: targetCell,
      },
      {
        key: "details",
        header: "",
        align: "right",
        width: "110px",
        hideOnMobile: true,
        render: detailsButton,
      },
    ];

  // ============================
  // UI
  // ============================

  const firstShown = result
    ? (result.page - 1) * PAGE_SIZE + 1
    : 0;

  const lastShown = result
    ? firstShown + result.items.length - 1
    : 0;

  return (
    <div>
      {/* HEADER */}

      <div>
        <p className="text-xs uppercase tracking-[3px] text-[#1266B1]">
          Management
        </p>

        <h1 className="mt-2 font-display text-4xl text-[#1266B1] md:text-5xl">
          Activity Logs
        </h1>

        <p className="mt-2 text-muted">
          Every change made in this admin
          panel, and every login, newest
          first. Entries are kept for a year
          and cannot be edited.
        </p>
      </div>

      {/* FILTERS */}

      <div className="mt-10 rounded-3xl bg-surface p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search admin or item..."
            aria-label="Search"
            className={`${fieldClass} xl:col-span-2`}
          />

          <select
            value={query.actor}
            onChange={(event) =>
              setFilter(
                "actor",
                event.target.value
              )
            }
            aria-label="Admin"
            className={fieldClass}
          >
            <option value="">All admins</option>

            {filters?.actors.map((actor) => (
              <option
                key={actor.id}
                value={actor.id}
              >
                {actor.name || actor.email}
              </option>
            ))}
          </select>

          <select
            value={query.resource}
            onChange={(event) =>
              setFilter(
                "resource",
                event.target.value
              )
            }
            aria-label="Page"
            className={fieldClass}
          >
            <option value="">All pages</option>

            {filters?.resources.map(
              (resource) => (
                <option
                  key={resource.key}
                  value={resource.key}
                >
                  {resource.label}
                </option>
              )
            )}
          </select>

          <select
            value={query.action}
            onChange={(event) =>
              setFilter(
                "action",
                event.target.value
              )
            }
            aria-label="Action"
            className={fieldClass}
          >
            <option value="">All actions</option>

            {(
              Object.keys(
                ACTIONS
              ) as ActivityAction[]
            ).map((action) => (
              <option
                key={action}
                value={action}
              >
                {ACTIONS[action].label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={query.from}
              max={query.to || undefined}
              onChange={(event) =>
                setFilter(
                  "from",
                  event.target.value
                )
              }
              aria-label="From date"
              title="From"
              className={`${fieldClass} px-3`}
            />

            <input
              type="date"
              value={query.to}
              min={query.from || undefined}
              onChange={(event) =>
                setFilter(
                  "to",
                  event.target.value
                )
              }
              aria-label="To date"
              title="To"
              className={`${fieldClass} px-3`}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>
            {result && result.total > 0
              ? `Showing ${firstShown}–${lastShown} of ${result.total} entr${
                  result.total === 1
                    ? "y"
                    : "ies"
                }`
              : "No entries"}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs uppercase tracking-[1px] text-[#1266B1] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}

      <CustomTable
        className="mt-6"
        columns={columns}
        rows={result?.items ?? []}
        rowKey={(log) => log._id}
        loading={loading}
        loadingMessage="Loading activity..."
        emptyIcon="🕘"
        emptyTitle={
          hasFilters
            ? "Nothing matches these filters"
            : "No activity yet"
        }
        emptyMessage={
          hasFilters
            ? "Try a wider date range or clear the filters."
            : "Changes made in the admin panel will show up here."
        }
        minWidth="820px"
        onRowClick={(log) => setSelected(log)}
        mobileTitle={actorCell}
        mobileBadge={actionBadge}
      />

      {/* PAGINATION */}

      {result && result.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={
              loading || result.page <= 1
            }
            onClick={() =>
              setQuery((previous) => ({
                ...previous,
                page: previous.page - 1,
              }))
            }
            className={pagerButton}
          >
            Previous
          </button>

          <span className="text-sm text-muted">
            Page {result.page} of{" "}
            {result.pages}
          </span>

          <button
            type="button"
            disabled={
              loading ||
              result.page >= result.pages
            }
            onClick={() =>
              setQuery((previous) => ({
                ...previous,
                page: previous.page + 1,
              }))
            }
            className={pagerButton}
          >
            Next
          </button>
        </div>
      )}

      {/* ============================ */}
      {/* DETAILS                      */}
      {/* ============================ */}

      <DialogBox
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        eyebrow="Activity"
        title={
          selected
            ? ACTIONS[selected.action].label
            : ""
        }
        description={
          selected
            ? sentence(selected)
            : undefined
        }
        size="lg"
        cancelLabel="Close"
      >
        {selected && (
          <div>
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              {[
                [
                  "When",
                  formatDateTime(
                    selected.createdAt
                  ),
                ],
                [
                  "Admin",
                  selected.actorName
                    ? `${selected.actorName} (${selected.actorEmail})`
                    : selected.actorEmail,
                ],
                [
                  "Role",
                  selected.actorRole
                    ? formatRole(
                        selected.actorRole
                      )
                    : "—",
                ],
                [
                  "Page",
                  selected.resource === "auth"
                    ? "Login"
                    : resourceLabel(
                        selected.resource
                      ),
                ],
                [
                  "Item",
                  selected.targetLabel ?? "—",
                ],
                [
                  "Item ID",
                  selected.targetId ?? "—",
                ],
                [
                  "Request",
                  `${selected.method} ${selected.path} → ${selected.statusCode}`,
                ],
                ["IP address", selected.ip ?? "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0"
                >
                  <dt className="text-xs uppercase tracking-[1px] text-muted">
                    {label}
                  </dt>

                  <dd className="mt-1 break-words text-ink">
                    {value}
                  </dd>
                </div>
              ))}

              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs uppercase tracking-[1px] text-muted">
                  Browser
                </dt>

                <dd className="mt-1 break-words text-xs text-muted">
                  {selected.userAgent ?? "—"}
                </dd>
              </div>
            </dl>

            {selected.details != null && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[1px] text-muted">
                  Submitted data
                </p>

                <pre className="mt-2 max-h-80 overflow-auto rounded-2xl bg-soft p-4 text-xs leading-relaxed text-ink">
                  {JSON.stringify(
                    selected.details,
                    null,
                    2
                  )}
                </pre>

                <p className="mt-2 text-xs text-muted">
                  Passwords are never stored.
                  Long text is shortened.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogBox>
    </div>
  );
}
