import { useState } from "react";
import axios from "axios";
import { Upload, User, Image, Lock } from "lucide-react";

export default function ManageAccount() {
    const [activeTab, setActiveTab] = useState("password");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [details, setDetails] = useState({ fullName: "", email: "" });
    const [avatar, setAvatar] = useState(null);
    const [cover, setCover] = useState(null);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState({ type: "", text: "" });

    // 🔒 Change Password
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        let err = {};
        if (!password) err.password = "This field is required";
        if (!newPassword) err.newPassword = "This field is required";
        if (!confirmPassword) err.confirmPassword = "This field is required";
        if (newPassword && confirmPassword && newPassword !== confirmPassword)
            err.confirmPassword = "Passwords do not match";
        setErrors(err);
        if (Object.keys(err).length > 0) return;

        try {
            const res = await axios.post(
                "http://localhost:8000/api/v1/users/change-password",
                { oldPassword: password, newPassword },
                { withCredentials: true }
            );
            setMessage({ type: "success", text: res.data.message || "Password changed successfully!" });
            setPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Incorrect old password.";
            setMessage({ type: "error", text: errorMsg });
        }
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    // 🧾 Update Account Details
    const handleDetailsUpdate = async (e) => {
        e.preventDefault();
        let err = {};
        if (!details.fullName) err.fullName = "This field is required";
        if (!details.email) err.email = "This field is required";
        setErrors(err);
        if (Object.keys(err).length > 0) return;

        try {
            const res = await axios.patch(
                "http://localhost:8000/api/v1/users/update-account",
                details,
                { withCredentials: true }
            );
            setMessage({ type: "success", text: res.data.message || "Account details updated successfully!" });
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to update details.";
            setMessage({ type: "error", text: errorMsg });
        }
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    // 🧍 Update Avatar
    const handleAvatarUpload = async (e) => {
        e.preventDefault();
        if (!avatar) {
            setMessage({ type: "error", text: "Please select an image file." });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("avatar", avatar);

            const res = await axios.patch(
                "http://localhost:8000/api/v1/users/avatar",
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
            setMessage({ type: "success", text: res.data.message || "Avatar updated successfully!" });
            setAvatar(null);
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to update avatar.";
            setMessage({ type: "error", text: errorMsg });
        }
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    // 🖼️ Update Cover Image
    const handleCoverUpload = async (e) => {
        e.preventDefault();
        if (!cover) {
            setMessage({ type: "error", text: "Please select a cover image file." });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("coverImage", cover);

            const res = await axios.patch(
                "http://localhost:8000/api/v1/users/cover-Image",
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
            setMessage({ type: "success", text: res.data.message || "Cover image updated successfully!" });
            setCover(null);
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to update cover image.";
            setMessage({ type: "error", text: errorMsg });
        }
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Account</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-3 mb-6">
                {[
                    { id: "password", label: "Change Password", color: "blue" },
                    { id: "details", label: "Update Details", color: "green" },
                    { id: "cover", label: "Update Cover Image", color: "purple" },
                    { id: "avatar", label: "Update Avatar", color: "orange" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === tab.id
                                ? `bg-${tab.color}-600 text-white`
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            }`}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setMessage({ type: "", text: "" });
                            setErrors({});
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Notification */}
            {message.text && (
                <div
                    className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Change Password */}
            {activeTab === "password" && (
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="text-blue-600" />
                        <h2 className="text-lg font-semibold">Change Current Password</h2>
                    </div>
                    <form onSubmit={handlePasswordChange} className="space-y-3">
                        <div>
                            <input
                                type="password"
                                placeholder="Current Password"
                                className="w-full border rounded-lg px-3 py-2 outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="New Password"
                                className="w-full border rounded-lg px-3 py-2 outline-none"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            {errors.newPassword && <p className="text-red-500 text-sm">{errors.newPassword}</p>}
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                className="w-full border rounded-lg px-3 py-2 outline-none"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Update Password
                        </button>
                    </form>
                </div>
            )}

            {/* Update Details */}
            {activeTab === "details" && (
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="text-green-600" />
                        <h2 className="text-lg font-semibold">Update Account Details</h2>
                    </div>
                    <form onSubmit={handleDetailsUpdate} className="space-y-3">
                        <div>
                            <input
                                type="text"
                                placeholder="Full Name"
                                className="w-full border rounded-lg px-3 py-2 outline-none"
                                value={details.fullName}
                                onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                            />
                            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
                        </div>
                        <div>
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full border rounded-lg px-3 py-2 outline-none"
                                value={details.email}
                                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                            />
                            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                        </div>
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>
            )}

            {/* Update Cover */}
            {activeTab === "cover" && (
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Image className="text-purple-600" />
                        <h2 className="text-lg font-semibold">Update Cover Image</h2>
                    </div>
                    <form onSubmit={handleCoverUpload} className="space-y-3">
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full border rounded-lg px-3 py-2 outline-none"
                            onChange={(e) => setCover(e.target.files[0])}
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                        >
                            Upload Cover Image
                        </button>
                    </form>
                </div>
            )}

            {/* Update Avatar */}
            {activeTab === "avatar" && (
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Upload className="text-orange-600" />
                        <h2 className="text-lg font-semibold">Update Avatar</h2>
                    </div>
                    <form onSubmit={handleAvatarUpload} className="space-y-3">
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full border rounded-lg px-3 py-2 outline-none"
                            onChange={(e) => setAvatar(e.target.files[0])}
                        />
                        <button
                            type="submit"
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
                        >
                            Upload Avatar
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

