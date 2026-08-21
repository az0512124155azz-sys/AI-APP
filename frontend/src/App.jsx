import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import ChatArea from "./components/ChatArea/ChatArea.jsx";
import PreviewPanel from "./components/PreviewPanel/PreviewPanel.jsx";

/**
 * Layout ראשי: 3 עמודות בהתאם למפרט
 * [Sidebar] [Main Canvas - Chat] [Right Preview Panel]
 * הפאנל הימני נפתח דינמית רק כשיש artifact להציג (קוד/גרף/קובץ).
 */
export default function App() {
  const [activePreview, setActivePreview] = useState(null); // {files, sources}
  const [mode, setMode] = useState("General"); // Study | Code | Vision | General

  return (
    <div className="flex h-screen w-screen bg-canvas text-text-primary overflow-hidden" dir="rtl">
      <Sidebar mode={mode} onModeChange={setMode} />

      <ChatArea
        mode={mode}
        onArtifactReady={(payload) => setActivePreview(payload)}
      />

      {activePreview && (
        <PreviewPanel
          data={activePreview}
          onClose={() => setActivePreview(null)}
        />
      )}
    </div>
  );
}
