import { useState, useEffect } from "react";
import { Menu, Search, User, Home, Upload, Flame, Library, X, Settings, Twitter, BarChart2 } from "lucide-react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import useSocket from "./src/hooks/useSocket.js";
import NotificationBell from "./src/components/Notifications/NotificationBell.jsx";
import { API_BASE_URL } from "./src/config/api.js";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [socketToken, setSocketToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/v1/users/current-user`, { withCredentials: true })
      .then((res) => {
        setUser(res.data.data);
        setSocketToken(res.data.data?._id || null);
      })
      .catch(() => setSocketToken(null));
  }, []);

  const socket = useSocket(socketToken);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/Home/search?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen((prev) => !prev);
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  const navItems = [
    { to: "/Home/feed", icon: Home, label: "Home" },
    { to: "/Home/tweets", icon: Twitter, label: "Tweets" },
    { to: "/Home/trending", icon: Flame, label: "Trending" },
    { to: "/Home/library", icon: Library, label: "Library" },
    { to: "/Home/dashboard", icon: BarChart2, label: "Dashboard" },
    { to: "/Home/uploadVideo", icon: Upload, label: "Upload" },
    { to: "/Home/user", icon: User, label: "Profile" },
  ];

  const searchForm = (className = "") => (
    <form onSubmit={handleSearch} className={`flex w-full group shadow-sm hover:shadow-md transition-shadow duration-300 rounded-full ${className}`}>
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search videos, posts..."
        aria-label="Search"
        className="w-full bg-white text-slate-900 px-4 md:px-5 py-2 md:py-2.5 rounded-l-full focus:outline-none focus:ring-1 focus:ring-brand-500 border border-slate-200 placeholder-slate-400 text-sm"
      />
      <button
        type="submit"
        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 border-l-0 px-4 md:px-6 py-2 md:py-2.5 rounded-r-full transition-colors flex items-center justify-center shrink-0"
        aria-label="Submit search"
      >
        <Search size={18} className="text-slate-600" />
      </button>
    </form>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-slate-900 overflow-hidden font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static z-50
          flex flex-col h-full bg-white border-r border-slate-200 shadow-2xl md:shadow-none
          transition-all duration-300 ease-in-out
          flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isExpanded ? "w-64" : "w-20"}
        `}
        aria-label="Main navigation"
      >
        <div className={`flex items-center ${isExpanded ? "justify-between px-4" : "justify-center px-2"} h-16 border-b border-slate-100`}>
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 shrink-0"
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu size={20} />
            </button>
            {isExpanded && (
              <button
                onClick={() => navigate("/Home/feed")}
                className="font-bold text-xl tracking-tight text-slate-900 truncate hover:text-brand-600 transition-colors"
              >
                MediaVerse
              </button>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500 shrink-0"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              end={item.to === "/Home/feed"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium group
                ${isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${!isExpanded ? "justify-center" : ""}`
              }
              title={!isExpanded ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={22}
                    className={`flex-shrink-0 ${isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}`}
                  />
                  {isExpanded && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all w-full text-left group ${!isExpanded ? "justify-center" : ""}`}
              onClick={() => navigate("/Home/user")}
            >
              <img
                src={user.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-brand-100 transition-colors flex-shrink-0"
              />
              {isExpanded && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-700 transition-colors">{user.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                  </div>
                  <Settings size={16} className="text-slate-400 group-hover:text-brand-600 shrink-0" />
                </>
              )}
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-3 md:px-6 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-600 shrink-0"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="hidden md:flex flex-1 max-w-2xl mx-auto px-4">
            {searchForm()}
          </div>

          <div className="flex md:hidden flex-1 min-w-0">
            {searchForm()}
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button
              onClick={() => navigate("/Home/tweets")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-4 md:py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/20 rounded-full hover:bg-[#1DA1F2]/20 transition-all"
              title="Switch to Posts"
            >
              <Twitter size={16} className="shrink-0" />
              <span className="text-xs md:text-sm font-semibold whitespace-nowrap hidden sm:inline">Posts</span>
            </button>

            {user && <NotificationBell socket={socket} />}

            {user ? (
              <button
                onClick={() => navigate("/Home/user")}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-brand-200 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                aria-label="Your profile"
              >
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button
                onClick={() => navigate("/Login")}
                className="bg-brand-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 whitespace-nowrap"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 lg:p-8">
          <Outlet context={{ socket, currentUserId: user?._id }} />
        </main>
      </div>
    </div>
  );
}
