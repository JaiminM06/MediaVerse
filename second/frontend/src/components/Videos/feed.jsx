import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Play, AlertCircle, Loader2 } from "lucide-react";
import { formatDuration } from "../../utils/formatDuration.js";
import { apiUrl } from "../../config/api.js";

const SkeletonCard = () => (
  <div className="flex flex-col gap-3 animate-pulse">
    <div className="rounded-xl bg-[var(--yt-card)] aspect-video" />
    <div className="flex gap-3 px-1">
      <div className="w-9 h-9 rounded-full bg-[var(--yt-card)] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[var(--yt-card)] rounded w-4/5" />
        <div className="h-3 bg-[var(--yt-card)] rounded w-2/3" />
      </div>
    </div>
  </div>
);

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const navigate = useNavigate();

  const fetchVideos = useCallback(async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const res = await axios.get(apiUrl("/api/v1/videos/feed"), {
        params: { page, limit: pagination.limit },
        withCredentials: true,
      });
      const incoming = res.data.data?.videos || [];
      setVideos((prev) => (append ? [...prev, ...incoming] : incoming));
      setPagination({
        total: res.data.data?.total || 0,
        page: res.data.data?.page || page,
        limit: res.data.data?.limit || 20,
      });
    } catch {
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchVideos(1, false);
  }, [fetchVideos]);

  const loadMore = () => {
    if (loadingMore || videos.length >= pagination.total) return;
    fetchVideos(pagination.page + 1, true);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-red-400 font-medium">{error}</p>
        <button
          onClick={() => fetchVideos(1, false)}
          className="px-5 py-2 bg-[var(--yt-primary)] hover:bg-[var(--yt-primary-hover)] text-white rounded-full text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-4 md:p-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {videos.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-[var(--yt-card)] rounded-2xl border border-[var(--yt-border)]">
            <p className="text-[var(--yt-text-secondary)] font-medium">No videos yet. Be the first to upload!</p>
            <button
              onClick={() => navigate("/youtube/upload")}
              className="mt-4 px-5 py-2 bg-[var(--yt-primary)] hover:bg-[var(--yt-primary-hover)] text-white rounded-full text-sm font-semibold transition-colors"
            >
              Upload a video
            </button>
          </div>
        ) : (
          videos.map((video) => (
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
              <div className="relative rounded-xl overflow-hidden aspect-video bg-[var(--yt-card)]">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
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
                  className="w-9 h-9 rounded-full object-cover border border-[var(--yt-border)] shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-[var(--yt-text)] transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-[var(--yt-text-secondary)] text-xs mt-1 truncate">
                    {video.owner?.username || "Unknown Channel"}
                  </p>
                  <p className="text-[var(--yt-text-muted)] text-xs mt-0.5">
                    {(video.views ?? 0).toLocaleString()} views
                    <span className="mx-1">•</span>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>

      {videos.length < pagination.total && (
        <div className="flex justify-center mt-8 pb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--yt-card)] border border-[var(--yt-border)] hover:bg-white/5 text-white rounded-full font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={16} className="animate-spin" />}
            {loadingMore ? "Loading..." : "Load more"}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
