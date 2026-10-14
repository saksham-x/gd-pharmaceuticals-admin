// ========================================
// LOADING SPINNER
//
// A ring that spins in the current text
// colour, so it fits a pink button, a
// white overlay or plain text alike.
//
// Give it a `label` when it stands alone;
// leave it out when text beside it
// already says what is loading.
// ========================================

const SIZE_CLASS = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

type LoadingSpinnerProps = {
  size?: keyof typeof SIZE_CLASS;

  label?: string;

  className?: string;
};

export default function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent ${SIZE_CLASS[size]} ${className}`}
    />
  );
}
