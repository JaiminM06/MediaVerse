import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Eye, Clock, Users, Video, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { PIE_COLORS } from "../../constants/chartColors.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  // States
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [viewsData, setViewsData] = useState([]);
  const [viewsPeriod, setViewsPeriod] = useState("month");
  const [viewsLoading, setViewsLoading] = useState(true);
  const [viewsError, setViewsError] = useState("");

  const [subData, setSubData] = useState([]);
  const [subPeriod, setSubPeriod] = useState("month");
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState("");

  const [trafficSources, setTrafficSources] = useState([]);
  const [trafficVideoTitle, setTrafficVideoTitle] = useState("");
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [trafficError, setTrafficError] = useState("");

  const [topVideos, setTopVideos] = useState([]);
  const [topVideosLoading, setTopVideosLoading] = useState(true);
  const [topVideosError, setTopVideosError] = useState("");

  // Fetch summary stats
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError("");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/analytics/summary`,
          { withCredentials: true }
        );
        setSummary(res.data.data?.summary || null);
      } catch (err) {
        console.error(err);
        setSummaryError("Failed to load summary stats.");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch views over time
  useEffect(() => {
    const fetchViews = async () => {
      setViewsLoading(true);
      setViewsError("");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/analytics/views?period=${viewsPeriod}`,
          { withCredentials: true }
        );
        setViewsData(res.data.data?.data || []);
      } catch (err) {
        console.error(err);
        setViewsError("Failed to load views chart data.");
      } finally {
        setViewsLoading(false);
      }
    };
    fetchViews();
  }, [viewsPeriod]);

  // Fetch subscriber growth
  useEffect(() => {
    const fetchSubs = async () => {
      setSubLoading(true);
      setSubError("");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/analytics/subscribers?period=${subPeriod}`,
          { withCredentials: true }
        );
        setSubData(res.data.data?.data || []);
      } catch (err) {
        console.error(err);
        setSubError("Failed to load subscriber growth data.");
      } finally {
        setSubLoading(false);
      }
    };
    fetchSubs();
  }, [subPeriod]);

  // Fetch top videos & traffic sources of top video
  useEffect(() => {
    const fetchTopAndTraffic = async () => {
      setTopVideosLoading(true);
      setTopVideosError("");
      setTrafficLoading(true);
      setTrafficError("");

      try {
        const topRes = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/analytics/top-videos?limit=10`,
          { withCredentials: true }
        );
        const videosList = topRes.data.data?.videos || [];
        setTopVideos(videosList);
        setTopVideosLoading(false);

        const bestVideo = videosList[0];
        if (bestVideo) {
          setTrafficVideoTitle(bestVideo.title || "Top video");
          const retRes = await axios.get(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/analytics/retention/${bestVideo._id}`,
            { withCredentials: true }
          );
          setTrafficSources(retRes.data.data?.trafficSources || []);
        } else {
          setTrafficVideoTitle("");
          setTrafficSources([]);
        }
      } catch (err) {
        console.error(err);
        setTopVideosError("Failed to load top videos.");
        setTrafficError("Failed to load traffic sources.");
      } finally {
        setTopVideosLoading(false);
        setTrafficLoading(false);
      }
    };
    fetchTopAndTraffic();
  }, []);

  const formatDateLabel = (tick) => {
    if (!tick) return "";
    const parts = tick.split("-");
    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : tick;
  };

  const periodLabel = (period) => {
    switch (period) {
      case "week": return "Last 7 days";
      case "month": return "Last 30 days";
      case "year": return "Last 365 days";
      default: return "";
    }
  };

  const tooltipContentStyle = {
    backgroundColor: '#1A1A1A',
    border: '1px solid #272727',
    borderRadius: 8,
    color: '#fff'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F0F0F] min-h-screen p-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold">Channel Analytics</h1>
          <p className="text-[#AAAAAA] text-sm mt-1">{today}</p>
        </div>
      </div>

      {/* STAT CARDS (4 cards in a grid) */}
      <div>
        {summaryError && (
          <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 text-red-400">
            <AlertCircle size={20} />
            <span>{summaryError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryLoading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="bg-[#1A1A1A] border border-[#272727] p-5 rounded-2xl animate-pulse h-32 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-[#272727] rounded w-24"></div>
                    <div className="h-8 w-8 bg-[#272727] rounded-lg"></div>
                  </div>
                  <div className="h-8 bg-[#272727] rounded w-16"></div>
                </div>
              ))
          ) : summary ? (
            <>
              {/* Card 1: Total Views */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
                className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-5"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[#AAAAAA] text-sm">Total Views</span>
                  <div className="icon bg-[#FF0000]/10 text-[#FF0000] rounded-xl p-2">
                    <Eye size={20} />
                  </div>
                </div>
                <h3 className="text-white text-3xl font-bold mt-2 leading-none">
                  {summary.totalViews.toLocaleString()}
                </h3>
                <p className="text-[#606060] text-xs mt-1">Total channel views</p>
              </motion.div>

              {/* Card 2: Watch Time */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
                className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-5"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[#AAAAAA] text-sm">Watch Time</span>
                  <div className="icon bg-purple-500/10 text-purple-400 rounded-xl p-2">
                    <Clock size={20} />
                  </div>
                </div>
                <h3 className="text-white text-3xl font-bold mt-2 leading-none">
                  {summary.totalWatchTimeHours.toFixed(1)} hrs
                </h3>
                <p className="text-[#606060] text-xs mt-1">Lifetime hours</p>
              </motion.div>

              {/* Card 3: Subscribers */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
                className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-5"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[#AAAAAA] text-sm">Subscribers</span>
                  <div className="icon bg-blue-500/10 text-blue-400 rounded-xl p-2">
                    <Users size={20} />
                  </div>
                </div>
                <h3 className="text-white text-3xl font-bold mt-2 leading-none">
                  {summary.totalSubscribers.toLocaleString()}
                </h3>
                <p className="text-[#606060] text-xs mt-1">Active subscribers</p>
              </motion.div>

              {/* Card 4: Videos */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
                className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-5"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[#AAAAAA] text-sm">Published Videos</span>
                  <div className="icon bg-green-500/10 text-green-400 rounded-xl p-2">
                    <Video size={20} />
                  </div>
                </div>
                <h3 className="text-white text-3xl font-bold mt-2 leading-none">
                  {summary.publishedVideoCount.toLocaleString()}
                </h3>
                <p className="text-[#606060] text-xs mt-1">Uploaded videos</p>
              </motion.div>
            </>
          ) : (
            <div className="col-span-4 bg-[#1A1A1A] border border-[#272727] p-6 rounded-2xl text-center text-[#AAAAAA]">
              No summary data available.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Views Over Time (Line Chart) */}
      <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-white font-medium mb-1">Views Over Time</h2>
            <p className="text-[#606060] text-xs">Audience watch patterns and visual counts</p>
          </div>
          
          {/* PERIOD TOGGLE BUTTONS */}
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setViewsPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  viewsPeriod === p
                    ? 'bg-[#FF0000] text-white'
                    : 'bg-[#272727] text-[#AAAAAA] hover:bg-[#383838] hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {viewsLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="animate-spin text-[#FF0000]" size={32} />
          </div>
        ) : viewsError ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-red-500 gap-2">
            <AlertCircle size={32} />
            <span>{viewsError}</span>
          </div>
        ) : viewsData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-[#AAAAAA]">
            No views record found for this period.
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#272727" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  stroke="#AAAAAA"
                  tick={{ fill: '#AAAAAA', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#3B82F6"
                  tick={{ fill: '#AAAAAA', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F59E0B"
                  tick={{ fill: '#AAAAAA', fontSize: 12 }}
                />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="views"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }}
                  name="Views"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgWatchTime"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  name="Avg Watch Time (s)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SECTION 3: Two Side-by-Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Subscriber Growth */}
        <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-white font-medium mb-1">Subscriber Growth</h2>
              <p className="text-[#606060] text-xs">{periodLabel(subPeriod)}</p>
            </div>
            
            {/* Period Toggles */}
            <div className="flex gap-2">
              {["week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSubPeriod(p)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                    subPeriod === p
                      ? "bg-[#FF0000] text-white"
                      : "bg-[#272727] text-[#AAAAAA] hover:bg-[#383838] hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {subLoading ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="animate-spin text-[#FF0000]" size={32} />
            </div>
          ) : subError ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-red-500 gap-2">
              <AlertCircle size={32} />
              <span>{subError}</span>
            </div>
          ) : subData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-[#AAAAAA]">
              No subscription records for this period.
            </div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#272727" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    stroke="#AAAAAA"
                    tick={{ fill: '#AAAAAA', fontSize: 12 }}
                  />
                  <YAxis stroke="#AAAAAA" tick={{ fill: '#AAAAAA', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipContentStyle} />
                  <Bar
                    dataKey="newSubscribers"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="New Subscribers"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Traffic Sources */}
        <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-5 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-white font-medium mb-1">Traffic Sources</h2>
            <p className="text-[#606060] text-xs">Top-performing video redirection channels</p>
            {trafficVideoTitle && (
              <p className="text-xs text-[#AAAAAA] mt-1.5 font-medium truncate" title={trafficVideoTitle}>
                Source: {trafficVideoTitle}
              </p>
            )}
          </div>

          {trafficLoading ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="animate-spin text-[#FF0000]" size={32} />
            </div>
          ) : trafficError ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-red-500 gap-2">
              <AlertCircle size={32} />
              <span>{trafficError}</span>
            </div>
          ) : trafficSources.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-[#AAAAAA]">
              No traffic sources data found. Upload and play a video first!
            </div>
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
                    <Tooltip contentStyle={tooltipContentStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom Legend */}
              <div className="flex justify-center gap-4 text-xs font-semibold text-[#AAAAAA] flex-wrap">
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
      </div>

      {/* SECTION 4: Top Videos Table */}
      <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#272727]">
          <h2 className="text-white font-medium">Top Videos</h2>
        </div>

        {topVideosLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#FF0000]" size={32} />
          </div>
        ) : topVideosError ? (
          <div className="p-6 text-center text-red-500 flex flex-col items-center gap-2">
            <AlertCircle size={28} />
            <span>{topVideosError}</span>
          </div>
        ) : topVideos.length === 0 ? (
          <div className="py-20 text-center text-[#AAAAAA]">No videos uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#272727]">
                  <th className="text-left p-4 text-[#AAAAAA] text-xs font-medium">Video</th>
                  <th className="text-right p-4 text-[#AAAAAA] text-xs font-medium">Views</th>
                  <th className="text-right p-4 text-[#AAAAAA] text-xs font-medium">Watch Time</th>
                  <th className="text-right p-4 text-[#AAAAAA] text-xs font-medium">Completion</th>
                  <th className="text-right p-4 text-[#AAAAAA] text-xs font-medium">Likes</th>
                </tr>
              </thead>
              <tbody>
                {topVideos.map(video => (
                  <motion.tr
                    key={video._id}
                    onClick={() => navigate(`/youtube/dashboard/video/${video._id}`)}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="border-b border-[#1F1F1F] cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={video.thumbnail} className="w-16 h-9 rounded-lg object-cover" />
                        <span className="text-white text-sm line-clamp-2">{video.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-[#AAAAAA] text-sm">
                      {video.totalViews?.toLocaleString() || 0}
                    </td>
                    <td className="p-4 text-right text-[#AAAAAA] text-sm">
                      {video.avgWatchDuration ? `${Math.floor(video.avgWatchDuration)}s` : "0s"}
                    </td>
                    <td className="p-4 text-right text-[#AAAAAA] text-sm">
                      {video.avgCompletionRate
                        ? `${(video.avgCompletionRate * 100).toFixed(1)}%`
                        : "0.0%"}
                    </td>
                    <td className="p-4 text-right text-[#AAAAAA] text-sm">
                      {video.likeCount || 0}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
