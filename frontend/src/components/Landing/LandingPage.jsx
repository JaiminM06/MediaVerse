import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import axios from "axios";
import { API_BASE_URL } from "../../config/api.js";
import "./LandingPage.css";

// ─── Three.js Animated Sphere ─────────────────────────────
function AnimatedSphere({ color, position, speed, distort }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * speed * 0.3;
      meshRef.current.rotation.y = clock.getElapsedTime() * speed * 0.5;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={1.8}>
      <mesh ref={meshRef} position={position} scale={1}>
        <icosahedronGeometry args={[1, 16]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.15}
          metalness={0.9}
          distort={distort}
          speed={2}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
}

// ─── Three.js Ring ────────────────────────────────────────
function AnimatedRing({ color, radius, tube, position }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.z = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.4} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[radius, tube, 32, 64]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.95}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

// ─── Three.js Scene ───────────────────────────────────────
function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#FF4444" />
      <pointLight position={[-5, -3, 3]} intensity={0.8} color="#1DA1F2" />
      <pointLight position={[0, 3, -5]} intensity={0.6} color="#a855f7" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#ffffff"
      />

      <AnimatedSphere
        color="#FF2222"
        position={[-0.8, 0.2, 0]}
        speed={0.4}
        distort={0.45}
      />
      <AnimatedSphere
        color="#1DA1F2"
        position={[1.2, -0.3, -0.5]}
        speed={0.3}
        distort={0.35}
      />
      <AnimatedSphere
        color="#a855f7"
        position={[0.2, 1.2, -1]}
        speed={0.5}
        distort={0.5}
      />

      <AnimatedRing
        color="#FF4444"
        radius={2}
        tube={0.03}
        position={[0, 0, -1]}
      />
      <AnimatedRing
        color="#1DA1F2"
        radius={1.6}
        tube={0.02}
        position={[0.3, 0.2, -0.5]}
      />

      <Environment preset="night" />
    </Canvas>
  );
}

// ─── Particle Canvas ──────────────────────────────────────
function ParticleBackground() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: null, y: null });
  const animId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.density = Math.random() * 25 + 10;
        this.color =
          Math.random() > 0.5
            ? "rgba(255, 60, 60, 0.35)"
            : "rgba(29, 161, 242, 0.3)";
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        const mx = mouse.current.x;
        const my = mouse.current.y;
        if (mx !== null && my !== null) {
          const dx = mx - this.x;
          const dy = my - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            this.x -= (dx / dist) * force * this.density;
            this.y -= (dy / dist) * force * this.density;
          } else {
            this.x += (this.baseX - this.x) / 20;
            this.y += (this.baseY - this.y) / 20;
          }
        } else {
          this.x += (this.baseX - this.x) / 20;
          this.y += (this.baseY - this.y) / 20;
        }
      }
    }

    function init() {
      particles.current = [];
      const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 18000));
      for (let i = 0; i < count; i++) {
        particles.current.push(
          new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height
          )
        );
      }
    }

    function connect() {
      const pts = particles.current;
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const dx = pts[a].x - pts[b].x;
          const dy = pts[a].y - pts[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const opacity = 0.12 - (dist / 120) * 0.12;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        p.update();
        p.draw();
      });
      connect();
      animId.current = requestAnimationFrame(animate);
    }

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouse.current = { x: null, y: null };
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (animId.current) cancelAnimationFrame(animId.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-canvas" />;
}

// ─── Stagger Animation Variants ───────────────────────────
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Features Data ────────────────────────────────────────
const features = [
  {
    icon: "🎥",
    title: "Adaptive Streaming",
    desc: "HLS-powered video delivery with multi-resolution transcoding. Watch in crystal clarity on any device.",
    accent: "red",
  },
  {
    icon: "🐦",
    title: "Real-Time Social",
    desc: "Live tweet feeds, threaded conversations, and instant notifications via WebSocket connections.",
    accent: "blue",
  },
  {
    icon: "🔒",
    title: "Enterprise Auth",
    desc: "JWT-based authentication with automatic token refresh, rate limiting, and Redis-backed sessions.",
    accent: "purple",
  },
  {
    icon: "📊",
    title: "Creator Analytics",
    desc: "Deep engagement metrics, watch-time tracking, and content performance dashboards for creators.",
    accent: "red",
  },
  {
    icon: "🔍",
    title: "Instant Search",
    desc: "Typesense-powered full-text search with autocomplete, typo tolerance, and faceted filtering.",
    accent: "blue",
  },
  {
    icon: "☁️",
    title: "Cloud Native",
    desc: "S3 storage, BullMQ job queues, and Redis caching — built for production scalability from day one.",
    accent: "purple",
  },
];

const stats = [
  { value: "4K+", label: "Video Support" },
  { value: "<100ms", label: "API Latency" },
  { value: "99.9%", label: "Uptime" },
  { value: "∞", label: "Scalability" },
];

// ─── Main Landing Page ────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  // Session check — silent check to know if user is logged in
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/v1/users/current-user`, {
        withCredentials: true,
        _skipInterceptor: true,
      })
      .then(() => {
        setIsLoggedIn(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  // Scroll listener for navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handlePlatform = useCallback(
    (platform) => {
      if (isLoggedIn) {
        localStorage.setItem("mv_last_platform", platform);
        navigate(platform === "twitter" ? "/twitter/home" : "/youtube/feed");
      } else {
        navigate("/login");
      }
    },
    [isLoggedIn, navigate]
  );

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="landing-root">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Ambient Glows */}
      <div className="landing-orb landing-orb--red" />
      <div className="landing-orb landing-orb--blue" />
      <div className="landing-orb landing-orb--purple" />

      {/* ─── Navbar ─── */}
      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="landing-nav__inner">
          <button onClick={() => scrollTo("hero")} className="landing-logo" style={{ background: "none", border: "none" }}>
            MEDIAVERSE<span className="landing-logo__dot" />
          </button>

          <ul className="landing-nav__links">
            <li>
              <button className="landing-nav__link" onClick={() => scrollTo("hero")}>
                Home
              </button>
            </li>
            <li>
              <button className="landing-nav__link" onClick={() => scrollTo("platforms")}>
                Platforms
              </button>
            </li>
            <li>
              <button className="landing-nav__link" onClick={() => scrollTo("features")}>
                Features
              </button>
            </li>
          </ul>

          <button onClick={() => navigate("/login")} className="landing-nav__cta">
            Sign In →
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section id="hero" className="landing-hero" ref={heroRef}>
        <div className="landing-hero__inner">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="landing-hero__badge">
              <span className="landing-hero__badge-dot" />
              Open Platform · Always Free
            </motion.div>

            <motion.h1 variants={fadeUp} className="landing-hero__title">
              Your Universe of{" "}
              <span className="landing-hero__title-gradient">
                Videos & Social.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="landing-hero__subtitle">
              MediaVerse unifies a YouTube-grade video platform with a
              Twitter-style social layer — adaptive streaming, real-time
              feeds, creator analytics, and enterprise-grade infrastructure,
              all in one place.
            </motion.p>

            <motion.div variants={fadeUp} className="landing-hero-cta-wrapper">
              <button
                className="landing-btn landing-btn--red"
                onClick={() => handlePlatform("youtube")}
              >
                🎬 Enter YouTube
              </button>
              <button
                className="landing-btn landing-btn--blue"
                onClick={() => handlePlatform("twitter")}
              >
                🐦 Enter Twitter
              </button>
              <button
                className="landing-btn landing-btn--ghost"
                onClick={() => navigate("/register")}
              >
                Create Account
              </button>
            </motion.div>
          </motion.div>

          {/* Three.js Visual */}
          <motion.div
            className="landing-hero__visual"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="landing-three-container">
              <HeroScene />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Platforms Section ─── */}
      <section id="platforms" className="landing-platforms">
        <div className="landing-platforms__inner">
          <motion.div
            className="landing-section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="landing-section-tag">Choose Your Experience</span>
            <h2 className="landing-section-title">Two Platforms, One Account</h2>
            <p className="landing-section-desc">
              Switch seamlessly between a full video platform and a real-time
              social feed. Your profile, subscribers, and content travel with
              you.
            </p>
          </motion.div>

          <div className="landing-platforms__grid">
            <motion.div
              className="landing-glass landing-platform-card landing-platform-card--yt"
              onClick={() => handlePlatform("youtube")}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8 }}
            >
              <span className="landing-platform-card__icon">🎬</span>
              <h3 className="landing-platform-card__title">MediaVerse Video</h3>
              <p className="landing-platform-card__desc">
                Upload, stream, and discover videos with HLS adaptive
                streaming, creator dashboards, playlists, and analytics.
              </p>
              <button className="landing-platform-card__btn">
                Launch →
              </button>
            </motion.div>

            <motion.div
              className="landing-glass landing-platform-card landing-platform-card--tw"
              onClick={() => handlePlatform("twitter")}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.25 }}
              whileHover={{ y: -8 }}
            >
              <span className="landing-platform-card__icon">🐦</span>
              <h3 className="landing-platform-card__title">MediaVerse X</h3>
              <p className="landing-platform-card__desc">
                Post tweets, engage in threads, retweet, and follow trending
                hashtags — all powered by real-time WebSocket feeds.
              </p>
              <button className="landing-platform-card__btn">
                Launch →
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="landing-stats">
        <motion.div
          className="landing-stats__inner"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="landing-glass landing-stat">
              <div className="landing-stat__value">{s.value}</div>
              <div className="landing-stat__label">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="landing-features">
        <div className="landing-features__inner">
          <motion.div
            className="landing-section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="landing-section-tag">Under the Hood</span>
            <h2 className="landing-section-title">Engineered for Scale</h2>
            <p className="landing-section-desc">
              Production-grade infrastructure meets beautiful user experience.
              Every feature is built to handle real-world traffic.
            </p>
          </motion.div>

          <motion.div
            className="landing-features__grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="landing-glass landing-feature-card"
                whileHover={{ y: -6, borderColor: "rgba(255,255,255,0.15)" }}
              >
                <div className={`landing-feature-card__icon landing-feature-card__icon--${f.accent}`}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <button onClick={() => scrollTo("hero")} className="landing-logo" style={{ background: "none", border: "none", fontSize: "1.2rem" }}>
            MEDIAVERSE<span className="landing-logo__dot" />
          </button>
          <p className="landing-footer__copy">
            © 2026 MediaVerse. Video streaming meets social networking.
          </p>
        </div>
      </footer>
    </div>
  );
}
