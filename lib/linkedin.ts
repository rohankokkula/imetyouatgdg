// LinkedIn's OIDC sign-in doesn't return the profile URL, so we ask for the handle once.

/** Accepts "rohan", "@rohan", "linkedin.com/in/rohan/", "https://www.linkedin.com/in/rohan?x=1". */
export function parseHandle(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const fromUrl = s.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
  const handle = (fromUrl ? fromUrl[1] : s.replace(/^@/, "")).replace(/\/+$/, "");
  try {
    const decoded = decodeURIComponent(handle);
    return /^[\p{L}\p{N}_-]{2,100}$/u.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export function profileUrl(handle: string | null, name: string): string {
  return handle
    ? `https://www.linkedin.com/in/${encodeURIComponent(handle)}/`
    : `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;
}
