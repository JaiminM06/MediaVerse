import { useState, useEffect } from "react";
import axios from "axios";
import { Save, ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";

function UpdateVideo({ videoId, goBack }) {
  const [video, setVideo] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/${videoId}`, {
          withCredentials: true,
        });
        setVideo(res.data.data);
        setTitle(res.data.data.title);
        setDescription(res.data.data.description);
      } catch (error) {
        console.error("Error fetching video for update:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchVideo();
  }, [videoId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setThumbnail(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      setLoading(true);
      await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/${videoId}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      goBack();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-[#FF0000]" size={32} />
    </div>
  );

  if (!video) return <p className="text-red-500 p-4 text-center">Error loading video detail.</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={goBack}
        className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors mb-6 font-medium text-sm"
      >
        <ArrowLeft size={16} /> Cancel Editing
      </button>

      <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-6 md:p-8">
        <h2 className="text-white text-2xl font-bold mb-8">Update Video</h2>

        <div className="space-y-6">
          {/* Thumbnail Section */}
          <div>
            <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Thumbnail</label>
            <div className="flex flex-col gap-4">
              <img
                src={previewUrl || video.thumbnail}
                alt="Thumbnail Preview"
                className="w-full h-48 object-cover rounded-xl bg-[#272727]"
              />
              <div>
                <label className="cursor-pointer border border-[#383838] text-white rounded-full px-4 py-2 hover:bg-[#272727] text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer">
                  <ImageIcon size={16} />
                  <span>Change Thumbnail</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[#606060] text-xs mt-2">Recommended: 16:9 aspect ratio, max 2MB.</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Video Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#272727] border border-[#383838] rounded-xl text-white px-4 py-3 placeholder-[#606060] focus:border-[#AAAAAA] focus:outline-none w-full transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#272727] border border-[#383838] rounded-xl text-white px-4 py-3 placeholder-[#606060] focus:border-[#AAAAAA] focus:outline-none w-full transition-colors h-32 resize-none"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full bg-[#FF0000] hover:bg-red-600 text-white rounded-full py-3 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateVideo;
