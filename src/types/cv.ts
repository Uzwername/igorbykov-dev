export const EMPLOYMENT_TYPE_FULL_TIME = 'full-time';
export const EMPLOYMENT_TYPE_PART_TIME = 'part-time';

export type EmploymentType =
  typeof EMPLOYMENT_TYPE_FULL_TIME | typeof EMPLOYMENT_TYPE_PART_TIME;

export const CONTRACT_TYPE_EMPLOYEE = 'employee';
export const CONTRACT_TYPE_CONTRACTOR = 'contractor';

export type ContractType =
  typeof CONTRACT_TYPE_EMPLOYEE | typeof CONTRACT_TYPE_CONTRACTOR;

/** ISO 8601 year-month, e.g. "2023-09". */
export type YearMonth = string;

export interface CvCompany {
  id: string;
  name: string;
  industry: string[];
  website: string | null;
}

export interface CvSkillsGained {
  soft: string[];
  hard: string[];
}

export interface CvPosition {
  id: string;
  companyId: string;
  title: string;
  location: string | null;
  employmentType: EmploymentType;
  contractType: ContractType;
  /** Null start/end means "ongoing"; only endDate is expected to ever be null in practice. */
  startDate: YearMonth;
  endDate: YearMonth | null;
  summary: string | null;
  responsibilities: string[];
  techStack: string[];
  achievements: string[];
  skillsGained: CvSkillsGained;
}

export interface CvEducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: YearMonth;
  endDate: YearMonth | null;
  honors: string[];
}

export interface CvContact {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  stackOverflow: string;
  devTo: string;
}

export interface CvLanguage {
  name: string;
  proficiency: string;
}

export interface CvProfile {
  name: string;
  headline: string;
  location: string;
  summary: string;
  contact: CvContact;
  languages: CvLanguage[];
  topSkills: string[];
  personality: string[];
  honors: string[];
  stackOverflowReputation: string;
  openSourceContributions: string[];
  upNext: string[];
}

export interface CvMeta {
  /** ISO 8601 date this data was last reconciled from source documents. */
  updatedAt: string;
  /** Self-reported: compiled from the subject's own CV and LinkedIn export, not a verified/external source. */
  source: 'self-reported';
  version: number;
}

export interface CvData {
  meta: CvMeta;
  profile: CvProfile;
  companies: CvCompany[];
  positions: CvPosition[];
  education: CvEducationEntry[];
}
