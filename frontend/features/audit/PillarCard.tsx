import type { PillarData } from "./types";

type Props = {
  number: string;
  title: string;
  subtitle: string;
  data: PillarData | undefined;
  render: (d: PillarData) => React.ReactNode;
};

export function PillarCard({ number, title, subtitle, data, render }: Props) {
  const unavailable = !data || data.available === false;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {number}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        {unavailable && (
          <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full border border-gray-700">
            Indisponible
          </span>
        )}
      </div>

      {unavailable ? (
        <p className="text-xs text-gray-500 italic ml-10">
          {(data?.warning as string) || "Clé API non configurée."}
        </p>
      ) : (
        <div className="ml-10">{render(data!)}</div>
      )}
    </div>
  );
}
