"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { getDatabase, ref, onValue, push, set, update, query, orderByChild, limitToLast } from "firebase/database";
import { useAuthContext } from "@/contexts/AuthContext";

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  chantierId?: string | null;
  text: string;
  timestamp: number;
  read?: boolean;
  userName?: string;
  planChoisi?: string;
};

type ClientInfo = {
  id: string;
  nom?: string;
  email?: string;
};

export default function AdminMessagesPage() {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Record<string, ClientInfo>>({});
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Chargement des messages et des clients - AVEC FILTRE POUR RÈGLE STRICTE
  useEffect(() => {
    if (!user?.uid) return;

    const db = getDatabase();
    
    // Écoute des messages avec filtre limitToLast(100) pour compatibilité règles strictes
    console.log("✅ [SEC] Messages admin chargés avec filtre");
    const messagesRef = ref(db, "messages");
    const q = query(messagesRef, orderByChild("dateEnvoi"), limitToLast(100));
    const unsubMessages = onValue(q, (snapshot) => {
      const data = snapshot.val() || {};
      const msgs: Message[] = Object.entries(data).map(([id, m]: [string, any]) => ({ id, ...m }));
      setMessages(msgs);
    });

    // Écoute des clients (users avec role client)
    const usersRef = ref(db, "users");
    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const clts: Record<string, ClientInfo> = {};
      Object.entries(data).forEach(([id, u]: [string, any]) => {
        if (u.role !== "admin") {
          clts[id] = { id, nom: u.displayName || u.email?.split("@")[0], email: u.email };
        }
      });
      setClients(clts);
    });

    return () => {
      unsubMessages();
      unsubUsers();
    };
  }, [user?.uid]);

  // Regrouper les messages par client (receiverId = client)
  const conversations = messages
    .filter(m => m.receiverId && clients[m.receiverId])
    .reduce((acc, m) => {
      const cid = m.receiverId;
      if (!acc[cid]) {
        acc[cid] = {
          clientId: cid,
          messages: [],
          lastMessage: m,
          unreadCount: 0,
        };
      }
      acc[cid].messages.push(m);
      acc[cid].messages.sort((a, b) => a.timestamp - b.timestamp);
      
      if (m.timestamp > (acc[cid].lastMessage?.timestamp || 0)) {
        acc[cid].lastMessage = m;
      }
      
      if (!m.read && m.senderId !== "admin") {
        acc[cid].unreadCount++;
      }
      
      return acc;
    }, {} as Record<string, { clientId: string; messages: Message[]; lastMessage: Message; unreadCount: number }>);

  // Trier par date du dernier message
  const sortedConversations = Object.values(conversations).sort((a, b) => 
    (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
  );

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedClient) return;

    const db = getDatabase();
    const msgRef = push(ref(db, "messages"));
    
    await set(msgRef, {
      id: msgRef.key,
      senderId: "admin",
      receiverId: selectedClient,
      chantierId: null,
      text: replyText.trim(),
      timestamp: Date.now(),
      read: false,
      userName: "Administrateur",
    });

    // Marquer les messages du client comme lus
    const clientMsgs = messages.filter(m => 
      m.receiverId === selectedClient && m.senderId !== "admin" && !m.read
    );
    for (const m of clientMsgs) {
      await update(ref(db, `messages/${m.id}`), { read: true });
    }

    setReplyText("");
  };

  const clientMessages = selectedClient ? conversations[selectedClient]?.messages || [] : [];
  const selectedClientInfo = selectedClient ? clients[selectedClient] : null;

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="p-4 text-xl font-black text-[#FF7A00]">💬 Messagerie</h1>
        
        <div className="flex h-[calc(100vh-120px)]">
          {/* COLONNE GAUCHE - Conversations */}
          <div className="w-[30%] border-r border-white/10 p-3">
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-2.5 text-white/40" />
              <input 
                placeholder="Rechercher..." 
                className="w-full rounded-[10px] bg-white/5 py-2 pl-9 pr-3 text-xs outline-none"
              />
            </div>
            
            <div className="space-y-1 overflow-y-auto">
              {sortedConversations.map(conv => (
                <button
                  key={conv.clientId}
                  onClick={() => setSelectedClient(conv.clientId)}
                  className={`w-full rounded-[10px] p-3 text-left transition ${
                    selectedClient === conv.clientId ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm">
                        {clients[conv.clientId]?.nom || "Client"}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-white/60">
                        {conv.lastMessage?.text || "..."}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {conv.unreadCount > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                      <span className="text-xs text-white/40">
                        {conv.lastMessage && new Date(conv.lastMessage.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* COLONNE DROITE - Fil de discussion */}
          <div className="flex w-[70%] flex-col">
            {selectedClient ? (
              <>
                {/* Header client */}
                <div className="border-b border-white/10 p-4">
                  <h2 className="font-black">{selectedClientInfo?.nom || "Client"}</h2>
                  <p className="text-xs text-white/60">{selectedClientInfo?.email}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {clientMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-[12px] px-3 py-2 text-sm ${
                          msg.senderId === "admin" 
                            ? "bg-[#0B5FFF] text-white" 
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulaire d'envoi */}
                <form onSubmit={handleSend} className="border-t border-white/10 p-3">
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Répondre..."
                      className="flex-1 rounded-[10px] bg-white/5 px-3 py-2 text-sm outline-none"
                      rows={2}
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="rounded-[10px] bg-[#FF7A00] px-4 font-black disabled:opacity-50"
                    >
                      Envoyer
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-white/50">Sélectionnez une conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}