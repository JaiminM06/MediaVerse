import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, Save, Loader2, Key, User, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ManageAccount() {
  const [activeTab, setActiveTab] = useState("details");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [details, setDetails] = useState({ fullName: "", email: "" });
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState("");
  const [currentCover, setCurrentCover] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/current-user`,
      { withCredentials: true }
    )
    .then(res => {
      const user = res.data.data;
      setDetails({
        fullName: user.fullName || '',
        email:    user.email    || ''
      });
      setCurrentAvatar(user.avatar || '');
      setCurrentCover(user.coverImage || '');
    })
    .catch(err => console.error('Failed to load user details:', err))
    .finally(() => setLoadingDetails(false));
  }, []);

  // 🔒 Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    let err = {};
    if (!password) err.password = "Current password is required";
    if (!newPassword) err.newPassword = "New password is required";
    if (newPassword && newPassword.length < 6) err.newPassword = "Password must be at least 6 characters";
    if (!confirmPassword) err.confirmPassword = "Please confirm new password";
    if (newPassword && confirmPassword && newPassword !== confirmPassword)
      err.confirmPassword = "Passwords do not match";

    setErrors(err);
    if (Object.keys(err).length > 0) return;

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/change-password`,
        { oldPassword: password, newPassword },
        { withCredentials: true }
      );
      setMessage({ type: "success", text: res.data.message || "Password updated successfully!" });
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Incorrect old password." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  // 🧾 Update Account Details
  const handleDetailsUpdate = async (e) => {
    e.preventDefault();
    let err = {};
    if (!details.fullName) err.fullName = "Full name is required";
    if (!details.email) err.email = "Email is required";

    setErrors(err);
    if (Object.keys(err).length > 0) return;

    try {
      setLoading(true);
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/update-account`,
        details,
        { withCredentials: true }
      );
      setMessage({ type: "success", text: res.data.message || "Account details updated!" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update details." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  // 🧍 Update Avatar
  const handleAvatarUpload = async (e) => {
    if (e) e.preventDefault();
    if (!avatar) {
      setMessage({ type: "error", text: "Please select an image first." });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("avatar", avatar);

      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/avatar`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage({ type: "success", text: res.data.message || "Avatar updated!" });
      
      // Update local preview cache
      if (res.data.data?.avatar) {
        setCurrentAvatar(res.data.data.avatar);
      }
      setAvatar(null);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to upload avatar." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  // 🖼️ Update Cover Image
  const handleCoverUpload = async (e) => {
    if (e) e.preventDefault();
    if (!cover) {
      setMessage({ type: "error", text: "Please select a cover image first." });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("coverImage", cover);

      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/cover-Image`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage({ type: "success", text: res.data.message || "Cover image updated!" });
      
      // Update local preview cache
      if (res.data.data?.coverImage) {
        setCurrentCover(res.data.data.coverImage);
      }
      setCover(null);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to upload cover." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const tabItems = [
    { id: "details", label: "Profile Details" },
    { id: "password", label: "Change Password" },
    { id: "avatar_cover", label: "Avatar & Cover" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0F0F0F] min-h-screen p-6"
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors mb-6 font-medium text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-white text-2xl font-bold mb-8">Account Settings</h1>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 border-b border-[#272727]">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setMessage({ type: "", text: "" });
                setErrors({});
              }}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-white' : 'text-[#AAAAAA] hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="accountTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF0000]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Flash Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-fadeIn ${
            message.type === "success" 
              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            <span className={`w-2 h-2 rounded-full ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}></span>
            {message.text}
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-[#1A1A1A] border border-[#272727] rounded-2xl p-6">
          {/* Profile Details Tab */}
          {activeTab === "details" && (
            <form onSubmit={handleDetailsUpdate} className="space-y-5">
              <div>
                <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Full Name</label>
                {loadingDetails ? (
                  <div className="w-full h-[48px] bg-[#272727] animate-pulse rounded-lg" />
                ) : (
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={details.fullName}
                    onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                    className="bg-[#272727] border border-[#383838] rounded-lg text-white px-4 py-3 placeholder-[#606060] focus:border-[#AAAAAA] focus:outline-none w-full transition-colors"
                  />
                )}
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Email Address</label>
                {loadingDetails ? (
                  <div className="w-full h-[48px] bg-[#272727] animate-pulse rounded-lg" />
                ) : (
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })}
                    className="bg-[#272727] border border-[#383838] rounded-lg text-white px-4 py-3 placeholder-[#606060] focus:border-[#AAAAAA] focus:outline-none w-full transition-colors"
                  />
                )}
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || loadingDetails}
                  className="bg-[#FF0000] text-white rounded-full px-6 py-2.5 font-medium hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Current Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#272727] border border-[#383838] rounded-lg text-white px-4 py-3 placeholder-[#606060] focus:border-[#AAAAAA] focus:outline-none w-full transition-colors"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#272727] border border-[#383838] rounded-lg text-white px-4 py-3 placeholder-[#606060] focus:border-[#AAAAAA] focus:outline-none w-full transition-colors"
                />
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="text-[#AAAAAA] text-sm font-medium mb-2 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#272727] border border-[#383838] rounded-lg text-white px-4 py-3 placeholder-[#606060] focus:border-[#AAAAAA] focus:outline-none w-full transition-colors"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#FF0000] text-white rounded-full px-6 py-2.5 font-medium hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  Update Password
                </button>
              </div>
            </form>
          )}

          {/* Avatar & Cover Tab */}
          {activeTab === "avatar_cover" && (
            <div className="space-y-8">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 pb-6 border-b border-[#272727]">
                <img
                  src={avatar ? URL.createObjectURL(avatar) : (currentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(details.fullName || "U")}&background=random`)}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#383838] shrink-0"
                />
                <div className="space-y-3 flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm">Profile Picture</h3>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      id="avatar-input"
                      className="hidden"
                      onChange={(e) => setAvatar(e.target.files[0])}
                    />
                    <label
                      htmlFor="avatar-input"
                      className="border border-[#383838] text-white rounded-full px-4 py-2 hover:bg-[#272727] text-sm font-medium transition-colors cursor-pointer inline-block"
                    >
                      Change Avatar
                    </label>
                    {avatar && (
                      <button
                        type="button"
                        onClick={handleAvatarUpload}
                        disabled={loading}
                        className="bg-[#FF0000] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                    )}
                  </div>
                  <p className="text-[#606060] text-xs">JPG, GIF or PNG. Max size 3MB.</p>
                </div>
              </div>

              {/* Cover Banner Section */}
              <div className="space-y-3">
                <h3 className="text-white font-medium text-sm">Banner Image</h3>
                <div className="w-full h-32 rounded-xl overflow-hidden bg-[#272727] relative border border-[#383838]">
                  <img
                    src={cover ? URL.createObjectURL(cover) : (currentCover || "https://via.placeholder.com/800x200")}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    id="cover-input"
                    className="hidden"
                    onChange={(e) => setCover(e.target.files[0])}
                  />
                  <label
                    htmlFor="cover-input"
                    className="border border-[#383838] text-white rounded-full px-4 py-2 hover:bg-[#272727] text-sm font-medium transition-colors cursor-pointer inline-block"
                  >
                    Change Cover
                  </label>
                  {cover && (
                    <button
                      type="button"
                      onClick={handleCoverUpload}
                      disabled={loading}
                      className="bg-[#FF0000] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                  )}
                </div>
                <p className="text-[#606060] text-xs">1920x1080 recommended banner size.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
