import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Bell, Check } from "lucide-react";

const isUnread = (notif) => !(notif.isRead ?? notif.read);

export default function NotificationBell({ socket, platform = "youtube" }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isYoutube = platform === "youtube";
  const accentColor = isYoutube ? "var(--yt-primary)" : "var(--tw-primary)";

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notifications?limit=10&unreadOnly=false`,
        { withCredentials: true }
      );
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("notification", (data) => {
      const incoming = {
        ...data.notification,
        isRead: false,
        createdAt: data.notification.createdAt || new Date().toISOString(),
      };
      setNotifications((prev) => [incoming, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket.off("notification");
  }, [socket]);

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notifications/read-all`,
        {},
        { withCredentials: true }
      );
      await fetchNotifications();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell size={20} className="text-[var(--yt-text-secondary)]" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border overflow-hidden z-50 origin-top-right"
            style={{
              backgroundColor: isYoutube ? "var(--yt-card)" : "var(--tw-card)",
              borderColor: isYoutube ? "var(--yt-border)" : "var(--tw-border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: isYoutube ? "var(--yt-border)" : "var(--tw-border)" }}>
              <h3 className="font-bold text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold flex items-center gap-1 hover:underline transition-all"
                  style={{ color: accentColor }}
                >
                  <Check size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-2">
                  <Bell size={28} className="text-[var(--yt-text-muted)]" />
                  <span className="text-sm text-[var(--yt-text-secondary)]">All caught up!</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-4 flex gap-3 hover:bg-white/5 transition-colors border-b ${
                      isUnread(notif) ? "bg-white/[0.02]" : ""
                    }`}
                    style={{ borderColor: isYoutube ? "var(--yt-border)" : "var(--tw-border)" }}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`h-2 w-2 rounded-full ${isUnread(notif) ? "" : "bg-[var(--yt-text-muted)]"}`}
                        style={isUnread(notif) ? { backgroundColor: accentColor } : {}}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug break-words ${
                        isUnread(notif) ? "font-semibold text-white" : "text-[var(--yt-text-secondary)]"
                      }`}>
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-[var(--yt-text-muted)] block mt-1">
                        {new Date(notif.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
