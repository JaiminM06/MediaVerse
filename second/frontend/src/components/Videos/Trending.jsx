import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Flame, MoreVertical, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDuration } from '../../utils/formatDuration.js';

function Trending() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('week');
    const navigate = useNavigate();

    const fetchTrending = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/trending/videos?period=${period}`,
                { withCredentials: true }
            );
            setVideos(res.data.data?.trending || []);
        } catch (err) {
            setError('Failed to load trending videos. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchTrending();
    }, [fetchTrending]);

    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-brand-600" size={40} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <Flame size={32} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Trending Now</h1>
                        <p className="text-slate-500">Most watched videos today</p>
                    </div>
                </div>

                {/* Period Toggles */}
                <div className="flex gap-2 mb-8">
                    {['day', 'week', 'month'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all
                                ${period === p ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Error State */}
                {error && (
                    <div className="text-center py-12 text-red-400">
                        <p>{error}</p>
                        <button
                            onClick={() => { setError(null); fetchTrending(); }}
                            className="mt-3 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && videos.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        <p className="text-lg">No trending videos this {period}.</p>
                        <p className="text-sm mt-2">Check back later or try a different time period.</p>
                    </div>
                )}

                {/* Video List */}
                {videos.length > 0 && (
                    <div className="space-y-4">
                        {videos.map((video, index) => (
                            <div
                                key={video._id}
                                className="group bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-4 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                                onClick={() => navigate(`/Home/${video._id}`)}
                            >
                                {/* Rank Number */}
                                <div className="hidden md:flex items-center justify-center w-8 text-2xl font-bold text-slate-300 group-hover:text-brand-600 transition-colors">
                                    {index + 1}
                                </div>

                                {/* Thumbnail */}
                                <div className="relative w-full sm:w-64 aspect-video rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                        {formatDuration(video.duration)}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 py-1">
                                    <h3 className="text-lg md:text-xl font-semibold text-slate-900 group-hover:text-brand-600 line-clamp-2 leading-tight mb-2">
                                        {video.title}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                        <span className="font-medium hover:text-slate-900">{video.owner?.username || "Unknown Channel"}</span>
                                        <span className="text-slate-400">•</span>
                                        <span>{video.views?.toLocaleString()} views</span>
                                        <span className="text-slate-400">•</span>
                                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <p className="text-sm text-slate-500 line-clamp-2 hidden md:block">
                                        {video.description}
                                    </p>
                                </div>

                                {/* Action */}
                                <button className="self-start sm:self-center p-2 text-slate-400 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

export default Trending;
