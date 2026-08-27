import { voyagerGet } from "../httpClient";
import { RestliFinderResponse, RestliElement } from "../types";

/**
 * The "top card" identity endpoint. Confirmed live via reverse engineering:
 *
 *   GET /identity/dash/profiles?q=memberIdentity&memberIdentity={publicId}
 *
 * Returns firstName, lastName, headline, summary (about), locationName,
 * industryUrn, profilePicture, backgroundPicture, entityUrn, objectUrn in
 * `included[0]`. This is a REST.li "finder" query, distinct from both the
 * deprecated flat REST endpoints and the newer GraphQL persisted-query
 * layer.
 */
export async function fetchTopCard(
  publicIdentifier: string
): Promise<RestliElement | null> {
  const path = `/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(
    publicIdentifier
  )}`;

  const res = await voyagerGet<RestliFinderResponse>(path, {
    allowMissing: true,
  });

  if (!res?.included?.length) return null;

  return (
    res.included.find(
      (el) => el.$type === "com.linkedin.voyager.dash.identity.profile.Profile"
    ) ?? res.included[0]
  );
}
