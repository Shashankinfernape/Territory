import React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Shuffle from "./bits/Shuffle";

interface SplashAnimationProps {
  onComplete?: () => void;
}

// ── Timing ──────────────────────────────────────────────────────────────────
// Total splash: buildings(0–0.8s) → pause → Shuffle fires(1.4s) → settle(2.4s) → exit(3.4s)
const DISPLAY_MS = 3400;
const EXIT_MS    = 500;

// ── App Design System (from index.css @theme) ────────────────────────────────
const FONT_HEADING = "'Poppins', ui-sans-serif, system-ui, sans-serif";
const FONT_BODY    = "'Inter', ui-sans-serif, system-ui, sans-serif";

const INK      = "#101010";
const GRAPHITE = "#242424";
const SLATE    = "#6b7280";
const SILVER   = "#e5e7eb";
const PAPER    = "#f4f4f4";
const EMERALD  = "#10b981";

// ── Easing ───────────────────────────────────────────────────────────────────
const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ── Building bars ────────────────────────────────────────────────────────────
const BARS = [
  { id: "a", delay: 0.10, h: 64,  w: 32, x: 0   },
  { id: "b", delay: 0.18, h: 104, w: 42, x: 40  },
  { id: "c", delay: 0.26, h: 158, w: 50, x: 90  },
  { id: "d", delay: 0.34, h: 218, w: 58, x: 149, flagship: true },
  { id: "e", delay: 0.42, h: 138, w: 46, x: 216 },
  { id: "f", delay: 0.50, h: 86,  w: 38, x: 271 },
  { id: "g", delay: 0.58, h: 56,  w: 30, x: 318 },
];

// ── Viewfinder corners ───────────────────────────────────────────────────────
const CORNERS: React.CSSProperties[] = [
  { top: 0,    left: 0,    borderTop: `2px solid ${EMERALD}`,    borderLeft: `2px solid ${EMERALD}` },
  { top: 0,    right: 0,   borderTop: `2px solid ${EMERALD}`,    borderRight: `2px solid ${EMERALD}` },
  { bottom: 0, left: 0,    borderBottom: `2px solid ${EMERALD}`, borderLeft: `2px solid ${EMERALD}` },
  { bottom: 0, right: 0,   borderBottom: `2px solid ${EMERALD}`, borderRight: `2px solid ${EMERALD}` },
];

/* ─── Subcomponents ──────────────────────────────────────────────────────── */

function Bar({ id, delay, h, w, flagship }: { id: string; delay: number; h: number; w: number; flagship?: boolean }) {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ delay, duration: 0.65, ease: EXPO }}
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
          transition={{ delay: 0.95, duration: 0.4, ease: EXPO }}
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

/** Skyline — all bars rise, then a single scan line sweeps once */
function Skyline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EXPO }}
      style={{ position: "relative", width: 348, height: 230, margin: "0 auto", willChange: "transform, opacity" }}
    >
      {BARS.map(b => (
        <div key={b.id} style={{ position: "absolute", left: b.x, bottom: 0, width: b.w, height: b.h }}>
          <Bar {...b} />
        </div>
      ))}
      {/* One scan line, fires after all bars are up, then gone */}
      <motion.div
        initial={{ top: 0, opacity: 0 }}
        animate={{ top: "100%", opacity: [0, 0.65, 0] }}
        transition={{ delay: 0.75, duration: 0.85, ease: "easeInOut" }}
        style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${EMERALD}, transparent)`,
          willChange: "top, opacity",
          pointerEvents: "none",
        }}
      />
      {/* Ground rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.72, duration: 0.6, ease: EXPO }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 1.5,
          background: `linear-gradient(90deg, transparent, ${INK}, transparent)`,
          transformOrigin: "center", opacity: 0.12, willChange: "transform",
        }}
      />
    </motion.div>
  );
}

/**
 * TERRITORY wordmark using GSAP Shuffle.
 * This is THE single animated text on screen.
 * Fires at 1.4s — after the skyline is fully settled and quiet.
 * The user's full attention is on this word as it reveals.
 */
function ShuffleWordmark() {
  return (
    /* Wrapper fades in just before Shuffle fires, so visibility:hidden → visible is seamless */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.38, duration: 0.01 }}
      style={{ marginTop: 26, willChange: "opacity" }}
    >
      <Shuffle
        text="TERRITORY"
        tag="h1"
        shuffleDirection="up"
        duration={0.42}
        shuffleTimes={3}
        animationMode="evenodd"
        stagger={0.036}
        ease="power3.out"
        triggerOnHover={true}
        triggerOnce={false}
        respectReducedMotion={true}
        playOnMount={true}
        playDelay={1.4}         // fires 1.4 s after mount — skyline is done
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

/** Static one-liner app motto — fades in calmly after Shuffle completes */
function Motto() {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 0.65, y: 0 }}
      // Shuffling 9 letters at stagger 0.036 ≈ 0.42s duration + small buffer → ~2.3s total
      transition={{ delay: 2.4, duration: 0.6, ease: EXPO }}
      style={{
        fontFamily: FONT_BODY,
        fontSize: "clamp(11px, 2vw, 13px)",
        fontWeight: 400,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: SLATE,
        marginTop: 12,
        willChange: "transform, opacity",
      }}
    >
      Find it.&nbsp;&nbsp;Own it.&nbsp;&nbsp;Live it.
    </motion.p>
  );
}

/** Emerald divider — appears after Shuffle and motto are both settled */
function Divider() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ delay: 2.65, duration: 0.55, ease: EXPO }}
      style={{
        height: 1.5,
        width: "min(260px, 55vw)",
        background: `linear-gradient(90deg, transparent, ${EMERALD}, transparent)`,
        transformOrigin: "center",
        boxShadow: `0 0 8px rgba(16,185,129,0.2)`,
        margin: "14px auto 0",
        willChange: "transform, opacity",
      }}
    />
  );
}

/** Viewfinder corners — appear last, frame the whole composition */
function ViewfinderCorners() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2.8, duration: 0.6, ease: EXPO }}
      style={{
        position: "absolute",
        inset: 0, margin: "auto",
        width: "min(480px, 84vw)",
        height: "min(440px, 78vh)",
        pointerEvents: "none",
        willChange: "transform, opacity",
      }}
    >
      {CORNERS.map((corner, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 20, height: 20,
            borderStyle: "solid",
            borderWidth: 0,
            ...corner,
          }}
        />
      ))}
    </motion.div>
  );
}

/** Progress bar — real-time sense of completion */
function ProgressBar() {
  return (
    <motion.div
      style={{
        position: "absolute", bottom: 0, left: 0,
        height: 2,
        background: `linear-gradient(90deg, ${EMERALD}, #047857)`,
        willChange: "width",
      }}
      initial={{ width: "0%" }}
      animate={{ width: "100%" }}
      transition={{ duration: DISPLAY_MS / 1000, ease: "linear" }}
    />
  );
}

function DotGrid() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `radial-gradient(${SILVER} 1px, transparent 1px)`,
      backgroundSize: "28px 28px",
      opacity: 0.5,
      maskImage: "radial-gradient(circle at center, black 15%, transparent 70%)",
      WebkitMaskImage: "radial-gradient(circle at center, black 15%, transparent 70%)",
      pointerEvents: "none",
    }} />
  );
}

function GlowOrb() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 0.35, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      style={{
        position: "absolute",
        width: "min(560px, 88vw)", height: "min(560px, 88vw)",
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
    const isMinimal = localStorage.getItem('propit_animation_setting') === 'minimal' || !localStorage.getItem('propit_animation_setting');
    if (prefersReduced || isMinimal) { setVisible(false); onComplete?.(); return; }
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.4, 0, 1, 1] }}
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

          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", flexDirection: "column",
            alignItems: "center", width: "100%", padding: "0 24px",
          }}>
            <Skyline />
            <ShuffleWordmark />
            <Motto />
            <Divider />
          </div>

          <ProgressBar />
        </motion.div>
      )}
    </AnimatePresence>
  );
}