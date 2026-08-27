// The response schema this API returns. This is our own design (the
// assignment leaves it open) — a flat, camelCase JSON shape independent of
// LinkedIn's internal REST.li representation.

export interface DateParts {
  month?: number;
  year?: number;
}

export interface ExperienceEntry {
  title: string | null;
  companyName: string | null;
  companyUrl: string | null;
  location: string | null;
  description: string | null;
  startDate: DateParts | null;
  endDate: DateParts | null;
  isCurrent: boolean;
}

export interface CertificationEntry {
  name: string | null;
  issuingOrganization: string | null;
  issueDate: DateParts | null;
  credentialId: string | null;
  credentialUrl: string | null;
}

export interface LanguageEntry {
  name: string | null;
  proficiency: string | null;
}

export interface SimpleEntry {
  name: string | null;
  description: string | null;
}

export interface EducationEntry {
  schoolName: string | null;
  degreeName: string | null;
  fieldOfStudy: string | null;
  startDate: DateParts | null;
  endDate: DateParts | null;
  description: string | null;
}

export interface SkillEntry {
  name: string | null;
  endorsementCount: number | null;
}

export interface LinkedInProfileResponse {
  requestedUrl: string;
  publicIdentifier: string;
  publicProfileUrl: string;
  fetchedAt: string;

  profile: {
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    headline: string | null;
    location: string | null;
    about: string | null;
    profileImageUrl: string | null;
    backgroundImageUrl: string | null;
  };

  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];

  // Bonus sections beyond the assignment's required list, available from
  // the same reverse-engineered endpoint family at no extra cost.
  projects: SimpleEntry[];
  honors: SimpleEntry[];
  publications: SimpleEntry[];
  volunteerExperience: SimpleEntry[];

  warnings: string[];
}
