import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- TypeScript Interfaces ---
interface SplashAnimationProps {
  onComplete?: () => void;
}

interface BuildingData {
  id: string;
  x: number;
  w: number;
  h: number;
  delay: number;
  tone: string;
  accent?: boolean;
  flagship?: boolean;
}

interface PlotCorner {
  id: string;
  pos: { top?: number; bottom?: number; left?: number; right?: number };
}

interface LogoLetter {
  id: string;
  ch: string;
}

const DURATION_MS = 2800;
const EXIT_MS = 550;

const PALETTE = {
  obsidian: "#e6e6ea",  // Clean luxury liquid matte silver background
  ink: "#cbd5e1",       // Structural backing plate color
  gold: "#c59b27",      // Deep burnished gold accents for legibility on light silver
  emerald: "#16a34a",   // Vibrant premium green
  bone: "#111116",      // Converted to deep midnight charcoal for ultra-sharp typography contrast
};

const BUILDINGS: BuildingData[] = [
  { id: "b-l3", x: -220, w: 46, h: 90,  delay: 0.15, tone: "#cbd5e1" },
  { id: "b-l2", x: -170, w: 54, h: 140, delay: 0.25, tone: "#b8c4d4" },
  { id: "b-l1", x: -110, w: 62, h: 200, delay: 0.35, tone: "#a3b2c6", accent: true },
  { id: "b-flagship", x: -42,  w: 70, h: 260, delay: 0.45, tone: "#8e9fb4", flagship: true },
  { id: "b-r1", x: 40,   w: 58, h: 175, delay: 0.55, tone: "#9eb0c5" },
  { id: "b-r2", x: 108,  w: 50, h: 120, delay: 0.65, tone: "#b0bfd2" },
  { id: "b-r3", x: 168,  w: 46, h: 95,  delay: 0.75, tone: "#c2cedc" },
];

const LOGO_LETTERS: LogoLetter[] = [
  { id: "L0", ch: "T" }, { id: "L1", ch: "E" }, { id: "L2", ch: "R" },
  { id: "L3", ch: "R" }, { id: "L4", ch: "I" }, { id: "L5", ch: "T" },
  { id: "L6", ch: "O" }, { id: "L7", ch: "R" }, { id: "L8", ch: "Y" },
];

const PLOT_CORNERS: PlotCorner[] = [
  { id: "tl", pos: { top: -6, left: -6 } },
  { id: "tr", pos: { top: -6, right: -6 } },
  { id: "bl", pos: { bottom: -6, left: -6 } },
  { id: "br", pos: { bottom: -6, right: -6 } },
];

const HUD_FONT = "'JetBrains Mono', ui-monospace, monospace";
const DISPLAY_FONT = "'Playfair Display', 'Cormorant Garamond', Georgia, serif";
const MONO_FONT = "'Inter Tight', 'Helvetica Neue', system-ui, sans-serif";
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/* ---------------- Sub-components ---------------- */

function Backdrop() {
  return (
    <>
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(circle at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute pointer-events-none"
        style={{
          width: "140vw",
          height: "140vw",
          maxWidth: 720,
          maxHeight: 720,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(212,162,76,0.02) 60%)",
          filter: "blur(20px)",
        }}
      />
    </>
  );
}

function TerritoryPlot() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, z: -30 }}
      animate={{ opacity: 1, scale: 1, z: -30 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="absolute left-1/2 top-[62%]"
      style={{
        width: 380,
        height: 180,
        x: "-50%",
        y: "-50%",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 60%, #cbd5e1 100%)",
        border: "1px solid rgba(197,155,39,0.3)",
        boxShadow:
          "0 30px 60px rgba(15,23,42,0.08), inset 0 0 40px rgba(255,255,255,0.6)",
        transformStyle: "preserve-3d",
      }}
    >
      {PLOT_CORNERS.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.08, duration: 0.35 }}
          className="absolute"
          style={{
            ...c.pos,
            width: 14,
            height: 14,
            border: `2px solid ${PALETTE.gold}`,
            borderRadius: 2,
          }}
        />
      ))}
    </motion.div>
  );
}

function Building({ b }: { b: BuildingData }) {
  const borderTop = b.flagship
    ? `2px solid ${PALETTE.gold}`
    : b.accent
    ? `2px solid ${PALETTE.emerald}`
    : "1px solid rgba(197,155,39,0.25)";

  return (
    <motion.div
      initial={{ y: 300, opacity: 0, scaleY: 0.2 }}
      animate={{ y: 0, opacity: 1, scaleY: 1 }}
      transition={{ delay: b.delay, duration: 0.9, ease: EASE_OUT_EXPO }}
      className="absolute bottom-0"
      style={{
        left: b.x,
        width: b.w,
        height: b.h,
        background: `linear-gradient(180deg, ${b.tone} 0%, #94a3b8 100%)`,
        border: "1px solid rgba(0,0,0,0.06)",
        borderTop,
        transformOrigin: "bottom",
        boxShadow:
          "0 15px 25px rgba(15,23,42,0.1), inset 1px 0 0 rgba(255,255,255,0.2)",
      }}
    >
      <div
        className="w-full h-full opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 10px, rgba(255,255,255,0.4) 10px, rgba(255,255,255,0.4) 12px), repeating-linear-gradient(90deg, transparent 0, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 10px)",
        }}
      />
      {b.flagship && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="absolute left-1/2 -top-6 -translate-x-1/2"
          style={{
            width: 2,
            height: 24,
            background: PALETTE.gold,
            transformOrigin: "bottom",
            boxShadow: `0 0 8px ${PALETTE.gold}`,
          }}
        />
      )}
    </motion.div>
  );
}

function Skyline() {
  return (
    <motion.div
      initial={{ z: 30 }}
      animate={{ z: 30 }}
      className="absolute left-1/2 top-[62%]"
      style={{ x: "-50%", y: "-100%", transformStyle: "preserve-3d" }}
    >
      {BUILDINGS.map((b) => <Building key={b.id} b={b} />)}
    </motion.div>
  );
}

function LightBeam() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -400 }}
      animate={{ opacity: [0, 0.4, 0], x: 400 }}
      transition={{ delay: 1.4, duration: 1.1, ease: "easeInOut" }}
      className="absolute left-1/2 top-[10%] -translate-x-1/2"
      style={{
        width: 240,
        height: 320,
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
        filter: "blur(14px)",
        transform: "rotate(18deg)",
      }}
    />
  );
}

function IsometricStage() {
  return (
    /* Responsive Scale Container: Scales down proportionally on small mobile widths */
    <div 
      className="relative scale-[0.60] xs:scale-[0.75] sm:scale-90 md:scale-100 transition-transform duration-300 origin-center" 
      style={{ width: 560, height: 380, perspective: 1200 }}
    >
      <motion.div
        initial={{ rotateX: 55, rotateZ: -35, y: 40, opacity: 0 }}
        animate={{ rotateX: 32, rotateZ: -18, y: 0, opacity: 1 }}
        transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.05 }}
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        <TerritoryPlot />
        <Skyline />
        <LightBeam />
      </motion.div>
    </div>
  );
}

function Logotype() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[14%] sm:bottom-[18%] flex flex-col items-center w-full px-4 text-center">
      <div className="flex items-end justify-center w-full max-w-full overflow-visible" style={{ perspective: 900 }}>
        {LOGO_LETTERS.map((l, i) => (
          <motion.span
            key={l.id}
            data-testid={`territory-letter-${i}`}
            initial={{ opacity: 0, y: 30, rotateX: -90, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            transition={{ delay: 1.15 + i * 0.055, duration: 0.65, ease: EASE_OUT_EXPO }}
            /* Font size scales responsively to avoid clipping on mobile viewports */
            className="text-[32px] xs:text-[42px] sm:text-[56px] md:text-[68px] tracking-[0.16em] sm:tracking-[0.22em]"
            style={{
              display: "inline-block",
              lineHeight: 1,
              color: PALETTE.bone,
              fontWeight: 500,
              textShadow: "0 4px 16px rgba(15,23,42,0.06)",
              transformStyle: "preserve-3d",
              marginRight: i === LOGO_LETTERS.length - 1 ? 0 : 1,
              fontFamily: DISPLAY_FONT,
            }}
          >
            {l.ch}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.7, ease: "easeOut" }}
        className="mt-3 sm:mt-4 w-[160px] sm:w-[260px]"
        style={{
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${PALETTE.gold}, transparent)`,
          transformOrigin: "center",
          boxShadow: "0 0 8px rgba(197,155,39,0.3)",
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.05, duration: 0.6 }}
        data-testid="territory-tagline"
        className="mt-3 sm:mt-4 uppercase text-[7.5px] xs:text-[9px] sm:text-[10px] tracking-[0.25em] xs:tracking-[0.4em] sm:tracking-[0.5em] font-semibold"
        style={{
          fontFamily: MONO_FONT,
          color: PALETTE.gold,
        }}
      >
        own&nbsp;·&nbsp;the&nbsp;·&nbsp;land&nbsp;·&nbsp;you&nbsp;·&nbsp;deserve
      </motion.p>
    </div>
  );
}

function HudOverlay() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase"
        style={{ color: PALETTE.gold, fontFamily: HUD_FONT }}
      >
        <div>lat&nbsp;·&nbsp;40.7128°N</div>
        <div className="mt-0.5 sm:mt-1">lng&nbsp;·&nbsp;40.0060°W</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-right"
        style={{ color: PALETTE.bone, fontFamily: HUD_FONT }}
      >
        <div>est.&nbsp;2026</div>
        <div className="mt-0.5 sm:mt-1" style={{ color: PALETTE.emerald }}>● live&nbsp;market</div>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 2.2, ease: "linear" }}
        className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6"
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${PALETTE.gold} 0%, ${PALETTE.bone} 50%, transparent 100%)`,
          transformOrigin: "left",
          opacity: 0.15,
        }}
      />
    </>
  );
}

/* ---------------- Main component ---------------- */

export default function SplashAnimation({ onComplete }: SplashAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), DURATION_MS);
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, DURATION_MS + EXIT_MS);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="territory-splash-root"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
          transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none touch-none"
          style={{ backgroundColor: PALETTE.obsidian, fontFamily: DISPLAY_FONT }}
        >
          <Backdrop />
          <IsometricStage />
          <Logotype />
          <HudOverlay />
        </motion.div>
      )}
    </AnimatePresence>
  );
}