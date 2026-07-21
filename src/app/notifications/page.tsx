"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Image as ImageIcon,
  CreditCard,
  CalendarCheck,
  CheckCheck,
  Filter,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  formatNotificationDate,
  getNotificationIcon,
  getNotificationColor,
  type Notification,
} from "@/lib/notifications";
import BtpBackground from "@/components/btp/BtpBackground";

type FilterType = "all" | "unread" | "chantier_active" | "chantier_termine" | "nouveau_message";

export default function NotificationsPage() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const loadNotifications = async () => {
      const notifs = await getUserNotifications(user.uid);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.lu).length);
      setLoading(false);
    };

    loadNotifications();
  }, [user]);

  const handleMarkAsRead = async (notifId: string) => {
    if (!user?.uid) return;
    await markAsRead(user.uid, notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, lu: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    await markAllAsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    setUnreadCount(0);
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.lu;
    return notif.type === filter;
  });

  const getIcon = (type: string) => {
    const iconMap: Record<string, typeof CheckCircle2> = {
      chantier_active: CheckCircle2,
      chantier_termine: CalendarCheck,
      nouveau_message: MessageSquare,
      nouvelle_photo: ImageIcon,
      paiement_recu: CreditCard,
    };
    const IconComponent = iconMap[type] || CheckCircle2;
    return <IconComponent size={24} />;
  };

  const pageContent = (
    <main className="min-h-screen pt-24 pb-24 px-2">
      {/* Header */}
      <div className="mb-8 mx-2">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-blue-100 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Retour
        </Link>
        <h1 className="text-3xl font-black text-white">🔔 Mes notifications</h1>
        <p className="mt-1 text-sm font-semibold text-blue-100">
          {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}` : "Toutes les notifications sont lues"}
        </p>
      </div>

      <div className="mx-2 space-y-4">
        {/* Filtres et actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={18} className="text-blue-200" />
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Toutes" },
                { value: "unread", label: "Non lues" },
                { value: "chantier_active", label: "Activations" },
                { value: "chantier_termine", label: "Terminaisons" },
                { value: "nouveau_message", label: "Messages" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value as FilterType)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    filter === f.value
                      ? "bg-[#0D2B6B] text-white"
                      : "bg-white/20 text-blue-200 hover:bg-white/30"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="ml-auto flex items-center gap-1 rounded-full bg-[#22C55E] px-4 py-2 text-xs font-black text-white transition hover:bg-[#22C55E]/90"
              >
                <CheckCheck size={14} />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </motion.div>

        {/* Liste des notifications */}
        <div className="space-y-3">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/20" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-dashed border-white/20 bg-white/10 p-12 text-center backdrop-blur-xl"
            >
              <CheckCircle2 size={48} className="mx-auto text-[#22C55E]" />
              <p className="mt-4 text-lg font-black text-white">
                {filter === "unread" ? "Toutes les notifications sont lues" : "Aucune notification"}
              </p>
              <p className="mt-1 text-sm text-blue-100">
                {filter === "unread"
                  ? "Vous êtes à jour !"
                  : "Vous n'avez pas encore reçu de notifications"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl transition ${
                    !notif.lu ? "ring-2 ring-[#FF7A00]/20" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className="grid size-12 shrink-0 place-items-center rounded-full"
                      style={{ backgroundColor: `${getNotificationColor(notif.type)}15` }}
                    >
                      <span style={{ color: getNotificationColor(notif.type) }}>
                        {getNotificationIcon(notif.type)}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-white">{notif.message}</p>
                          {notif.chantierNom && (
                            <p className="mt-1 text-xs text-blue-100">
                              📁 {notif.chantierNom}
                            </p>
                          )}
                        </div>
                        {!notif.lu && (
                          <span className="size-2 shrink-0 rounded-full bg-red-400" />
                        )}
                      </div>

                      <p className="mt-2 text-[10px] text-blue-200">
                        {formatNotificationDate(notif.dateCreation)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {notif.chantierId && (
                          <Link
                            href={`/chantier/${notif.chantierId}`}
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="rounded-full bg-[#0D2B6B] px-4 py-1.5 text-xs font-black text-white transition hover:bg-[#0D2B6B]/90"
                          >
                            Voir le chantier
                          </Link>
                        )}
                        {!notif.lu && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 text-xs font-black text-blue-200 transition hover:bg-white/30"
                          >
                            <CheckCheck size={14} />
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </main>
  );

  return (
    <BtpBackground imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop" overlay="light">
      {pageContent}
    </BtpBackground>
  );
}
