import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Shuffle from "./bits/Shuffle";
import RotatingText from "./bits/RotatingText";

interface SplashAnimationProps {
  onComplete?: () => void;
}

// ── Timing ─────────────────────────────────────────────────────────────────
const DISPLAY_MS = 4000;
const EXIT_MS    = 520;

// ── App Design System (from index.css @theme) ───────────────────────────────
const FONT_HEADING = "'Poppins', ui-sans-serif, system-ui, sans-serif";
const FONT_BODY    = "'Inter', ui-sans-serif, system-ui, sans-serif";

const INK      = "#101010";
const GRAPHITE = "#242424";
const SLATE    = "#6b7280";
const SILVER   = "#e5e7eb";
const PAPER    = "#f4f4f4";
const EMERALD  = "#10b981";

// ── Easing ─────────────────────────────────────────────────────────────────
const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ── Building bars (flat 2D, GPU-only) ──────────────────────────────────────
const BARS = [
  { id: "a", delay: 0.10, h: 64,  w: 32, x: 0   },
  { id: "b", delay: 0.18, h: 104, w: 42, x: 40  },
  { id: "c", delay: 0.26, h: 158, w: 50, x: 90  },
  { id: "d", delay: 0.34, h: 218, w: 58, x: 149, flagship: true },
  { id: "e", delay: 0.42, h: 138, w: 46, x: 216 },
  { id: "f", delay: 0.50, h: 86,  w: 38, x: 271 },
  { id: "g", delay: 0.58, h: 56,  w: 30, x: 318 },
];

// ── Rotating motto phrases ──────────────────────────────────────────────────
const MOTTO_TEXTS = [
  "Find your land.",
  "Own your future.",
  "Live your legacy.",
  "Claim your territory.",
];

// ── Viewfinder corners ──────────────────────────────────────────────────────
const CORNERS: React.CSSProperties[] = [
  { top: 0,    left: 0,    borderTop: `2px solid ${EMERALD}`,    borderLeft: `2px solid ${EMERALD}` },
  { top: 0,    right: 0,   borderTop: `2px solid ${EMERALD}`,    borderRight: `2px solid ${EMERALD}` },
  { bottom: 0, left: 0,    borderBottom: `2px solid ${EMERALD}`, borderLeft: `2px solid ${EMERALD}` },
  { bottom: 0, right: 0,   borderBottom: `2px solid ${EMERALD}`, borderRight: `2px solid ${EMERALD}` },
];

/* ─── Subcomponents ─────────────────────────────────────────────────────── */

function Bar({ id, delay, h, w, flagship }: { id: string; delay: number; h: number; w: number; flagship?: boolean }) {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ delay, duration: 0.72, ease: EXPO }}
      style={{
        width: w, height: h,
        transformOrigin: "bottom",
        background: flagship
          ? `linear-gradient(180deg, ${GRAPHITE} 0%, ${INK} 100%)`
          : `linear-gradient(180deg, ${SILVER} 0%, #94a3b8 100%)`,
        borderTop: flagship ? `2px solid ${EMERALD}` : "1px solid rgba(16,16,16,0.1)",
        willChange: "transform, opacity",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: flagship
          ? "repeating-linear-gradient(0deg, transparent 0, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 12px)"
          : "repeating-linear-gradient(0deg, transparent 0, transparent 10px, rgba(16,16,16,0.04) 10px, rgba(16,16,16,0.04) 12px)",
      }} />
      {flagship && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.1, duration: 0.4, ease: EXPO }}
          style={{
            position: "absolute", bottom: "100%",
            left: "50%", transform: "translateX(-50%)",
            width: 2, height: 20,
            background: EMERALD, transformOrigin: "bottom",
            boxShadow: `0 0 8px ${EMERALD}`, willChange: "transform",
          }}
        />
      )}
    </motion.div>
  );
}

function Skyline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EXPO }}
      style={{ position: "relative", width: 348, height: 230, margin: "0 auto", willChange: "transform, opacity" }}
    >
      {BARS.map(b => (
        <div key={b.id} style={{ position: "absolute", left: b.x, bottom: 0, width: b.w, height: b.h }}>
          <Bar {...b} />
        </div>
      ))}
      {/* Scan line sweeping down over the skyline */}
      <motion.div
        initial={{ top: 0, opacity: 0 }}
        animate={{ top: "100%", opacity: [0, 0.7, 0] }}
        transition={{ delay: 0.65, duration: 1.0, ease: "easeInOut" }}
        style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${EMERALD}, transparent)`,
          willChange: "top, opacity",
        }}
      />
      {/* Ground rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.75, duration: 0.65, ease: EXPO }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 1.5,
          background: `linear-gradient(90deg, transparent, ${INK}, transparent)`,
          transformOrigin: "center", opacity: 0.12, willChange: "transform",
        }}
      />
    </motion.div>
  );
}

/** Rotating motto using RotatingText — fades in at delay via wrapper */
function MottoRotator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.55, ease: EXPO }}
      style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        marginTop: 18, height: 28,
        willChange: "transform, opacity",
      }}
    >
      <RotatingText
        texts={MOTTO_TEXTS}
        rotationInterval={1300}
        splitBy="characters"
        staggerFrom="last"
        staggerDuration={0.025}
        initial={{ y: "110%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-110%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        loop={true}
        auto={true}
        mainClassName=""
        elementLevelClassName=""
        style={{
          fontFamily: FONT_BODY,
          fontSize: "clamp(13px, 2.2vw, 15px)",
          fontWeight: 500,
          color: SLATE,
          letterSpacing: "0.01em",
          overflow: "hidden",
        }}
      />
    </motion.div>
  );
}

/** TERRITORY wordmark using GSAP Shuffle for slot-machine reveal */
function ShuffleWordmark() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.55, duration: 0.01 }} // make visible just before Shuffle fires
      style={{ marginTop: 22, overflow: "hidden", willChange: "opacity" }}
    >
      <Shuffle
        text="TERRITORY"
        tag="h1"
        shuffleDirection="up"
        duration={0.38}
        shuffleTimes={3}
        animationMode="evenodd"
        stagger={0.032}
        ease="power3.out"
        triggerOnHover={true}
        triggerOnce={false}
        respectReducedMotion={true}
        // Mount-mode: fire 1.6s into the splash without needing scroll
        playOnMount={true}
        playDelay={1.6}
        colorFrom={SLATE}
        colorTo={INK}
        style={{
          fontFamily: FONT_HEADING,
          fontSize: "clamp(40px, 9vw, 72px)",
          fontWeight: 700,
          letterSpacing: "0.2em",
          lineHeight: 1,
          color: INK,
          textAlign: "center",
          margin: 0,
          padding: 0,
        }}
      />
    </motion.div>
  );
}

/** Emerald divider sweep */
function Divider() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.65, ease: EXPO }}
      style={{
        height: 1.5,
        width: "min(280px, 58vw)",
        background: `linear-gradient(90deg, transparent, ${EMERALD}, transparent)`,
        transformOrigin: "center",
        boxShadow: `0 0 8px rgba(16,185,129,0.25)`,
        margin: "12px auto 0",
        willChange: "transform, opacity",
      }}
    />
  );
}

/** Tagline using Inter */
function Tagline() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 0.6, y: 0 }}
      transition={{ delay: 2.7, duration: 0.55, ease: EXPO }}
      style={{
        fontFamily: FONT_BODY,
        fontSize: "clamp(8px, 1.8vw, 10px)",
        fontWeight: 500,
        letterSpacing: "0.5em",
        textTransform: "uppercase",
        color: SLATE,
        marginTop: 10,
        willChange: "transform, opacity",
      }}
    >
      own · the · land · you · deserve
    </motion.p>
  );
}

/** Viewfinder bracket corners that shrink into frame */
function ViewfinderCorners() {
  const SIZE = 22;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2.6, duration: 0.65, ease: EXPO }}
      style={{
        position: "absolute",
        inset: 0, margin: "auto",
        width: "min(500px, 86vw)",
        height: "min(460px, 80vh)",
        pointerEvents: "none",
        willChange: "transform, opacity",
      }}
    >
      {CORNERS.map((corner, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: SIZE, height: SIZE,
            borderStyle: "solid",
            borderWidth: 0,
            ...corner,
          }}
        />
      ))}
    </motion.div>
  );
}

/** Thin progress bar crawling across the bottom */
function ProgressBar() {
  return (
    <motion.div
      style={{
        position: "absolute", bottom: 0, left: 0,
        height: 2,
        background: `linear-gradient(90deg, ${EMERALD}, #047857)`,
        willChange: "width",
        transformOrigin: "left",
      }}
      initial={{ width: "0%" }}
      animate={{ width: "100%" }}
      transition={{ duration: DISPLAY_MS / 1000, ease: "linear" }}
    />
  );
}

/** Dot grid background */
function DotGrid() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `radial-gradient(${SILVER} 1px, transparent 1px)`,
      backgroundSize: "28px 28px",
      opacity: 0.55,
      maskImage: "radial-gradient(circle at center, black 15%, transparent 72%)",
      WebkitMaskImage: "radial-gradient(circle at center, black 15%, transparent 72%)",
      pointerEvents: "none",
    }} />
  );
}

/** Centre ambient glow */
function GlowOrb() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 0.38, scale: 1 }}
      transition={{ duration: 1.3, ease: "easeOut" }}
      style={{
        position: "absolute",
        width: "min(580px, 90vw)", height: "min(580px, 90vw)",
        background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(244,244,244,0) 70%)",
        filter: "blur(32px)",
        pointerEvents: "none",
        willChange: "transform, opacity",
      }}
    />
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */
export default function SplashAnimation({ onComplete }: SplashAnimationProps) {
  const [visible, setVisible] = useState(true);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) { setVisible(false); onComplete?.(); return; }
    const t1 = setTimeout(() => setVisible(false), DISPLAY_MS);
    const t2 = setTimeout(() => onComplete?.(), DISPLAY_MS + EXIT_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete, prefersReduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="territory-splash-root"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.52, ease: EXPO }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            backgroundColor: PAPER,
            overflow: "hidden", userSelect: "none", touchAction: "none",
            transform: "translateZ(0)",
            willChange: "opacity, transform",
          }}
        >
          <DotGrid />
          <GlowOrb />
          <ViewfinderCorners />

          {/* Content stack */}
          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", flexDirection: "column",
            alignItems: "center", width: "100%", padding: "0 24px",
          }}>
            <Skyline />
            <MottoRotator />
            <ShuffleWordmark />
            <Divider />
            <Tagline />
          </div>

          <ProgressBar />
        </motion.div>
      )}
    </AnimatePresence>
  );
}