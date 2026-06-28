import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";
import { apiUrl } from "../../config/api.js";

export default function TwitterFeed() {
  const { socket, currentUserId } = useOutletContext() ?? {};

  const [tweets, setTweets] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quoteTweetId, setQuoteTweetId] = useState(null);

  const loaderRef = useRef(null);
  const loadingRef = useRef(false);

  const fetchTweets = useCallback(async (pageNum, replace = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(apiUrl("/api/v1/tweets/feed"), {
        params: { page: pageNum, limit: 20 },
        withCredentials: true,
      });

      const newTweets = res.data?.data?.tweets || [];

      if (replace) {
        setTweets(newTweets);
      } else {
        setTweets((prev) => {
          const existingIds = new Set(prev.map((t) => t._id));
          return [...prev, ...newTweets.filter((t) => !existingIds.has(t._id))];
        });
      }

      setHasMore(newTweets.length === 20);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tweets");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchTweets(1, true);
  }, [fetchTweets]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchTweets(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchTweets]);

  useEffect(() => {
    if (!socket) return;

    const handleNewTweet = (data) => {
      if (!data?.tweet) return;
      setTweets((prev) => {
        if (prev.some((t) => t._id === data.tweet._id)) return prev;
        return [data.tweet, ...prev];
      });
    };

    socket.on("new_tweet", handleNewTweet);
    return () => socket.off("new_tweet", handleNewTweet);
  }, [socket]);

  const handleTweetPosted = (newTweet) => {
    setTweets((prev) => [newTweet, ...prev]);
    setQuoteTweetId(null);
  };

  return (
    <div className="space-y-4">
      {currentUserId && (
        <div className="mb-4">
          <TweetComposer onTweetPosted={handleTweetPosted} quoteTweetId={quoteTweetId} />
          {quoteTweetId && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setQuoteTweetId(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Cancel Quote
              </button>
            </div>
          )}
        </div>
      )}

      <div className="divide-y divide-[#EFF3F4] bg-white overflow-hidden">
        {tweets.map((tweet) => (
          <TweetCard
            key={tweet._id}
            tweet={tweet}
            variant="light"
            onQuote={(id) => setQuoteTweetId(id)}
          />
        ))}
      </div>

      {loading && (
        <div className="py-8 flex justify-center">
          <Loader2 className="animate-spin text-[#1DA1F2]" size={32} />
        </div>
      )}

      {!loading && tweets.length === 0 && !error && (
        <div className="text-center py-12 px-4 border border-[#EFF3F4] bg-white">
          <p className="text-[#536471] text-sm font-medium">
            No posts yet. Follow people or be the first to post!
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 border border-red-100 bg-red-50 rounded-xl text-center">
          <p className="text-red-600 text-sm font-medium mb-3">{error}</p>
          <button
            type="button"
            onClick={() => fetchTweets(page, tweets.length === 0)}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {hasMore && !loading && <div ref={loaderRef} className="h-4" aria-hidden="true" />}
    </div>
  );
}
