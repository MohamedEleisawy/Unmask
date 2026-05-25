type Props = { label: string; value: string };

export function StatBox({ label, value }: Props) {
  return (
    <div className="bg-gray-800 rounded-lg p-2 text-center">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white text-sm font-semibold">{value}</p>
    </div>
  );
}
