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
  dark: [37, 20, 29] as [number, number, number],      // --ld-text (#25141d)
  body: [60, 60, 60] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  line: [220, 220, 220] as [number, number, number],
  violet: [147, 107, 255] as [number, number, number], // marque #936bff
  violetInk: [107, 70, 217] as [number, number, number], // --ld-violet-ink (texte sur clair)
  white: [238, 238, 238] as [number, number, number],  // #eee
  green: [10, 143, 106] as [number, number, number],
  amber: [182, 125, 16] as [number, number, number],
  red: [192, 57, 43] as [number, number, number],
};

/** Logo « unmask » (SVG du site) en blanc, pour le bandeau violet d'en-tête. */
const UNMASK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 12.05"><path d="M10.3809 11.7657V7.18792C10.3809 4.65809 12.489 2.59006 15.059 2.59006C17.6491 2.59006 19.7573 4.65809 19.7573 7.18792V11.7657H17.2877V6.98714C17.2877 5.80254 16.2838 4.81872 15.059 4.81872C13.8343 4.81872 12.8504 5.80254 12.8504 6.98714V11.7657H10.3809ZM27.0997 11.7657V6.7462C27.0997 5.70215 26.1962 4.81872 25.112 4.81872C24.0278 4.81872 23.1443 5.70215 23.1443 6.7462V11.7657H20.6747V6.94698C20.6747 4.5577 22.6625 2.59006 25.112 2.59006C26.2564 2.59006 27.3406 3.03178 28.1839 3.79474L28.3244 3.93529L28.4851 3.79474C29.3083 3.03178 30.3925 2.59006 31.5369 2.59006C33.9864 2.59006 35.9942 4.5577 35.9942 6.94698V11.7657H33.5246V6.7462C33.5246 5.70215 32.6412 4.81872 31.5369 4.81872C30.4527 4.81872 29.5693 5.70215 29.5693 6.7462V11.7657H27.0997Z" fill="#eee"/><path d="M43.8968 9.33626C44.2983 8.9347 44.5594 8.39259 44.6397 7.85049C44.9007 6.14386 43.8365 4.5577 41.9894 4.5577C40.865 4.5577 39.9213 5.18012 39.4997 6.2041C39.2186 6.88675 39.2186 7.77018 39.4997 8.45283C39.7808 9.1154 40.2627 9.63743 40.9453 9.91852C41.5477 10.1595 42.2504 10.1795 42.8728 9.97875C43.2543 9.85829 43.6157 9.63743 43.8968 9.33626ZM47.0691 11.7657H44.6397V11.083L44.2983 11.3039C43.5555 11.7858 42.7523 12.0468 41.8689 12.0468C41.126 12.0669 40.4233 11.9665 39.7607 11.6854C39.1785 11.4444 38.6564 11.1031 38.2147 10.6614C37.3313 9.77797 36.9096 8.5733 36.9096 7.32846C36.9096 5.36082 38.0541 3.71443 39.9013 2.97154C41.1662 2.4696 42.7925 2.4696 44.0373 2.97154C45.9046 3.71443 47.0691 5.36082 47.0691 7.32846V11.7657Z" fill="#eee"/><path d="M9.37641 2.89123V7.46901C9.37641 9.99883 7.26822 12.0669 4.67817 12.0669C2.10819 12.0669 0 9.99883 0 7.46901V2.89123H2.46959V7.66979C2.46959 8.85439 3.45341 9.83821 4.67817 9.83821C5.90292 9.83821 6.90682 8.85439 6.90682 7.66979V2.89123H9.37641Z" fill="#eee"/><path d="M56.2927 6.38776e-06V7.20799L59.7461 2.91131L62.4967 2.89123L58.9429 7.32846L62.4967 11.7657L59.7461 11.7456L57.5776 9.03509L56.2927 10.6212V11.7657H53.8833V6.38776e-06H56.2927Z" fill="#eee"/><path d="M53.8487 8.99166C53.9325 9.195 53.9889 9.40684 54.0796 9.61109L55.0307 4.72241C54.4791 5.19688 53.731 6.69746 52.8372 6.08736C52.0644 5.55984 51.858 4.60245 50.8366 4.31977C50.5347 4.2372 50.2172 4.23086 49.9123 4.30129C49.2255 4.45951 48.6494 5.01671 48.8306 5.75387C49.0637 6.70235 50.1596 6.86797 50.9559 7.00528C51.588 7.11427 52.3547 7.40461 52.871 7.7769C53.3031 8.08233 53.6418 8.50307 53.8487 8.99166Z" fill="#eee"/><path d="M46.7688 6.51376C46.76 6.41836 46.7596 6.28945 46.7598 6.10187L46.7688 6.51376C46.7975 6.82518 46.915 6.77968 47.3863 7.25317C47.9064 7.77555 48.5835 8.08411 49.2806 8.30801C50.1599 8.59042 51.1066 8.50247 51.7003 9.35929C51.8377 9.55746 51.921 9.8236 51.9218 10.0638C51.9253 10.3398 51.8186 10.6057 51.6256 10.8021C51.2989 11.131 50.8386 11.272 50.3864 11.2688C49.9085 11.2654 49.4783 11.1235 49.1391 10.7791C48.6584 10.291 48.5234 9.52517 47.8227 9.27289C47.4744 9.1475 47.118 9.0913 46.8319 9.38995L46.7688 6.51376Z" fill="#eee"/><circle cx="64.087" cy="10.9164" r="1.13043" fill="#eee"/></svg>`;

/** Rastérise un SVG (le logo) en dataURL PNG à haute résolution, fond transparent. */
function svgToDataUrl(svg: string, widthPx: number, heightPx: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      try {
        const scale = 4; // densité pour rester net à l'impression
        const canvas = document.createElement("canvas");
        canvas.width = widthPx * scale;
        canvas.height = heightPx * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

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
    setColor(RGB.violetInk);
    doc.text(label.toUpperCase(), M, y);
    // Filet : court segment violet de marque + prolongement gris discret.
    const labelW = doc.getTextWidth(label.toUpperCase());
    doc.setDrawColor(RGB.violet[0], RGB.violet[1], RGB.violet[2]);
    doc.setLineWidth(0.5);
    doc.line(M, y + 1.8, M + Math.min(labelW, 40), y + 1.8);
    doc.setDrawColor(RGB.line[0], RGB.line[1], RGB.line[2]);
    doc.setLineWidth(0.2);
    doc.line(M + Math.min(labelW, 40) + 2, y + 1.8, RIGHT, y + 1.8);
    y += 6;
  };

  /** Anneau de score (cercle de progression coloré par verdict) + chiffre au centre. */
  const drawScoreRing = (cx: number, cy: number, r: number, score: number) => {
    const col = scoreRgb(score);
    // Piste complète, gris très clair.
    doc.setDrawColor(228, 228, 228);
    doc.setLineWidth(2.2);
    doc.circle(cx, cy, r, "S");
    // Frange proportionnelle au score, approchée par segments (jsPDF n'a pas d'arc).
    doc.setDrawColor(col[0], col[1], col[2]);
    doc.setLineWidth(2.4);
    const steps = Math.max(1, Math.round((score / 100) * 60));
    const start = -Math.PI / 2; // 12 h
    for (let i = 0; i < steps; i++) {
      const a1 = start + (i / 60) * 2 * Math.PI;
      const a2 = start + ((i + 1) / 60) * 2 * Math.PI;
      doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
    }
    doc.setLineWidth(0.2);
    // Chiffre au centre, couleur du verdict.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(col);
    doc.text(`${score}`, cx, cy + 0.6, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    setColor(RGB.muted);
    doc.text("/100", cx, cy + 4.4, { align: "center" });
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

  // ---- Bandeau de marque (violet pleine largeur, logo blanc) --------------
  const BANNER_H = 22;
  doc.setFillColor(RGB.violet[0], RGB.violet[1], RGB.violet[2]);
  doc.rect(0, 0, PAGE_W, BANNER_H, "F");
  const logoData = await svgToDataUrl(UNMASK_LOGO_SVG, 132, 24);
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", M, 7.5, 33, 6); // ratio 66:12
    } catch {
      /* logo illisible → on continue sans */
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(RGB.white);
  doc.text("Rapport d'audit", RIGHT, 12.5, { align: "right" });
  y = BANNER_H + 8;

  // ---- En-tête profil : photo + nom à gauche, anneau de score à droite ----
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
  setColor(RGB.violetInk);
  doc.text("PROFIL AUDITÉ", textX, y + 3);
  doc.setFontSize(18);
  setColor(RGB.dark);
  doc.text(`@${name}`, textX, y + 11);
  if (realName && realName.toLowerCase() !== name.toLowerCase()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(RGB.muted);
    doc.text(`Identité : ${realName}`, textX, y + 17);
  }
  // Anneau de score à droite + libellé de verdict dessous.
  const ringCx = RIGHT - 11;
  const ringCy = y + 11;
  drawScoreRing(ringCx, ringCy, 9, global_score);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(scoreRgb(global_score));
  doc.text(verdictLabel(global_score), RIGHT, ringCy + 14, { align: "right" });
  y = Math.max(headerTop + 32, ringCy + 14) + 4;

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
  ensure(14);
  y += 3;
  doc.setDrawColor(RGB.line[0], RGB.line[1], RGB.line[2]);
  doc.line(M, y, RIGHT, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(RGB.violetInk);
  doc.text("unmask", M, y);
  doc.setFont("helvetica", "normal");
  setColor(RGB.muted);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, RIGHT, y, { align: "right" });
  y += 4;
  const footer = doc.splitTextToSize(disclaimer, CONTENT_W) as string[];
  for (const ln of footer) {
    doc.text(ln, M, y);
    y += 3.2;
  }

  const safeName = name.replace(/[^a-zA-Z0-9_-]+/g, "_");
  doc.save(`Unmask_${safeName}.pdf`);
}
