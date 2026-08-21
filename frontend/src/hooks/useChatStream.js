import { useCallback, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

/**
 * Hook לניהול שליחת הודעה וקבלת תגובה בסטרימינג (SSE) מה-backend.
 * חושף: messages, statusText (ל-Live Execution Status banner), sendMessage, isStreaming
 */
export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [statusText, setStatusText] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const assistantBufferRef = useRef("");

  const sendMessage = useCallback(async ({ text, mode, imageFile }) => {
    setIsStreaming(true);
    assistantBufferRef.current = "";

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "", sources: [], files: [] }]);

    const formData = new FormData();
    formData.append("message", text);
    formData.append("mode", mode);
    formData.append("history", JSON.stringify(messages));
    if (imageFile) formData.append("image", imageFile);

    const response = await fetch(`${API_BASE}/chat`, { method: "POST", body: formData });
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const updateLastAssistant = (patch) => {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = { ...last, ...patch };
        return copy;
      });
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop();

      for (const evt of events) {
        const eventLine = evt.split("\n").find((l) => l.startsWith("event:"));
        const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
        if (!eventLine || !dataLine) continue;

        const eventName = eventLine.replace("event:", "").trim();
        const data = JSON.parse(dataLine.replace("data:", "").trim());

        switch (eventName) {
          case "status":
            setStatusText(data.message);
            break;
          case "sources":
            updateLastAssistant({ sources: data.sources });
            break;
          case "token":
            assistantBufferRef.current += data.token;
            updateLastAssistant({ content: assistantBufferRef.current });
            break;
          case "files":
            updateLastAssistant({ files: data.files });
            break;
          case "done":
            setStatusText(null);
            break;
          case "error":
            setStatusText(null);
            updateLastAssistant({ content: `⚠️ שגיאה: ${data.message}` });
            break;
        }
      }
    }
    setIsStreaming(false);
  }, [messages]);

  return { messages, statusText, isStreaming, sendMessage };
}
