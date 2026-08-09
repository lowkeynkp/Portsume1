export type ID = string;

export type ISODate = string;

export type PipelineStage =
  | "uploaded"
  | "validating"
  | "storing"
  | "parsing"
  | "normalizing"
  | "enhancing"
  | "generating"
  | "publishing"
  | "completed"
  | "failed";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface JobStageUpdate {
  stage: string;
  status: "pending" | "running" | "done" | "skipped";
  progress: number; // 0-100
  detail?: string;
}

export interface PipelineJob {
  id: ID;
  userId: ID;
  fileId: ID;
  status: JobStatus;
  currentStage: PipelineStage;
  progress: number; // 0-100 overall
  stages: JobStageUpdate[];
  error?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface UploadedFileMeta {
  id: ID;
  userId: ID;
  name: string;
  size: number;
  mimeType: string;
  storagePath: string;
  sha256: string;
  uploadedAt: ISODate;
}

export interface TimelineEntry {
  id: ID;
  role: string;
  company: string;
  location?: string;
  start?: string;
  end?: string;
  current?: boolean;
  description: string;
  highlights?: string[];
  sortOrder: number;
}

export interface ProjectEntry {
  id: ID;
  title: string;
  subtitle?: string;
  description: string;
  url?: string;
  techStack: string[];
  images?: string[];
  highlights?: string[];
  sortOrder: number;
}

export interface EducationEntry {
  id: ID;
  institution: string;
  degree: string;
  field?: string;
  start?: string;
  end?: string;
  description?: string;
}

export interface SkillGroup {
  id: ID;
  category: string;
  skills: string[];
}

export interface AwardEntry {
  id: ID;
  title: string;
  issuer?: string;
  year?: string;
  description?: string;
}

export interface PublicationEntry {
  id: ID;
  title: string;
  venue?: string;
  year?: string;
  url?: string;
  description?: string;
}

export interface SocialLink {
  id: ID;
  platform: string;
  url: string;
}

export interface ParsedResume {
  id: ID;
  fileId: ID;
  userId: ID;
  status: "parsing" | "ready" | "failed";
  rawText: string;
  confidence: number;
  structured: ResumeStructured;
  detectedMissing: string[];
  parsedAt: ISODate;
}

export interface ResumeStructured {
  name: string;
  professionalTitle: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  summary: string;
  experience: TimelineEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  certificates: Array<{ id: ID; name: string; issuer?: string; year?: string }>;
  achievements: string[];
  awards: AwardEntry[];
  publications: PublicationEntry[];
  languages: string[];
  socialLinks: SocialLink[];
  volunteer: TimelineEntry[];
}

export type ThemeId = "editorial" | "developer" | "professional" | "creative" | "studio" | "executive" | "magazine";

export interface PortfolioSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
}

export interface PortfolioContent {
  landing: {
    headline: string;
    tagline: string;
    heroImages: string[];
  };
  about: {
    name: string;
    role: string;
    heading: string;
    bio: string;
    photoUrl?: string;
  };
  experience: TimelineEntry[];
  projects: ProjectEntry[];
  skills: SkillGroup[];
  education: EducationEntry[];
  certificates: Array<{ id: ID; name: string; issuer?: string; year?: string }>;
  achievements: string[];
  awards: AwardEntry[];
  publications: PublicationEntry[];
  languages: string[];
  socialLinks: SocialLink[];
  contact: {
    email: string;
    location?: string;
    phone?: string;
    availableForWork: boolean;
  };
  resumeDownload: { fileId: ID; fileName: string; url?: string };
  /** Projects pushed to the top of a template's project grid. */
  featuredProjectIds?: string[];
  /** Per-section visibility + ordering — content stays independent of presentation. */
  sections?: Record<string, { visible: boolean; order?: number }>;
  /** Optional testimonial quotes. */
  testimonials?: Array<{ id: ID; quote: string; author: string; role?: string }>;
}

export type PortfolioStatus = "draft" | "published";

export interface Portfolio {
  id: ID;
  userId: ID;
  slug: string;
  title: string;
  status: PortfolioStatus;
  themeId: ThemeId;
  content: PortfolioContent;
  seo: PortfolioSEO;
  accent: string;
  versions: number;
  createdAt: ISODate;
  updatedAt: ISODate;
  publishedUrl?: string;
}

export interface PublishedSite {
  id: ID;
  portfolioId: ID;
  subdomain: string;
  url: string;
  customDomain?: string;
  publishedAt: ISODate;
  previewImage?: string;
}

export interface Theme {
  id: string;
  slug: ThemeId;
  name: string;
  blurb: string;
  previewColors: string[];
  version: number;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: ID;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "github" | "email";
  createdAt: ISODate;
}

export interface ApiEnvelope<T> {
  ok: true;
  data: T;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiEnvelope<T> | ApiErrorEnvelope;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
