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

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      {/* Header avec image de fond */}
      <div className="relative overflow-hidden bg-[#0D2B6B] pb-16 pt-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D2B6B] to-[#1E40AF]" />
        <div className="relative px-4">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-white/80 transition hover:text-white"
          >
            <ArrowLeft size={16} /> Retour
          </Link>
          <h1 className="text-3xl font-black text-white">🔔 Mes notifications</h1>
          <p className="mt-1 text-sm font-semibold text-white/70">
            {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}` : "Toutes les notifications sont lues"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 -mt-8">
        {/* Filtres et actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={18} className="text-[#6B7280]" />
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
                      : "bg-[#F7F9FC] text-[#6B7280] hover:bg-[#E7EBF5]"
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
        <div className="mt-4 space-y-3 pb-24">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-[#E7EBF5]" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-dashed border-[#E7EBF5] bg-white p-12 text-center"
            >
              <CheckCircle2 size={48} className="mx-auto text-[#22C55E]" />
              <p className="mt-4 text-lg font-black text-[#0D2B6B]">
                {filter === "unread" ? "Toutes les notifications sont lues" : "Aucune notification"}
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">
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
                  className={`rounded-2xl border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)] transition hover:shadow-[0_8px_24px_rgba(16,24,40,0.12)] ${
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
                          <p className="font-black text-[#0D2B6B]">{notif.message}</p>
                          {notif.chantierNom && (
                            <p className="mt-1 text-xs text-[#6B7280]">
                              📁 {notif.chantierNom}
                            </p>
                          )}
                        </div>
                        {!notif.lu && (
                          <span className="size-2 shrink-0 rounded-full bg-[#EF4444]" />
                        )}
                      </div>

                      <p className="mt-2 text-[10px] text-[#6B7280]">
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
                            className="flex items-center gap-1 rounded-full bg-[#F7F9FC] px-4 py-1.5 text-xs font-black text-[#6B7280] transition hover:bg-[#E7EBF5]"
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
}