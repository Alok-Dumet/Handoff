/** Clerk 7.5.8's development keyless redirect embeds an unescaped return URL. */
export function keylessReturnUrl(requestUrl: string): URL {
  const request = new URL(requestUrl);
  const fallback = new URL("/", request);
  const raw = request.search.slice("?returnUrl=".length);
  // Preserve the original query, including encoded ampersands inside values.
  // Also accept a correctly encoded returnUrl when the dependency is fixed.
  let target = request.search.startsWith("?returnUrl=http")
    && /^https?:\/\//.test(raw)
    ? raw
    : request.searchParams.get("returnUrl");
  if (!target) return fallback;
  // Next may encode the first returnUrl value before invoking middleware,
  // leaving the remaining original query parameters at the outer level.
  if (!/^https?:\/\//.test(raw)) {
    const remaining = new URLSearchParams(request.searchParams);
    remaining.delete("returnUrl");
    if (remaining.size) target += `${target.includes("?") ? "&" : "?"}${remaining}`;
  }
  try {
    const url = new URL(target, request);
    if (url.origin !== request.origin || url.pathname === "/clerk-sync-keyless") {
      return fallback;
    }
    return url;
  } catch {
    return fallback;
  }
}
