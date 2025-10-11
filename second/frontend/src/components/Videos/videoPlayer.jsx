// import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";

// export default function VideoPlayer() {
//   const { id } = useParams();
//   const [video, setVideo] = useState(null); // start as null
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchVideo = async () => {
//       try {
//         const res = await axios.get(
//           `http://localhost:8000/api/v1/videos/${id}`,
//           { withCredentials: true } // if your API requires auth cookies
//         );
//         setVideo(res.data);
//       } catch (error) {
//         console.error("Error fetching video:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVideo();
//   }, [id]); // include `id` in dependency array

//   if (loading) return <p className="text-center mt-8">Loading video...</p>;
//   if (!video) return <p className="text-center mt-8 text-red-500">Video not found!</p>;
  
//   return (
//     <div className="max-w-3xl mx-auto mt-8">
//       <h1 className="text-xl font-bold mb-4">{video.title}</h1>
      
//       <video
//         src={video.data.videoFile}
//         poster={video.thumbnail}
//         controls
//         className="w-[800px] h-[500px] object-cover"
//       />
//       <p className="mt-2 text-gray-700">{video.description}</p>
//       <div>like</div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Flag, UserStar } from "lucide-react";

export default function VideoPlayer() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [avatar, setAvatar]= useState(null);
  const [subscribers,setSubscribers]=useState(0);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/v1/videos/${id}`, {
          withCredentials: true,
        });
        setVideo(res.data.data);
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);
 
    useEffect(() => {
    if (!video) return;

    const fetchAvatar = async () => {
      try {
        console.log(video.owner._id)
        const res = await axios.get(`http://localhost:8000/api/v1/users/${video.owner._id}`, {
          withCredentials: true,
        });
        setAvatar(res.data.data.avatar);
        console.log(res.data.data.avatar)
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };

    fetchAvatar();
  }, [video]);
  useEffect(() => {
    if (!video) return;

    const fetchSubscriber = async () => {
      try {
        console.log(video.owner._id)
        const res = await axios.get(`http://localhost:8000/api/v1/users/${video.owner._id}`, {
          withCredentials: true,
        });
        setAvatar(res.data.data.avatar);
        console.log(res.data.data.avatar)
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };

    fetchAvatar();
  }, [video]);

  
  const handleLike = () => {
    if (liked) {
      setLiked(false);
    } else {
      setLiked(true);
      setDisliked(false);
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      setLiked(false);
    }
  };
  
  if (loading) return <p className="text-center mt-8">Loading video...</p>;
  if (!video) return <p className="text-center mt-8 text-red-500">Video not found!</p>;
  console.log(video)
  console.log(avatar)
  
  
  
  
  const shortDesc = video.description?.slice(0, 120) || "";
  const publishedDate = new Date(video.createdAt).toLocaleDateString();
  
  
    
    return (
  <div className="w-[1200px] mx-auto mt-8 px-4 overflow-y-auto max-h-[calc(100vh-64px)]  bg-gray-100">
    {/* Video Player */}
    <div className="relative w-full rounded-xl overflow-hidden shadow-lg  bg-gray-100 ">
      <video
        src={video.videoFile}
        poster={video.thumbnail}
        controls
        className="w-full h-[500px] object-contain md:object-cover   bg-gray-100"
      />
    </div>

    {/* Video Title and Actions */}
    <div className="mt-4">
      <h1 className="text-2xl font-semibold">{video.title}</h1>
      <div className="flex flex-wrap justify-between items-center mt-3">
        <p className="text-gray-600 text-sm">
          {video.views || Math.floor(Math.random() * 100000)} views • {publishedDate}
        </p>
        <div className="flex gap-4 text-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 ${liked ? "text-blue-600" : "hover:text-blue-500"}`}
          >
            <ThumbsUp size={20} /> Like
          </button>
          <button
            onClick={handleDislike}
            className={`flex items-center gap-1 ${disliked ? "text-red-600" : "hover:text-red-500"}`}
          >
            <ThumbsDown size={20} /> Dislike
          </button>
          <button className="flex items-center gap-1 hover:text-green-600">
            <Share2 size={20} /> Share
          </button>
          <button className="flex items-center gap-1 hover:text-yellow-600">
            <Bookmark size={20} /> Save
          </button>
          <button className="flex items-center gap-1 hover:text-gray-600">
            <Flag size={20} /> Report
          </button>
        </div>
      </div>
    </div>

    {/* Channel Info */}
    <div className="flex items-center gap-3 mt-6 border-t border-gray-200 pt-4">
      <img
        src={avatar || "https://via.placeholder.com/50"}
        alt="Channel"
        className="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-gray-900">{video.owner.username || "Unknown Channel"}</p>
        <p className="text-sm text-gray-500">1.2M subscribers</p>
      </div>
      <button className="ml-auto bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700">
        Subscribe
      </button>
    </div>

    {/* Description */}
    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
      <p className="text-gray-800 text-sm whitespace-pre-line">
        {showFullDesc ? video.description : shortDesc}
        {video.description?.length > 120 && (
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="text-blue-600 ml-2"
          >
            {showFullDesc ? "Show less" : "Show more"}
          </button>
        )}
      </p>
    </div>
  </div>
);

}
