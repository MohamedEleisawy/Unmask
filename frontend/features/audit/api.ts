import { API_BASE_URL } from "@/shared/config";
import type { AuditPreview, AuditRequest, AuditResponse } from "./types";

async function postJson<T>(path: string, payload: AuditRequest): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
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

/** Pré-vérification rapide d'identité (avant l'audit complet). */
export function fetchAuditPreview(payload: AuditRequest): Promise<AuditPreview> {
  return postJson<AuditPreview>("/audit/preview", payload);
}

export function fetchFullAudit(payload: AuditRequest): Promise<AuditResponse> {
  return postJson<AuditResponse>("/audit/full", payload);
}
