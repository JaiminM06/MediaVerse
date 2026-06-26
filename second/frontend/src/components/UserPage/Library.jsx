import { useState, useEffect } from "react";
import axios from "axios";
import { History, ThumbsUp, Clock, FolderHeart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDuration } from '../../utils/formatDuration.js';

const PREVIEW_LIMIT = 4;

function Library() {
    const [history, setHistory] = useState([]);
    const [liked, setLiked] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedHistory, setExpandedHistory] = useState(false);
    const [expandedLiked, setExpandedLiked] = useState(false);
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

    const VideoSection = ({ title, icon: Icon, videos, isExpanded, onToggle }) => {
        const displayedVideos = isExpanded ? videos : videos.slice(0, PREVIEW_LIMIT);
        const hasMore = videos.length > PREVIEW_LIMIT;

        return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Icon size={24} className="text-brand-600" />
                    {title}
                </h2>
                {hasMore && (
                    <button
                        onClick={onToggle}
                        className="text-brand-600 text-sm font-semibold hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {isExpanded ? "Show less" : "See all"}
                    </button>
                )}
            </div>

            {displayedVideos.length === 0 ? (
                <div className="h-32 flex items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    No videos in {title}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedVideos.map(video => (
                        <div
                            key={video._id}
                            className="group cursor-pointer"
                            onClick={() => navigate(`/Home/${video._id}`)}
                        >
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 mb-3">
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                    {formatDuration(video.duration)}
                                </div>
                                {/* Watch progress not yet tracked — remove until real data is available */}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug group-hover:text-brand-600 transition-colors">
                                    {video.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">{video.owner?.username || "Unknown Channel"} • {video.views} views</p>
                                <span className="text-xs text-slate-500">
                                    {video.watchedAt
                                        ? new Date(video.watchedAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })
                                        : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 md:p-8 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md">
                    <p className="text-red-600 font-semibold mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <FolderHeart className="text-brand-600" size={32} />
                    Library
                </h1>

                <VideoSection
                    title="History"
                    icon={History}
                    videos={history}
                    isExpanded={expandedHistory}
                    onToggle={() => setExpandedHistory(v => !v)}
                />
                <VideoSection
                    title="Liked Videos"
                    icon={ThumbsUp}
                    videos={liked}
                    isExpanded={expandedLiked}
                    onToggle={() => setExpandedLiked(v => !v)}
                />
                <VideoSection title="Watch Later" icon={Clock} videos={[]} />
            </div>
        </div>
    );
}

export default Library;
