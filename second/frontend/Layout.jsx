import { useState, useEffect } from "react";
import { Menu, Search, Bell, User, Home, Upload, Flame, Tv, Library, X, LogOut, Settings } from "lucide-react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle
  const [isExpanded, setIsExpanded] = useState(true); // Desktop collapse state
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/v1/users/current-user", {
          withCredentials: true,
        });
        setUser(res.data.data);
      } catch (error) {
        console.error("Failed to fetch user in layout:", error);
      }
    };
    fetchUser();
  }, []);

  const navItems = [
    { to: "/Home/feed", icon: Home, label: "Home" },
    { to: "trending", icon: Flame, label: "Trending" },
    { to: "library", icon: Library, label: "Library" },
    { to: "uploadVideo", icon: Upload, label: "Upload" },
    { to: "user", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-slate-900 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-50
          flex flex-col h-full bg-white border-r border-slate-200 shadow-2xl md:shadow-none
          transition-all duration-300 ease-in-out
          flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isExpanded ? "w-64" : "w-20"}
        `}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center ${isExpanded ? "justify-between px-4" : "justify-center"} h-16 border-b border-slate-100 transition-all`}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/Home/feed")}>
            <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <Menu size={20} />
            </button>
            <span className={`font-bold text-lg text-slate-900 md:hidden`}>MyTube</span>
          </div>
            <span className={`font-bold text-xl tracking-tight text-slate-900 overflow-hidden transition-all duration-300 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 hidden"}`}>
              MyTube
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium group
                ${isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${!isExpanded && "justify-center"}`
              }
              title={!isExpanded ? item.label : ""}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={22}
                    className={`flex-shrink-0 ${isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}`}
                  />
                  <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 hidden"}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Mini Profile (Bottom) */}
        {user && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer group ${!isExpanded && "justify-center"}`}
              onClick={() => navigate('/Home/user')}
            >
              <img
                src={user.avatar}
                alt="User"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-brand-100 transition-colors flex-shrink-0"
              />
              {isExpanded && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-700 transition-colors">{user.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                  </div>
                  <Settings size={16} className="text-slate-400 group-hover:text-brand-600" />
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-shadow">
          

          {/* Search Bar - Better Centered */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto px-8 relative">
            <div className="w-full relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search videos, channels..."
                className="w-full bg-slate-100 text-slate-900 pl-11 pr-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all border border-transparent focus:border-brand-200 placeholder-slate-400 shadow-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 relative group transition-colors">
              <Bell size={20} className="group-hover:text-slate-900" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {user ? (
              <button
                onClick={() => navigate('/Home/user')}
                className="ml-2 w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-brand-200 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
              >
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <button
                onClick={() => navigate('/Login')}
                className="ml-2 bg-brand-600 text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
              >
                Sign In
              </button>
            )}

          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-slate-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

