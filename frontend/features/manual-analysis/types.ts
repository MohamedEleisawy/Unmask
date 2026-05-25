export type DiscourseSignal = {
  type: string;
  quote: string;
  explanation: string;
};

export type DiscourseResult = {
  manipulation_score: number;
  signals: DiscourseSignal[];
  summary: string;
  verdict: "safe" | "suspicious" | "manipulative";
  warning?: string;
  available: boolean;
};

export type PartnershipFlag = {
  rule: string;
  severity: string;
  detail: string;
  source: string;
  source_url: string;
};

export type PartnershipResult = {
  has_disclosure: boolean;
  flags: PartnershipFlag[];
  compliance_score: number;
  warning?: string;
};
