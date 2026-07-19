"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getDatabase, ref as dbRef, onValue, push, update } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

export default function AdminCalendarPage() {
  const { user } = useAuthContext();
  const { database } = getFirebaseServices();

  const [rdvs, setRdvs] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [rdvForm, setRdvForm] = useState({
    chantierId: "",
    titre: "",
    type: "visite",
    date: "",
    heure: "09:00",
    duree: "1h",
    lieu: "",
    description: ""
  });
  const [vue, setVue] = useState<"mois" | "liste">("liste");

  useEffect(() => {
    if (!user) return;

    // Charger tous les RDV
    const rdvsRef = dbRef(database, 'rendezvous');
    const unsubRdvs = onValue(rdvsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rdvsData = Object.entries(data)
          .filter(([id, r]: [string, any]) => r.actif)
          .map(([id, r]: [string, any]) => ({ id, ...r }))
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setRdvs(rdvsData);
      }
    });

    // Charger tous les chantiers (pour le menu déroulant)
    const chantiersRef = dbRef(database, 'chantiers');
    const unsubChantiers = onValue(chantiersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chantiersData = Object.entries(data)
          .map(([id, c]: [string, any]) => ({ id, ...c }));
        setChantiers(chantiersData);
      }
    });

    return () => {
      unsubRdvs();
      unsubChantiers();
    };
  }, [user, database]);

  const handleCreerRdv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rdvForm.titre.trim() || !rdvForm.date || !rdvForm.chantierId) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const chantier = chantiers.find(c => c.id === rdvForm.chantierId);
    if (!chantier) return;

    try {
      await push(dbRef(database, 'rendezvous'), {
        ...rdvForm,
        statut: "propose",
        creePar: user?.uid,
        creeParRole: "admin",
        clientId: chantier.userId,
        dateCreation: Date.now(),
        dateModification: Date.now(),
        actif: true
      });

      alert("✅ Rendez-vous créé avec succès !");
      setShowForm(false);
      setRdvForm({
        chantierId: "",
        titre: "",
        type: "visite",
        date: "",
        heure: "09:00",
        duree: "1h",
        lieu: "",
        description: ""
      });
    } catch (error) {
      console.error("Erreur création RDV:", error);
      alert("Erreur lors de la création du RDV");
    }
  };

  const handleChangerStatut = async (rdvId: string, nouveauStatut: string) => {
    await update(dbRef(database, `rendezvous/${rdvId}`), {
      statut: nouveauStatut,
      dateModification: Date.now()
    });
  };

  const handleSupprimerRdv = async (rdvId: string) => {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    await update(dbRef(database, `rendezvous/${rdvId}`), {
      actif: false,
      dateModification: Date.now()
    });
  };

  return (
    <main className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-[#FF7A00]">📅 Calendrier des chantiers</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setVue(vue === "liste" ? "mois" : "liste")}
              className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition"
            >
              {vue === "liste" ? "📆 Vue mois" : "📋 Vue liste"}
            </button>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#e66e00] transition"
            >
              {showForm ? "✖️ Annuler" : "+ Nouveau RDV"}
            </button>
          </div>
        </div>

        {/* Formulaire de création */}
        {showForm && (
          <form onSubmit={handleCreerRdv} className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-bold text-lg mb-2">Créer un rendez-vous</h3>
            
            {/* Chantier */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">Chantier *</label>
              <select 
                value={rdvForm.chantierId}
                onChange={(e) => setRdvForm({...rdvForm, chantierId: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                required
              >
                <option value="">Sélectionner un chantier...</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom_projet || c.nom || "Sans nom"} - {c.localisation?.ville || ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Titre */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">Titre *</label>
              <input 
                type="text"
                value={rdvForm.titre}
                onChange={(e) => setRdvForm({...rdvForm, titre: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                placeholder="Ex: Visite de chantier, Livraison ciment..."
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">Type</label>
              <select 
                value={rdvForm.type}
                onChange={(e) => setRdvForm({...rdvForm, type: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
              >
                <option value="visite">🏗️ Visite de chantier</option>
                <option value="livraison">📦 Livraison matériaux</option>
                <option value="coulee">🧱 Coulage béton</option>
                <option value="reunion">🤝 Réunion</option>
                <option value="rdv_client">👤 RDV client</option>
                <option value="autre">📌 Autre</option>
              </select>
            </div>

            {/* Date et heure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-white/70 mb-1 block">Date *</label>
                <input 
                  type="date"
                  value={rdvForm.date}
                  onChange={(e) => setRdvForm({...rdvForm, date: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1 block">Heure</label>
                <input 
                  type="time"
                  value={rdvForm.heure}
                  onChange={(e) => setRdvForm({...rdvForm, heure: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                />
              </div>
            </div>

            {/* Durée */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">Durée</label>
              <select 
                value={rdvForm.duree}
                onChange={(e) => setRdvForm({...rdvForm, duree: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
              >
                <option value="30min">30 minutes</option>
                <option value="1h">1 heure</option>
                <option value="1h30">1h30</option>
                <option value="2h">2 heures</option>
                <option value="2h30">2h30</option>
                <option value="3h">3 heures</option>
                <option value="demi-journee">Demi-journée</option>
                <option value="journee">Journée complète</option>
              </select>
            </div>

            {/* Lieu */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">Lieu</label>
              <input 
                type="text"
                value={rdvForm.lieu}
                onChange={(e) => setRdvForm({...rdvForm, lieu: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                placeholder="Adresse ou lieu de rendez-vous"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">Description</label>
              <textarea 
                value={rdvForm.description}
                onChange={(e) => setRdvForm({...rdvForm, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                placeholder="Détails du rendez-vous..."
              />
            </div>

            <button 
              type="submit"
              className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
            >
              ✅ Créer le rendez-vous
            </button>
          </form>
        )}

        {/* Vue Liste */}
        {vue === "liste" && (
          <div className="space-y-3">
            {rdvs.length === 0 ? (
              <p className="text-center text-white/60 py-8">Aucun rendez-vous planifié.</p>
            ) : (
              rdvs.map((rdv) => {
                const chantier = chantiers.find(c => c.id === rdv.chantierId);
                const isPast = new Date(rdv.date) < new Date();
                
                return (
                  <div 
                    key={rdv.id} 
                    className={`p-4 rounded-2xl border ${
                      rdv.statut === "confirme_admin" || rdv.statut === "confirme_client" 
                        ? "bg-green-500/10 border-green-500/30" 
                        : rdv.statut === "reporte"
                        ? "bg-orange-500/10 border-orange-500/30"
                        : rdv.statut === "annule"
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-white/5 border-white/10"
                    } ${isPast ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">
                            {rdv.type === "visite" ? "🏗️" :
                             rdv.type === "livraison" ? "📦" :
                             rdv.type === "coulee" ? "🧱" :
                             rdv.type === "reunion" ? "🤝" :
                             rdv.type === "rdv_client" ? "👤" : "📌"}
                          </span>
                          <h4 className="font-bold text-white text-lg">{rdv.titre}</h4>
                        </div>
                        <p className="text-sm text-white/70">
                          📅 {new Date(rdv.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {rdv.heure}
                        </p>
                        <p className="text-sm text-white/70">
                          ⏱️ Durée : {rdv.duree}
                        </p>
                        {rdv.lieu && (
                          <p className="text-sm text-white/70">📍 {rdv.lieu}</p>
                        )}
                        {chantier && (
                          <p className="text-sm text-white/70 mt-1">
                            🏠 Chantier : <Link href={`/admin/chantier/${chantier.id}`} className="text-[#FF7A00] hover:underline">
                              {chantier.nom_projet || chantier.nom}
                            </Link>
                          </p>
                        )}
                        {rdv.description && (
                          <p className="text-sm text-white/60 mt-2 italic">{rdv.description}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          rdv.statut === "confirme_admin" || rdv.statut === "confirme_client" ? "bg-green-500/20 text-green-400" :
                          rdv.statut === "reporte" ? "bg-orange-500/20 text-orange-400" :
                          rdv.statut === "annule" ? "bg-red-500/20 text-red-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {rdv.statut === "propose" ? "📝 Proposé" :
                           rdv.statut === "confirme_admin" ? "✅ Confirmé (Admin)" :
                           rdv.statut === "confirme_client" ? "✅ Confirmé (Client)" :
                           rdv.statut === "reporte" ? "⏸️ Reporté" : "❌ Annulé"}
                        </span>
                        
                        <div className="flex gap-1">
                          {rdv.statut === "propose" && (
                            <button 
                              onClick={() => handleChangerStatut(rdv.id, "confirme_admin")}
                              className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30"
                            >
                              ✅ Confirmer
                            </button>
                          )}
                          <button 
                            onClick={() => handleSupprimerRdv(rdv.id)}
                            className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Vue Mois (Calendrier visuel) */}
        {vue === "mois" && (
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setMonth(d.getMonth() - 1);
                  setCurrentDate(d);
                }}
                className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20"
              >
                ← Précédent
              </button>
              <h3 className="font-bold text-lg">
                {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setMonth(d.getMonth() + 1);
                  setCurrentDate(d);
                }}
                className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20"
              >
                Suivant →
              </button>
            </div>

            {/* Grille du calendrier */}
            <div className="grid grid-cols-7 gap-1">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((jour) => (
                <div key={jour} className="text-center text-xs font-bold text-white/60 py-2">
                  {jour}
                </div>
              ))}
              
              {/* Jours du mois */}
              {Array.from({ length: 42 }).map((_, idx) => {
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
                const dayDate = new Date(currentDate);
                dayDate.setDate(1 - startDay + idx);
                
                const dayRdvs = rdvs.filter(r => new Date(r.date).toDateString() === dayDate.toDateString());
                const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth();
                const isToday = dayDate.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={idx} 
                    className={`min-h-[80px] p-1 rounded-lg border ${
                      isCurrentMonth ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-white/5"
                    } ${isToday ? "ring-2 ring-[#FF7A00]" : ""}`}
                  >
                    <div className={`text-xs font-bold mb-1 ${isToday ? "text-[#FF7A00]" : "text-white/70"}`}>
                      {dayDate.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayRdvs.slice(0, 2).map((rdv) => (
                        <div 
                          key={rdv.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            rdv.type === "visite" ? "bg-blue-500/30 text-blue-300" :
                            rdv.type === "livraison" ? "bg-green-500/30 text-green-300" :
                            rdv.type === "coulee" ? "bg-orange-500/30 text-orange-300" :
                            "bg-purple-500/30 text-purple-300"
                          }`}
                          title={rdv.titre}
                        >
                          {rdv.heure} {rdv.titre.substring(0, 15)}
                        </div>
                      ))}
                      {dayRdvs.length > 2 && (
                        <div className="text-xs text-white/50">+{dayRdvs.length - 2} autres</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
