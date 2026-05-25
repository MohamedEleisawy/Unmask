import { API_BASE_URL } from "@/shared/config";
import type { DiscourseResult, PartnershipResult } from "./types";

export async function analyzeText(
  text: string,
): Promise<{ discourse: DiscourseResult | null; partnership: PartnershipResult | null }> {
  const [d, p] = await Promise.all([
    fetch(`${API_BASE_URL}/audit/discourse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }),
    fetch(`${API_BASE_URL}/audit/partnerships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }),
  ]);

  return {
    discourse: d.ok ? await d.json() : null,
    partnership: p.ok ? await p.json() : null,
  };
}
