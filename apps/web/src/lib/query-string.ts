// Shared by every admin list service - drops undefined/empty values instead
// of sending literal "undefined" query params. Takes `object` (not
// `Record<string, ...>`) so named param interfaces without an explicit
// index signature can be passed directly without a cast.
export function buildQueryString(params: object): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value as string | number | boolean));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}
