import { API_BASE_URL } from "@/shared/config";
import type { AuditRequest, AuditResponse } from "./types";

export async function fetchFullAudit(payload: AuditRequest): Promise<AuditResponse> {
  const res = await fetch(`${API_BASE_URL}/audit/full`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erreur serveur" }));
    throw new Error(err.detail || "Erreur serveur");
  }

  return res.json();
}
