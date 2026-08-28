import { AxiosInstance } from "axios";
import { voyagerGet } from "../httpClient";
import { RestliCollectionResponse, RestliElement } from "../types";

/**
 * Generic fetcher for the flat `/identity/profiles/{publicId}/{resource}`
 * sub-resources confirmed live during reverse engineering: certifications,
 * languages, projects, courses, honors, publications, testScores,
 * organizations, volunteerExperiences, patents. Each returns a REST.li
 * CollectionResponse; the elements themselves (not `included`) carry the
 * actual field data for these simpler resource types.
 */
export async function fetchSimpleCollection(
  client: AxiosInstance,
  publicIdentifier: string,
  resource: string
): Promise<RestliElement[]> {
  const path = `/identity/profiles/${encodeURIComponent(
    publicIdentifier
  )}/${resource}`;

  const res = await voyagerGet<RestliCollectionResponse>(client, path, {
    allowMissing: true,
  });

  if (!res) return [];

  return res.data?.elements ?? [];
}
