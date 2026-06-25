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
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [trafficError, setTrafficError] = useState("");

  const [topVideos, setTopVideos] = useState([]);
  const [topVideosLoading, setTopVideosLoading] = useState(true);
  const [topVideosError, setTopVideosError] = useState("");

  const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

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
          const retRes = await axios.get(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/analytics/retention/${bestVideo._id}`,
            { withCredentials: true }
          );
          setTrafficSources(retRes.data.data?.trafficSources || []);
        } else {
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Channel Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time creator analytics and video performance</p>
        </div>
        <span className="bg-white border border-slate-200 shadow-sm rounded-full px-4 py-2 text-xs font-semibold text-slate-600">
          {today}
        </span>
      </div>

      {/* SECTION 1: Summary Stat Cards */}
      <div>
        {summaryError && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-600">
            <AlertCircle size={20} />
            <span>{summaryError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryLoading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm h-32 animate-pulse flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              ))
          ) : summary ? (
            <>
              {/* Card 1: Total Views */}
              <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium text-sm">Total Views</span>
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <Eye size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-950 mt-4 leading-none">
                  {summary.totalViews.toLocaleString()}
                </h3>
              </div>

              {/* Card 2: Watch Time */}
              <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium text-sm">Watch Time</span>
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-950 mt-4 leading-none">
                  {summary.totalWatchTimeHours.toFixed(1)} hrs
                </h3>
              </div>

              {/* Card 3: Subscribers */}
              <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium text-sm">Subscribers</span>
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <Users size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-950 mt-4 leading-none">
                  {summary.totalSubscribers.toLocaleString()}
                </h3>
              </div>

              {/* Card 4: Videos */}
              <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium text-sm">Published Videos</span>
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                    <Video size={20} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-950 mt-4 leading-none">
                  {summary.publishedVideoCount.toLocaleString()}
                </h3>
              </div>
            </>
          ) : (
            <div className="col-span-4 bg-white p-6 rounded-2xl text-center text-slate-400">
              No summary data available.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Views Over Time (Line Chart) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Views Over Time</h2>
            <p className="text-xs text-slate-500 mt-0.5">Audience watch patterns and visual counts</p>
          </div>
          {/* Period Toggles */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            {["week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setViewsPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  viewsPeriod === p
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {viewsLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : viewsError ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-red-500 gap-2">
            <AlertCircle size={32} />
            <span>{viewsError}</span>
          </div>
        ) : viewsData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-slate-400">
            No views record found for this period.
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={500}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#3B82F6"
                  fontSize={11}
                  fontWeight={500}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F59E0B"
                  fontSize={11}
                  fontWeight={500}
                />
                <Tooltip />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Subscriber Growth */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Subscriber Growth</h2>
              <p className="text-xs text-slate-500 mt-0.5">New channels subscribers count</p>
            </div>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              {["week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setSubPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                    subPeriod === p
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {subLoading ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : subError ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-red-500 gap-2">
              <AlertCircle size={32} />
              <span>{subError}</span>
            </div>
          ) : subData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-slate-400">
              No subscription records for this period.
            </div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    stroke="#94a3b8"
                    fontSize={10}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Traffic Sources</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top-performing video redirection channels</p>
          </div>

          {trafficLoading ? (
            <div className="flex items-center justify-center h-[250px]">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : trafficError ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-red-500 gap-2">
              <AlertCircle size={32} />
              <span>{trafficError}</span>
            </div>
          ) : trafficSources.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-slate-400">
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom Legend */}
              <div className="flex justify-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Video Performance</h2>
          <p className="text-xs text-slate-500 mt-0.5">Retention and engagement rates for top 10 published videos</p>
        </div>

        {topVideosLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : topVideosError ? (
          <div className="p-6 text-center text-red-500 flex flex-col items-center gap-2">
            <AlertCircle size={28} />
            <span>{topVideosError}</span>
          </div>
        ) : topVideos.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No videos uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/55 text-xs font-bold text-slate-500 uppercase">
                  <th className="px-6 py-4">Video</th>
                  <th className="px-6 py-4 text-right">Views</th>
                  <th className="px-6 py-4 text-right">Avg Watch Time</th>
                  <th className="px-6 py-4 text-right">Completion Rate</th>
                  <th className="px-6 py-4 text-right">Likes</th>
                  <th className="px-6 py-4 text-right">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {topVideos.map((video) => (
                  <tr
                    key={video._id}
                    onClick={() => navigate(`/dashboard/video/${video._id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Thumbnail & Title */}
                    <td className="px-6 py-4 flex items-center gap-4">
                      <img
                        src={video.thumbnail}
                        alt=""
                        className="w-[60px] h-[40px] rounded-lg object-cover bg-slate-100 flex-shrink-0 shadow-sm border border-slate-100"
                      />
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 max-w-[280px]">
                        {video.title}
                      </span>
                    </td>
                    {/* Views */}
                    <td className="px-6 py-4 text-right font-semibold text-slate-700">
                      {video.totalViews?.toLocaleString() || 0}
                    </td>
                    {/* Avg Watch */}
                    <td className="px-6 py-4 text-right text-slate-600">
                      {video.avgWatchDuration ? `${Math.round(video.avgWatchDuration)}s` : "0s"}
                    </td>
                    {/* Completion % */}
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full text-xs">
                        {video.avgCompletionRate
                          ? `${(video.avgCompletionRate * 100).toFixed(0)}%`
                          : "0%"}
                      </span>
                    </td>
                    {/* Likes */}
                    <td className="px-6 py-4 text-right text-slate-600">{video.likeCount || 0}</td>
                    {/* Comments */}
                    <td className="px-6 py-4 text-right text-slate-600">{video.commentCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
