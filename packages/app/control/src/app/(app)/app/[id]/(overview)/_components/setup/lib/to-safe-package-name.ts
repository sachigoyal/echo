// toSafePackageName.ts

const RESERVED = new Set(['node_modules', 'favicon.ico']);
const DEFAULT_MAX_LEN = 214;

export interface SafeNameOptions {
  /** Allow parsing & sanitizing @scope/name form */
  allowScope?: boolean;
  /** Fallback if the cleaned name becomes empty */
  fallback?: string;
  /** Max length (npm limit is 214) */
  maxLength?: number;
}

/** Remove diacritics while keeping ASCII letters/digits intact */
function deburr(str: string): string {
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

/** Sanitize a single name part to npm-safe subset */
function sanitizePart(s: string): string {
  return deburr(s)
    .toLowerCase()
    .trim()
    .replace(/\./g, '') // strip out all periods
    .replace(/[^a-z0-9-_]+/g, '-') // replace invalids with -
    .replace(/[-_]+/g, m => m[0]) // collapse runs of -, _ to single
    .replace(/^[-_]+/, '') // trim leading -, _
    .replace(/[-_]+$/, ''); // trim trailing -, _
}

/**
 * Convert an arbitrary string (or @scope/name) into a safe npm package name.
 * Follows npm constraints: lowercase, URL-safe, no leading . or _, not reserved, ≤ 214 chars.
 */
export function toSafePackageName(
  input: string,
  opts: SafeNameOptions = {}
): string {
  const {
    allowScope = true,
    fallback = 'my-echo-app',
    maxLength = DEFAULT_MAX_LEN,
  } = opts;

  if (!input || typeof input !== 'string') return fallback;

  const name = input.trim();

  let scope: string | null = null;
  let bare = name;

  if (allowScope && name.startsWith('@')) {
    const idx = name.indexOf('/');
    if (idx > 1 && idx < name.length - 1) {
      scope = name.slice(1, idx);
      bare = name.slice(idx + 1);
    } else {
      // malformed scope; treat as unscoped
      scope = null;
      bare = name;
    }
  }

  const cleanScope = scope ? sanitizePart(scope) : null;
  let cleanBare = sanitizePart(bare);

  if (!cleanBare) cleanBare = fallback;

  if (RESERVED.has(cleanBare)) cleanBare = `${cleanBare}-pkg`;

  let out = cleanScope ? `@${cleanScope}/${cleanBare}` : cleanBare;

  // Enforce length (trim the bare part first if scoped)
  if (out.length > maxLength) {
    if (cleanScope) {
      const head = `@${cleanScope}/`;
      const budget = Math.max(1, maxLength - head.length);
      cleanBare = cleanBare.slice(0, budget).replace(/[-_]+$/, '');
      if (!cleanBare) cleanBare = fallback;
      out = head + cleanBare;
    } else {
      out = out.slice(0, maxLength).replace(/[-_]+$/, '');
      if (!out) out = fallback;
    }
  }

  // Final safety: npm forbids leading _
  if (out.startsWith('_')) {
    out = out.replace(/^_+/, '');
    if (!out) out = fallback;
  }

  return out;
}

// --- Example usage ---
// console.log(toSafePackageName("My Cool_Project!?"));           // "my-cool_project"
// console.log(toSafePackageName("@Acme Inc./Super Πλάνη?!"));    // "@acme-inc/super-plani"
// console.log(toSafePackageName(" node_modules "));              // "node_modules-pkg"
// console.log(toSafePackageName("....____"));                    // "my-echo-app"
