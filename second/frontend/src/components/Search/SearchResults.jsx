import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Video, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { apiUrl } from '../../config/api.js';
import { formatDuration } from '../../utils/formatDuration.js';

const TABS = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'tweet', label: 'Posts', icon: MessageSquare },
];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q')?.trim() || '';
  const activeTab = searchParams.get('type') || 'all';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const fetchResults = useCallback(async () => {
    if (!query) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.get(apiUrl('/api/v1/search'), {
        params: { q: query, type: activeTab, limit: 20 },
        withCredentials: true,
      });
      setResults(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, activeTab]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const setTab = (type) => {
    const next = new URLSearchParams(searchParams);
    if (type === 'all') next.delete('type');
    else next.set('type', type);
    setSearchParams(next);
  };

  const videos = activeTab === 'all'
    ? results?.results?.videos?.results || []
    : activeTab === 'video'
      ? results?.results || []
      : [];

  const tweets = activeTab === 'all'
    ? results?.results?.tweets?.results || []
    : activeTab === 'tweet'
      ? results?.results || []
      : [];

  const totalVideos = activeTab === 'all'
    ? results?.results?.videos?.totalFound
    : activeTab === 'video'
      ? results?.totalFound
      : null;

  const totalTweets = activeTab === 'all'
    ? results?.results?.tweets?.totalFound
    : activeTab === 'tweet'
      ? results?.totalFound
      : null;

  const hasResults = videos.length > 0 || tweets.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Search</h1>
        {query && (
          <p className="text-slate-500 mt-1 text-sm">
            Results for <span className="font-semibold text-slate-700">&ldquo;{query}&rdquo;</span>
          </p>
        )}
      </div>

      {!query && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Search size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Enter a search term to find videos and posts.</p>
        </div>
      )}

      {query && (
        <>
          <div className="flex gap-2 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-brand-600" size={36} />
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-12 bg-red-50 rounded-2xl border border-red-100">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
              <button
                onClick={fetchResults}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && !hasResults && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500 font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-slate-400 text-sm mt-1">Try different keywords or switch tabs.</p>
            </div>
          )}

          {!loading && !error && hasResults && (
            <div className="space-y-8">
              {(activeTab === 'all' || activeTab === 'video') && videos.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Video size={20} className="text-brand-600" />
                    Videos
                    {totalVideos != null && (
                      <span className="text-sm font-normal text-slate-400">({totalVideos})</span>
                    )}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <button
                        key={video._id || video.id}
                        onClick={() => navigate(`/Home/${video._id || video.id}?source=search`)}
                        className="group text-left bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all"
                      >
                        <div className="relative aspect-video bg-slate-100">
                          {video.thumbnail && (
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                            {formatDuration(video.duration)}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {video.views?.toLocaleString?.() ?? video.views ?? 0} views
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === 'all' || activeTab === 'tweet') && tweets.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-[#1DA1F2]" />
                    Posts
                    {totalTweets != null && (
                      <span className="text-sm font-normal text-slate-400">({totalTweets})</span>
                    )}
                  </h2>
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {tweets.map((tweet) => (
                      <button
                        key={tweet._id || tweet.id}
                        onClick={() => navigate(`/Home/tweets/${tweet._id || tweet.id}`)}
                        className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          @{tweet.ownerUsername || tweet.owner?.username || 'user'}
                        </p>
                        <p className="text-slate-800 mt-1 line-clamp-3">{tweet.content}</p>
                        {tweet.createdAt && (
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(tweet.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
