import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginMethod, setLoginMethod] = useState("password"); // 'password' or 'otp'
  const [otpStep, setOtpStep] = useState(1); // 1 = email, 2 = otp
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/login`,
        { email, password },
        { withCredentials: true }
      );
      login(res.data.data.user);
      navigate("/youtube/feed");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/send-otp`,
        { email },
        { withCredentials: true }
      );
      setSuccess("OTP sent successfully to your email!");
      setOtpStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/verify-otp`,
        { email, otp },
        { withCredentials: true }
      );
      login(res.data.data.user);
      navigate("/youtube/feed");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
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
        {/* Gradient orbs */}
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#FF0000]/8 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-[#1DA1F2]/6 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-6">🎬</div>
            <h1 className="text-5xl font-black tracking-tight text-white mb-3">
              Media<span className="text-gradient">Verse</span>
            </h1>
            <p className="text-[var(--yt-text-secondary)] text-lg font-medium max-w-xs mx-auto">
              Your universe for videos, tweets, and everything in between.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-4xl mb-3">🎬</div>
            <h1 className="text-2xl font-bold text-white">MediaVerse</h1>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-[var(--yt-text-secondary)] mb-8">Sign in to your account</p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2"
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
                className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={
              loginMethod === "password"
                ? handlePasswordLogin
                : otpStep === 1
                ? handleSendOTP
                : handleVerifyOTP
            }
            className="space-y-5"
          >
            {loginMethod === "password" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--yt-text-secondary)]">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)]" size={18} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[var(--tw-card)] border border-[var(--tw-border)] rounded-xl text-white placeholder-[var(--yt-text-muted)] focus:outline-none focus:border-[var(--tw-primary)] focus:ring-1 focus:ring-[var(--tw-primary)] transition-all text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--yt-text-secondary)]">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)]" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 bg-[var(--tw-card)] border border-[var(--tw-border)] rounded-xl text-white placeholder-[var(--yt-text-muted)] focus:outline-none focus:border-[var(--tw-primary)] focus:ring-1 focus:ring-[var(--tw-primary)] transition-all text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)] hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : otpStep === 1 ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--yt-text-secondary)]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)]" size={18} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--tw-card)] border border-[var(--tw-border)] rounded-xl text-white placeholder-[var(--yt-text-muted)] focus:outline-none focus:border-[var(--tw-primary)] focus:ring-1 focus:ring-[var(--tw-primary)] transition-all text-sm"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--yt-text-secondary)]">6-Digit Code</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--yt-text-muted)]" size={18} />
                  <input
                    type="text"
                    placeholder="Enter the OTP from your email"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="w-full pl-11 pr-4 py-3 bg-[var(--tw-card)] border border-[var(--tw-border)] rounded-xl text-white placeholder-[var(--yt-text-muted)] focus:outline-none focus:border-[var(--tw-primary)] focus:ring-1 focus:ring-[var(--tw-primary)] transition-all text-sm tracking-widest font-mono"
                    required
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button type="button" onClick={() => { setOtpStep(1); setOtp(""); setSuccess(""); setError(""); }} className="text-xs text-[var(--tw-primary)] hover:underline">Change Email</button>
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--tw-primary)] text-white py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {loginMethod === "password" ? "Signing in..." : otpStep === 1 ? "Sending..." : "Verifying..."}
                </>
              ) : loginMethod === "password" ? (
                "Sign In"
              ) : otpStep === 1 ? (
                "Send Login Code"
              ) : (
                "Verify Code"
              )}
            </motion.button>
          </form>

          <div className="text-center mt-4">
            {loginMethod === "password" ? (
              <button
                onClick={() => {
                  setLoginMethod("otp");
                  setError("");
                  setSuccess("");
                }}
                className="text-sm text-[var(--yt-text-secondary)] hover:text-white transition-colors"
              >
                Use a <span className="text-[var(--tw-primary)] font-semibold">Login Code (OTP)</span> instead
              </button>
            ) : (
              <button
                onClick={() => {
                  setLoginMethod("password");
                  setError("");
                  setSuccess("");
                }}
                className="text-sm text-[var(--yt-text-secondary)] hover:text-white transition-colors"
              >
                Use a <span className="text-[var(--tw-primary)] font-semibold">Password</span> instead
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="relative flex items-center w-full mb-6">
              <div className="flex-grow border-t border-[var(--tw-border)]"></div>
              <span className="flex-shrink-0 mx-4 text-[var(--yt-text-muted)] text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-[var(--tw-border)]"></div>
            </div>
            
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed")}
              theme="filled_black"
              shape="pill"
              text="signin_with"
            />
          </div>

          <p className="text-center text-[var(--yt-text-secondary)] text-sm mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-[var(--tw-primary)] hover:underline font-semibold">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
