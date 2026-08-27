import { voyagerGet } from "../httpClient";
import { RestliCollectionResponse, RestliElement } from "../types";

export interface PositionGroupsResult {
  positions: RestliElement[];
  companiesByUrn: Map<string, RestliElement>;
}

/**
 * Confirmed live: GET /identity/profiles/{publicId}/positionGroups
 *
 * This is the classic (pre-"dash") REST.li nested resource. The flat,
 * ungrouped `/positions` and the monolithic `/profileView` were both
 * retired (410 Gone) by LinkedIn, but this grouped-by-company variant
 * survives and returns full experience data.
 */
export async function fetchExperience(
  publicIdentifier: string
): Promise<PositionGroupsResult> {
  const path = `/identity/profiles/${encodeURIComponent(
    publicIdentifier
  )}/positionGroups`;

  const res = await voyagerGet<RestliCollectionResponse>(path, {
    allowMissing: true,
  });

  if (!res) return { positions: [], companiesByUrn: new Map() };

  const included = res.included ?? [];

  const positions = included.filter(
    (el) => el.$type === "com.linkedin.voyager.identity.profile.Position"
  );

  const companiesByUrn = new Map<string, RestliElement>();
  for (const el of included) {
    if (
      el.$type === "com.linkedin.voyager.entities.shared.MiniCompany" &&
      el.entityUrn
    ) {
      companiesByUrn.set(el.entityUrn, el);
    }
  }

  return { positions, companiesByUrn };
}
