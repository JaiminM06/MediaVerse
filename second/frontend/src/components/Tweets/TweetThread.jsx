import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import useSocket from "../../hooks/useSocket.js";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";

export default function TweetThread() {
  const { tweetId } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const [rootTweet, setRootTweet] = useState(null);
  const [replies, setReplies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [socketToken, setSocketToken] = useState(null);

  useEffect(() => {
    axios.get(
      `${apiUrl}/api/v1/users/current-user`,
      { withCredentials: true }
    )
    .then(res => {
      setUser(res.data.data);
      setSocketToken(res.data.data?._id || null);
    })
    .catch(() => {
      setSocketToken(null);
    });
  }, [apiUrl]);

  const socket = useSocket(socketToken);
  const currentUserId = user?._id;

  const fetchThread = async (pageNum, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await axios.get(
        `${apiUrl}/api/v1/tweets/${tweetId}/thread?page=${pageNum}&limit=20`,
        { withCredentials: true }
      );

      const threadData = res.data?.data;
      if (threadData) {
        if (!append) {
          setRootTweet(threadData.rootTweet);
          setReplies(threadData.replies || []);
        } else {
          setReplies((prev) => {
            const existingIds = new Set(prev.map((r) => r._id));
            const filtered = (threadData.replies || []).filter((r) => !existingIds.has(r._id));
            return [...prev, ...filtered];
          });
        }
        setHasMore((threadData.replies || []).length === 20);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load thread");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchThread(1, false);
    setPage(1);
  }, [tweetId]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_tweet_room', { tweetId });

    const handleNewReply = (data) => {
      if (!data?.reply) return;
      const parentId = data.reply.parentTweet?._id?.toString()
        || data.reply.parentTweet?.toString();
      if (parentId === tweetId) {
        setReplies((prev) => {
          if (prev.some((r) => r._id === data.reply._id)) return prev;
          return [...prev, data.reply];
        });

        setRootTweet((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            replyCount: (prev.replyCount || 0) + 1
          };
        });
      }
    };

    socket.on("new_reply", handleNewReply);

    return () => {
      socket.off("new_reply", handleNewReply);
      socket.emit('leave_tweet_room', { tweetId });
    };
  }, [socket, tweetId]);

  const handleReplyPosted = (newReply) => {
    setReplies((prev) => {
      if (prev.some((r) => r._id === newReply._id)) return prev;
      return [...prev, newReply];
    });
    
    setRootTweet((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        replyCount: (prev.replyCount || 0) + 1
      };
    });
  };

  const loadMoreReplies = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchThread(nextPage, true);
  };

  // Loading skeleton state
  if (loading && !rootTweet) {
    return (
      <div className="bg-[#000000] min-h-screen text-white">
        <div className="sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-sm border-b border-[#2F3336] px-4 py-3 flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            ←
          </button>
          <h2 className="text-white font-bold text-xl">Post</h2>
        </div>

        <div className="space-y-0">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse flex gap-3 p-4 border-b border-[#2F3336]">
              <div className="w-10 h-10 rounded-full bg-[#272727] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#272727] rounded w-1/3" />
                <div className="h-3 bg-[#272727] rounded w-full" />
                <div className="h-3 bg-[#272727] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#000000] min-h-screen text-white"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-sm border-b border-[#2F3336] px-4 py-3 flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            ←
          </button>
          <h2 className="text-white font-bold text-xl">Post</h2>
        </div>

        {error && (
          <div className="p-4 border border-red-500/30 bg-red-950/20 rounded-xl text-center my-4 mx-4">
            <p className="text-red-400 text-sm font-medium mb-3">{error}</p>
            <button
              onClick={() => fetchThread(1, false)}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {rootTweet && (
          <div>
            {/* Root Tweet */}
            <div className="border-b border-[#2F3336]">
              <TweetCard
                tweet={rootTweet}
                currentUserId={currentUserId}
                isRootInThread={true}
                onQuote={() => {}}
                onRetweet={() => {}}
                onReply={() => {}}
              />
            </div>

            {/* Composer Section for reply */}
            {currentUserId && (
              <div className="border-b border-[#2F3336]">
                <TweetComposer
                  parentTweetId={tweetId}
                  onTweetPosted={handleReplyPosted}
                />
              </div>
            )}

            {/* Replies List */}
            <div className="divide-y divide-[#2F3336]">
              {replies.map((reply) => (
                <div key={reply._id} className="border-b border-[#2F3336]">
                  <TweetCard
                    tweet={reply}
                    currentUserId={currentUserId}
                    onQuote={() => {}}
                    onRetweet={() => {}}
                    onReply={() => {}}
                  />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <button
                onClick={loadMoreReplies}
                disabled={loadingMore}
                className="w-full py-4 text-[#1DA1F2] hover:bg-white/5 transition-colors text-sm font-medium border-b border-[#2F3336]"
              >
                {loadingMore ? "Loading more replies..." : "Load more replies"}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
