import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function TweetComposer({ onTweetPosted, parentTweetId, quoteTweetId }) {
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quoteTweet, setQuoteTweet] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const fileInputRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Fetch user details for the avatar
    axios.get(`${apiUrl}/api/v1/users/current-user`, { withCredentials: true })
      .then(res => setCurrentUser(res.data.data))
      .catch(err => console.error("Failed to load user avatar in TweetComposer:", err));
  }, [apiUrl]);

  useEffect(() => {
    const fetchQuoteTweet = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/api/v1/tweets/${quoteTweetId}/thread`,
          { withCredentials: true }
        );
        if (res.data?.data?.rootTweet) {
          setQuoteTweet(res.data.data.rootTweet);
        }
      } catch (err) {
        console.error("Failed to fetch quote tweet details", err);
      }
    };
    if (quoteTweetId) {
      fetchQuoteTweet();
    }
  }, [quoteTweetId, apiUrl]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (mediaUrls.length + files.length > 4) {
      setError("Maximum 4 media items per tweet");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const newMediaUrls = [...mediaUrls];
      for (const file of files) {
        if (file.size > 10485760) {
          throw new Error(`File ${file.name} is too large. Max size is 10MB`);
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} has unsupported format`);
        }

        // Get presigned URL
        const res = await axios.post(
          `${apiUrl}/api/v1/tweets/media/upload-url`,
          { contentType: file.type, fileSize: file.size },
          { withCredentials: true }
        );

        const { uploadUrl, publicUrl } = res.data.data;

        // PUT to S3
        await axios.put(uploadUrl, file, {
          headers: { 'Content-Type': file.type }
        });

        newMediaUrls.push(publicUrl);
      }
      setMediaUrls(newMediaUrls);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to upload image(s)");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = (indexToRemove) => {
    setMediaUrls(mediaUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaUrls.length === 0) return;
    if (content.length > 280) return;

    setSubmitting(true);
    setError("");

    try {
      let endpoint = `${apiUrl}/api/v1/tweets`;
      let payload = { content, media: mediaUrls };

      if (parentTweetId) {
        endpoint = `${apiUrl}/api/v1/tweets/${parentTweetId}/reply`;
        payload = { content };
      } else if (quoteTweetId) {
        endpoint = `${apiUrl}/api/v1/tweets/${quoteTweetId}/quote`;
        payload = { content };
      }

      const res = await axios.post(endpoint, payload, { withCredentials: true });
      const responseData = res.data.data;
      const newTweet =
        responseData?.reply       ||
        responseData?.quoteTweet  ||
        responseData?.tweet       ||
        responseData;

      if (onTweetPosted) {
        onTweetPosted(newTweet);
      }
      setContent("");
      setMediaUrls([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post tweet");
    } finally {
      setSubmitting(false);
    }
  };

  const charLength = content.length;
  let counterColor = "text-[#71767B]";
  if (charLength >= 275) {
    counterColor = "text-red-400 font-semibold";
  } else if (charLength >= 260) {
    counterColor = "text-yellow-400 font-semibold";
  }

  const hashtags = content.match(/#[\w]+/g) || [];

  return (
    <div className="bg-[#16181C] border-b border-[#2F3336] p-4 flex gap-3">
      {/* Avatar on Left */}
      <img
        src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || "U")}&background=random`}
        alt="Avatar"
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />

      {/* Right Content Column */}
      <form onSubmit={handleSubmit} className="flex-1 min-w-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentTweetId ? "Post your reply" : "What's happening?"}
          maxLength={280}
          rows={parentTweetId ? 2 : 3}
          className="bg-transparent text-white text-lg placeholder-[#71767B] resize-none outline-none w-full min-h-[80px]"
        />

        {/* Hashtags Preview */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {hashtags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="bg-[#1DA1F2]/10 text-[#1DA1F2] text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Quote Tweet Preview */}
        {quoteTweetId && quoteTweet && (
          <div className="border border-[#2F3336] rounded-2xl p-3 mb-3 text-sm">
            <span className="text-[#71767B] font-semibold">@{quoteTweet?.owner?.username}</span>
            <p className="text-white mt-1 line-clamp-2">{quoteTweet?.content}</p>
          </div>
        )}

        {/* Image Previews */}
        {mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#2F3336]">
                <img src={url} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 mb-2">
            {error}
          </div>
        )}

        {/* Bottom toolbar and post button */}
        <div className="flex items-center justify-between border-t border-[#2F3336] pt-3 mt-2">
          {/* Left: media upload icons */}
          <div className="flex items-center gap-2">
            {!parentTweetId && !quoteTweetId && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || mediaUrls.length >= 4}
                  className="text-[#1DA1F2] hover:bg-[#1DA1F2]/10 p-2 rounded-full transition-colors disabled:opacity-50"
                  title="Upload images"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </>
            )}
            
            {uploading && (
              <span className="text-xs text-[#71767B] flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-[#1DA1F2]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </span>
            )}
          </div>

          {/* Right: counter & submit */}
          <div className="flex items-center gap-3">
            <span className={`text-xs ${counterColor}`}>
              {charLength}/280
            </span>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              disabled={(!content.trim() && mediaUrls.length === 0) || charLength > 280 || submitting || uploading}
              className="px-5 py-2 bg-[#1DA1F2] text-white rounded-full font-bold text-sm hover:bg-[#1A8CD8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '...' : (parentTweetId ? 'Reply' : 'Post')}
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
}
