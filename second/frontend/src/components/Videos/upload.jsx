import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Film, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function VideoUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setUploadProgress(0);
    setProcessingStatus("");

    if (!title || !videoFile) {
      setError("Please provide a title and a video file.");
      return;
    }

    try {
      setUploading(true);
      setProcessingStatus("Requesting upload permissions...");

      // Determine content type with fallback for Windows file association gaps
      let contentType = videoFile.type;
      if (!contentType) {
        const ext = videoFile.name.split('.').pop().toLowerCase();
        if (ext === 'mp4') contentType = 'video/mp4';
        else if (ext === 'webm') contentType = 'video/webm';
        else if (ext === 'mov' || ext === 'qt') contentType = 'video/quicktime';
      }

      // 1. Get presigned URL from backend
      const requestUrlRes = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/request-url`,
        {
          fileName: videoFile.name,
          contentType: contentType || "video/mp4",
          fileSize: videoFile.size,
          title,
          description,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean)
        },
        { withCredentials: true }
      );

      const { uploadUrl, videoId } = requestUrlRes.data.data;
      setProcessingStatus("Uploading video directly to AWS S3...");

      // 2. Upload raw video file directly to AWS S3 via PUT
      await axios.put(uploadUrl, videoFile, {
        headers: {
          "Content-Type": contentType || "video/mp4"
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setUploadProgress(100);
      setProcessingStatus("Queuing video in transcoding queue...");

      // 3. Confirm upload on backend to start transcoding worker
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/confirm/${videoId}`,
        {},
        { withCredentials: true }
      );

      setProcessingStatus("Transcoding & generating HLS manifests (360p, 480p, 720p, 1080p)...");

      // 4. Poll status until ready or failed
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/status/${videoId}`,
            { withCredentials: true }
          );
          
          const status = statusRes.data.data.processingStatus;
          if (status === "ready") {
            clearInterval(pollRef.current);
            setProcessingStatus("Ready");
            setMessage("Video uploaded, processed, and ready for adaptive streaming!");
            setUploading(false);
            // Reset form
            setTitle("");
            setDescription("");
            setTags("");
            setVideoFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setUploadProgress(0);
          } else if (status === "failed") {
            clearInterval(pollRef.current);
            setProcessingStatus("Failed");
            setError(statusRes.data.data.processingError || "Transcoding failed.");
            setUploading(false);
          }
        } catch (pollErr) {
          clearInterval(pollRef.current);
          console.error("Polling error:", pollErr);
          setError("Failed to track video status, but processing is running.");
          setUploading(false);
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to upload video. Please try again.");
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F0F0F] min-h-screen p-6"
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-8">Upload Video</h1>

        <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#FF0000]/10 text-[#FF0000] rounded-xl flex items-center gap-3 border border-[#FF0000]/20 text-sm">
              <AlertCircle size={20} className="shrink-0" />
              <div className="flex-1">{error}</div>
            </div>
          )}
          
          {message && (
            <div className="mb-6 p-4 bg-green-500/10 text-green-400 rounded-xl flex items-center gap-3 border border-green-500/20 text-sm">
              <CheckCircle size={20} className="shrink-0" />
              <div className="flex-1">{message}</div>
            </div>
          )}

          {/* Upload Progress / Status */}
          {uploading && (
            <div className="mb-6 bg-[#1F1F1F] border border-[#272727] rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                {processingStatus === "Ready" ? (
                  <span className="text-green-400 flex items-center gap-2">
                    ✅ Video is ready!
                  </span>
                ) : processingStatus === "Failed" ? (
                  <span className="text-red-400 flex items-center gap-2">
                    ❌ Processing failed.
                  </span>
                ) : processingStatus.toLowerCase().includes("transcoding") || processingStatus.toLowerCase().includes("process") ? (
                  <span className="text-yellow-400 flex items-center gap-2">
                    ⚙️ <Loader2 className="animate-spin" size={16} /> Processing video...
                  </span>
                ) : (
                  <span className="text-[#AAAAAA] flex items-center gap-2">
                    🔄 {processingStatus || "Uploading to server..."}
                  </span>
                )}
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white text-sm font-medium">Uploading...</span>
                    <span className="text-[#AAAAAA] text-sm">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#272727] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-[#FF0000] h-2 rounded-full"
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleUpload}>
            {/* File Drop Zone (shown before file selected) */}
            {!videoFile ? (
              <div className="relative group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  id="video-upload"
                  disabled={uploading}
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="hidden"
                />
                <label
                  htmlFor="video-upload"
                  className="border-2 border-dashed border-[#383838] rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-[#FF0000] hover:bg-[#FF0000]/5 transition-colors cursor-pointer"
                >
                  <div className="text-5xl mb-4">🎬</div>
                  <p className="text-white font-medium mb-1">Drag and drop video files to upload</p>
                  <p className="text-[#AAAAAA] text-sm mb-4">Your videos will be private until you publish them</p>
                  <span className="px-6 py-2.5 bg-[#FF0000] text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors inline-block">
                    Select Files
                  </span>
                </label>
              </div>
            ) : (
              /* Form Fields (shown after file selected) */
              <div className="space-y-4">
                {/* Selected File Summary */}
                <div className="flex items-center gap-3 bg-[#272727]/50 border border-[#383838] rounded-xl p-4">
                  <div className="w-10 h-10 bg-[#FF0000]/10 text-[#FF0000] rounded-xl flex items-center justify-center shrink-0">
                    <Film size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{videoFile.name}</p>
                    <p className="text-[#AAAAAA] text-xs">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => {
                      setVideoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-[#AAAAAA] hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Change
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Video Title</label>
                  <input
                    type="text"
                    required
                    disabled={uploading}
                    placeholder="Give your video a catchy title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-[#272727] border border-[#383838] rounded-lg text-white placeholder-[#606060] px-4 py-3 w-full focus:border-[#AAAAAA] focus:outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    disabled={uploading}
                    placeholder="Tell viewers about your video..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="bg-[#272727] border border-[#383838] rounded-lg text-white placeholder-[#606060] px-4 py-3 w-full focus:border-[#AAAAAA] focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Tags (comma separated)</label>
                  <input
                    type="text"
                    disabled={uploading}
                    placeholder="e.g. gaming, tutorials, vlog"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="bg-[#272727] border border-[#383838] rounded-lg text-white placeholder-[#606060] px-4 py-3 w-full focus:border-[#AAAAAA] focus:outline-none transition-colors"
                  />
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={uploading || !videoFile || !title.trim()}
                  className="w-full py-3 bg-[#FF0000] text-white rounded-full font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-6"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    "Publish Video"
                  )}
                </motion.button>
              </div>
            )}
          </form>
        </div>
      </div>
    </motion.div>
  );
}
