import { RestliElement } from "../types";
import { resolveImageUrl } from "../imageResolver";
import { LinkedInProfileResponse } from "../schema";

const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);

export function parseTopCard(
  raw: RestliElement | null
): LinkedInProfileResponse["profile"] {
  if (!raw) {
    return {
      firstName: null,
      lastName: null,
      fullName: null,
      headline: null,
      location: null,
      about: null,
      profileImageUrl: null,
      backgroundImageUrl: null,
    };
  }

  const firstName = str(raw.firstName);
  const lastName = str(raw.lastName);

  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || null,
    headline: str(raw.headline),
    location: str(raw.locationName),
    about: str(raw.summary),
    profileImageUrl: resolveImageUrl(raw.profilePicture),
    backgroundImageUrl: resolveImageUrl(raw.backgroundPicture),
  };
}
