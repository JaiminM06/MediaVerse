import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Play, AlertCircle, Loader2 } from "lucide-react";
import { formatDuration } from "../../utils/formatDuration.js";
import { apiUrl } from "../../config/api.js";
import PageLoader from "../ui/PageLoader.jsx";

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

  if (loading) return <PageLoader label="Loading feed..." />;

  if (error && videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => fetchVideos(1, false)}
          className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 font-medium">No videos yet. Be the first to upload!</p>
            <button
              onClick={() => navigate("/Home/uploadVideo")}
              className="mt-4 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-sm font-semibold transition-colors"
            >
              Upload a video
            </button>
          </div>
        ) : (
          videos.map((video) => (
            <article
              key={video._id}
              className="group cursor-pointer flex flex-col gap-3"
              onClick={() => navigate(`/Home/${video._id}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/Home/${video._id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 shadow-sm group-hover:shadow-md transition-all duration-300">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-black/30 backdrop-blur-sm p-3 rounded-full">
                    <Play size={24} className="text-white fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>

              <div className="flex gap-3 px-1">
                <img
                  src={video.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.owner?.username || "U")}&background=random`}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1 truncate">
                    {video.owner?.username || "Unknown Channel"}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {(video.views ?? 0).toLocaleString()} views
                    <span className="mx-1">•</span>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {videos.length < pagination.total && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-full font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {loadingMore && <Loader2 size={16} className="animate-spin" />}
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
