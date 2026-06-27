const YEAR = String.raw`\d{4}`;
const ORDINAL = String.raw`\d+(?:st|nd|rd|th)`;
const REMASTER = String.raw`(?:${YEAR}\s*)?re[-\s]?master(?:ed|is(?:e|é|ee|ée)|isé|isée|isee)?(?:\s*${YEAR})?`;
const CREDIT = String.raw`(?:feat\.?|ft\.?|featuring|avec|with)\s+[^()[\]-]+`;
const MIX = String.raw`(?:[^()[\]-]+\s+)?(?:remix|mix|edit|version)`;
const EDITION = String.raw`(?:(?:${ORDINAL}|xx)\s*)?(?:(?:anniversary|super)\s*)?(?:radio edit|single version|album version|extended version|deluxe edition|expanded edition|bonus edition|special edition|anniversary edition|mono)`;
const ANNIVERSARY = String.raw`${ORDINAL}\s*anniversary`;
const JUNK = String.raw`(?:${YEAR}|${REMASTER}|${CREDIT}|${MIX}|${EDITION}|${ANNIVERSARY})`;
const TRAILING_JUNK_VALUE = String.raw`(?:(?:[-:/]\s*)?${REMASTER}|(?:[-:/]\s*)?${CREDIT}|(?:[-:/]\s*)?${MIX}|(?:[-:/]\s*)?${EDITION}|(?:[-:/]\s*)?${ANNIVERSARY}|[-:/]\s*(?:${YEAR}|xx))`;

const BRACKETED_JUNK = new RegExp(String.raw`\s*[\[(]\s*${JUNK}\s*[\])]\s*`, "giu");
const TRAILING_JUNK = new RegExp(String.raw`\s*${TRAILING_JUNK_VALUE}\s*$`, "iu");

export function sanitizeTrackText(value: string): string;
export function sanitizeTrackText(value: string | null): string | null;
export function sanitizeTrackText(value: string | null): string | null {
  if (value === null) return null;

  let sanitized = value.replace(BRACKETED_JUNK, " ");

  while (TRAILING_JUNK.test(sanitized)) {
    sanitized = sanitized.replace(TRAILING_JUNK, "");
  }

  sanitized = sanitized
    .replace(/\s+[\[(][^[\]()]+[\])]\s*$/g, "")
    .replace(/\s*[\[(]\s*[\])]\s*/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s*[-:/]\s*$/g, "")
    .trim();

  return sanitized || value;
}
