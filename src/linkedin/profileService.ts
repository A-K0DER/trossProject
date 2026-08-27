import { extractPublicIdentifier } from "./urlParser";
import { fetchTopCard } from "./fetchers/fetchTopCard";
import { fetchExperience } from "./fetchers/fetchExperience";
import { fetchSimpleCollection } from "./fetchers/fetchSimpleCollection";
import { parseTopCard } from "./parse/parseTopCard";
import { parseExperience } from "./parse/parseExperience";
import {
  parseCertification,
  parseLanguage,
  parseSimpleEntry,
} from "./parse/parseCollections";
import { LinkedInProfileResponse } from "./schema";

/**
 * Education and skills have no known-working reverse-engineered endpoint
 * as of this writing: the flat REST resources LinkedIn used to expose for
 * them (`/educations`, `/skills`) return 410 Gone, and the replacement
 * GraphQL persisted-query layer requires a `queryId` hash that is
 * deploy-specific and rotates — see README "Known limitations" for how to
 * extend this once you've captured a current hash from DevTools.
 */
const UNAVAILABLE_SECTIONS_WARNING =
  "education and skills could not be retrieved: LinkedIn has retired the REST endpoints these used to be served from (410 Gone) and replaced them with a GraphQL persisted-query API whose query IDs rotate per deploy. See README 'Known limitations'.";

export async function getLinkedInProfile(
  requestedUrl: string
): Promise<LinkedInProfileResponse> {
  const publicIdentifier = extractPublicIdentifier(requestedUrl);

  const [topCardRaw, experienceResult, certifications, languages, projects, honors, publications, volunteerExperience] =
    await Promise.all([
      fetchTopCard(publicIdentifier),
      fetchExperience(publicIdentifier),
      fetchSimpleCollection(publicIdentifier, "certifications"),
      fetchSimpleCollection(publicIdentifier, "languages"),
      fetchSimpleCollection(publicIdentifier, "projects"),
      fetchSimpleCollection(publicIdentifier, "honors"),
      fetchSimpleCollection(publicIdentifier, "publications"),
      fetchSimpleCollection(publicIdentifier, "volunteerExperiences"),
    ]);

  const warnings: string[] = [UNAVAILABLE_SECTIONS_WARNING];
  if (!topCardRaw) {
    warnings.push(
      "Could not retrieve top-card profile data (name/headline/about) — the profile may not exist, may be outside your network's visibility, or your session cookies may have expired."
    );
  }

  return {
    requestedUrl,
    publicIdentifier,
    publicProfileUrl: `https://www.linkedin.com/in/${publicIdentifier}/`,
    fetchedAt: new Date().toISOString(),

    profile: parseTopCard(topCardRaw),

    experience: parseExperience(experienceResult),
    education: [],
    skills: [],

    certifications: certifications.map(parseCertification),
    languages: languages.map(parseLanguage),

    projects: projects.map(parseSimpleEntry),
    honors: honors.map(parseSimpleEntry),
    publications: publications.map(parseSimpleEntry),
    volunteerExperience: volunteerExperience.map(parseSimpleEntry),

    warnings,
  };
}
