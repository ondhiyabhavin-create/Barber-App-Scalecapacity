/**
 * Maps Supabase Auth error strings to short, user-facing copy.
 */
export function formatAuthErrorMessage(raw: string): string {
  const m = raw.toLowerCase();

  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Too many attempts from this email or network. Wait a few minutes and try again.";
  }
  if (m.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  return raw;
}
