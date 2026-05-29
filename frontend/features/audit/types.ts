export type Verdict = "fiable" | "suspect" | "alerte";

export type AuditEntity = {
  name?: string;
  siren?: string;
  url?: string;
  sector?: string;
};

export type AuditResponse = {
  entity: AuditEntity;
  global_score: number;
  verdict: Verdict;
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
