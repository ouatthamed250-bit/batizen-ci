"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Mail, Smartphone, CheckCircle2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { ref, set, get } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

type NotificationPreferences = {
  chantier_active: boolean;
  chantier_termine: boolean;
  nouveau_message: boolean;
  nouvelle_photo: boolean;
  paiement_recu: boolean;
  promotion: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  chantier_active: true,
  chantier_termine: true,
  nouveau_message: true,
  nouvelle_photo: true,
  paiement_recu: true,
  promotion: false,
};

export default function SettingsPage() {
  const { user } = useAuthContext();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      const { database } = getFirebaseServices();
      const snap = await get(ref(database, `users/${user.uid}/notificationPreferences`));
      if (snap.exists()) {
        setPrefs({ ...DEFAULT_PREFS, ...(snap.val() as NotificationPreferences) });
      }
    };
    load();
  }, [user]);

  const toggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const { database } = getFirebaseServices();
      await set(ref(database, `users/${user.uid}/notificationPreferences`), prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const PreferenceItem = ({ label, description, checked, onToggle }: { label: string; description: string; checked: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between rounded-[14px] border border-[#E7EBF5] bg-white p-4 shadow-sm">
      <div className="flex-1">
        <p className="font-black text-[#0D2B6B]">{label}</p>
        <p className="text-xs text-[#6B7280]">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative ml-3 grid size-12 place-items-center rounded-full transition ${checked ? "bg-[#22C55E] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}
        aria-label={checked ? "Activé" : "Désactivé"}
      >
        <CheckCircle2 size={22} />
      </button>
    </div>
  );

  return (
    <main className="pt-20 pb-16 px-4 min-h-screen bg-[#f9fafb]">
      <div className="relative overflow-hidden bg-[#0D2B6B] pb-16 pt-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D2B6B] to-[#1E40AF]" />
        <div className="relative px-4">
          <h1 className="text-3xl font-black text-white">⚙️ Paramètres</h1>
          <p className="mt-1 text-sm font-semibold text-white/70">Gérez vos préférences de notifications</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 -mt-8 space-y-4">
        <div className="rounded-2xl border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="text-[#FF7A00]" size={18} />
            <h2 className="font-black text-[#0D2B6B]">Notifications</h2>
          </div>
          <p className="mb-4 text-xs text-[#6B7280]">Choisissez les événements pour lesquels vous souhaitez être notifié.</p>
          <div className="space-y-3">
            <PreferenceItem label="Chantier activé" description="Recevoir une notification quand un chantier passe en cours" checked={prefs.chantier_active} onToggle={() => toggle("chantier_active")} />
            <PreferenceItem label="Chantier terminé" description="Recevoir une notification quand un chantier est terminé" checked={prefs.chantier_termine} onToggle={() => toggle("chantier_termine")} />
            <PreferenceItem label="Nouveau message" description="Recevoir une notification pour chaque nouveau message" checked={prefs.nouveau_message} onToggle={() => toggle("nouveau_message")} />
            <PreferenceItem label="Nouvelle photo" description="Recevoir une notification quand une photo est ajoutée" checked={prefs.nouvelle_photo} onToggle={() => toggle("nouvelle_photo")} />
            <PreferenceItem label="Paiement reçu" description="Recevoir une confirmation pour chaque paiement" checked={prefs.paiement_recu} onToggle={() => toggle("paiement_recu")} />
            <PreferenceItem label="Promotions" description="Recevoir les offres et actualités de BATIZEN.CI" checked={prefs.promotion} onToggle={() => toggle("promotion")} />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#0D2B6B] py-3 text-sm font-black text-white transition active:scale-95 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : saved ? "✓ Enregistré" : "Enregistrer les préférences"}
          </button>
        </div>

        <div className="rounded-2xl border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="text-[#FF7A00]" size={18} />
            <h2 className="font-black text-[#0D2B6B]">Notifications push</h2>
          </div>
          <p className="text-xs text-[#6B7280]">Les notifications push sont activées par défaut sur votre appareil.</p>
        </div>

        <div className="rounded-2xl border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="mb-3 flex items-center gap-2">
            <Smartphone className="text-[#FF7A00]" size={18} />
            <h2 className="font-black text-[#0D2B6B]">Notifications in-app</h2>
          </div>
          <p className="text-xs text-[#6B7280]">Les notifications dans l'application sont toujours actives. Consultez la page <a href="/notifications" className="font-bold text-[#0B5FFF]">Notifications</a> pour voir votre historique.</p>
        </div>
      </div>
    </main>
  );
}
