import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";

// ========================================
// ROW ACTIONS MENU
//
// The three dot button every list row uses
// instead of a strip of Edit / Delete
// buttons. Pages describe the actions;
// this file owns the look and the open /
// close behaviour.
//
// The dropdown is rendered in a portal on
// document.body with fixed coordinates.
// CustomTable clips its rows (the shell is
// rounded and hides overflow, the desktop
// body scrolls sideways), so a menu
// positioned inside the cell would be cut
// off on the last rows and on narrow
// screens.
// ========================================

// ========================================
// ACTION
// ========================================

export type RowActionTone =
  | "default"
  | "success"
  | "danger";

export type RowAction = {
  // Unique among the actions. React key
  // only, never shown.
  key: string;

  label: string;

  onSelect: () => void;

  // Shown before the label. A character
  // like "✎" is enough; there is no icon
  // package in this project.
  icon?: ReactNode;

  tone?: RowActionTone;

  disabled?: boolean;

  // Draws a hairline above this action, to
  // keep a destructive item away from the
  // rest.
  dividerBefore?: boolean;
};

// ========================================
// PROPS
// ========================================

export type RowActionsMenuProps = {
  actions: RowAction[];

  // The row is mid request. The button is
  // disabled and pulses.
  busy?: boolean;

  // Screen reader name for the button.
  label?: string;

  className?: string;
};

// ========================================
// THEME
// ========================================

const TONE: Record<
  RowActionTone,
  string
> = {
  default:
    "text-ink hover:bg-soft",

  success:
    "text-green-700 hover:bg-green-50",

  danger: "text-red-600 hover:bg-red-50",
};

// Matches the menu width below (w-44), and
// is needed before the menu exists so the
// first paint lands in the right place.
const MENU_WIDTH = 176;

// Breathing room between the button and
// the menu, and against the viewport edge.
const GAP = 8;

const EDGE = 12;

// ========================================
// COMPONENT
// ========================================

export default function RowActionsMenu({
  actions,
  busy = false,
  label = "Row actions",
  className = "",
}: RowActionsMenuProps) {
  const [open, setOpen] =
    useState(false);

  const [position, setPosition] =
    useState<{
      top: number;
      left: number;
    } | null>(null);

  const triggerRef =
    useRef<HTMLButtonElement | null>(
      null
    );

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  // ======================================
  // POSITION
  //
  // Measured after the menu renders so we
  // know its real height, then flipped
  // above the button when the space below
  // runs out.
  // ======================================

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const trigger = triggerRef.current;

    const menu = menuRef.current;

    if (!trigger || !menu) {
      return;
    }

    const rect =
      trigger.getBoundingClientRect();

    const height = menu.offsetHeight;

    const below = rect.bottom + GAP;

    const fitsBelow =
      below + height <=
      window.innerHeight - EDGE;

    const top = fitsBelow
      ? below
      : Math.max(
          EDGE,
          rect.top - GAP - height
        );

    // The right edge of the button lines
    // up with the right edge of the menu,
    // then is pulled back inside the
    // viewport when that would overflow.
    const left = Math.min(
      Math.max(
        EDGE,
        rect.right - MENU_WIDTH
      ),
      window.innerWidth -
        MENU_WIDTH -
        EDGE
    );

    setPosition({ top, left });
  }, [open]);

  // ======================================
  // CLOSE
  //
  // Outside click, Escape, and any scroll
  // or resize: the menu is fixed, so it
  // would drift away from its row instead
  // of following it.
  // ======================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (
      event: MouseEvent
    ) => {
      const target =
        event.target as Node;

      if (
        triggerRef.current?.contains(
          target
        ) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const close = () => setOpen(false);

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "resize",
      close
    );

    // Capture, so a scroll inside the
    // table body counts too.
    window.addEventListener(
      "scroll",
      close,
      true
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "resize",
        close
      );

      window.removeEventListener(
        "scroll",
        close,
        true
      );
    };
  }, [open]);

  // Nothing to show, rather than a button
  // that opens an empty card.
  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      className={`inline-flex ${className}`}
      // Rows can be clickable; opening the
      // menu must not open the row too.
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={busy}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (previous) => !previous
          )
        }
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-[#1266B1] transition disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? "border-[#1266B1] bg-blush"
            : "border-[#1266B1]/20 bg-soft hover:border-[#1266B1] hover:bg-blush"
        } ${busy ? "animate-pulse" : ""}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="8" cy="3" r="1.5" />

          <circle cx="8" cy="8" r="1.5" />

          <circle
            cx="8"
            cy="13"
            r="1.5"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,

              // Hidden for the measuring
              // pass, so the menu never
              // flashes in the corner.
              visibility: position
                ? "visible"
                : "hidden",
            }}
            className="fixed z-[60] w-44 overflow-hidden rounded-2xl border border-[#1266B1]/10 bg-surface py-2 shadow-xl"
          >
            {actions.map((action) => (
              <div key={action.key}>
                {action.dividerBefore && (
                  <div className="my-1 border-t border-[#1266B1]/10" />
                )}

                <button
                  type="button"
                  role="menuitem"
                  disabled={
                    action.disabled
                  }
                  onClick={() => {
                    setOpen(false);
                    action.onSelect();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    TONE[
                      action.tone ??
                        "default"
                    ]
                  }`}
                >
                  {action.icon && (
                    <span className="w-4 shrink-0 text-center">
                      {action.icon}
                    </span>
                  )}

                  <span>
                    {action.label}
                  </span>
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
