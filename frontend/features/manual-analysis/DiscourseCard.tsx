import type { DiscourseResult } from "./types";

const VERDICT_LABEL: Record<DiscourseResult["verdict"], { text: string; tone: string }> = {
  safe: { text: "Sain", tone: "bg-green-900/40 text-green-300 border-green-700" },
  suspicious: { text: "Suspect", tone: "bg-yellow-900/40 text-yellow-300 border-yellow-700" },
  manipulative: { text: "Manipulatoire", tone: "bg-red-900/40 text-red-300 border-red-700" },
};

export function DiscourseCard({ result }: { result: DiscourseResult }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <Header />

      {!result.available ? (
        <p className="text-xs text-gray-500 italic">{result.warning}</p>
      ) : (
        <Body result={result} />
      )}
    </div>
  );
}

function Header() {
  return (
    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center">3</span>
      Analyse du discours (IA)
    </h3>
  );
}

function Body({ result }: { result: DiscourseResult }) {
  const verdict = VERDICT_LABEL[result.verdict];
  const barColor =
    result.manipulation_score < 30
      ? "bg-green-500"
      : result.manipulation_score < 60
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Score de manipulation</p>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${result.manipulation_score}%` }} />
            </div>
            <span className="text-sm font-bold text-white">{result.manipulation_score}/100</span>
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${verdict.tone}`}>{verdict.text}</span>
      </div>

      {result.summary && (
        <p className="text-xs text-gray-400 mb-4 p-3 bg-gray-800 rounded-lg">{result.summary}</p>
      )}

      {result.signals.map((s, i) => (
        <div key={i} className="mb-3 p-3 rounded-lg bg-red-900/20 border border-red-900/40 text-xs">
          <p className="font-semibold text-red-300 mb-1">{s.type}</p>
          {s.quote && <p className="italic text-gray-400 mb-1">« {s.quote} »</p>}
          <p className="text-gray-500">{s.explanation}</p>
        </div>
      ))}

      {result.signals.length === 0 && (
        <p className="text-xs text-green-400">Aucun signal de manipulation détecté.</p>
      )}
    </>
  );
}
