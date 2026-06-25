import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Bell, Check, Trash2, ShieldAlert } from "lucide-react";

export default function NotificationBell({ socket }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notifications?limit=10&unreadOnly=false`,
        { withCredentials: true }
      );
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("notification", (data) => {
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("notification");
    };
  }, [socket]);

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/notifications/read-all`,
        {},
        { withCredentials: true }
      );
      await fetchNotifications();
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fadeIn origin-top-right">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 hover:underline transition-all"
              >
                <Check size={14} /> Mark all as read
              </button>
            )}
          </div>

          {/* Notifications Scroll Box */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Bell size={32} className="text-slate-300 stroke-[1.5]" />
                <span className="text-sm">All caught up! No notifications.</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 flex gap-3 hover:bg-slate-50 transition-all ${
                    !notif.read ? "bg-brand-50/20" : ""
                  }`}
                >
                  {/* Indicator Dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        !notif.read ? "bg-red-500 animate-pulse" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  {/* Notification Body */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs text-slate-700 leading-snug break-words ${!notif.read ? "font-semibold text-slate-900" : ""}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
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
        </div>
      )}
    </div>
  );
}
