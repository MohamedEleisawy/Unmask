// Génération d'un vrai PDF A4 téléchargé directement (jsPDF), 1-2 pages max.
// Pas de window.print() : le fichier est produit et téléchargé sans dialogue.

import { jsPDF } from "jspdf";
import type { AuditResponse, AuditTrailEntry, PillarData } from "./types";

type SocialHit = {
  platform: string;
  username?: string;
  followers?: string;
  official?: boolean;
  confidence?: number;
  found: boolean;
};

type Article = { title: string; url: string; impact: string; event_type?: string; year?: number | null };

const RGB = {
  dark: [17, 17, 17] as [number, number, number],
  body: [60, 60, 60] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  line: [220, 220, 220] as [number, number, number],
  green: [10, 143, 106] as [number, number, number],
  amber: [182, 125, 16] as [number, number, number],
  red: [192, 57, 43] as [number, number, number],
};

function scoreRgb(score: number): [number, number, number] {
  return score >= 70 ? RGB.green : score >= 40 ? RGB.amber : RGB.red;
}

function verdictLabel(score: number): string {
  return score >= 70 ? "Profil vérifié" : score >= 40 ? "Partiellement vérifié" : "Peu d'éléments vérifiables";
}

function mediaName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Charge une image distante (CORS) en dataURL pour l'intégrer au PDF. */
function loadImageDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = Math.min(img.naturalWidth, img.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        // Recadrage carré centré.
        ctx.drawImage(img, (img.naturalWidth - size) / 2, (img.naturalHeight - size) / 2, size, size, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateAuditPdf(results: AuditResponse): Promise<void> {
  const { global_score, entity, pillars, score_breakdown, audit_trail, disclaimer } = results;
  const name = (entity.name || entity.url || "Entité auditée").replace(/^@/, "");

  const resolved = pillars.identity_resolution as PillarData | undefined;
  const realName = (resolved?.real_name as string) || null;
  const photoUrl = (resolved?.image_url as string) || null;

  const social = pillars.social_presence as PillarData | undefined;
  const foundHits = ((social?.hits as SocialHit[] | undefined) ?? []).filter((h) => h.found);

  const legal = pillars.legal_identity as PillarData | undefined;
  const identity = legal?.identity as Record<string, unknown> | null | undefined;
  const legalFound = !!legal?.found && !!identity;

  const compliance = pillars.compliance as PillarData | undefined;
  const regulators = (compliance?.regulators as Record<string, string> | undefined) ?? {};

  const reputation = pillars.reputation as PillarData | undefined;
  const repAvailable = !!reputation && reputation.available !== false;
  const articles = (reputation?.articles as Article[] | undefined) ?? [];
  const harmful = articles.filter((a) => a.impact === "harmful");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const M = 14;
  const RIGHT = PAGE_W - M;
  const CONTENT_W = RIGHT - M;
  let y = M;

  const ensure = (space: number) => {
    if (y + space > PAGE_H - M) {
      doc.addPage();
      y = M;
    }
  };
  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);

  const heading = (label: string) => {
    ensure(12);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setColor(RGB.muted);
    doc.text(label.toUpperCase(), M, y);
    doc.setDrawColor(RGB.line[0], RGB.line[1], RGB.line[2]);
    doc.line(M, y + 1.5, RIGHT, y + 1.5);
    y += 6;
  };

  const para = (text: string, opts: { size?: number; color?: [number, number, number]; bold?: boolean } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 9);
    setColor(opts.color ?? RGB.body);
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    for (const ln of lines) {
      ensure(5);
      doc.text(ln, M, y);
      y += 4.4;
    }
  };

  // ---- En-tête : photo + nom + score --------------------------------------
  const photoData = photoUrl ? await loadImageDataUrl(photoUrl) : null;
  const headerTop = y;
  if (photoData) {
    try {
      doc.addImage(photoData, "JPEG", M, y, 22, 22);
    } catch {
      /* image illisible → on continue sans */
    }
  }
  const textX = photoData ? M + 27 : M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(RGB.muted);
  doc.text("RAPPORT D'AUDIT UNMASK", textX, y + 3);
  doc.setFontSize(18);
  setColor(RGB.dark);
  doc.text(`@${name}`, textX, y + 11);
  if (realName && realName.toLowerCase() !== name.toLowerCase()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(RGB.muted);
    doc.text(`Identité : ${realName}`, textX, y + 17);
  }
  // Score à droite
  const sc = scoreRgb(global_score);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setColor(sc);
  doc.text(`${global_score}`, RIGHT, y + 9, { align: "right" });
  doc.setFontSize(9);
  setColor(RGB.muted);
  doc.text("/100", RIGHT, y + 14, { align: "right" });
  doc.setFontSize(9);
  setColor(sc);
  doc.text(verdictLabel(global_score), RIGHT, y + 19, { align: "right" });
  y = Math.max(headerTop + 22, y + 19);
  y += 3;
  doc.setDrawColor(RGB.dark[0], RGB.dark[1], RGB.dark[2]);
  doc.setLineWidth(0.4);
  doc.line(M, y, RIGHT, y);
  doc.setLineWidth(0.2);
  y += 2;

  // ---- Score par critère ---------------------------------------------------
  if (score_breakdown && score_breakdown.length > 0) {
    heading("Score de crédibilité");
    for (const r of score_breakdown) {
      ensure(5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(RGB.body);
      doc.text(r.label, M, y);
      doc.setFont("helvetica", "bold");
      const val = r.available && r.score !== null ? `${r.score}/100` : "Non évalué";
      setColor(r.available && r.score !== null ? scoreRgb(r.score) : RGB.muted);
      doc.text(val, RIGHT, y, { align: "right" });
      y += 4.6;
    }
  }

  // ---- Réseaux sociaux -----------------------------------------------------
  heading("Réseaux sociaux officiels");
  if (foundHits.length > 0) {
    for (const h of foundHits) {
      ensure(5);
      const tag = h.official ? "officiel" : "probable";
      const handle = (h.username || "").replace(/^@/, "");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setColor(RGB.dark);
      doc.text(h.platform, M, y);
      doc.setFont("helvetica", "normal");
      setColor(RGB.body);
      const line = `${handle ? "@" + handle + "  " : ""}${tag} (${h.confidence ?? 0}%)${h.followers ? "  ·  " + h.followers + " abonnés" : ""}`;
      doc.text(line, M + 34, y);
      y += 4.6;
    }
  } else {
    para("Aucun compte officiel confirmé sur les plateformes analysées.", { color: RGB.muted });
  }

  // ---- Entreprise ----------------------------------------------------------
  heading("Entreprise associée");
  if (legalFound && identity) {
    const fields: [string, unknown][] = [
      ["Nom", identity.nom ?? name],
      ["SIREN", identity.siren],
      ["SIRET", identity.siret],
      ["Statut juridique", identity.forme_juridique],
      ["Date de création", typeof identity.date_creation === "string" ? identity.date_creation.slice(0, 10) : null],
      ["Dirigeant", identity.dirigeant],
      ["Activité", identity.activite],
    ];
    for (const [label, value] of fields) {
      if (!value) continue;
      ensure(5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(RGB.muted);
      doc.text(`${label} :`, M, y);
      setColor(RGB.body);
      doc.text(String(value), M + 32, y);
      y += 4.6;
    }
  } else {
    para("Aucune entreprise identifiée dans les sources publiques consultées.", { color: RGB.muted });
  }

  // ---- Vérifications réglementaires ---------------------------------------
  heading("Vérifications réglementaires");
  const amf = regulators.amf_result === "found" ? "correspondance trouvée" : "aucune correspondance";
  para(`AMF : ${amf}.`);

  // ---- Réputation publique -------------------------------------------------
  heading("Réputation publique");
  if (repAvailable) {
    para((reputation?.summary as string) || "Aucun article notable détecté.");
    const fav = articles.filter((a) => a.impact === "favorable").length;
    const neu = articles.filter((a) => a.impact === "neutral").length;
    para(`${articles.length} article(s) — ${fav} favorable(s), ${neu} neutre(s), ${harmful.length} défavorable(s).`, { bold: true });
  } else {
    para("Analyse de réputation indisponible (non pénalisant).", { color: RGB.muted });
  }

  // ---- Principales alertes -------------------------------------------------
  if (harmful.length > 0) {
    heading("Principales alertes");
    for (const a of harmful.slice(0, 5)) {
      const prefix = `${mediaName(a.url) || "Source"}${a.year ? ` (${a.year})` : ""} — `;
      para(prefix + a.title, { size: 9 });
    }
  }

  // ---- Sources techniques consultées --------------------------------------
  if (audit_trail && audit_trail.length > 0) {
    heading("Sources techniques consultées");
    for (const t of audit_trail as AuditTrailEntry[]) {
      ensure(5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(RGB.body);
      doc.text(`${t.source} — ${t.result}`, M, y);
      y += 4.4;
    }
  }

  // ---- Pied de page --------------------------------------------------------
  ensure(12);
  y += 3;
  doc.setDrawColor(RGB.line[0], RGB.line[1], RGB.line[2]);
  doc.line(M, y, RIGHT, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setColor(RGB.muted);
  const footer = doc.splitTextToSize(
    `${disclaimer} — Généré le ${new Date().toLocaleDateString("fr-FR")}.`,
    CONTENT_W,
  ) as string[];
  for (const ln of footer) {
    doc.text(ln, M, y);
    y += 3.2;
  }

  const safeName = name.replace(/[^a-zA-Z0-9_-]+/g, "_");
  doc.save(`Unmask_${safeName}.pdf`);
}
