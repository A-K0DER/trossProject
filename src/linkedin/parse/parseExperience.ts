import { RestliElement, TimePeriod } from "../types";
import { PositionGroupsResult } from "../fetchers/fetchExperience";
import { DateParts, ExperienceEntry } from "../schema";

const str = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

function parseDateParts(v: unknown): DateParts | null {
  if (!v || typeof v !== "object") return null;
  const d = v as { month?: number; year?: number };
  if (!d.year) return null;
  return { month: d.month, year: d.year };
}

export function parseExperience({
  positions,
  companiesByUrn,
}: PositionGroupsResult): ExperienceEntry[] {
  return positions.map((pos): ExperienceEntry => {
    const timePeriod = (pos.timePeriod ?? null) as TimePeriod | null;
    const company = pos.companyUrn
      ? companiesByUrn.get(pos.companyUrn as string)
      : undefined;

    return {
      title: str(pos.title),
      companyName: str(pos.companyName) ?? (company ? str(company.name) : null),
      companyUrl: company ? buildCompanyUrl(company) : null,
      location: str(pos.locationName) ?? str(pos.geoLocationName),
      description: str(pos.description),
      startDate: parseDateParts(timePeriod?.startDate),
      endDate: parseDateParts(timePeriod?.endDate),
      isCurrent: Boolean(timePeriod && timePeriod.startDate && !timePeriod.endDate),
    };
  });
}

function buildCompanyUrl(company: RestliElement): string | null {
  const universalName = str(company.universalName);
  return universalName
    ? `https://www.linkedin.com/company/${universalName}`
    : null;
}
