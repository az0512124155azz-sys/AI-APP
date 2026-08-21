import { Globe } from "lucide-react";

export default function CitationCards({ sources }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
      {sources.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col gap-1 bg-surface-2 border border-border rounded-xl2 p-2.5 hover:border-accent/40 transition"
        >
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Globe size={12} />
            <span className="truncate">{s.source}</span>
            <span className="ms-auto text-accent">[{s.id}]</span>
          </div>
          <div className="text-xs text-text-primary line-clamp-2">{s.title}</div>
        </a>
      ))}
    </div>
  );
}
