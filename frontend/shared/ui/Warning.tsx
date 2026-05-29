import { AlertIcon } from "./icons";

export function Warning({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2 text-xs text-[var(--color-warn)] mt-2 leading-relaxed">
      <AlertIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </p>
  );
}
