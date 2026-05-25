import type { PartnershipResult } from "./types";

export function PartnershipCard({ result }: { result: PartnershipResult }) {
  const barColor =
    result.compliance_score >= 70
      ? "bg-green-500"
      : result.compliance_score >= 40
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center">2</span>
        Conformité loi influenceurs 2023
      </h3>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${result.compliance_score}%` }} />
        </div>
        <span className="text-xs text-gray-400">{result.compliance_score}/100</span>
        <span className={`text-xs font-medium ${result.has_disclosure ? "text-green-400" : "text-red-400"}`}>
          {result.has_disclosure ? "✓ Mention partenariat présente" : "✗ Pas de mention partenariat"}
        </span>
      </div>

      {result.flags.map((f, i) => (
        <FlagRow key={i} flag={f} />
      ))}

      {result.flags.length === 0 && (
        <p className="text-xs text-green-400">Aucune violation détectée.</p>
      )}
    </div>
  );
}

function FlagRow({ flag }: { flag: PartnershipResult["flags"][number] }) {
  const tone =
    flag.severity === "violation"
      ? "bg-red-900/30 border border-red-800 text-red-300"
      : "bg-yellow-900/30 border border-yellow-800 text-yellow-300";
  return (
    <div className={`mb-2 p-2.5 rounded-lg text-xs ${tone}`}>
      <p className="font-semibold">{flag.rule}</p>
      <p className="text-gray-400 mt-0.5">{flag.detail}</p>
      {flag.source_url && (
        <a
          href={flag.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:underline text-xs mt-1 inline-block"
        >
          ↗ {flag.source}
        </a>
      )}
    </div>
  );
}
