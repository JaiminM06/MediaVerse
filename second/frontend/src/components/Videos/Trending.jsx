import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Flame, Loader2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDuration } from "../../utils/formatDuration.js";

const SkeletonCard = () => (
  <div className="flex flex-col gap-3 animate-pulse">
    <div className="rounded-xl bg-[#272727] aspect-video" />
    <div className="flex gap-3 px-1">
      <div className="w-9 h-9 rounded-full bg-[#272727] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[#272727] rounded w-4/5" />
        <div className="h-3 bg-[#272727] rounded w-2/3" />
      </div>
    </div>
  </div>
);

function Trending() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("week");
  const navigate = useNavigate();

  const fetchTrending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/trending/videos?period=${period}`,
        { withCredentials: true }
      );
      setVideos(res.data.data?.trending || []);
    } catch (err) {
      setError("Failed to load trending videos. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  if (loading) {
    return (
      <div className="bg-[#0F0F0F] min-h-screen p-6">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Trending</h1>
          <p className="text-[#AAAAAA] text-sm mt-1">What's popular right now</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F0F0F] min-h-screen p-6"
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Trending</h1>
        <p className="text-[#AAAAAA] text-sm mt-1">What's popular right now</p>
      </div>

      {/* Period Toggles */}
      <div className="flex gap-2 mb-6">
        {["day", "week", "month"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              period === p
                ? "bg-[#FF0000] text-white"
                : "bg-[#272727] text-[#AAAAAA] hover:bg-[#383838] hover:text-white"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12 text-[#FF0000] flex flex-col items-center gap-2">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchTrending();
            }}
            className="mt-3 px-5 py-2 bg-[#FF0000] text-white rounded-full text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && videos.length === 0 && (
        <div className="text-center py-20 text-[#AAAAAA]">
          <p className="text-lg font-medium">No trending videos this {period}.</p>
          <p className="text-sm mt-2 text-[#606060]">
            Check back later or try a different time period.
          </p>
        </div>
      )}

      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map((video) => (
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
                
                {/* Engagement score badge */}
                <span className="absolute top-2 left-2 bg-[#FF0000] text-white text-xs font-bold px-2 py-0.5 rounded-full z-10 shadow-md">
                  🔥 {Math.floor(video.engagementScore).toLocaleString()}
                </span>

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm p-3 rounded-full">
                    <Play size={22} className="text-white fill-white" />
                  </div>
                </div>
                
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
                  <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-white transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-[#AAAAAA] text-xs mt-1 truncate">
                    {video.owner?.username || "Unknown Channel"}
                  </p>
                  <p className="text-[#606060] text-xs mt-0.5">
                    {(video.views ?? 0).toLocaleString()} views
                    <span className="mx-1">•</span>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Trending;
