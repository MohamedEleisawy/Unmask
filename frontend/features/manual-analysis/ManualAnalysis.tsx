"use client";

import { useState } from "react";
import { analyzeText } from "./api";
import { DiscourseCard } from "./DiscourseCard";
import { ManualForm } from "./ManualForm";
import { PartnershipCard } from "./PartnershipCard";
import type { DiscourseResult, PartnershipResult } from "./types";

export function ManualAnalysis() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [discourse, setDiscourse] = useState<DiscourseResult | null>(null);
  const [partnership, setPartnership] = useState<PartnershipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Collez un texte à analyser.");
      return;
    }
    setLoading(true);
    setError(null);
    setDiscourse(null);
    setPartnership(null);

    try {
      const { discourse: d, partnership: p } = await analyzeText(text);
      setDiscourse(d);
      setPartnership(p);
    } catch {
      setError("Impossible de contacter l'API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <ManualForm
        text={text}
        onTextChange={setText}
        onSubmit={onSubmit}
        loading={loading}
        error={error}
      />
      {discourse && <DiscourseCard result={discourse} />}
      {partnership && <PartnershipCard result={partnership} />}
    </div>
  );
}
