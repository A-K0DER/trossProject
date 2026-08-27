export class InvalidLinkedInUrlError extends Error {
  constructor(input: string) {
    super(`"${input}" is not a recognizable LinkedIn profile URL.`);
    this.name = "InvalidLinkedInUrlError";
  }
}

/**
 * Extracts the public identifier (the "jeffweiner08" in
 * linkedin.com/in/jeffweiner08/) from a LinkedIn profile URL, or from a
 * bare identifier if that's what was passed in.
 */
export function extractPublicIdentifier(input: string): string {
  const trimmed = input.trim();

  // Allow passing a bare identifier directly.
  if (/^[a-zA-Z0-9\-]+$/.test(trimmed) && !trimmed.includes(".")) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
  } catch {
    throw new InvalidLinkedInUrlError(input);
  }

  if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) {
    throw new InvalidLinkedInUrlError(input);
  }

  const match = url.pathname.match(/\/in\/([^/]+)\/?/);
  if (!match) {
    throw new InvalidLinkedInUrlError(input);
  }

  return decodeURIComponent(match[1]);
}
