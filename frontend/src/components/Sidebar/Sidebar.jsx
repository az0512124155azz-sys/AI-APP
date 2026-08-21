import { Plus, MessageSquare, GraduationCap, Code2, Eye, Sparkles } from "lucide-react";

const MODES = [
  { id: "General", label: "כללי", icon: Sparkles },
  { id: "Study", label: "לימוד", icon: GraduationCap },
  { id: "Code", label: "קוד", icon: Code2 },
  { id: "Vision", label: "ראייה", icon: Eye },
];

export default function Sidebar({ mode, onModeChange }) {
  return (
    <aside className="w-64 shrink-0 bg-surface border-l border-border flex flex-col p-3">
      <button className="flex items-center gap-2 rounded-xl2 bg-accent/10 text-accent hover:bg-accent/20 transition px-3 py-2.5 text-sm font-medium mb-4">
        <Plus size={16} />
        שיחה חדשה
      </button>

      {/* בחירת מצב עבודה */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={`flex flex-col items-center gap-1 rounded-xl2 py-2.5 text-xs transition
              ${mode === id
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-surface-2 text-text-secondary border border-transparent hover:border-border"}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* היסטוריית שיחות */}
      <div className="text-xs text-text-muted mb-2 px-1">היסטוריה</div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {/* TODO: מיפוי מתוך state/backend של שיחות שמורות */}
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-text-secondary hover:bg-surface-2 cursor-pointer">
          <MessageSquare size={14} />
          <span className="truncate">שיחה לדוגמה - נגזרות</span>
        </div>
      </div>
    </aside>
  );
}
