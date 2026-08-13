// WCAG 2 contrast utilities - shared by the web builder (real-time warning +
// save-blocking, see Sprint 7 spec §4) and the API's publish path (defense
// in depth, so "kaydetmeyi engelle" is a real guarantee and not just client
// trust). Pure math, no DOM/React dependency, so both sides can import it.

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const value = parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const linear = (channel: number): number => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

// WCAG's own formula: (L1 + 0.05) / (L2 + 0.05), lighter over darker.
export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG AA: 4.5:1 for normal text, 3:1 for large text (>=18pt / >=14pt bold).
export function meetsWcagAA(ratio: number, isLargeText = false): boolean {
  return ratio >= (isLargeText ? 3 : 4.5);
}

// Picks whichever of black/white reads better against a given background -
// used to auto-compute a safe button/badge foreground color (spec §4
// "Otomatik foreground rengi hesapla") instead of asking the business to
// guess.
export function bestForeground(backgroundHex: string): "#000000" | "#ffffff" {
  const whiteRatio = contrastRatio("#ffffff", backgroundHex);
  const blackRatio = contrastRatio("#000000", backgroundHex);
  return whiteRatio >= blackRatio ? "#ffffff" : "#000000";
}
