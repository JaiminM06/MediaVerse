import { useState, useEffect } from "react";
import axios from "axios";

function UpdateVideo({ videoId, goBack }) {
  const [video, setVideo] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      const res = await axios.get(`http://localhost:8000/api/v1/videos/${videoId}`, {
        withCredentials: true,
      });
      setVideo(res.data.data);
      setTitle(res.data.data.title);
      setDescription(res.data.data.description);
    };
    fetchVideo();
  }, [videoId]);

  const handleUpdate = async () => {
    if (!thumbnail) {
      alert("Thumbnail is required!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnail", thumbnail);

    try {
      await axios.patch(
        `http://localhost:8000/api/v1/videos/${videoId}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("Video updated successfully!");
      goBack();
    } catch (error) {
      alert("Failed to update video!");
      console.error(error);
    }
  };

  if (!video) return <p>Loading video...</p>;

  return (
    <div className="space-y-4">
      <button
        onClick={goBack}
        className="bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300"
      >
        ← Back
      </button>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Update Video</h2>
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-64 h-40 object-cover rounded"
      />
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full"
          rows="4"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files[0])}
          className="border rounded-lg px-3 py-2 w-full"
        />
      </div>
      <button
        onClick={handleUpdate}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        Save Changes
      </button>
    </div>
  );
}

export default UpdateVideo;
