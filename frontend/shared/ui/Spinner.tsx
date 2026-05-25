type Props = { label: string };

export function Spinner({ label }: Props) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
      {label}
    </span>
  );
}
