import { Loader2 } from "lucide-react";

export default function StatusBanner({ text }) {
  return (
    <div className="inline-flex items-center gap-2 bg-surface-2 border border-border text-text-secondary text-xs rounded-full px-3 py-1.5">
      <Loader2 size={12} className="animate-spin text-accent" />
      {text}
    </div>
  );
}
