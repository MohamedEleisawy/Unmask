import { API_BASE_URL } from "@/shared/config";
import type { AuditPreview, AuditRequest, AuditResponse } from "./types";

/** Message lisible selon le code HTTP — jamais un « Error occurred » opaque. */
function httpMessage(status: number, detail?: string): string {
  if (detail) return detail;
  if (status === 400) return "Requête invalide — vérifie le nom, le @handle ou le SIREN saisi.";
  if (status === 404) return "Aucune donnée trouvée pour cette entité.";
  if (status === 429) return "Trop de requêtes — patiente quelques instants avant de réessayer.";
  if (status >= 500) return "Le service d'audit est momentanément indisponible. Réessaie dans un instant.";
  return "Erreur serveur.";
}

async function postJson<T>(path: string, payload: AuditRequest): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Échec réseau (offline, DNS, CORS) — fetch rejette avant toute réponse.
    throw new Error("Impossible de contacter le service. Vérifie ta connexion et réessaie.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(httpMessage(res.status, err?.detail));
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
