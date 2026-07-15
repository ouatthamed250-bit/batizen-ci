"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  Image as ImageIcon,
  CreditCard,
  CalendarCheck,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  subscribeToNotifications,
  subscribeToAdminNotifications,
  markAsRead,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationDate,
  type Notification,
} from "@/lib/notifications";

export default function NotificationBell() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Souscrire aux notifications admin et utilisateur en parallèle
    let unsubAdmin: (() => void) | null = null;
    let unsubUser: (() => void) | null = null;

    const loadAdmin = async () => {
      import("@/lib/notifications").then(({ subscribeToAdminNotifications }) => {
        unsubAdmin = subscribeToAdminNotifications((notifs) => {
          setNotifications((prev) => {
            const combined = [...notifs, ...prev];
            const unique = Array.from(new Map(combined.map((n) => [n.id, n])).values());
            return unique.sort((a, b) => b.dateCreation - a.dateCreation).slice(0, 5);
          });
          setUnreadCount((prev) => prev + notifs.filter((n) => !n.lu).length);
        });
      });
    };

    const loadUser = async () => {
      import("@/lib/notifications").then(({ subscribeToNotifications }) => {
        unsubUser = subscribeToNotifications(user.uid, (notifs) => {
          setNotifications(notifs.slice(0, 5));
          setUnreadCount(notifs.filter((n) => !n.lu).length);
        });
      });
    };

    loadAdmin();
    loadUser();

    return () => {
      if (unsubAdmin) unsubAdmin();
      if (unsubUser) unsubUser();
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.lu && user?.uid) {
      await markAsRead(user.uid, notif.id);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    const iconMap: Record<string, typeof CheckCircle2> = {
      chantier_active: CheckCircle2,
      chantier_termine: CalendarCheck,
      nouveau_message: MessageSquare,
      nouvelle_photo: ImageIcon,
      paiement_recu: CreditCard,
    };
    const IconComponent = iconMap[type] || Bell;
    return <IconComponent size={18} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-[#EF4444] text-[10px] font-black text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[#E7EBF5] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
          >
            <div className="border-b border-[#E7EBF5] p-4">
              <h3 className="font-black text-[#0D2B6B]">Notifications</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell size={32} className="mx-auto text-[#9CA3AF]" />
                  <p className="mt-2 text-sm font-bold text-[#6B7280]">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.chantierId ? `/chantier/${notif.chantierId}` : "/notifications"}
                    onClick={() => handleNotificationClick(notif)}
                    className={`block border-b border-[#E7EBF5] p-3 transition hover:bg-[#F7F9FC] ${
                      !notif.lu ? "bg-[#F7F9FC]/50" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className="grid size-10 shrink-0 place-items-center rounded-full"
                        style={{ backgroundColor: `${getNotificationColor(notif.type)}20` }}
                      >
                        <span style={{ color: getNotificationColor(notif.type) }}>
                          {getNotificationIcon(notif.type)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-[#0D2B6B]">{notif.message}</p>
                        <p className="mt-0.5 text-[10px] text-[#6B7280]">
                          {formatNotificationDate(notif.dateCreation)}
                        </p>
                      </div>
                      {!notif.lu && (
                        <span className="size-2 shrink-0 rounded-full bg-[#EF4444]" />
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-[#E7EBF5] p-2">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#0D2B6B] py-2 text-sm font-black text-white transition hover:bg-[#0D2B6B]/90"
                >
                  Voir toutes les notifications <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}