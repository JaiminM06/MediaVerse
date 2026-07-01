import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDuration } from "../../utils/formatDuration.js";

export default function Library() {
  const [history, setHistory] = useState([]);
  const [liked, setLiked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Watch History");
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [historyRes, likedRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/history`, {
            withCredentials: true,
          }),
          axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/likes/videos`, {
            withCredentials: true,
          })
        ]);

        const rawHistory = historyRes.data.data?.watchHistory || [];
        setHistory(rawHistory
          .filter(entry => entry.video)
          .map(entry => ({
            ...entry.video,
            watchedAt: entry.watchedAt
          })));

        // Map liked video records (populated from Like schema) to extract video object
        const likedVideos = (likedRes.data.data || [])
          .map(likeDoc => likeDoc.video)
          .filter(Boolean);
        setLiked(likedVideos);

      } catch (err) {
        console.error("Error fetching library:", err);
        setError("Failed to fetch library details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0F0F0F] min-h-screen p-6">
        <div className="h-8 bg-[#272727] w-48 rounded mb-8 animate-pulse" />
        <div className="flex gap-1 mb-8 border-b border-[#272727]">
          {['Watch History', 'Liked Videos'].map(tab => (
            <div key={tab} className="px-4 py-3 text-sm font-medium text-[#AAAAAA] w-32 bg-[#272727] rounded-t-lg animate-pulse mr-2" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="rounded-xl bg-[#272727] aspect-video" />
              <div className="flex gap-3 px-1">
                <div className="w-9 h-9 rounded-full bg-[#272727] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#272727] rounded w-4/5" />
                  <div className="h-3 bg-[#272727] rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0F0F0F] min-h-screen p-6 flex flex-col items-center justify-center text-center">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#FF0000] text-white font-semibold rounded-full hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeVideos = activeTab === "Watch History" ? history : liked;
  const emptyMessage = activeTab === "Watch History" 
    ? "No watch history yet. Start watching videos!"
    : "No liked videos yet. Like videos to see them here!";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F0F0F] min-h-screen p-6"
    >
      {/* Page Header */}
      <h1 className="text-white text-2xl font-bold mb-8">Library</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 border-b border-[#272727]">
        {['Watch History', 'Liked Videos'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab ? 'text-white' : 'text-[#AAAAAA] hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="libraryTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0000]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Video Content Grid */}
      {activeVideos.length === 0 ? (
        <div className="text-center py-20 text-[#606060]">
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {activeVideos.map((video) => (
            <motion.article
              key={video._id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15 }}
              className="group cursor-pointer flex flex-col gap-3"
              onClick={() => navigate(`/youtube/watch/${video._id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/youtube/watch/${video._id}`)}
            >
              {/* Thumbnail */}
              <div className="relative rounded-xl overflow-hidden aspect-video bg-[#1A1A1A]">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>

              {/* Info */}
              <div className="flex gap-3 px-0.5">
                <img
                  src={video.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.owner?.username || "U")}&background=random`}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-[#272727] shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-[#AAAAAA] text-xs mt-1 truncate">
                    {video.owner?.username || "Unknown Channel"}
                  </p>
                  <p className="text-[#606060] text-xs mt-0.5">
                    {(video.views ?? 0).toLocaleString()} views
                  </p>

                  {/* watchedAt Date for History cards */}
                  {activeTab === "Watch History" && video.watchedAt && (
                    <p className="text-[#606060] text-xs mt-1">
                      Watched {new Date(video.watchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </motion.div>
  );
}
