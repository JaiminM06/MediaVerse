import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Upload, Eye, EyeOff, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { GoogleLogin } from '@react-oauth/google';

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!avatarFile) {
      setError("Avatar image is required");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("username", username);
    formData.append("password", password);
    if (avatarFile) formData.append("avatar", avatarFile);
    if (coverFile) formData.append("coverImage", coverFile);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/register`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/google-login`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );
      login(res.data.data.user);
      navigate("/youtube/feed");
    } catch (err) {
      setError(err.response?.data?.message || "Google Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F0F0F]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0F0F0F] to-[#1A1A1A]">
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-[#1DA1F2]/8 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] bg-[#FF0000]/6 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-6">🐦</div>
            <h1 className="text-5xl font-black tracking-tight text-white mb-3">
              Join <span className="text-gradient">MediaVerse</span>
            </h1>
            <p className="text-[var(--yt-text-secondary)] text-lg font-medium max-w-xs mx-auto">
              Create, share, and connect with the world.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-6">
            <div className="text-4xl mb-2">🎬</div>
            <h1 className="text-xl font-bold text-white">MediaVerse</h1>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-[var(--yt-text-secondary)] mb-6">Join MediaVerse today</p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--yt-text-secondary)]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)]" size={16} />
                  <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[var(--tw-card)] border border-[var(--tw-border)] rounded-xl text-white placeholder-[var(--yt-text-muted)] focus:outline-none focus:border-[var(--tw-primary)] focus:ring-1 focus:ring-[var(--tw-primary)] transition-all text-sm"
                    required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--yt-text-secondary)]">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)] text-sm">@</span>
                  <input type="text" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-[var(--tw-card)] border border-[var(--tw-border)] rounded-xl text-white placeholder-[var(--yt-text-muted)] focus:outline-none focus:border-[var(--tw-primary)] focus:ring-1 focus:ring-[var(--tw-primary)] transition-all text-sm"
                    required />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--yt-text-secondary)]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)]" size={16} />
                <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[var(--tw-card)] border border-[var(--tw-border)] rounded-xl text-white placeholder-[var(--yt-text-muted)] focus:outline-none focus:border-[var(--tw-primary)] focus:ring-1 focus:ring-[var(--tw-primary)] transition-all text-sm"
                  required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--yt-text-secondary)]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)]" size={16} />
                <input type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-11 py-2.5 bg-[var(--tw-card)] border border-[var(--tw-border)] rounded-xl text-white placeholder-[var(--yt-text-muted)] focus:outline-none focus:border-[var(--tw-primary)] focus:ring-1 focus:ring-[var(--tw-primary)] transition-all text-sm"
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)] hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* File uploads */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <input type="file" accept="image/*" id="avatar-upload" onChange={(e) => setAvatarFile(e.target.files[0])} className="hidden" />
                <label htmlFor="avatar-upload" className="flex flex-col items-center justify-center p-4 border border-dashed border-[var(--tw-border)] rounded-xl hover:border-[var(--tw-primary)] hover:bg-[var(--tw-primary)]/5 transition-all cursor-pointer h-full">
                  <Upload size={18} className="text-[var(--yt-text-muted)] mb-1.5" />
                  <span className="text-xs text-[var(--yt-text-secondary)] font-medium text-center truncate max-w-full">{avatarFile ? avatarFile.name : "Avatar"}</span>
                </label>
              </div>
              <div>
                <input type="file" accept="image/*" id="cover-upload" onChange={(e) => setCoverFile(e.target.files[0])} className="hidden" />
                <label htmlFor="cover-upload" className="flex flex-col items-center justify-center p-4 border border-dashed border-[var(--tw-border)] rounded-xl hover:border-[var(--tw-primary)] hover:bg-[var(--tw-primary)]/5 transition-all cursor-pointer h-full">
                  <ImageIcon size={18} className="text-[var(--yt-text-muted)] mb-1.5" />
                  <span className="text-xs text-[var(--yt-text-secondary)] font-medium text-center truncate max-w-full">{coverFile ? coverFile.name : "Cover"}</span>
                </label>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--tw-primary)] text-white py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <div className="mt-5 flex flex-col items-center">
            <div className="relative flex items-center w-full mb-5">
              <div className="flex-grow border-t border-[var(--tw-border)]"></div>
              <span className="flex-shrink-0 mx-4 text-[var(--yt-text-muted)] text-xs font-medium">OR</span>
              <div className="flex-grow border-t border-[var(--tw-border)]"></div>
            </div>
            
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed")}
              theme="filled_black"
              shape="pill"
              text="signup_with"
            />
          </div>

          <p className="text-center text-[var(--yt-text-secondary)] text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[var(--tw-primary)] hover:underline font-semibold">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
