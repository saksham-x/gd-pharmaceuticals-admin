import {
  useState,
  type InputHTMLAttributes,
} from "react";

// ========================================
// PASSWORD INPUT
//
// A password field with an eye button
// that shows or hides what was typed.
// Takes every normal <input> prop except
// `type`; `className` styles the input
// itself (leave room on the right for the
// button, e.g. pr-12).
// ========================================

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export default function PasswordInput(
  props: PasswordInputProps
) {
  const [visible, setVisible] =
    useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
      />

      <button
        type="button"
        onClick={() =>
          setVisible((prev) => !prev)
        }
        aria-label={
          visible
            ? "Hide password"
            : "Show password"
        }
        className="absolute inset-y-0 right-0 flex items-center px-4 text-[#1266B1] hover:text-[#0e5698]"
      >
        {visible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
