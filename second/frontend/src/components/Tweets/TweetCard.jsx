import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import TweetComposer from "./TweetComposer";

export default function TweetCard({
  tweet,
  currentUserId,
  onRetweet,
  onReply,
  onQuote,
}) {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const displayTweet = tweet.isRetweet && tweet.originalTweet ? tweet.originalTweet : tweet;

  const [liked, setLiked] = useState(!!tweet.likedByCurrentUser);
  const [localLikeCount, setLocalLikeCount] = useState(tweet.likeCount || 0);
  const [localRetweetCount, setLocalRetweetCount] = useState(displayTweet.retweetCount || 0);
  const [retweeted, setRetweeted] = useState(false);
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    const originalLiked = liked;
    const originalLikeCount = localLikeCount;

    setLiked(!originalLiked);
    setLocalLikeCount(originalLiked ? Math.max(0, originalLikeCount - 1) : originalLikeCount + 1);

    try {
      await axios.post(
        `${apiUrl}/api/v1/likes/tweet/${displayTweet._id}`,
        {},
        { withCredentials: true }
      );
    } catch {
      setLiked(originalLiked);
      setLocalLikeCount(originalLikeCount);
    }
  };

  const handleRetweetClick = async (e) => {
    e.stopPropagation();
    const originalRetweeted = retweeted;
    const originalRetweetCount = localRetweetCount;

    setRetweeted(!originalRetweeted);
    setLocalRetweetCount(
      originalRetweeted ? Math.max(0, originalRetweetCount - 1) : originalRetweetCount + 1
    );

    try {
      const res = await axios.post(
        `${apiUrl}/api/v1/tweets/${displayTweet._id}/retweet`,
        {},
        { withCredentials: true }
      );
      if (res.data?.data) {
        setRetweeted(res.data.data.retweeted);
      }
      if (onRetweet) onRetweet(displayTweet._id);
    } catch {
      setRetweeted(originalRetweeted);
      setLocalRetweetCount(originalRetweetCount);
    }
  };

  const handleReplyPosted = (newReply) => {
    setShowReplyComposer(false);
    if (onReply) onReply(newReply);
  };

  const renderContent = (text) => {
    if (!text) return null;
    const parts = text.split(/((?:#|@)[\w]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("#")) {
        return (
          <span
            key={idx}
            className="text-[var(--tw-primary)] hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/twitter/search?q=${encodeURIComponent(part.slice(1))}`);
            }}
          >
            {part}
          </span>
        );
      } else if (part.startsWith("@")) {
        return (
          <span
            key={idx}
            className="text-[var(--tw-primary)] hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/twitter/profile/${part.slice(1)}`);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const media = displayTweet.media || [];
  const mediaCount = media.length;
  let gridClass = "";
  if (mediaCount === 1) gridClass = "grid-cols-1";
  else if (mediaCount === 2) gridClass = "grid-cols-2";
  else gridClass = "grid-cols-2 grid-rows-2";

  return (
    <div
      onClick={() => navigate(`/twitter/tweet/${displayTweet._id}`)}
      className="px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-[var(--tw-border)]"
    >
      {/* Retweet header */}
      {tweet.isRetweet && (
        <div className="flex items-center gap-2 text-xs font-semibold mb-2 pl-12 text-[var(--tw-text-secondary)]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6.89M9 11l3 3 3-3" />
          </svg>
          <span>@{tweet.owner?.username} reposted</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/twitter/profile/${displayTweet.owner?.username}`);
          }}
        >
          <img
            src={displayTweet.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"}
            alt=""
            className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 text-sm flex-wrap">
            <span
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/twitter/profile/${displayTweet.owner?.username}`);
              }}
              className="font-bold text-white hover:underline cursor-pointer"
            >
              {displayTweet.owner?.fullName || displayTweet.owner?.username}
            </span>
            <span className="text-[var(--tw-text-secondary)]">@{displayTweet.owner?.username}</span>
            <span className="text-[var(--tw-text-secondary)]">·</span>
            <span className="text-[var(--tw-text-secondary)] text-xs">{formatTimeAgo(displayTweet.createdAt)}</span>
          </div>

          {/* Tweet text */}
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap text-[var(--tw-text)] mt-1">
            {renderContent(displayTweet.content)}
          </p>

          {/* Media Grid */}
          {media.length > 0 && (
            <div className={`grid ${gridClass} gap-0.5 mt-3 rounded-2xl overflow-hidden border border-[var(--tw-border)]`}>
              {media.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt=""
                  className="w-full h-full object-cover aspect-video"
                  onClick={(e) => e.stopPropagation()}
                />
              ))}
            </div>
          )}

          {/* Quote Tweet */}
          {displayTweet.quoteTweet && (
            <div
              className="mt-3 p-3 rounded-2xl border border-[var(--tw-border)] hover:bg-white/[0.03] transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/twitter/tweet/${displayTweet.quoteTweet._id}`);
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-white">
                <span>@{displayTweet.quoteTweet.owner?.username || "user"}</span>
              </div>
              <p className="text-xs line-clamp-3 leading-relaxed text-[var(--tw-text-secondary)]">
                {displayTweet.quoteTweet.content?.length > 100
                  ? `${displayTweet.quoteTweet.content.substring(0, 100)}...`
                  : displayTweet.quoteTweet.content}
              </p>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-3 max-w-md -ml-2">
            {/* Reply */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReplyComposer(!showReplyComposer);
              }}
              className="flex items-center gap-1 group text-[var(--tw-text-secondary)] hover:text-[var(--tw-primary)] transition-colors"
            >
              <span className="p-2 rounded-full group-hover:bg-[var(--tw-primary)]/10 transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              <span className="text-xs">{displayTweet.replyCount || 0}</span>
            </button>

            {/* Retweet */}
            <button
              onClick={handleRetweetClick}
              className={`flex items-center gap-1 group transition-colors ${retweeted ? "text-[var(--tw-green)]" : "text-[var(--tw-text-secondary)] hover:text-[var(--tw-green)]"}`}
            >
              <motion.span
                animate={{ rotate: retweeted ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="p-2 rounded-full group-hover:bg-[var(--tw-green)]/10 transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6.89M9 11l3 3 3-3" />
                </svg>
              </motion.span>
              <span className="text-xs">{localRetweetCount}</span>
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 group transition-colors ${liked ? "text-[var(--tw-pink)]" : "text-[var(--tw-text-secondary)] hover:text-[var(--tw-pink)]"}`}
            >
              <motion.span
                animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="p-2 rounded-full group-hover:bg-[var(--tw-pink)]/10 transition-colors"
              >
                {liked ? (
                  <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                ) : (
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </motion.span>
              <span className="text-xs">{localLikeCount}</span>
            </button>

            {/* Views */}
            <span className="flex items-center gap-1 text-[var(--tw-text-secondary)] text-xs">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {displayTweet.views || 0}
            </span>

            {/* Quote */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onQuote) onQuote(displayTweet._id);
              }}
              className="flex items-center group text-[var(--tw-text-secondary)] hover:text-[var(--tw-primary)] transition-colors"
            >
              <span className="p-2 rounded-full group-hover:bg-[var(--tw-primary)]/10 transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Reply */}
      {showReplyComposer && (
        <div className="mt-3 pl-[52px]" onClick={(e) => e.stopPropagation()}>
          <TweetComposer parentTweetId={displayTweet._id} onTweetPosted={handleReplyPosted} />
        </div>
      )}
    </div>
  );
}
