import { RestliElement, TimePeriod } from "../types";
import {
  CertificationEntry,
  DateParts,
  LanguageEntry,
  SimpleEntry,
} from "../schema";

const str = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

/** Reads the first present field among several candidate keys. */
function firstStr(el: RestliElement, keys: string[]): string | null {
  for (const k of keys) {
    const v = str(el[k]);
    if (v) return v;
  }
  return null;
}

function parseDateParts(v: unknown): DateParts | null {
  if (!v || typeof v !== "object") return null;
  const d = v as { month?: number; year?: number };
  if (!d.year) return null;
  return { month: d.month, year: d.year };
}

/**
 * NOTE ON FIELD NAMES: the certifications/languages/projects/etc.
 * sub-resources were confirmed live and returning valid (if empty, for the
 * test profiles used during reverse engineering) REST.li collections, but
 * their element field names were not directly observed with real data.
 * The keys below follow LinkedIn's established naming conventions from the
 * same API family (positionGroups) and from prior public documentation of
 * this API; `firstStr` tries several plausible aliases defensively so a
 * naming difference degrades to `null` for that field rather than breaking
 * the whole entry.
 */

export function parseCertification(el: RestliElement): CertificationEntry {
  const timePeriod = (el.timePeriod ?? null) as TimePeriod | null;
  return {
    name: firstStr(el, ["name", "title"]),
    issuingOrganization: firstStr(el, ["authority", "companyName", "issuer"]),
    issueDate: parseDateParts(timePeriod?.startDate ?? el.issueDate),
    credentialId: firstStr(el, ["licenseNumber", "credentialId"]),
    credentialUrl: firstStr(el, ["url", "credentialUrl"]),
  };
}

export function parseLanguage(el: RestliElement): LanguageEntry {
  return {
    name: firstStr(el, ["name"]),
    proficiency: firstStr(el, ["proficiency"]),
  };
}

export function parseSimpleEntry(el: RestliElement): SimpleEntry {
  return {
    name: firstStr(el, ["name", "title", "role"]),
    description: firstStr(el, ["description", "summary"]),
  };
}
