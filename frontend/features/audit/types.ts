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
  effective_weight: number;
  points: number;
};

export type AuditResponse = {
  entity: AuditEntity;
  global_score: number;
  verdict: Verdict;
  score_breakdown?: ScoreBreakdownRow[];
  pillars: Record<string, PillarData | undefined>;
  disclaimer: string;
};

export type PillarData = Record<string, unknown>;

export type AuditRequest = {
  entity_name?: string;
  url?: string;
  siren?: string;
  youtube_url?: string;
  sector: string;
};
