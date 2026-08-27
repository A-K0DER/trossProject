// Minimal shapes for the LinkedIn Voyager "normalized+included" REST.li
// response format. LinkedIn does not publish a schema for these, so these
// types only cover the fields this project actually reads — everything
// else is left as `unknown` on purpose.

export interface RestliElement {
  $type: string;
  entityUrn?: string;
  [key: string]: unknown;
}

export interface RestliCollectionResponse<T = RestliElement> {
  data: {
    entityUrn?: string;
    elements?: T[];
    paging?: { count: number; start: number; total: number };
    [key: string]: unknown;
  };
  included?: RestliElement[];
}

export interface RestliFinderResponse<T = RestliElement> {
  data: T;
  included?: RestliElement[];
}

export interface TimePeriod {
  startDate?: { month?: number; year?: number };
  endDate?: { month?: number; year?: number };
}

export interface VectorArtifact {
  width: number;
  height: number;
  fileIdentifyingUrlPathSegment: string;
}

export interface VectorImage {
  rootUrl: string;
  artifacts: VectorArtifact[];
}
