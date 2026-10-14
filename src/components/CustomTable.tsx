import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import LoadingSpinner from "./LoadingSpinner";

// ========================================
// CUSTOM TABLE
//
// One table for the whole admin panel, so
// every list page shares the same shell,
// header, spacing, empty state and mobile
// behaviour.
//
// Pages describe their columns; this file
// owns the look.
//
// Desktop renders a real <table>. Mobile
// renders the same columns as stacked
// label/value cards, because a 10 column
// table is unreadable on a phone.
// ========================================

// ========================================
// THEME
//
// Kept in one place so a colour change
// lands everywhere at once.
// ========================================

const THEME = {
  shell:
    "overflow-hidden rounded-xl border border-line bg-surface",

  head: "bg-soft text-muted",

  headCell:
    "border-y border-line px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[.1em]",

  row: "border-b border-line transition last:border-b-0 hover:bg-soft",

  cell: "px-3 py-3 text-[12.5px] text-muted",

  muted: "text-muted",

  strong: "text-ink",
};

// ========================================
// COLUMN
//
// `render` receives the whole row, so a
// column can show anything: text, a badge,
// an image, an action menu.
// ========================================

export type TableColumnAlign =
  | "left"
  | "center"
  | "right";

export type TableColumn<T> = {
  // Unique among the columns. Used as the
  // React key only, never shown.
  key: string;

  header: ReactNode;

  render: (
    row: T,
    rowIndex: number
  ) => ReactNode;

  align?: TableColumnAlign;

  // Any CSS width, e.g. "120px" or "20%".
  width?: string;

  headerClassName?: string;

  cellClassName?: string;

  // Drop this column from the mobile card.
  // Useful for row-number or drag handles
  // that mean nothing on a phone.
  hideOnMobile?: boolean;

  // Label shown beside the value on mobile.
  // Falls back to `header` when it is a
  // plain string.
  mobileLabel?: string;
};

// ========================================
// ROW EXTRAS
//
// Anything a page wants on the row element
// itself. `className` is appended to the
// table's own row classes rather than
// replacing them.
// ========================================

export type RowExtraProps =
  HTMLAttributes<HTMLElement> & {
    draggable?: boolean;
  };

// ========================================
// PROPS
// ========================================

export type CustomTableProps<T> = {
  columns: TableColumn<T>[];

  rows: T[];

  // Stable identity per row. Prefer the
  // document id over the array index.
  rowKey: (
    row: T,
    rowIndex: number
  ) => string;

  loading?: boolean;

  loadingMessage?: string;

  // ---- Empty state ----

  emptyIcon?: ReactNode;

  emptyTitle?: string;

  emptyMessage?: string;

  // ---- Desktop ----

  // Below this the table scrolls sideways
  // instead of squashing the columns.
  minWidth?: string;

  onRowClick?: (
    row: T,
    rowIndex: number
  ) => void;

  // Extra attributes for the row element:
  // drag handlers, a highlight class, data
  // attributes. Applied to the <tr> on
  // desktop and to the card on mobile, so
  // a page can make its rows sortable
  // without owning the whole table.
  rowProps?: (
    row: T,
    rowIndex: number
  ) => RowExtraProps;

  // ---- Mobile card ----
  //
  // The card header. Without these the card
  // is just the label/value list.

  mobileTitle?: (row: T) => ReactNode;

  mobileSubtitle?: (
    row: T
  ) => ReactNode;

  mobileBadge?: (row: T) => ReactNode;

  // Pinned to the top right of each card,
  // beside the badge. This is where the
  // three dot menu goes: a card has no
  // Actions column to put it in.
  mobileActions?: (row: T) => ReactNode;

  // Pinned to the bottom of each card, for
  // anything wider than the menu.
  mobileFooter?: (row: T) => ReactNode;

  // ---- Extras ----

  // Sits below the rows on both layouts.
  // Pagination goes here.
  footer?: ReactNode;

  className?: string;
};

// ========================================
// ALIGNMENT
// ========================================

const alignClass = (
  align: TableColumnAlign = "left"
) => {
  if (align === "center") {
    return "text-center";
  }

  if (align === "right") {
    return "text-right";
  }

  return "text-left";
};

// ========================================
// MOBILE LABEL
//
// Only a string header can double as the
// label. A custom node (say a checkbox)
// cannot, so that column goes unlabelled.
// ========================================

const mobileLabelFor = <T,>(
  column: TableColumn<T>
) => {
  if (column.mobileLabel) {
    return column.mobileLabel;
  }

  if (typeof column.header === "string") {
    return column.header;
  }

  return "";
};

// ========================================
// STATE MESSAGES
//
// Loading and empty are rendered once and
// shared by both layouts, so the two never
// drift apart.
// ========================================

type StateMessageProps = {
  icon?: ReactNode;
  title?: string;
  message?: string;
};

function StateMessage({
  icon,
  title,
  message,
}: StateMessageProps) {
  return (
    <div className="px-6 py-14 text-center">
      {icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soft text-xl text-[#1266B1]">
          {icon}
        </div>
      )}

      {title && (
        <p
          className={`font-medium ${THEME.strong}`}
        >
          {title}
        </p>
      )}

      {message && (
        <p
          className={`mt-2 text-sm ${THEME.muted}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

// ========================================
// COMPONENT
// ========================================

export default function CustomTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  loadingMessage = "Loading...",
  emptyIcon,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  minWidth = "900px",
  onRowClick,
  rowProps,
  mobileTitle,
  mobileSubtitle,
  mobileBadge,
  mobileActions,
  mobileFooter,
  footer,
  className = "",
}: CustomTableProps<T>) {
  const isEmpty = rows.length === 0;

  const mobileColumns = columns.filter(
    (column) => !column.hideOnMobile
  );

  // ======================================
  // LOADING / EMPTY
  //
  // Both replace the rows entirely, so we
  // skip the table shell and show one
  // message instead of an empty grid.
  // ======================================

  if (loading || isEmpty) {
    return (
      <div
        className={`${THEME.shell} ${className}`}
      >
        {loading ? (
          <div
            role="status"
            className="flex flex-col items-center gap-4 px-6 py-14 text-center"
          >
            <LoadingSpinner
              size="lg"
              className="text-[#1266B1]"
            />

            <p
              className={`text-sm ${THEME.muted}`}
            >
              {loadingMessage}
            </p>
          </div>
        ) : (
          <StateMessage
            icon={emptyIcon}
            title={emptyTitle}
            message={emptyMessage}
          />
        )}

        {footer}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* ================================ */}
      {/* MOBILE                           */}
      {/* ================================ */}

      <div className="grid gap-4 md:hidden">
        {rows.map((row, rowIndex) => {
          const {
            className: extraClassName =
              "",
            ...extra
          } =
            rowProps?.(row, rowIndex) ??
            {};

          return (
          <div
            key={rowKey(row, rowIndex)}
            onClick={
              onRowClick
                ? () =>
                    onRowClick(
                      row,
                      rowIndex
                    )
                : undefined
            }
            {...extra}
            className={`rounded-xl border border-line bg-surface p-4 ${
              onRowClick
                ? "cursor-pointer"
                : ""
            } ${extraClassName}`}
          >
            {/* CARD HEADER */}

            {(mobileTitle ||
              mobileBadge ||
              mobileActions) && (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {mobileTitle && (
                    <h3
                      className={`font-semibold ${THEME.strong}`}
                    >
                      {mobileTitle(row)}
                    </h3>
                  )}

                  {mobileSubtitle && (
                    <p
                      className={`mt-1 text-xs ${THEME.muted}`}
                    >
                      {mobileSubtitle(
                        row
                      )}
                    </p>
                  )}
                </div>

                {(mobileBadge ||
                  mobileActions) && (
                  <div className="flex shrink-0 items-center gap-2">
                    {mobileBadge?.(row)}

                    {mobileActions?.(
                      row
                    )}
                  </div>
                )}
              </div>
            )}

            {/* LABEL / VALUE LIST */}

            <div
              className={`mt-4 space-y-2 text-sm ${THEME.muted}`}
            >
              {mobileColumns.map(
                (column) => {
                  const label =
                    mobileLabelFor(
                      column
                    );

                  return (
                    <div
                      key={column.key}
                      className="flex gap-2 break-words"
                    >
                      {label && (
                        <span
                          className={`shrink-0 font-medium ${THEME.strong}`}
                        >
                          {label}:
                        </span>
                      )}

                      <span className="min-w-0">
                        {column.render(
                          row,
                          rowIndex
                        )}
                      </span>
                    </div>
                  );
                }
              )}
            </div>

            {/* CARD FOOTER */}

            {mobileFooter && (
              <div className="mt-5">
                {mobileFooter(row)}
              </div>
            )}
          </div>
          );
        })}

        {footer}
      </div>

      {/* ================================ */}
      {/* DESKTOP                          */}
      {/* ================================ */}

      <div
        className={`hidden md:block ${THEME.shell}`}
      >
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            style={{ minWidth }}
          >
            <thead className={THEME.head}>
              <tr>
                {columns.map(
                  (column) => (
                    <th
                      key={column.key}
                      style={
                        column.width
                          ? {
                              width:
                                column.width,
                            }
                          : undefined
                      }
                      className={`${
                        THEME.headCell
                      } ${alignClass(
                        column.align
                      )} ${
                        column.headerClassName ??
                        ""
                      }`}
                    >
                      {column.header}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (row, rowIndex) => {
                  const {
                    className:
                      extraClassName = "",
                    ...extra
                  } =
                    rowProps?.(
                      row,
                      rowIndex
                    ) ?? {};

                  return (
                  <tr
                    key={rowKey(
                      row,
                      rowIndex
                    )}
                    onClick={
                      onRowClick
                        ? () =>
                            onRowClick(
                              row,
                              rowIndex
                            )
                        : undefined
                    }
                    {...extra}
                    className={`${
                      THEME.row
                    } ${
                      onRowClick
                        ? "cursor-pointer"
                        : ""
                    } ${extraClassName}`}
                  >
                    {columns.map(
                      (column) => (
                        <td
                          key={
                            column.key
                          }
                          className={`${
                            THEME.cell
                          } ${alignClass(
                            column.align
                          )} ${
                            column.cellClassName ??
                            ""
                          }`}
                        >
                          {column.render(
                            row,
                            rowIndex
                          )}
                        </td>
                      )
                    )}
                  </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        {footer}
      </div>
    </div>
  );
}
