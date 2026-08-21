import { X, Download } from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function PreviewPanel({ data, onClose }) {
  const files = data?.files || [];
  const [activeIdx, setActiveIdx] = useState(0);
  const active = files[activeIdx];

  return (
    <aside className="w-[420px] shrink-0 bg-surface border-r border-border flex flex-col shadow-panel">
      {/* Header + טאבים כשיש כמה קבצים */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex gap-1 overflow-x-auto">
          {files.map((f, i) => (
            <button
              key={f.filename}
              onClick={() => setActiveIdx(i)}
              className={`text-xs px-2.5 py-1 rounded-lg whitespace-nowrap ${
                i === activeIdx ? "bg-accent/15 text-accent" : "text-text-secondary hover:bg-surface-2"
              }`}
            >
              {f.language}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={16} />
        </button>
      </div>

      {/* תוכן */}
      <div className="flex-1 overflow-auto p-4">
        {active?.renderable ? (
          // רנדור חי עבור HTML/SVG/Mermaid
          <iframe
            title="preview"
            srcDoc={active.preview}
            className="w-full h-full bg-white rounded-lg"
            sandbox="allow-scripts"
          />
        ) : (
          <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">
            {active?.preview}
          </pre>
        )}
      </div>

      {/* הורדה */}
      {active && (
        <div className="border-t border-border p-3">
          <a
            href={`${API_BASE}/files/${active.filename}`}
            className="flex items-center justify-center gap-2 bg-accent text-canvas rounded-lg py-2 text-sm font-medium hover:opacity-90"
          >
            <Download size={14} />
            הורד קובץ
          </a>
        </div>
      )}
    </aside>
  );
}
