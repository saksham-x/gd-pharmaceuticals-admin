import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";

import LoadingSpinner from "./LoadingSpinner";

// ========================================
// DIALOG BOX
//
// One modal shell for the whole admin
// panel: add forms, edit forms, details,
// confirmations.
//
// Pages supply the body; this file owns
// the overlay, the panel, the header, the
// footer buttons and the close behaviour.
//
// Pass `onSubmit` and the body is wrapped
// in a <form>, so Enter saves and browser
// validation runs before onSubmit fires.
// ========================================

// ========================================
// THEME
//
// Kept in one place so a colour change
// lands on every dialog at once. Mirrors
// the tokens CustomTable uses.
// ========================================

const THEME = {
  overlay:
    "fixed inset-0 z-[100] flex items-center justify-center bg-[#17324d]/50 p-4 backdrop-blur-[3px]",

  panel:
    "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl",

  eyebrow:
    "text-xs font-bold uppercase tracking-[1.5px] text-[#147d64]",

  title:
    "mt-1.5 font-display text-2xl font-medium tracking-tight text-ink",

  description: "mt-2 text-sm text-muted",

  closeButton:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-50",

  primaryButton:
    "rounded-lg bg-[#1266B1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0e5698] disabled:cursor-not-allowed disabled:opacity-50",

  secondaryButton:
    "rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-[#1266B1] transition hover:border-[#1266B1] hover:bg-blush disabled:cursor-not-allowed disabled:opacity-50",

  dangerButton:
    "rounded-lg bg-[#DC2626] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50",
};

// ========================================
// SIZE
//
// Most add/edit forms want "md". A wide
// form with two columns wants "lg".
// ========================================

const SIZE_CLASS = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export type DialogBoxSize =
  keyof typeof SIZE_CLASS;

// ========================================
// PROPS
// ========================================

export type DialogBoxProps = {
  open: boolean;

  onClose: () => void;

  // ---- Header ----

  // Small pink line above the title,
  // e.g. "Management".
  eyebrow?: string;

  title: string;

  description?: string;

  // ---- Body ----

  children: ReactNode;

  size?: DialogBoxSize;

  // ---- Footer ----
  //
  // Leave `footer` empty to get the default
  // cancel + confirm pair. Pass your own
  // node to take over the row completely.

  footer?: ReactNode;

  confirmLabel?: string;

  cancelLabel?: string;

  // Omit to hide the confirm button, e.g.
  // for a read-only details dialog. Ignored
  // when `onSubmit` is set, since the button
  // submits the form instead.
  onConfirm?: () => void;

  // Turns the body into a <form>. The
  // confirm button becomes its submit
  // button.
  onSubmit?: () => void;

  // Disables the buttons and swaps the
  // confirm label while saving.
  submitting?: boolean;

  submittingLabel?: string;

  confirmDisabled?: boolean;

  // Paints the confirm button red, for
  // destructive actions.
  destructive?: boolean;

  // ---- Behaviour ----

  // Both default to true. Turn them off for
  // a dialog the admin must resolve, so a
  // stray click cannot discard a half
  // filled form.
  closeOnBackdrop?: boolean;

  closeOnEscape?: boolean;
};

// ========================================
// COMPONENT
// ========================================

export default function DialogBox({
  open,
  onClose,
  eyebrow,
  title,
  description,
  children,
  size = "md",
  footer,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  onConfirm,
  onSubmit,
  submitting = false,
  submittingLabel = "Saving...",
  confirmDisabled = false,
  destructive = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: DialogBoxProps) {
  const panelRef =
    useRef<HTMLDivElement | null>(null);

  // Ties the panel to its heading for
  // screen readers.
  const titleId = useId();

  // ======================================
  // ESCAPE TO CLOSE
  //
  // Listening on the document rather than
  // the panel, so the key works before
  // anything inside is focused.
  // ======================================

  useEffect(() => {
    if (!open || !closeOnEscape) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, closeOnEscape, onClose]);

  // ======================================
  // LOCK BACKGROUND SCROLL
  //
  // Without this the page behind the
  // overlay scrolls under the dialog.
  // ======================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  // ======================================
  // FOCUS THE PANEL
  //
  // So the dialog is where the keyboard
  // lands, not the page behind it.
  // ======================================

  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  // ======================================
  // SUBMIT
  // ======================================

  const handleSubmit = (
    event: FormEvent
  ) => {
    event.preventDefault();

    onSubmit?.();
  };

  const showConfirm = Boolean(
    onConfirm || onSubmit
  );

  // ======================================
  // FOOTER
  //
  // The default pair. `footer` replaces it
  // entirely when provided.
  // ======================================

  const defaultFooter = (
    <div className="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className={THEME.secondaryButton}
      >
        {cancelLabel}
      </button>

      {showConfirm && (
        <button
          type={
            onSubmit
              ? "submit"
              : "button"
          }
          onClick={
            onSubmit
              ? undefined
              : onConfirm
          }
          disabled={
            submitting ||
            confirmDisabled
          }
          className={
            destructive
              ? THEME.dangerButton
              : THEME.primaryButton
          }
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />

              {submittingLabel}
            </span>
          ) : (
            confirmLabel
          )}
        </button>
      )}
    </div>
  );

  // ======================================
  // PANEL CONTENTS
  //
  // Header and footer stay put; only the
  // body scrolls, so a long form never
  // pushes its buttons off screen.
  // ======================================

  const body = (
    <>
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          {eyebrow && (
            <p className={THEME.eyebrow}>
              {eyebrow}
            </p>
          )}

          <h2
            id={titleId}
            className={THEME.title}
          >
            {title}
          </h2>

          {description && (
            <p
              className={
                THEME.description
              }
            >
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close dialog"
          className={THEME.closeButton}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* BODY */}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {children}
      </div>

      {/* FOOTER */}

      <div className="border-t border-[#1266B1]/10 px-6 py-5">
        {footer ?? defaultFooter}
      </div>
    </>
  );

  return (
    <div
      className={THEME.overlay}
      onClick={
        closeOnBackdrop
          ? onClose
          : undefined
      }
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // The overlay closes on click, so
        // stop clicks inside the panel from
        // bubbling up to it.
        onClick={(event) =>
          event.stopPropagation()
        }
        className={`${THEME.panel} ${SIZE_CLASS[size]} outline-none`}
      >
        {onSubmit ? (
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            {body}
          </form>
        ) : (
          body
        )}
      </div>
    </div>
  );
}
