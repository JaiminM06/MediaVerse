import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

const platforms = [
  {
    id: "youtube",
    icon: "🎬",
    title: "MediaVerse",
    subtitle: "Videos · Playlists · Analytics",
    path: "/youtube/feed",
    gradient: "from-[#1A0000] to-[#2D0A0A]",
    border: "border-[#FF000033]",
    borderHover: "hover:border-[#FF0000]",
    btnBg: "bg-[#FF0000] hover:bg-[#CC0000]",
    glowColor: "rgba(255,0,0,0.2)",
  },
  {
    id: "twitter",
    icon: "🐦",
    title: "MediaVerse X",
    subtitle: "Tweets · Threads · Trending",
    path: "/twitter/home",
    gradient: "from-[#00101A] to-[#0A1929]",
    border: "border-[#1DA1F233]",
    borderHover: "hover:border-[#1DA1F2]",
    btnBg: "bg-[#1DA1F2] hover:bg-[#1A8CD8]",
    glowColor: "rgba(29,161,242,0.2)",
  },
];

export default function PlatformSelector() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/v1/users/current-user`, { withCredentials: true })
      .then(() => {
        const lastPlatform = localStorage.getItem("mv_last_platform") || "youtube";
        navigate(lastPlatform === "twitter" ? "/twitter/home" : "/youtube/feed", { replace: true });
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  const handleSelect = (platform) => {
    localStorage.setItem("mv_last_platform", platform.id);
    navigate(platform.path);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] bg-grid-pattern flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#FF0000]/5 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#1DA1F2]/5 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="max-w-3xl w-full mx-auto text-center relative z-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-3">
            Media<span className="text-gradient">Verse</span>
          </h1>
          <p className="text-[#AAAAAA] text-lg font-medium mb-12">Choose your experience</p>
        </motion.div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.15, duration: 0.4, ease: "easeOut" }}
              whileHover={{ y: -6, boxShadow: `0 25px 60px ${platform.glowColor}` }}
              className={`bg-gradient-to-br ${platform.gradient} border ${platform.border} ${platform.borderHover} rounded-2xl p-8 cursor-pointer transition-colors duration-200 group`}
              onClick={() => handleSelect(platform)}
            >
              <div className="text-5xl mb-5">{platform.icon}</div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{platform.title}</h2>
              <p className="text-[#AAAAAA] text-sm mb-6 font-medium">{platform.subtitle}</p>
              <button
                className={`${platform.btnBg} text-white font-semibold px-8 py-2.5 rounded-full text-sm transition-all duration-200 group-hover:scale-105`}
              >
                Enter
              </button>
            </motion.div>
          ))}
        </div>

        {/* Sign in link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-[#606060] text-sm"
        >
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#1DA1F2] hover:underline font-medium"
          >
            Sign in
          </button>
        </motion.p>
      </div>
    </div>
  );
}
