import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  Camera,
  CameraOff,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  Loader,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

// ── Image cache ───────────────────────────────────
const imgCache = {};

// ── Smart URL handler ─────────────────────────────
const getImageUrl = (url) => {
  if (!url) return url;
  if (url.includes("cloudinary.com")) return url;
  if (url.includes("localhost:8000")) return url;
  return `http://localhost:8000/tryon/proxy-image?url=${encodeURIComponent(url)}`;
};

// ── Image loader ──────────────────────────────────
function loadImg(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const finalUrl = getImageUrl(url);
    if (imgCache[finalUrl]) {
      resolve(imgCache[finalUrl]);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgCache[finalUrl] = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = finalUrl;
  });
}

// ── Item Thumbnail ────────────────────────────────
const ItemThumb = ({ item, isSelected, onClick, index }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onClick(index)}
    className={`
            relative cursor-pointer rounded-xl overflow-hidden
            border-2 flex-shrink-0 w-24 h-32 transition-all bg-white/5
            ${
              isSelected
                ? "border-violet-500 shadow-lg shadow-violet-500/30"
                : "border-white/10"
            }
        `}
  >
    <img
      src={getImageUrl(item.image)}
      alt=""
      crossOrigin="anonymous"
      className="w-full h-full object-contain p-1"
    />
    {isSelected && (
      <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
        <CheckCircle className="w-5 h-5 text-violet-400" />
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center py-1">
      <span className="text-xs text-gray-300 capitalize">
        {item.category === "top"
          ? "👕"
          : item.category === "bottom"
            ? "👖"
            : "🧥"}
      </span>
    </div>
  </motion.div>
);

// ── Main Component ────────────────────────────────
export default function TryOn() {
  const { user } = useAuth();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const detectorRef = useRef(null);
  const topImgRef = useRef(null);
  const bottomImgRef = useRef(null);
  const smoothRef = useRef({});
  const fpsRef = useRef({ n: 0, t: Date.now() });
  const showTopRef = useRef(true);
  const showBotRef = useRef(true);
  const showSkelRef = useRef(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [poseDetected, setPoseDetected] = useState(false);
  const [fps, setFps] = useState(0);
  const [showTop, setShowTop] = useState(true);
  const [showBot, setShowBot] = useState(true);
  const [showSkel, setShowSkel] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [items, setItems] = useState([]);
  const [selIdx, setSelIdx] = useState(0);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Fetch all items separately ────────────────
  useEffect(() => {
    API.get(`/recommend/${user.email}`)
      .then((r) => {
        const tops = r.data.tops || [];
        const bottoms = r.data.bottoms || [];
        const outers = r.data.outers || [];
        const all = [...tops, ...bottoms, ...outers];
        console.log(`📦 Loaded ${all.length} items`);
        setItems(all);
      })
      .catch(() => setError("No items found. Set up body profile first."))
      .finally(() => setLoadingItems(false));
  }, [user.email]);

  // ── Load image when item changes ──────────────
  useEffect(() => {
    const item = items[selIdx];
    if (!item) return;

    setImgLoaded(false);
    topImgRef.current = null;
    bottomImgRef.current = null;

    loadImg(item.image).then((img) => {
      if (!img) return;
      // Place on correct body part based on category
      if (item.category === "top" || item.category === "outer") {
        topImgRef.current = img;
      } else {
        bottomImgRef.current = img;
      }
      setImgLoaded(true);
      console.log(`✅ ${item.category} image ready`);
    });
  }, [selIdx, items]);

  // ── Smooth helper ─────────────────────────────
  const smooth = (key, val, f = 0.72) => {
    const prev = smoothRef.current[key];
    if (prev === undefined) {
      smoothRef.current[key] = val;
      return val;
    }
    const s = prev * f + val * (1 - f);
    smoothRef.current[key] = s;
    return s;
  };

  // ── Pose → placement ──────────────────────────
  const getPlacement = (kps, W, H) => {
    const find = (name) => kps.find((k) => k.name === name);
    const ls = find("left_shoulder");
    const rs = find("right_shoulder");
    const lh = find("left_hip");
    const rh = find("right_hip");
    const lk = find("left_knee");
    const rk = find("right_knee");
    const la = find("left_ankle");
    const ra = find("right_ankle");

    if (!ls || !rs || !lh || !rh) return null;
    if (ls.score < 0.2 || rs.score < 0.2) return null;
    if (lh.score < 0.2 || rh.score < 0.2) return null;

    const mx = (x) => W - x;

    const shCX = (mx(ls.x) + mx(rs.x)) / 2;
    const shW = Math.abs(mx(ls.x) - mx(rs.x));
    const shY = (ls.y + rs.y) / 2;
    const hiCX = (mx(lh.x) + mx(rh.x)) / 2;
    const hiW = Math.abs(mx(lh.x) - mx(rh.x));
    const hiY = (lh.y + rh.y) / 2;
    const knY = lk && rk && lk.score > 0.2 ? (lk.y + rk.y) / 2 : hiY + H * 0.22;
    const anY = la && ra && la.score > 0.2 ? (la.y + ra.y) / 2 : knY + H * 0.2;

    return {
      top: {
        x: shCX - (shW * 1.8) / 2,
        y: shY - (hiY - shY) * 0.15,
        w: shW * 1.8,
        h: (hiY - shY) * 1.35,
      },
      bottom: {
        x: hiCX - Math.max(hiW * 1.8, shW * 1.3) / 2,
        y: hiY - (hiY - shY) * 0.05,
        w: Math.max(hiW * 1.8, shW * 1.3),
        h: (anY - hiY) * 1.1,
      },
    };
  };

  // ── Draw skeleton ─────────────────────────────
  const drawSkeleton = (ctx, kps, W) => {
    const pairs = [
      ["left_shoulder", "right_shoulder"],
      ["left_shoulder", "left_hip"],
      ["right_shoulder", "right_hip"],
      ["left_hip", "right_hip"],
      ["left_hip", "left_knee"],
      ["right_hip", "right_knee"],
      ["left_knee", "left_ankle"],
      ["right_knee", "right_ankle"],
    ];
    const get = (n) => kps.find((k) => k.name === n);
    ctx.save();
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;
    pairs.forEach(([a, b]) => {
      const pa = get(a),
        pb = get(b);
      if (!pa || !pb || pa.score < 0.2 || pb.score < 0.2) return;
      ctx.beginPath();
      ctx.moveTo(W - pa.x, pa.y);
      ctx.lineTo(W - pb.x, pb.y);
      ctx.stroke();
    });
    kps.forEach((pt) => {
      if (pt.score < 0.2) return;
      ctx.beginPath();
      ctx.arc(W - pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#7c3aed";
      ctx.globalAlpha = 1;
      ctx.fill();
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.restore();
  };

  // ── Render loop ───────────────────────────────
  const startLoop = (detector) => {
    const loop = async () => {
      if (!runningRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const W = video.videoWidth;
      const H = video.videoHeight;
      if (!W || !H) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Draw mirrored video
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, W, H);
      ctx.restore();

      try {
        const poses = await detector.estimatePoses(video);
        const kps = poses?.[0]?.keypoints;

        if (kps?.length > 0) {
          const p = getPlacement(kps, W, H);
          if (p) {
            setPoseDetected(true);

            const sp = {
              top: {
                x: smooth("tx", p.top.x),
                y: smooth("ty", p.top.y),
                w: smooth("tw", p.top.w),
                h: smooth("th", p.top.h),
              },
              bottom: {
                x: smooth("bx", p.bottom.x),
                y: smooth("by", p.bottom.y),
                w: smooth("bw", p.bottom.w),
                h: smooth("bh", p.bottom.h),
              },
            };

            if (showSkelRef.current) drawSkeleton(ctx, kps, W);

            // Draw bottom first, then top on top
            if (showBotRef.current && bottomImgRef.current) {
              ctx.save();
              ctx.globalAlpha = 0.9;
              ctx.drawImage(
                bottomImgRef.current,
                sp.bottom.x,
                sp.bottom.y,
                sp.bottom.w,
                sp.bottom.h,
              );
              ctx.restore();
            }
            if (showTopRef.current && topImgRef.current) {
              ctx.save();
              ctx.globalAlpha = 0.92;
              ctx.drawImage(
                topImgRef.current,
                sp.top.x,
                sp.top.y,
                sp.top.w,
                sp.top.h,
              );
              ctx.restore();
            }
          } else {
            setPoseDetected(false);
          }
        } else {
          setPoseDetected(false);
        }
      } catch (e) {
        /* silent */
      }

      // FPS counter
      fpsRef.current.n++;
      const now = Date.now();
      if (now - fpsRef.current.t >= 1000) {
        setFps(fpsRef.current.n);
        fpsRef.current.n = 0;
        fpsRef.current.t = now;
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  // ── Start camera ──────────────────────────────
  const startCamera = async () => {
    try {
      setCameraError("");
      setError("");
      setLoading(true);
      setLoadingMsg("Starting camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () =>
          videoRef.current.play().then(resolve);
      });

      setLoadingMsg("Loading AI pose model...");
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const pd = await import("@tensorflow-models/pose-detection");
      const detector = await pd.createDetector(pd.SupportedModels.MoveNet, {
        modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      });

      detectorRef.current = detector;
      runningRef.current = true;
      setLoading(false);
      setCameraOn(true);
      startLoop(detector);
    } catch (err) {
      setLoading(false);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera denied. Allow camera in browser settings."
          : `Error: ${err.message}`,
      );
    }
  };

  // ── Stop camera ───────────────────────────────
  const stopCamera = () => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    smoothRef.current = {};
    setCameraOn(false);
    setPoseDetected(false);
    const canvas = canvasRef.current;
    if (canvas)
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => () => stopCamera(), []);

  // ── Toggles ───────────────────────────────────
  const toggleTop = () => {
    const v = !showTop;
    setShowTop(v);
    showTopRef.current = v;
  };
  const toggleBot = () => {
    const v = !showBot;
    setShowBot(v);
    showBotRef.current = v;
  };
  const toggleSkel = () => {
    const v = !showSkel;
    setShowSkel(v);
    showSkelRef.current = v;
  };

  // ── Screenshot ────────────────────────────────
  const screenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg", 0.95);
    a.download = `outfitiq_tryon_${Date.now()}.jpg`;
    a.click();
  };

  const currentItem = items[selIdx];

  return (
    <div
      className="min-h-screen bg-[#080810] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
                .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); }
                .mesh {
                    background:
                        radial-gradient(ellipse 60% 40% at 20% 20%, rgba(139,92,246,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 40% at 80% 80%, rgba(244,114,182,0.08) 0%, transparent 60%);
                }
            `}</style>

      <div className="fixed inset-0 mesh pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            ✦ Live AR
          </p>
          <h1
            className="text-5xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Virtual Try-On
          </h1>
          <p className="text-gray-400">
            Try individual pieces live •{" "}
            {imgLoaded ? (
              <span className="text-emerald-400">✓ Item ready</span>
            ) : (
              <span className="text-yellow-400">⏳ Loading item...</span>
            )}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Canvas ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Canvas */}
            <div
              className="relative rounded-2xl overflow-hidden border border-white/8 bg-[#0d0d1a]"
              style={{ aspectRatio: "4/3" }}
            >
              <video
                ref={videoRef}
                className="hidden"
                playsInline
                muted
                autoPlay
              />
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
                style={{ display: cameraOn ? "block" : "none" }}
              />

              {/* Placeholder */}
              {!cameraOn && !loading && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                  style={{ background: "rgba(8,8,16,0.97)" }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="w-24 h-24 rounded-2xl border border-violet-500/30 flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.1)" }}
                  >
                    <Camera
                      className="w-12 h-12 text-violet-400"
                      strokeWidth={1}
                    />
                  </motion.div>
                  <div className="text-center px-4">
                    <p className="text-white font-semibold mb-2 text-lg">
                      AR Dressing Room
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Click{" "}
                      <span className="text-violet-400 font-medium">
                        Start AR
                      </span>{" "}
                      below, then stand back so your full body is visible
                    </p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5"
                  style={{ background: "rgba(8,8,16,0.95)" }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 flex items-center justify-center">
                      <Loader className="w-8 h-8 text-violet-400 animate-spin" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500 animate-ping opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">
                      {loadingMsg}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      First load: ~10 seconds
                    </p>
                  </div>
                </div>
              )}

              {/* Status badges */}
              {cameraOn && (
                <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(239,68,68,0.85)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-full text-xs font-semibold text-gray-300"
                    style={{ background: "rgba(0,0,0,0.65)" }}
                  >
                    {fps} FPS
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white
                                        ${poseDetected ? "bg-emerald-500/80" : "bg-gray-700/80"}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${poseDetected ? "bg-white animate-pulse" : "bg-gray-400"}`}
                    />
                    {poseDetected ? "✓ Body Detected" : "No Body"}
                  </div>
                  {imgLoaded && (
                    <div
                      className="px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-300"
                      style={{ background: "rgba(16,185,129,0.2)" }}
                    >
                      ✓ Item Ready
                    </div>
                  )}
                </div>
              )}

              {/* Screenshot button */}
              {cameraOn && poseDetected && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={screenshot}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                  style={{ background: "rgba(0,0,0,0.75)" }}
                >
                  <Download className="w-3.5 h-3.5" /> Save
                </motion.button>
              )}

              {/* Stand back hint */}
              {cameraOn && !poseDetected && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <motion.div
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="px-4 py-2 rounded-xl text-sm text-white font-medium"
                    style={{ background: "rgba(0,0,0,0.8)" }}
                  >
                    👋 Step back — show full body from head to ankles
                  </motion.div>
                </div>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {(error || cameraError) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/30"
                  style={{ background: "rgba(239,68,68,0.1)" }}
                >
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error || cameraError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={cameraOn ? stopCamera : startCamera}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={
                  cameraOn
                    ? {
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171",
                      }
                    : {
                        background: "linear-gradient(135deg,#7c3aed,#db2777)",
                        boxShadow: "0 0 20px rgba(124,58,237,0.3)",
                        color: "white",
                      }
                }
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Loading...
                  </>
                ) : cameraOn ? (
                  <>
                    <CameraOff className="w-4 h-4" /> Stop AR
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Start AR
                  </>
                )}
              </motion.button>

              {[
                {
                  label: "Top",
                  state: showTop,
                  fn: toggleTop,
                  color: "#a78bfa",
                },
                {
                  label: "Bottom",
                  state: showBot,
                  fn: toggleBot,
                  color: "#f472b6",
                },
                {
                  label: "Skeleton",
                  state: showSkel,
                  fn: toggleSkel,
                  color: "#34d399",
                },
              ].map((btn) => (
                <motion.button
                  key={btn.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={btn.fn}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border"
                  style={{
                    background: btn.state
                      ? `${btn.color}18`
                      : "rgba(255,255,255,0.03)",
                    borderColor: btn.state
                      ? `${btn.color}50`
                      : "rgba(255,255,255,0.1)",
                    color: btn.state ? btn.color : "#6b7280",
                  }}
                >
                  {btn.state ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  {btn.label}
                </motion.button>
              ))}
            </div>

            {/* Step guide */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { n: "1", text: "Click Start AR", done: cameraOn || loading },
                { n: "2", text: "Show full body", done: poseDetected },
                {
                  n: "3",
                  text: "Item appears!",
                  done: poseDetected && imgLoaded,
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs transition-all
                                         ${s.done ? "border-emerald-500/30 text-emerald-400" : "border-white/8 text-gray-500"}`}
                  style={{
                    background: s.done
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                                        ${s.done ? "bg-emerald-500 text-white" : "bg-gray-800 text-gray-500"}`}
                  >
                    {s.done ? "✓" : s.n}
                  </span>
                  {s.text}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="flex flex-col gap-4">
            {/* Wearing Now — single item */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-white/8 glass p-5"
            >
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-4">
                Trying Now
              </p>

              {loadingItems ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              ) : !currentItem ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No items found.
                  <br />
                  Set up body profile first.
                </p>
              ) : (
                <>
                  {/* Single item image */}
                  <div
                    className="rounded-xl overflow-hidden border border-white/8 bg-white/5 mb-4"
                    style={{ aspectRatio: '2/3', minHeight: '280px' }}
                  >
                    <img
                      src={getImageUrl(currentItem.image)}
                      alt={currentItem.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain p-3"
                    />
                  </div>

                  {/* Category badge */}
                  <div className="mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                                            ${
                                              currentItem.category === "top"
                                                ? "bg-violet-600/20 text-violet-400"
                                                : currentItem.category ===
                                                    "bottom"
                                                  ? "bg-pink-600/20 text-pink-400"
                                                  : "bg-emerald-600/20 text-emerald-400"
                                            }`}
                    >
                      {currentItem.category === "top"
                        ? "👕"
                        : currentItem.category === "bottom"
                          ? "👖"
                          : "🧥"}{" "}
                      {currentItem.category}
                    </span>
                  </div>

                  {/* Item details */}
                  <div className="flex flex-col gap-1.5 mb-4">
                    {[
                      ["🏷️", currentItem.name],
                      ["🎨", currentItem.colors?.join(", ")],
                      ["💰", `₹${currentItem.price?.toLocaleString()}`],
                      ["🏪", currentItem.brand],
                      ["📐", currentItem.sizes?.join(" · ")],
                    ].map(
                      ([icon, val], i) =>
                        val && (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-gray-500">{icon}</span>
                            <span className="text-gray-300 text-right max-w-[70%] truncate">
                              {val}
                            </span>
                          </div>
                        ),
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelIdx(Math.max(0, selIdx - 1));
                        smoothRef.current = {};
                      }}
                      disabled={selIdx === 0}
                      className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </motion.button>
                    <span className="text-xs text-gray-500">
                      {selIdx + 1} / {items.length}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelIdx(Math.min(items.length - 1, selIdx + 1));
                        smoothRef.current = {};
                      }}
                      disabled={selIdx === items.length - 1}
                      className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>

            {/* All items thumbnails */}
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/8 glass p-4"
              >
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
                  All Items ({items.length})
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {items.map((item, i) => (
                    <ItemThumb
                      key={item.id || i}
                      item={item}
                      isSelected={selIdx === i}
                      onClick={(idx) => {
                        setSelIdx(idx);
                        smoothRef.current = {};
                      }}
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-violet-500/20 p-4"
              style={{ background: "rgba(139,92,246,0.05)" }}
            >
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3">
                💡 Best Results
              </p>
              <ul className="flex flex-col gap-2">
                {[
                  "Stand 1.5–2m from camera",
                  "Show full body head to ankle",
                  "Plain background works best",
                  "Good lighting is important",
                  "Enable Skeleton to verify detection",
                  'Wait for "Item Ready" badge',
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-400"
                  >
                    <span className="text-violet-500 flex-shrink-0 mt-0.5">
                      →
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
