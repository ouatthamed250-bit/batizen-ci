"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MessageCircle, Hammer, Send } from "lucide-react";
import { ref, onValue, push, update } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

// Composant Messagerie - réutilisable
export function ChantierMessages({ chantierId, userId, userRole }: { chantierId: string; userId?: string; userRole?: "admin" | "client" }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const { database } = getFirebaseServices();
    const unsub = onValue(ref(database, "messages"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter((msg: any) => msg.chantierId === chantierId)
          .sort((a: any, b: any) => (a.dateEnvoi || 0) - (b.dateEnvoi || 0));
        setMessages(msgs);
      }
    });
    return () => unsub();
  }, [chantierId]);

  const handleEnvoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const { database } = getFirebaseServices();
    await push(ref(database, "messages"), {
      chantierId,
      expediteurId: "admin",
      expediteurNom: "Admin",
      expediteurRole: userRole || "admin",
      destinataireId: userId,
      contenu: newMessage.trim(),
      dateEnvoi: Date.now(),
      lu: false
    });
    setNewMessage("");
  };

  return (
    <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 flex items-center gap-2 font-black text-[#FF7A00]">
        <MessageCircle size={20} /> 💬 Messagerie
      </h3>
      <div className="h-64 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 ? (
          <p className="text-sm text-white/50">Aucun message échangé.</p>
        ) : (
          messages.map((msg: any) => (
            <div key={msg.id} className={`p-3 rounded-xl ${msg.expediteurRole === "admin" ? "bg-blue-500/20 ml-8" : "bg-white/10 mr-8"}`}>
              <p className="text-xs font-bold text-white/70 mb-1">{msg.expediteurNom || "—"}</p>
              <p className="text-sm text-white">{msg.contenu}</p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleEnvoyer} className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Votre message..."
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl font-bold">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// Composant Gestion Équipe - Admin only
export function GestionEquipe({ chantierId }: { chantierId: string }) {
  const [ouvriersList, setOuvriersList] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]);
  const [ouvrierSelectionne, setOuvrierSelectionne] = useState("");

  useEffect(() => {
    const { database } = getFirebaseServices();

    const unsubOuvriers = onValue(ref(database, "ouvriers"), (snapshot) => {
      const data = snapshot.val();
      if (data) setOuvriersList(Object.keys(data).map(key => ({ id: key, ...data[key] })));
    });

    const unsubEquipes = onValue(ref(database, "equipes"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eq = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter((e: any) => e.chantierId === chantierId && e.actif);
        setEquipe(eq);
      }
    });

    return () => {
      unsubOuvriers();
      unsubEquipes();
    };
  }, [chantierId]);

const handleAjouter = async (e: FormEvent) => {
    e.preventDefault();
    if (!ouvrierSelectionne) {
      alert("Veuillez sélectionner un ouvrier");
      return;
    }

    const ouvrier = ouvriersList.find((o: any) => o.id === ouvrierSelectionne);
    if (!ouvrier) return;

    // 🔍 DIAGNOSTIC ULTRA-DÉTAILLÉ - ADMIN ÉCRITURE ÉQUIPE
    console.log("🔍 ADMIN - Écriture équipe DÉTAILLÉE:", {
      chantierId_original: chantierId,
      chantierId_type: typeof chantierId,
      chantierId_stringified: String(chantierId),
      chantierId_length: chantierId.length,
      chantierId_charCodes: chantierId.split('').map(c => c.charCodeAt(0)),
      ouvrierId_selectionne: ouvrierSelectionne,
      ouvrierId_type: typeof ouvrierSelectionne,
      ouvrier_trouve: ouvrier,
      ouvrierId: ouvrier.id,
      ouvrierNom: ouvrier.nom,
      fonction: ouvrier.fonction
    });

    try {
      const { database } = getFirebaseServices();
      const equipeData = {
        chantierId: String(chantierId), // ⚠️ FORCER EN STRING
        ouvrierId: String(ouvrier.id),
        ouvrierNom: ouvrier.nom || ouvrier.name || "Ouvrier",
        specialite: ouvrier.specialite || ouvrier.metier || "Non spécifié",
        fonction: ouvrier.fonction || ouvrier.role || "ouvrier",
        telephone: ouvrier.telephone || ouvrier.phone || "",
        dateAffectation: Date.now(),
        actif: true,
        // 🔍 Ajouter un timestamp pour debugging
        _debug_timestamp: Date.now()
      };

      console.log("📝 Données équipe Firebase (avec clé chantierId):", JSON.stringify(equipeData, null, 2));

      await push(ref(database, "equipes"), equipeData);

      console.log("✅ Équipe écrite avec succès dans Firebase !");
      console.log("   - Nœud Firebase: equipes/");
      console.log("   - chantierId stocké:", equipeData.chantierId);
      alert(`✅ ${ouvrier.nom} ajouté à l'équipe`);
      setOuvrierSelectionne("");
    } catch (error) {
      console.error("❌ Erreur écriture équipe:", error);
      alert("Erreur lors de l'ajout");
    }
  };

  const handleRetirer = async (equipeId: string) => {
    if (!confirm("Retirer cet ouvrier du chantier ?")) return;
    const membre = equipe.find((m: any) => m.id === equipeId);
    const { database } = getFirebaseServices();
    if (membre) {
      await update(ref(database, `ouvriers/${membre.ouvrierId}`), { chantierId: "" });
    }
    await update(ref(database, `equipes/${equipeId}`), { actif: false });
  };

  return (
    <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 flex items-center gap-2 font-black text-[#FF7A00]">
        <Hammer size={20} /> 👷 Gestion de l'équipe
      </h3>
      {equipe.length > 0 && (
        <div className="space-y-2 mb-4">
          {equipe.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
              <div>
                <p className="font-bold text-sm text-white">{m.ouvrierNom}</p>
                <p className="text-xs text-white/60">{m.specialite}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.fonction === "chef_de_chantier" && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">👑 Chef</span>
                )}
                <button onClick={() => handleRetirer(m.id)} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAjouter} className="flex gap-2">
        <select value={ouvrierSelectionne} onChange={(e) => setOuvrierSelectionne(e.target.value)} className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm">
          <option value="">Sélectionner un ouvrier...</option>
          {ouvriersList.filter((o: any) => !o.chantierId || o.chantierId === chantierId).map((o: any) => (
            <option key={o.id} value={o.id}>{o.nom} - {o.specialite}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold">
          + Ajouter
        </button>
      </form>
    </div>
  );
}

// Composant Affichage Équipe - Client
export function AffichageEquipe({ chantierId }: { chantierId: string }) {
  const [equipe, setEquipe] = useState<any[]>([]);

useEffect(() => {
    const { database } = getFirebaseServices();
    const unsub = onValue(ref(database, "equipes"), (snapshot) => {
      console.log("🔍 CLIENT - Lecture équipes pour chantierId:", chantierId, "type:", typeof chantierId);
      
      const data = snapshot.val();
      console.log(" Données brutes équipes:", data);
      
      if (data) {
        const eq = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter((e: any) => {
            console.log(`  Vérif équipe ${e.id}:`, {
              chantierIdEcrit: e.chantierId,
              chantierIdAttendu: chantierId,
              match: String(e.chantierId) === String(chantierId),
              actif: e.actif
            });
            return String(e.chantierId) === String(chantierId) && e.actif === true;
          });
        console.log("✅ Équipes filtrées:", eq.length, eq);
        setEquipe(eq);
      } else {
        console.log("⚠️ Aucune donnée dans equipes/");
        setEquipe([]);
      }
    });
    return () => unsub();
  }, [chantierId]);

  return (
    <div className="mt-6 p-4 bg-white/90 rounded-2xl border border-white/50">
      <h3 className="font-bold text-[var(--navy)] mb-3 flex items-center gap-2">👷 Mon Équipe sur ce chantier</h3>
      {equipe.length === 0 ? (
        <p className="text-sm text-gray-500">L'équipe sera assignée prochainement par l'administration.</p>
      ) : (
        <div className="space-y-2">
          {equipe.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-sm text-[var(--navy)]">{m.ouvrierNom}</p>
                <p className="text-xs text-gray-600">{m.specialite}</p>
              </div>
              {m.fonction === "chef_de_chantier" && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">👑 Chef</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}