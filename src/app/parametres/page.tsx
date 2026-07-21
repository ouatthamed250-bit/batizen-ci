"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Mail, Smartphone, CheckCircle2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { ref, set, get } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import BtpBackground from "@/components/btp/BtpBackground";

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
    <div className="flex items-center justify-between rounded-[14px] border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl">
      <div className="flex-1">
        <p className="font-black text-white">{label}</p>
        <p className="text-xs text-blue-100">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative ml-3 grid size-12 place-items-center rounded-full transition ${checked ? "bg-[#22C55E] text-white" : "bg-white/20 text-blue-200"}`}
        aria-label={checked ? "Activé" : "Désactivé"}
      >
        <CheckCircle2 size={22} />
      </button>
    </div>
  );

  const pageContent = (
    <div className="min-h-screen pt-24 pb-24 px-2">
      <div className="mb-8 mx-2">
        <h1 className="text-3xl font-black text-white">⚙️ Paramètres</h1>
        <p className="mt-1 text-sm font-semibold text-blue-100">Gérez vos préférences de notifications</p>
      </div>

      <div className="mx-2 space-y-4">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="text-[#FF7A00]" size={18} />
            <h2 className="font-black text-white">Notifications</h2>
          </div>
          <p className="mb-4 text-xs text-blue-100">Choisissez les événements pour lesquels vous souhaitez être notifié.</p>
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
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] py-3 text-sm font-black text-white transition active:scale-95 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : saved ? "✓ Enregistré" : "Enregistrer les préférences"}
          </button>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="text-[#FF7A00]" size={18} />
            <h2 className="font-black text-white">Notifications push</h2>
          </div>
          <p className="text-xs text-blue-100">Les notifications push sont activées par défaut sur votre appareil.</p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2">
            <Smartphone className="text-[#FF7A00]" size={18} />
            <h2 className="font-black text-white">Notifications in-app</h2>
          </div>
          <p className="text-xs text-blue-100">Les notifications dans l'application sont toujours actives. Consultez la page <a href="/notifications" className="font-bold text-blue-300">Notifications</a> pour voir votre historique.</p>
        </div>
      </div>
    </div>
  );

  return (
    <BtpBackground imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop" overlay="medium">
      {pageContent}
    </BtpBackground>
  );
}