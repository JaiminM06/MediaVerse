import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function VideoPlayer() {
  const { id } = useParams();
  const [video, setVideo] = useState(null); // start as null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/v1/videos/${id}`,
          { withCredentials: true } // if your API requires auth cookies
        );
        setVideo(res.data);
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]); // include `id` in dependency array

  if (loading) return <p className="text-center mt-8">Loading video...</p>;
  if (!video) return <p className="text-center mt-8 text-red-500">Video not found!</p>;
  
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-xl font-bold mb-4">{video.title}</h1>
      
      <video
        src={video.data.videoFile}
        poster={video.thumbnail}
        controls
        className="w-[800px] h-[500px] object-cover"
      />
      <p className="mt-2 text-gray-700">{video.description}</p>
      <div>like</div>
    </div>
  );
}
