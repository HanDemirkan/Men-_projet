// Dotless-i/ş/ğ are distinct Unicode base characters, not diacritic
// compositions - NFKD alone doesn't transliterate them, it would just drop
// them. Mapped explicitly first since this is a Turkish-market product.
// Shared by Product and Category slug generation (Sprint 3A / 3B).
const TURKISH_CHAR_MAP: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g" };

export function slugify(name: string): string {
  const transliterated = name.replace(/[ışŞğĞİ]/g, (char) => TURKISH_CHAR_MAP[char] ?? char);

  return transliterated
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip remaining combining diacritics (e.g. ç -> c, ü -> u)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
