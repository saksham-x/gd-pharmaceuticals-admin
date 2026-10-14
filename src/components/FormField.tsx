import type { ReactNode } from "react";

// ========================================
// FORM FIELD
//
// The label above every admin form input,
// with a red * on required fields so the
// admin knows before they hit Save.
//
// Wrap a plain input and the label is tied
// to it without ids:
//
//   <FormField label="Price" required>
//     <input required ... />
//   </FormField>
//
// Keep `required` on the input as well:
// the * only tells the admin, the input's
// attribute is what blocks the submit.
//
// For something that is not a single
// input (an editor, an image picker) use
// FormLabel on its own.
// ========================================

const THEME = {
  label:
    "mb-2 block text-sm font-medium text-ink",

  asterisk: "ml-0.5 text-[#DC2626]",

  hint: "ml-1 text-xs font-normal text-muted",
};

type LabelProps = {
  label: ReactNode;

  required?: boolean;

  // Small grey note after the label,
  // e.g. "e.g. 3 Months".
  hint?: string;
};

// The text, the * and the hint. Screen
// readers hear "(required)" instead of
// "star".
function LabelText({
  label,
  required = false,
  hint,
}: LabelProps) {
  return (
    <>
      {label}

      {required && (
        <>
          <span
            aria-hidden="true"
            className={THEME.asterisk}
          >
            *
          </span>

          <span className="sr-only">
            {" "}
            (required)
          </span>
        </>
      )}

      {hint && (
        <span className={THEME.hint}>
          {hint}
        </span>
      )}
    </>
  );
}

// ========================================
// FORM LABEL
//
// Label only. Pass `htmlFor` to point it
// at an input by id; without it the label
// is plain text.
// ========================================

export function FormLabel({
  htmlFor,
  ...props
}: LabelProps & { htmlFor?: string }) {
  return htmlFor ? (
    <label
      htmlFor={htmlFor}
      className={THEME.label}
    >
      <LabelText {...props} />
    </label>
  ) : (
    <p className={THEME.label}>
      <LabelText {...props} />
    </p>
  );
}

// ========================================
// FORM FIELD
//
// Label wrapped around one input.
// ========================================

type FormFieldProps = LabelProps & {
  // Grid placement, e.g. "md:col-span-2".
  className?: string;

  children: ReactNode;
};

export default function FormField({
  className = "",
  children,
  ...props
}: FormFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className={THEME.label}>
        <LabelText {...props} />
      </span>

      {children}
    </label>
  );
}
