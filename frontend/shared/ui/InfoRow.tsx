type Props = { label: string; value?: string; alert?: boolean };

export function InfoRow({ label, value, alert }: Props) {
  if (!value) return null;
  return (
    <div>
      <p className="text-gray-600 text-xs">{label}</p>
      <p className={`text-xs font-medium ${alert ? "text-red-400" : "text-gray-200"}`}>{value}</p>
    </div>
  );
}
