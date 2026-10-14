// ========================================
// VALIDATION
//
// One set of rules for every admin form.
// A page describes its fields once and
// gets back the first message to show:
//
//   const error = validate(form, {
//     name: ["Name", [required()]],
//     price: ["Price", [required(), number({ min: 0 })]],
//   });
//
//   if (error) {
//     toast.error(error);
//     return;
//   }
//
// Every rule except `required` passes an
// empty value, so optional fields are only
// checked once the admin fills them in.
// ========================================

// A rule returns a message when the value
// fails, nothing when it passes. `label`
// is the field name used in the message.
export type Rule = (
  value: unknown,
  label: string
) => string | undefined;

// ========================================
// HELPERS
// ========================================

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" &&
    value.trim() === "") ||
  (Array.isArray(value) &&
    value.length === 0);

const asText = (value: unknown) =>
  String(value).trim();

// ========================================
// TEXT RULES
// ========================================

export const required =
  (message?: string): Rule =>
  (value, label) =>
    isEmpty(value)
      ? message ?? `${label} is required.`
      : undefined;

export const minLength =
  (length: number, message?: string): Rule =>
  (value, label) =>
    !isEmpty(value) &&
    asText(value).length < length
      ? message ??
        `${label} must be at least ${length} characters.`
      : undefined;

export const maxLength =
  (length: number, message?: string): Rule =>
  (value, label) =>
    !isEmpty(value) &&
    asText(value).length > length
      ? message ??
        `${label} must be at most ${length} characters.`
      : undefined;

export const pattern =
  (regex: RegExp, message: string): Rule =>
  (value) =>
    !isEmpty(value) &&
    !regex.test(asText(value))
      ? message
      : undefined;

// ========================================
// FORMAT RULES
// ========================================

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Digits with optional +, spaces, dashes
// and brackets; 7 to 15 digits in total.
const PHONE_REGEX = /^\+?[\d\s\-()]+$/;

export const email =
  (message?: string): Rule =>
  (value, label) =>
    !isEmpty(value) &&
    !EMAIL_REGEX.test(asText(value))
      ? message ??
        `${label} must be a valid email address.`
      : undefined;

export const phone =
  (message?: string): Rule =>
  (value, label) => {
    if (isEmpty(value)) {
      return undefined;
    }

    const text = asText(value);

    const digits = text.replace(/\D/g, "");

    return !PHONE_REGEX.test(text) ||
      digits.length < 7 ||
      digits.length > 15
      ? message ??
          `${label} must be a valid phone number.`
      : undefined;
  };

export const url =
  (message?: string): Rule =>
  (value, label) => {
    if (isEmpty(value)) {
      return undefined;
    }

    try {
      const parsed = new URL(asText(value));

      if (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      ) {
        return undefined;
      }
    } catch {
      // Falls through to the message.
    }

    return (
      message ??
      `${label} must be a valid URL.`
    );
  };

// ========================================
// NUMBER RULES
//
// Form inputs hold numbers as strings, so
// these accept either and parse first.
// ========================================

type NumberOptions = {
  min?: number;
  max?: number;
  integer?: boolean;
};

export const number =
  (
    { min, max, integer }: NumberOptions = {},
    message?: string
  ): Rule =>
  (value, label) => {
    if (isEmpty(value)) {
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return (
        message ??
        `${label} must be a number.`
      );
    }

    if (
      integer &&
      !Number.isInteger(parsed)
    ) {
      return (
        message ??
        `${label} must be a whole number.`
      );
    }

    if (min !== undefined && parsed < min) {
      return (
        message ??
        `${label} must be at least ${min}.`
      );
    }

    if (max !== undefined && parsed > max) {
      return (
        message ??
        `${label} must be at most ${max}.`
      );
    }

    return undefined;
  };

// ========================================
// FILE RULES
// ========================================

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type ImageOptions = {
  types?: string[];
  maxSizeMB?: number;
};

export const validImage =
  ({
    types = IMAGE_TYPES,
    maxSizeMB = 5,
  }: ImageOptions = {}): Rule =>
  (value) => {
    if (!(value instanceof File)) {
      return undefined;
    }

    if (!types.includes(value.type)) {
      return "Please upload a JPG, PNG or WebP image.";
    }

    if (
      value.size >
      maxSizeMB * 1024 * 1024
    ) {
      return `Image must be smaller than ${maxSizeMB} MB.`;
    }

    return undefined;
  };

// ========================================
// RUNNERS
// ========================================

// Checks one value, e.g. a file picked
// outside the form state.
export const validateField = (
  value: unknown,
  label: string,
  rules: Rule[]
) => {
  for (const rule of rules) {
    const message = rule(value, label);

    if (message) {
      return message;
    }
  }

  return undefined;
};

// Field name -> [label, rules]. Only the
// fields listed are checked, in order.
export type Schema<T> = Partial<
  Record<keyof T, [string, Rule[]]>
>;

// Returns the first failing message, in
// the order the schema lists the fields.
export const validate = <T extends object>(
  values: T,
  schema: Schema<T>
) => {
  for (const key of Object.keys(
    schema
  ) as (keyof T)[]) {
    const [label, rules] = schema[key]!;

    const message = validateField(
      values[key],
      label,
      rules
    );

    if (message) {
      return message;
    }
  }

  return undefined;
};
