import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";
import { Eye, Clock, Award, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { PIE_COLORS } from "../../constants/chartColors.js";

export default function VideoAnalytics() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  // States
  const [video, setVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState("");

  const [retention, setRetention] = useState(null);
  const [trafficSources, setTrafficSources] = useState([]);
  const [retentionLoading, setRetentionLoading] = useState(true);
  const [retentionError, setRetentionError] = useState("");

  // Fetch video details
  useEffect(() => {
    const fetchVideoDetails = async () => {
      setVideoLoading(true);
      setVideoError("");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/videos/${videoId}`,
          { withCredentials: true }
        );
        setVideo(res.data.data);
      } catch (err) {
        console.error("Video details fetch failed, trying stream endpoint...", err);
        try {
          const streamRes = await axios.get(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/upload/stream/${videoId}`,
            { withCredentials: true }
          );
          setVideo(streamRes.data.data);
        } catch (streamErr) {
          console.error(streamErr);
          setVideoError("Failed to load video details.");
        }
      } finally {
        setVideoLoading(false);
      }
    };

    if (videoId) {
      fetchVideoDetails();
    }
  }, [videoId]);

  // Fetch retention and traffic sources
  useEffect(() => {
    const fetchRetention = async () => {
      setRetentionLoading(true);
      setRetentionError("");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/analytics/retention/${videoId}`,
          { withCredentials: true }
        );
        setRetention(res.data.data?.retention || null);
        setTrafficSources(res.data.data?.trafficSources || []);
      } catch (err) {
        console.error(err);
        setRetentionError("Failed to load video retention metrics.");
      } finally {
        setRetentionLoading(false);
      }
    };

    if (videoId) {
      fetchRetention();
    }
  }, [videoId]);

  // Determine progress bar color based on completion rate
  const getProgressBarColor = (rate) => {
    if (rate > 0.7) return "bg-emerald-500";
    if (rate >= 0.4) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 bg-gray-50/30 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate("/Home/dashboard")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 border border-slate-200 shadow-sm rounded-full self-start"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Header */}
      {videoLoading ? (
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm flex items-center gap-6 animate-pulse">
          <div className="w-[120px] h-[80px] bg-slate-200 rounded-lg flex-shrink-0"></div>
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          </div>
        </div>
      ) : videoError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-600">
          <AlertCircle size={20} />
          <span>{videoError}</span>
        </div>
      ) : video ? (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <img
            src={video.thumbnail || (video.thumbnails && video.thumbnails[0])}
            alt=""
            className="w-[150px] h-[100px] rounded-xl object-cover bg-slate-100 flex-shrink-0 shadow-sm border border-slate-150"
          />
          <div className="text-center sm:text-left flex-1">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full text-xs">
              Video Insights
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2 leading-tight">{video.title}</h1>
            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{video.description}</p>
          </div>
        </div>
      ) : null}

      {/* Row 1: 4 Stat Cards */}
      {retentionLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm h-32 animate-pulse flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                  <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
        </div>
      ) : retentionError ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-600">
          <AlertCircle size={20} />
          <span>{retentionError}</span>
        </div>
      ) : retention ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Views */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-sm">Total Views</span>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Eye size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-950 mt-4 leading-none">
              {retention.totalViews.toLocaleString()}
            </h3>
          </div>

          {/* Card 2: Avg Watch Duration */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-sm">Avg Watch Duration</span>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-950 mt-4 leading-none">
              {Math.floor(retention.avgWatchDuration)}s
            </h3>
          </div>

          {/* Card 3: Avg Completion Rate */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-sm">Avg Completion Rate</span>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <Award size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-950 mt-4 leading-none">
              {(retention.avgCompletionRate * 100).toFixed(1)}%
            </h3>
          </div>

          {/* Card 4: Fully Watched */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-sm">Fully Watched</span>
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-950 mt-4 leading-none">
              {retention.completionPercent?.toFixed(1)}%
            </h3>
          </div>
        </div>
      ) : null}

      {/* Row 2: Completion Rate Visual */}
      {!retentionLoading && retention && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Audience Retention Visual</h2>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                retention.avgCompletionRate
              )}`}
              style={{ width: `${Math.min(retention.avgCompletionRate * 100, 100)}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Viewers watch on average{" "}
            <span className="text-blue-600 font-bold">
              {(retention.avgCompletionRate * 100).toFixed(1)}%
            </span>{" "}
            of this video.
          </p>
        </div>
      )}

      {/* Row 3: Traffic Sources Pie Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Traffic Sources</h2>
          <p className="text-xs text-slate-500 mt-0.5">Where viewers discover this video</p>
        </div>

        {retentionLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : trafficSources.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No traffic sources recorded yet.</div>
        ) : (
          <div className="h-[250px] flex flex-col justify-center">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSources}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    fontSize={11}
                    fontWeight={500}
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex justify-center gap-4 text-xs font-semibold text-slate-600 flex-wrap mt-2">
              {trafficSources.map((entry, index) => (
                <div key={entry.source} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="capitalize">{entry.source}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 4: Back to Dashboard Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate("/Home/dashboard")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors bg-white px-6 py-2.5 border border-slate-200 shadow-sm rounded-full"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
