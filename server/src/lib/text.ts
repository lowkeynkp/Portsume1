const ACRONYMS = new Set(["AI", "UI", "UX", "CEO", "CTO", "CFO", "COO", "PhD", "MPH", "MBA"]);

/** Convert an ALL-CAPS name like "SAM CARTER" to "Sam Carter" while leaving
 *  already-mixed-case names untouched and preserving common acronyms. */
export function titleCase(name: string): string {
  if (!name) return name;
  if (/[a-z]/.test(name)) return name;
  return name
    .split(/(\s+|-)/)
    .map((word) => {
      if (ACRONYMS.has(word.toUpperCase())) return word.toUpperCase();
      if (/^[A-Za-z][A-Za-z'.]+$/.test(word)) return word[0]!.toUpperCase() + word.slice(1).toLowerCase();
      return word;
    })
    .join("");
}
