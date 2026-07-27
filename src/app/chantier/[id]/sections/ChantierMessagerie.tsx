"use client";

import { RefObject } from "react";
import { LockedTab } from "@/components/ui/LockedTab";

interface ChantierMessagerieProps {
  messages: any[];
  newMessage: string;
  setNewMessage: (v: string) => void;
  uploading: boolean;
  recording: boolean;
  isTabLocked: boolean;
  onSendMessage: (e?: React.FormEvent) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChantierMessagerie({
  messages, newMessage, setNewMessage, uploading, recording, isTabLocked,
  onSendMessage, onStartRecording, onStopRecording, onFileUpload, messagesEndRef,
}: ChantierMessagerieProps) {
  if (isTabLocked) return <LockedTab />;

  return (
    <div className="flex h-[80vh] flex-col w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl shadow-xl">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 500 }}>
        {messages.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">Aucun message.</p> : messages.map((m) => (
          <div key={m.id} className={`flex ${m.expediteurRole === "client" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] rounded-2xl p-3 ${m.expediteurRole === "client" ? "bg-[#0B5FFF] text-white" : "bg-gray-100 text-gray-800"}`}>
              <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold opacity-70">{m.expediteurNom||m.expediteur}</span><span className="text-xs opacity-50">{m.dateEnvoi ? new Date(m.dateEnvoi).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}) : (m.date||"").slice(11,16)}</span>{m.expediteurRole === "client" && m.lu && <span className="text-xs">✓✓</span>}</div>
              {m.type === "texte" && <p className="text-sm whitespace-pre-line">{m.contenu}</p>}
              {m.type === "vocal" && <div className="flex items-center gap-2"><audio controls src={m.url} className="h-8" /><span className="text-xs opacity-70">{m.dureeVocal}s</span></div>}
              {m.type === "piece_jointe" && <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline">📎 {m.nomFichier} ({m.tailleFichier ? (m.tailleFichier/1024).toFixed(1)+" KB" : "—"})</a>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex flex-col gap-2 border-t border-[#E7EBF5] p-3">
        <div className="flex gap-2">
          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Votre message..." disabled={uploading} className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#0B5FFF] focus:outline-none disabled:opacity-50" />
          <button type="button" onClick={() => onSendMessage()} disabled={!newMessage.trim()||uploading} className="px-4 py-2 bg-[#0B5FFF] text-white rounded-xl font-bold hover:bg-[#0a4fd9] transition disabled:opacity-50">Envoyer</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSendMessage(e); }} className="hidden"><button type="submit">Hidden submit</button></form>
        <div className="flex gap-2">
          <button type="button" onClick={recording ? onStopRecording : onStartRecording} disabled={uploading} className={`flex-1 px-3 py-2 rounded-xl font-bold transition ${recording ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}>{recording ? "⏹️ Arrêter" : "🎤 Vocal"}</button>
          <label className={`flex-1 px-3 py-2 rounded-xl font-bold text-center cursor-pointer transition ${uploading ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>📎 Fichier<input type="file" onChange={onFileUpload} className="hidden" disabled={uploading} /></label>
        </div>
        {uploading && <p className="text-xs text-gray-500 text-center">⏳ Upload...</p>}
      </div>
    </div>
  );
}