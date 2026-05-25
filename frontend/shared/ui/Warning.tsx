export function Warning({ text }: { text: string }) {
  return <p className="text-yellow-400 text-xs mt-2">⚠ {text}</p>;
}
