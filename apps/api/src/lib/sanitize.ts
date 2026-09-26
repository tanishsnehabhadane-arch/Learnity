/**
 * Untrusted student free-text handling: length caps + instruction-strip patterns
 * applied before any string reaches an LLM prompt (prompt-injection defense).
 */
const MAX_TEXT_LENGTH = 4_000;

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all|any|previous) (instructions|prompts)/gi,
  /disregard (all|previous) instructions/gi,
  /system prompt/gi,
  /you are now/gi,
  /\bDAN\b/g,
];

export interface SanitizeResult {
  /** Cleaned text safe to embed in prompts as *data*. */
  text: string;
  /** True if injection patterns were detected and stripped. */
  modified: boolean;
}

export function sanitizeStudentText(raw: string): SanitizeResult {
  let text = raw.slice(0, MAX_TEXT_LENGTH).trim();
  let modified = false;
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      modified = true;
      text = text.replace(pattern, "[filtered]");
    }
  }
  return { text, modified };
}

/** Wraps untrusted text as clearly-delimited data inside a prompt. */
export function asUntrustedData(label: string, text: string): string {
  return `<${label}>\n${text}\n</${label}>`;
}
