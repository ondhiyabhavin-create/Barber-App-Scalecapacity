/**
 * URL-safe segment from a business name — no random suffix.
 * Used as the public /book/[slug] identifier.
 */
export function slugifyName(input: string) {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "shop";
}

/** Next candidate when `slugifyName` collides (e.g. shop → shop-2). */
export function slugWithCollisionSuffix(base: string, attempt: number) {
  if (attempt <= 1) return base;
  return `${base}-${attempt}`;
}
