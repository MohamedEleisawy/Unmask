export type Verdict = "fiable" | "suspect" | "alerte";

export type AuditEntity = {
  name?: string;
  siren?: string;
  url?: string;
  sector?: string;
};

export type ScoreBreakdownRow = {
  key: string;
  label: string;
  weight: number;
  score: number | null;
  available: boolean;
  reason: string;
  details?: string[];
  effective_weight: number;
  points: number;
};

export type AuditTrailEntry = {
  source: string;
  consulted: boolean;
  found: boolean;
  verified: boolean;
  result: string;
  detail?: string;
  evidence_url?: string | null;
};

export type TimelineEvent = { label: string; type: string; title: string; url: string };
export type TimelineYear = { year: number; events: TimelineEvent[] };
export type Timeline = { entries: TimelineYear[]; has_conviction: boolean };

export type AuditResponse = {
  entity: AuditEntity;
  global_score: number;
  verdict: Verdict;
  score_breakdown?: ScoreBreakdownRow[];
  audit_trail?: AuditTrailEntry[];
  timeline?: Timeline;
  pillars: Record<string, PillarData | undefined>;
  disclaimer: string;
};

export type PillarData = Record<string, unknown>;

export type AuditRequest = {
  entity_name?: string;
  url?: string;
  siren?: string;
  youtube_url?: string;
  sector?: string;
};

export type PreviewNetwork = {
  platform: string;
  username?: string;
  url?: string | null;
  official?: boolean;
  confidence?: number;
};

export type AuditPreview = {
  query: string;
  found: boolean;
  real_name: string | null;
  image_url: string | null;
  wikipedia_url: string | null;
  networks: PreviewNetwork[];
};
