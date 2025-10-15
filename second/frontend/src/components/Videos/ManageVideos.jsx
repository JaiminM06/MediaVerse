import { useState, useEffect } from "react";
import axios from "axios";
import Upload from "./upload.jsx"
import UpdateVideo from "./UpdateVideo.jsx";
function ManageVideos() {
    const [selectedTab, setSelectedTab] = useState("upload");
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await axios.get("http://localhost:8000/api/v1/videos/", {
                    withCredentials: true,
                });
                setVideos(res.data.data || []);
            } catch (error) {
                console.error("Error fetching videos:", error);
            }
        };
        fetchVideos();
    }, []);

    // Delete a video
    const handleDelete = async (videoId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this video?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:8000/api/v1/videos/${videoId}`, {
                withCredentials: true,
            });
            alert("Video deleted successfully!");
            setVideos(videos.filter((v) => v._id !== videoId));
        } catch (error) {
            alert("Failed to delete video!");
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-indigo-700">🎬 Manage Your Videos</h1>
                <button
                    onClick={() => (window.location.href = "/Home/user")}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setSelectedTab("upload")}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${selectedTab === "upload"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-indigo-600 border border-indigo-600"
                        }`}
                >
                    Upload Video
                </button>
                <button
                    onClick={() => setSelectedTab("update")}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${selectedTab === "update"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-indigo-600 border border-indigo-600"
                        }`}
                >
                    Update Video
                </button>
                <button
                    onClick={() => setSelectedTab("delete")}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${selectedTab === "delete"
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-indigo-600 border border-indigo-600"
                        }`}
                >
                    Delete Video
                </button>
            </div>

            {/* Render Tab */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                {selectedTab === "upload" && <Upload />}

                {selectedTab === "delete" && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">🗑️ Select a video to delete</h2>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {videos.map((video) => (
                                <div
                                    key={video._id}
                                    className="border rounded-lg overflow-hidden shadow hover:shadow-md transition cursor-pointer"
                                >
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                                        <button
                                            onClick={() => handleDelete(video._id)}
                                            className="mt-2 w-full bg-red-500 text-white py-1 rounded-lg hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedTab === "update" && (
                    <div>
                        {!selectedVideo ? (
                            <>
                                <h2 className="text-xl font-semibold mb-4">✏️ Select a video to update</h2>
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {videos.map((video) => (
                                        <div
                                            key={video._id}
                                            onClick={() => setSelectedVideo(video._id)}
                                            className="border rounded-lg overflow-hidden shadow hover:shadow-md transition cursor-pointer"
                                        >
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-full h-40 object-cover"
                                            />
                                            <div className="p-3">
                                                <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                                                <p className="text-xs text-gray-400">{video.views} views</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <UpdateVideo videoId={selectedVideo} goBack={() => setSelectedVideo(null)} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageVideos;
