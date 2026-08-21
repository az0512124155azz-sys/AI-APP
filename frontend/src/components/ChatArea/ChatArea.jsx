import { useState } from "react";
import { Paperclip, Mic, ArrowUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChatStream } from "../../hooks/useChatStream.js";
import CitationCards from "../Shared/CitationCards.jsx";
import StatusBanner from "../Shared/StatusBanner.jsx";

export default function ChatArea({ mode, onArtifactReady }) {
  const { messages, statusText, isStreaming, sendMessage } = useChatStream();
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;
    const text = input;
    setInput("");
    await sendMessage({ text, mode, imageFile });
    setImageFile(null);
  };

  // כשמגיעים קבצים חדשים בתשובה האחרונה, פותחים את פאנל התצוגה
  const lastMsg = messages[messages.length - 1];
  if (lastMsg?.files?.length && onArtifactReady) {
    onArtifactReady({ files: lastMsg.files, sources: lastMsg.sources });
  }

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* היסטוריית הודעות */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            שאל אותי כל דבר על שיעורי הבית שלך ✦
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-text-primary" : "text-text-primary"}>
            <div className="text-xs text-text-muted mb-1">{m.role === "user" ? "אתה" : "עוזר AI"}</div>

            {m.sources?.length > 0 && <CitationCards sources={m.sources} />}

            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {statusText && <StatusBanner text={statusText} />}
      </div>

      {/* שורת קלט תחתונה */}
      <div className="border-t border-border bg-canvas p-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2 bg-surface border border-border rounded-xl2 px-3 py-2 shadow-panel">
          <label className="cursor-pointer text-text-secondary hover:text-accent p-2">
            <Paperclip size={18} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="שאל שאלה, הדבק שיעורי בית, או צרף תמונה..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm py-2 placeholder:text-text-muted"
          />

          <button className="text-text-secondary hover:text-accent p-2">
            <Mic size={18} />
          </button>

          <button
            onClick={handleSend}
            disabled={isStreaming}
            className="bg-accent text-canvas rounded-lg p-2 hover:opacity-90 disabled:opacity-40 transition"
          >
            {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
          </button>
        </div>
      </div>
    </main>
  );
}
