import { VectorImage } from "./types";

/**
 * LinkedIn nests profile/background images behind a handful of shapes
 * depending on endpoint and account type (e.g. a bare VectorImage, or one
 * wrapped in a "com.linkedin.common.VectorImage" typed union, or nested
 * under a `displayImageReference`). This walks the shapes seen during
 * reverse engineering and returns the highest-resolution artifact URL, or
 * null if the field is absent or in a shape we haven't encountered.
 */
export function resolveImageUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;

  const candidate = unwrapVectorImage(raw as Record<string, unknown>);
  if (!candidate || !candidate.rootUrl || !candidate.artifacts?.length) {
    return null;
  }

  const largest = [...candidate.artifacts].sort((a, b) => b.width - a.width)[0];
  return `${candidate.rootUrl}${largest.fileIdentifyingUrlPathSegment}`;
}

function unwrapVectorImage(
  obj: Record<string, unknown>
): VectorImage | null {
  if (typeof obj.rootUrl === "string" && Array.isArray(obj.artifacts)) {
    return obj as unknown as VectorImage;
  }

  const nestedKeys = [
    "vectorImage",
    "com.linkedin.common.VectorImage",
    "displayImageReference",
    "displayImage",
  ];

  for (const key of nestedKeys) {
    const value = obj[key];
    if (value && typeof value === "object") {
      const resolved = unwrapVectorImage(value as Record<string, unknown>);
      if (resolved) return resolved;
    }
  }

  return null;
}
