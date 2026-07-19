"use client";

import { useState, useEffect } from "react";
import { ref, push, update, onValue } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { useAuthContext } from "@/contexts/AuthContext";

type Chantier = {
  userId?: string;
  nom_projet?: string;
  nom?: string;
  client_nom?: string;
  budget?: number;
};

export default function PaiementsSection({ chantierId, chantier }: { chantierId: string; chantier: Chantier | null }) {
  const { database } = getFirebaseServices();
  const { user } = useAuthContext();
  
  const [paiements, setPaiements] = useState<any[]>([]);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [paiementForm, setPaiementForm] = useState({
    montant: 0,
    datePaiement: new Date().toISOString().split('T')[0],
    mode: "cash",
    reference: "",
    description: ""
  });

  // Listener pour les paiements
  useEffect(() => {
    const paiementsRef = ref(database, 'paiements');
    const unsubPaiements = onValue(paiementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const paiementsChantier = Object.entries(data)
          .filter(([id, p]: [string, any]) => p.chantierId === chantierId && p.actif)
          .map(([id, p]: [string, any]) => ({ id, ...p }))
          .sort((a: any, b: any) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime());
        setPaiements(paiementsChantier);
      } else {
        setPaiements([]);
      }
    });
    return () => unsubPaiements();
  }, [chantierId, database]);

  // Calculs financiers
  const totalPaye = paiements
    .filter(p => p.statut === "valide")
    .reduce((sum, p) => sum + p.montant, 0);
  
  const budgetTotal = chantier?.budget || 0;
  const resteAPayer = budgetTotal - totalPaye;
  const pourcentagePaye = budgetTotal > 0 ? Math.round((totalPaye / budgetTotal) * 100) : 0;

  // Enregistrer un paiement (Admin)
  const handleEnregistrerPaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paiementForm.montant <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    try {
      await push(ref(database, 'paiements'), {
        chantierId,
        clientId: chantier?.userId,
        ...paiementForm,
        statut: "valide",
        creePar: user?.uid,
        creeParRole: "admin",
        validePar: user?.uid,
        dateValidation: Date.now(),
        dateCreation: Date.now(),
        actif: true
      });

      alert("✅ Paiement enregistré avec succès !");
      setShowPaiementForm(false);
      setPaiementForm({
        montant: 0,
        datePaiement: new Date().toISOString().split('T')[0],
        mode: "cash",
        reference: "",
        description: ""
      });
    } catch (error) {
      console.error("Erreur enregistrement paiement:", error);
      alert("Erreur lors de l'enregistrement du paiement");
    }
  };

  // Valider un paiement
  const handleValiderPaiement = async (paiementId: string) => {
    await update(ref(database, `paiements/${paiementId}`), {
      statut: "valide",
      validePar: user?.uid,
      dateValidation: Date.now()
    });
    alert("✅ Paiement validé !");
  };

  // Rejeter un paiement
  const handleRejeterPaiement = async (paiementId: string) => {
    if (!confirm("Rejeter ce paiement ?")) return;
    await update(ref(database, `paiements/${paiementId}`), {
      statut: "rejete"
    });
    alert("❌ Paiement rejeté.");
  };

  // Générer un reçu PDF
  const handleGenererRecuPDF = (paiement: any) => {
    const contenu = `
      <html>
        <head>
          <title>Reçu de paiement - BÂTIZEN.CI</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #FF7A00; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #FF7A00; }
            .info { margin: 10px 0; }
            .montant { font-size: 32px; font-weight: bold; color: #22C55E; text-align: center; margin: 30px 0; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">BÂTIZEN.CI</div>
            <div>Reçu de paiement</div>
          </div>
          <div class="info"><strong>Chantier :</strong> ${chantier?.nom_projet || chantier?.nom}</div>
          <div class="info"><strong>Client :</strong> ${chantier?.client_nom || "Client"}</div>
          <div class="info"><strong>Date :</strong> ${new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}</div>
          <div class="info"><strong>Mode :</strong> ${paiement.mode.toUpperCase()}</div>
          <div class="info"><strong>Référence :</strong> ${paiement.reference || "N/A"}</div>
          <div class="montant">${paiement.montant?.toLocaleString('fr-FR') || 0} FCFA</div>
          ${paiement.description ? `<div class="info"><strong>Note :</strong> ${paiement.description}</div>` : ""}
          <div class="footer">
            <p>Ce reçu confirme la réception du paiement ci-dessus.</p>
            <p>BÂTIZEN.CI - Votre partenaire BTP de confiance</p>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </body>
      </html>
    `;
    
    const nouvelleFenetre = window.open('', '_blank');
    if (nouvelleFenetre) {
      nouvelleFenetre.document.write(contenu);
      nouvelleFenetre.document.close();
      setTimeout(() => {
        nouvelleFenetre.print();
      }, 250);
    }
  };

  return (
    <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        💰 Paiements & Finances
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
          <p className="text-xs text-green-400 mb-1">Total payé</p>
          <p className="text-2xl font-black text-green-400">{totalPaye.toLocaleString('fr-FR')} F</p>
          <p className="text-xs text-green-400/70">{pourcentagePaye}% du budget</p>
        </div>
        <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
          <p className="text-xs text-orange-400 mb-1">Reste à payer</p>
          <p className="text-2xl font-black text-orange-400">{resteAPayer.toLocaleString('fr-FR')} F</p>
          <p className="text-xs text-orange-400/70">sur {budgetTotal.toLocaleString('fr-FR')} F</p>
        </div>
        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
          <p className="text-xs text-blue-400 mb-1">Paiements</p>
          <p className="text-2xl font-black text-blue-400">{paiements.length}</p>
          <p className="text-xs text-blue-400/70">{paiements.filter(p => p.statut === "valide").length} validés</p>
        </div>
      </div>

      <button 
        onClick={() => setShowPaiementForm(!showPaiementForm)}
        className="w-full mb-4 px-4 py-3 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#e66e00] transition"
      >
        {showPaiementForm ? "✖️ Annuler" : "+ Enregistrer un paiement"}
      </button>

      {showPaiementForm && (
        <form onSubmit={handleEnregistrerPaiement} className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
          <div>
            <label className="text-sm text-white/70 mb-1 block">Montant (FCFA) *</label>
            <input 
              type="number"
              value={paiementForm.montant}
              onChange={(e) => setPaiementForm({...paiementForm, montant: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
              placeholder="Ex: 500000"
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">Date du paiement</label>
            <input 
              type="date"
              value={paiementForm.datePaiement}
              onChange={(e) => setPaiementForm({...paiementForm, datePaiement: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">Mode de paiement</label>
            <select 
              value={paiementForm.mode}
              onChange={(e) => setPaiementForm({...paiementForm, mode: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
            >
              <option value="cash">💵 Espèces (Cash)</option>
              <option value="wave">📱 Wave</option>
              <option value="orange">📱 Orange Money</option>
              <option value="mtn">📱 MTN MoMo</option>
              <option value="autre">📌 Autre</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">Référence (numéro transaction)</label>
            <input 
              type="text"
              value={paiementForm.reference}
              onChange={(e) => setPaiementForm({...paiementForm, reference: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
              placeholder="Ex: WAVE123456 ou reçu n°..."
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1 block">Description (optionnel)</label>
            <textarea 
              value={paiementForm.description}
              onChange={(e) => setPaiementForm({...paiementForm, description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
              placeholder="Acompte, solde, etc."
            />
          </div>

          <button 
            type="submit"
            className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
          >
            ✅ Enregistrer le paiement
          </button>
        </form>
      )}

      {paiements.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-white">Historique des paiements</h4>
          {paiements.map((paiement) => (
            <div 
              key={paiement.id}
              className={`p-4 rounded-xl border ${
                paiement.statut === "valide" ? "bg-green-500/10 border-green-500/30" :
                paiement.statut === "rejete" ? "bg-red-500/10 border-red-500/30" :
                "bg-orange-500/10 border-orange-500/30"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {paiement.mode === "cash" ? "💵" :
                       paiement.mode === "wave" ? "📱" :
                       paiement.mode === "orange" ? "📱" :
                       paiement.mode === "mtn" ? "📱" : "📌"}
                    </span>
                    <p className="text-2xl font-black text-white">
                      {paiement.montant?.toLocaleString('fr-FR') || 0} FCFA
                    </p>
                  </div>
                  <p className="text-sm text-white/70">
                    📅 {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-white/70">
                    Mode : {paiement.mode?.toUpperCase()}
                  </p>
                  {paiement.reference && (
                    <p className="text-sm text-white/70">Réf : {paiement.reference}</p>
                  )}
                  {paiement.description && (
                    <p className="text-sm text-white/60 mt-1 italic">{paiement.description}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    paiement.statut === "valide" ? "bg-green-500/20 text-green-400" :
                    paiement.statut === "rejete" ? "bg-red-500/20 text-red-400" :
                    "bg-orange-500/20 text-orange-400"
                  }`}>
                    {paiement.statut === "valide" ? "✅ Validé" :
                     paiement.statut === "rejete" ? "❌ Rejeté" : "⏳ En attente"}
                  </span>

                  <div className="flex gap-1">
                    {paiement.statut === "en_attente" && (
                      <>
                        <button 
                          onClick={() => handleValiderPaiement(paiement.id)}
                          className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30"
                        >
                          ✅ Valider
                        </button>
                        <button 
                          onClick={() => handleRejeterPaiement(paiement.id)}
                          className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30"
                        >
                          ❌ Rejeter
                        </button>
                      </>
                    )}
                    {paiement.statut === "valide" && (
                      <button 
                        onClick={() => handleGenererRecuPDF(paiement)}
                        className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30"
                      >
                        📄 Reçu PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {paiements.length === 0 && !showPaiementForm && (
        <p className="text-center text-white/60 py-4">Aucun paiement enregistré pour ce chantier.</p>
      )}
    </div>
  );
}