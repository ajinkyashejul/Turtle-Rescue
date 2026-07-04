import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Skull } from "lucide-react";

// All creatures are hand-drawn SVGs sharing one style: soft radial gradients,
// deep outline strokes, a white specular highlight, and eyes with glints.

const svgFx = { transformBox: "fill-box", transformOrigin: "center" } as const;

// ---------------------------------------------------------------------------
// TurtleSprite — the hatchling.
//
// Designed as a CHARACTER, not a diagram: a chibi baby sea turtle in a hero
// 3/4 view with baby proportions (big head, huge eyes), a glossy just-hatched
// shell, and little paddle-arms. It never spins — it always faces the player.
// Lateral moves flip it horizontally; forward moves make it stretch and paddle
// eagerly. All the charm (the face) stays pointed at the viewer at all times.
// ---------------------------------------------------------------------------
export const TurtleSprite = ({
  isInShell,
  isDead,
  row,
  col,
}: {
  isInShell: boolean;
  isDead: boolean;
  row: number;
  col: number;
}) => {
  const [isCrawling, setIsCrawling] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [lunge, setLunge] = useState(0); // -1 = moving up/forward, 1 = down
  const prevPos = useRef({ row, col });
  const uid = useRef(`h${Math.floor(row * 7 + col)}`);
  const u = uid.current;

  useEffect(() => {
    if (prevPos.current.row !== row || prevPos.current.col !== col) {
      const dx = col - prevPos.current.col;
      const dy = row - prevPos.current.row;
      if (dx !== 0) setFacing(dx > 0 ? 1 : -1);
      setLunge(dy < 0 ? -1 : dy > 0 ? 1 : 0);
      setIsCrawling(true);
      const timer = setTimeout(() => setIsCrawling(false), 900);
      prevPos.current = { row, col };
      return () => clearTimeout(timer);
    }
  }, [row, col]);

  // Skin (head + flippers) vs shell palettes; both swap to browns when hiding.
  const skinLight = "#bff2c4", skinDark = "#5ecb83";
  const seam = isInShell ? "#3a271a" : "#0c5a2b";

  // Front paddle-arm — reaches up and out, strokes when crawling.
  const armAnim = (dir: 1 | -1) =>
    isCrawling
      ? { rotate: [dir * -6, dir * 26, dir * -6], transition: { duration: 0.3, repeat: Infinity } }
      : { rotate: [0, dir * 8, 0], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } };

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      animate={{
        y: isCrawling ? [0, -3, 0] : [0, -1.2, 0],
        rotate: isCrawling ? [-4, 4, -4] : 0,
      }}
      transition={{
        y: { duration: isCrawling ? 0.3 : 2.6, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 0.3, repeat: isCrawling ? 3 : 0 },
      }}
    >
      <motion.div
        className={`relative w-16 h-16 flex items-center justify-center transition-all duration-500
          ${isInShell ? "scale-[0.62] sm:scale-[0.78]" : "scale-[0.82] sm:scale-100"}
          ${isDead ? "grayscale opacity-40" : ""}`}
        animate={{ scaleX: facing, rotate: isDead ? 180 : 0 }}
        transition={{ scaleX: { type: "spring", stiffness: 300, damping: 20 } }}
        style={{ transformOrigin: "center" }}
      >
        {!isDead && (
          <div className="absolute bottom-1.5 w-10 h-3 bg-black/25 rounded-full blur-md -z-10" />
        )}

        <motion.svg
          viewBox="0 0 64 64"
          className="w-[52px] h-[52px] drop-shadow-md"
          animate={{ scaleY: isCrawling && lunge === -1 ? [1, 1.06, 1] : 1 }}
          transition={{ duration: 0.3, repeat: isCrawling ? 3 : 0 }}
        >
          <defs>
            <radialGradient id={`${u}-shell`} cx="38%" cy="26%" r="82%">
              <stop offset="0%" stopColor={isInShell ? "#cda98a" : "#5fe39a"} />
              <stop offset="52%" stopColor={isInShell ? "#8a6448" : "#28b463"} />
              <stop offset="100%" stopColor={isInShell ? "#553a28" : "#0f8a40"} />
            </radialGradient>
            <linearGradient id={`${u}-plate`} x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor={isInShell ? "#c19a7d" : "#7dedad"} stopOpacity="0.85" />
              <stop offset="100%" stopColor={isInShell ? "#6f4c34" : "#1c9c4c"} stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id={`${u}-skin`} x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor={skinLight} />
              <stop offset="100%" stopColor={skinDark} />
            </linearGradient>
          </defs>

          {/* Back flippers (little feet) */}
          {!isInShell && (
            <g fill={`url(#${u}-skin)`} stroke={seam} strokeWidth="1.4" strokeLinejoin="round">
              <path d="M24 52 Q19 56 21.5 60 Q25 60.5 27 55 Z" />
              <path d="M40 52 Q45 56 42.5 60 Q39 60.5 37 55 Z" />
            </g>
          )}

          {/* Shell dome */}
          <path
            d="M13 44 Q13 25 32 25 Q51 25 51 44 Q51 55 32 55 Q13 55 13 44 Z"
            fill={`url(#${u}-shell)`}
            stroke={seam}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Bold scute seams — few, readable at small size */}
          <g stroke={seam} strokeWidth="1.3" opacity="0.55" fill="none" strokeLinecap="round">
            <path d="M22 33 Q32 28 42 33" />
            <path d="M32 27 L32 54" />
            <path d="M22 33 L15.5 46" />
            <path d="M42 33 L48.5 46" />
            <path d="M15 47 Q32 52 49 47" />
          </g>
          {/* Central highlight plate + gloss */}
          <ellipse cx="24" cy="34" rx="6.5" ry="4.2" fill="white" opacity="0.4" transform="rotate(-24 24 34)" />
          {/* Just-hatched sparkle */}
          {!isInShell && (
            <path d="M45 30 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1 Z" fill="white" opacity="0.75" />
          )}

          {!isInShell && (
            <>
              {/* Front paddle-arms */}
              <motion.path
                d="M20 42 Q7 40 4 31 Q3 26 8 28 Q18 32 22 40 Z"
                fill={`url(#${u}-skin)`} stroke={seam} strokeWidth="1.5" strokeLinejoin="round"
                style={{ transformBox: "fill-box", transformOrigin: "90% 90%" }} animate={armAnim(-1)}
              />
              <motion.path
                d="M44 42 Q57 40 60 31 Q61 26 56 28 Q46 32 42 40 Z"
                fill={`url(#${u}-skin)`} stroke={seam} strokeWidth="1.5" strokeLinejoin="round"
                style={{ transformBox: "fill-box", transformOrigin: "10% 90%" }} animate={armAnim(1)}
              />

              {/* Big baby head */}
              <motion.g
                animate={isCrawling ? { y: [0, -1.5, 0], transition: { duration: 0.3, repeat: Infinity } } : {}}
              >
                <circle cx="32" cy="18" r="10.5" fill={`url(#${u}-skin)`} stroke={seam} strokeWidth="1.9" />
                {/* Head speckles */}
                <circle cx="27" cy="10" r="0.8" fill="#eafbe4" opacity="0.7" />
                <circle cx="36" cy="10.5" r="0.7" fill="#eafbe4" opacity="0.7" />
                <circle cx="32" cy="8.5" r="0.6" fill="#eafbe4" opacity="0.6" />
                {/* Huge eyes */}
                <circle cx="26.6" cy="17.5" r="3.6" fill="#152018" />
                <circle cx="37.4" cy="17.5" r="3.6" fill="#152018" />
                <circle cx="27.9" cy="16" r="1.35" fill="white" />
                <circle cx="38.7" cy="16" r="1.35" fill="white" />
                <circle cx="25.6" cy="18.9" r="0.7" fill="white" opacity="0.85" />
                <circle cx="36.4" cy="18.9" r="0.7" fill="white" opacity="0.85" />
                {/* Rosy cheeks */}
                <ellipse cx="22.5" cy="21.5" rx="2.1" ry="1.3" fill="#fb7185" opacity="0.55" />
                <ellipse cx="41.5" cy="21.5" rx="2.1" ry="1.3" fill="#fb7185" opacity="0.55" />
                {/* Smile */}
                <path d="M29 22.5 Q32 25.5 35 22.5" fill="none" stroke={seam} strokeWidth="1.3" strokeLinecap="round" />
              </motion.g>
            </>
          )}

          {isInShell && (
            /* Tucked in: just the shell, with a dark opening where the head was */
            <ellipse cx="32" cy="27" rx="7" ry="4" fill="#000" opacity="0.35" />
          )}
        </motion.svg>

        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center z-30" style={{ transform: "rotate(180deg)" }}>
            <Skull className="w-6 h-6 text-red-900/50" />
          </div>
        )}
        {isInShell && (
          <div className="absolute -top-1 -right-1 bg-[#5d4037] text-white text-[8px] px-1 rounded-full font-bold uppercase tracking-tighter shadow-sm border border-white/20 z-30">
            Shell
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export const FlyingBird = ({
  isShadow = false,
  isHunter = false,
}: {
  isShadow?: boolean;
  isHunter?: boolean;
}) => {
  const uid = useRef(`b${isHunter ? "h" : "n"}${isShadow ? "s" : ""}`);
  const u = uid.current;
  const stroke = isShadow ? "black" : isHunter ? "#7c2d12" : "#5b6b7c";
  const bodyFill = isShadow ? "black" : `url(#${u}-body)`;
  const wingFill = isShadow ? "black" : `url(#${u}-wing)`;

  const flap = {
    animate: { rotateX: [0, 62, 0], y: [0, 4, 0] },
    transition: { duration: 0.34, repeat: Infinity, ease: "easeInOut" as const },
  };

  return (
    <div className={`relative ${isShadow ? "opacity-25 blur-[2px] grayscale brightness-0" : "drop-shadow-lg"}`}>
      <motion.svg viewBox="0 0 100 64" className={`${isShadow ? "w-16 h-10" : "w-24 h-16"}`}>
        <defs>
          <linearGradient id={`${u}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isHunter ? "#fff7ed" : "#ffffff"} />
            <stop offset="100%" stopColor={isHunter ? "#fdba74" : "#c3cede"} />
          </linearGradient>
          <linearGradient id={`${u}-wing`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isHunter ? "#fed7aa" : "#eef2f7"} />
            <stop offset="100%" stopColor={isHunter ? "#ea9d3a" : "#8a9bb0"} />
          </linearGradient>
        </defs>

        {/* Tail */}
        <path d="M28 32 L14 39 L20 32 L14 25 Z" fill={wingFill} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />

        {/* Body */}
        <path d="M24 32 Q46 18 72 30 Q54 44 28 36 Z" fill={bodyFill} stroke={stroke} strokeWidth="1.4" />
        {/* Belly shading */}
        {!isShadow && <path d="M30 34 Q46 40 66 33 Q52 42 32 37 Z" fill="#000" opacity="0.06" />}

        {/* Far wing (behind) */}
        <motion.path
          d="M52 27 Q40 6 22 12 Q34 16 42 24 Q30 22 20 26 Q38 30 52 27"
          fill={wingFill} stroke={stroke} strokeWidth="1.2"
          {...flap}
          style={{ originY: "27px", originX: "52px", opacity: 0.85 }}
        />
        {/* Near wing (front) */}
        <motion.path
          d="M50 27 Q66 4 86 14 Q72 18 62 26 Q76 24 88 30 Q68 32 50 27"
          fill={wingFill} stroke={stroke} strokeWidth="1.3"
          {...flap}
          style={{ originY: "27px", originX: "50px" }}
        />

        {/* Head */}
        <circle cx="74" cy="29" r="6.5" fill={bodyFill} stroke={stroke} strokeWidth="1.3" />
        {/* Beak */}
        <path d="M79 27 L91 30 L79 33 Z" fill={isShadow ? "black" : isHunter ? "#f97316" : "#f2a53b"} stroke={isShadow ? "black" : "#b45309"} strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M84 30.5 L91 30 L84 31.6 Z" fill={isShadow ? "black" : "#c2410c"} opacity="0.5" />

        {!isShadow && (
          <>
            {/* Eye */}
            <circle cx="75.5" cy="27.5" r="1.9" fill="#1c1917" />
            <circle cx="76.2" cy="26.8" r="0.6" fill="white" />
            {/* Hunter's angry brow */}
            {isHunter && <path d="M70.5 23.5 L78 26" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" />}
          </>
        )}
      </motion.svg>
    </div>
  );
};

export const CrabSprite = ({ row, col }: { row: number; col: number }) => {
  const [isMoving, setIsMoving] = useState(false);
  const prevPos = useRef({ row, col });

  useEffect(() => {
    if (prevPos.current.col !== col || prevPos.current.row !== row) {
      setIsMoving(true);
      const timer = setTimeout(() => setIsMoving(false), 1000);
      prevPos.current = { row, col };
      return () => clearTimeout(timer);
    }
  }, [row, col]);

  // A raised, snapping claw — mirrored for each side (s = +1 right, -1 left).
  const Claw = ({ s }: { s: 1 | -1 }) => {
    const bx = 38 + s * 17; // base near body
    const cx = 38 + s * 27; // claw centre
    return (
      <g>
        {/* upper arm */}
        <path d={`M${38 + s * 15} 30 L${bx} 20 L${cx} 16`} fill="none" stroke="#a01818" strokeWidth="4" strokeLinecap="round" />
        {/* pincer */}
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: s === 1 ? "20% 80%" : "80% 80%" }}
          animate={{ rotate: [0, s * 14, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* lower jaw (fixed) */}
          <path d={`M${cx} 17 Q${cx + s * 9} 15 ${cx + s * 8} 22 Q${cx + s * 5} 25 ${cx} 22 Z`} fill="url(#crab-claw)" stroke="#7f1d1d" strokeWidth="1.8" strokeLinejoin="round" />
          {/* upper jaw (opens) */}
          <path d={`M${cx} 15 Q${cx + s * 10} 9 ${cx + s * 9} 16 Q${cx + s * 6} 18 ${cx} 17 Z`} fill="url(#crab-claw)" stroke="#7f1d1d" strokeWidth="1.8" strokeLinejoin="round" />
        </motion.g>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute bottom-2.5 w-12 h-3 bg-black/25 rounded-full blur-md" />
      <motion.svg
        viewBox="0 0 76 60"
        className="w-16 h-13 drop-shadow-sm"
        animate={isMoving ? { x: [-1.5, 1.5, -1.5], y: [0, -2, 0] } : {}}
        transition={{ duration: 0.2, repeat: isMoving ? Infinity : 0 }}
      >
        <defs>
          <radialGradient id="crab-body" cx="40%" cy="28%" r="82%">
            <stop offset="0%" stopColor="#ff9385" />
            <stop offset="52%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#a91717" />
          </radialGradient>
          <radialGradient id="crab-claw" cx="40%" cy="30%" r="85%">
            <stop offset="0%" stopColor="#ff8574" />
            <stop offset="100%" stopColor="#bd2626" />
          </radialGradient>
        </defs>

        {/* Skittering legs */}
        {[0, 1, 2].map((i) => (
          <motion.g key={i} style={svgFx} animate={isMoving ? { rotate: [-8, 8, -8], transition: { duration: 0.12, repeat: Infinity, delay: i * 0.03 } } : {}}>
            <path d={`M24 ${38 + i * 4} Q13 ${41 + i * 6} 7 ${36 + i * 7} L5 ${40 + i * 7}`} fill="none" stroke="#a01818" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M52 ${38 + i * 4} Q63 ${41 + i * 6} 69 ${36 + i * 7} L71 ${40 + i * 7}`} fill="none" stroke="#a01818" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </motion.g>
        ))}

        {/* Claws */}
        <Claw s={-1} />
        <Claw s={1} />

        {/* Eye stalks */}
        <path d="M32 24 L30 13" stroke="#a01818" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M44 24 L46 13" stroke="#a01818" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="30" cy="11" r="4.2" fill="white" stroke="#7f1d1d" strokeWidth="1.5" />
        <circle cx="46" cy="11" r="4.2" fill="white" stroke="#7f1d1d" strokeWidth="1.5" />
        <circle cx="30.7" cy="11.6" r="1.9" fill="#1c1917" />
        <circle cx="45.3" cy="11.6" r="1.9" fill="#1c1917" />
        <circle cx="31.4" cy="10.7" r="0.7" fill="white" />
        <circle cx="46" cy="10.7" r="0.7" fill="white" />

        {/* Body */}
        <ellipse cx="38" cy="35" rx="19" ry="13.5" fill="url(#crab-body)" stroke="#7f1d1d" strokeWidth="2.4" />
        {/* Shell ridges */}
        <path d="M26 31 Q38 25 50 31" fill="none" stroke="#7f1d1d" strokeWidth="1.2" opacity="0.4" />
        <path d="M24 37 Q38 32 52 37" fill="none" stroke="#7f1d1d" strokeWidth="1.2" opacity="0.28" />
        {/* Little bumps */}
        <circle cx="27" cy="34" r="1.1" fill="#7f1d1d" opacity="0.35" />
        <circle cx="49" cy="34" r="1.1" fill="#7f1d1d" opacity="0.35" />
        {/* Highlight */}
        <ellipse cx="31" cy="29.5" rx="6" ry="3" fill="white" opacity="0.4" transform="rotate(-16 31 29.5)" />
        {/* Toothy grin */}
        <path d="M32 40 Q38 45 44 40" fill="none" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M35 41.5 L36 43.2 L37 41.5 M39 41.5 L40 43.2 L41 41.5" fill="none" stroke="#7f1d1d" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </div>
  );
};

export const SnakeSprite = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute bottom-2.5 w-14 h-3 bg-black/25 rounded-full blur-md" />
      <motion.svg
        viewBox="0 0 68 60"
        className="w-16 h-14 drop-shadow-sm"
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "34px 50px" }}
      >
        <defs>
          <linearGradient id="snake-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c6f06a" />
            <stop offset="55%" stopColor="#7fc428" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </linearGradient>
          <radialGradient id="snake-head" cx="42%" cy="30%" r="82%">
            <stop offset="0%" stopColor="#dcf79e" />
            <stop offset="100%" stopColor="#5f9d16" />
          </radialGradient>
        </defs>

        {/* Coiled body — a plump resting coil */}
        <g>
          <ellipse cx="34" cy="49" rx="24" ry="10.8" fill="#3f6212" />
          <ellipse cx="34" cy="47.8" rx="24" ry="10.8" fill="url(#snake-body)" />
          {/* Seam implying the loop wraps over itself */}
          <path d="M13 49 Q26 40 40 45 Q50 48.5 54 43" fill="none" stroke="#3f6212" strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />
          {/* Diamond scales */}
          <g fill="#3f6212" opacity="0.4">
            <path d="M22 47 l2.5 -2 2.5 2 -2.5 2 Z" />
            <path d="M33 50 l2.5 -2 2.5 2 -2.5 2 Z" />
            <path d="M45 47 l2.5 -2 2.5 2 -2.5 2 Z" />
          </g>
          {/* Highlight */}
          <ellipse cx="24" cy="43.5" rx="8" ry="3" fill="white" opacity="0.18" transform="rotate(-8 24 43.5)" />
          {/* Tail tip curling up over the coil */}
          <path d="M55 45 Q63 43 62 36" fill="none" stroke="#4d7c0f" strokeWidth="4.5" strokeLinecap="round" />
        </g>

        {/* Reared neck + head */}
        <motion.g
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "34px 42px" }}
        >
          {/* Neck */}
          <path d="M34 44 Q28 30 34 22" fill="none" stroke="#3f6212" strokeWidth="12" strokeLinecap="round" />
          <path d="M34 44 Q28 30 34 22" fill="none" stroke="url(#snake-body)" strokeWidth="9" strokeLinecap="round" />
          {/* Head (front-facing, slightly hooded) */}
          <path d="M23 18 Q23 6 34 6 Q45 6 45 18 Q45 27 34 28 Q23 27 23 18 Z" fill="url(#snake-head)" stroke="#3f6212" strokeWidth="2.2" strokeLinejoin="round" />
          {/* Brow ridges (a little menace) */}
          <path d="M25 12 Q28 10 31 12 M43 12 Q40 10 37 12" fill="none" stroke="#3f6212" strokeWidth="1.6" strokeLinecap="round" />
          {/* Eyes with slit pupils */}
          <circle cx="29" cy="15" r="3.4" fill="#fdf6b8" stroke="#3f6212" strokeWidth="0.9" />
          <circle cx="39" cy="15" r="3.4" fill="#fdf6b8" stroke="#3f6212" strokeWidth="0.9" />
          <ellipse cx="29.3" cy="15.3" rx="1" ry="2.4" fill="#1c1917" />
          <ellipse cx="39.3" cy="15.3" rx="1" ry="2.4" fill="#1c1917" />
          <circle cx="28.2" cy="13.8" r="0.7" fill="white" />
          <circle cx="38.2" cy="13.8" r="0.7" fill="white" />
          {/* Nostrils */}
          <circle cx="32.5" cy="23.5" r="0.7" fill="#3f6212" />
          <circle cx="35.5" cy="23.5" r="0.7" fill="#3f6212" />
          {/* Flicking forked tongue */}
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
            animate={{ scaleY: [0, 1, 1, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 1 }}
          >
            <path d="M34 26 L34 33 M34 33 L31.5 36 M34 33 L36.5 36" fill="none" stroke="#e11d48" strokeWidth="1.4" strokeLinecap="round" />
          </motion.g>
        </motion.g>
      </motion.svg>
    </div>
  );
};

export const OctopusSprite = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute bottom-2 w-11 h-3 bg-black/25 rounded-full blur-md" />
      <motion.svg
        viewBox="0 0 64 64"
        className="w-13 h-13 drop-shadow-sm"
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <radialGradient id="octo-head" cx="40%" cy="26%" r="82%">
            <stop offset="0%" stopColor="#e3c4ff" />
            <stop offset="52%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7318b8" />
          </radialGradient>
        </defs>

        {/* Tentacles — curl left and right, suckers underneath */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = 12 + i * 8;
          const dir = i % 2 === 0 ? 1 : -1;
          const curl = (i - 2.5) * 2;
          return (
            <motion.g
              key={i}
              style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
              animate={{ rotate: [dir * -9, dir * 9, dir * -9] }}
              transition={{ duration: 1.4 + i * 0.14, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d={`M${x} 40 Q${x + curl} 52 ${x - dir * 5} 59`} fill="none" stroke="#6a17ac" strokeWidth="6.5" strokeLinecap="round" />
              <path d={`M${x} 40 Q${x + curl} 52 ${x - dir * 5} 59`} fill="none" stroke="#a855f7" strokeWidth="3.6" strokeLinecap="round" />
              <circle cx={x + curl * 0.5} cy={50} r="1.1" fill="#f3e8ff" opacity="0.8" />
              <circle cx={x - dir * 3} cy={56} r="1" fill="#f3e8ff" opacity="0.7" />
            </motion.g>
          );
        })}

        {/* Mantle / head dome */}
        <path
          d="M11 39 Q9 10 32 9 Q55 10 53 39 Q47 46 32 46 Q17 46 11 39 Z"
          fill="url(#octo-head)"
          stroke="#4a1178"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Spots */}
        <circle cx="19" cy="19" r="1.7" fill="#eeddff" opacity="0.55" />
        <circle cx="44" cy="16" r="1.4" fill="#eeddff" opacity="0.55" />
        <circle cx="48" cy="25" r="1.1" fill="#eeddff" opacity="0.45" />
        {/* Gloss */}
        <ellipse cx="23" cy="17" rx="6.5" ry="3.6" fill="white" opacity="0.4" transform="rotate(-22 23 17)" />

        {/* Big eyes with heavy lids (sly look) */}
        <circle cx="24" cy="29" r="5.4" fill="white" stroke="#4a1178" strokeWidth="1.4" />
        <circle cx="40" cy="29" r="5.4" fill="white" stroke="#4a1178" strokeWidth="1.4" />
        <circle cx="25" cy="30.3" r="2.7" fill="#1c1917" />
        <circle cx="39" cy="30.3" r="2.7" fill="#1c1917" />
        <circle cx="26" cy="29.3" r="0.9" fill="white" />
        <circle cx="40" cy="29.3" r="0.9" fill="white" />
        {/* Heavy lids */}
        <path d="M18.6 26.5 Q24 24 29.4 26.5" fill="none" stroke="#4a1178" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M34.6 26.5 Q40 24 45.4 26.5" fill="none" stroke="#4a1178" strokeWidth="1.6" strokeLinecap="round" />
        {/* Smug little smile */}
        <path d="M28 39 Q32 42.5 36 39" fill="none" stroke="#4a1178" strokeWidth="1.7" strokeLinecap="round" />
      </motion.svg>
    </div>
  );
};

export const DecoySprite = ({ turnsLeft }: { turnsLeft: number }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, y: -30 }}
        animate={{ scale: 1, y: 0, rotate: [-4, 4, -4] }}
        transition={{ rotate: { duration: 2, repeat: Infinity } }}
        className="relative w-11 h-12"
      >
        {/* A flat cardboard cut-out of a hatchling — clearly a fake lure */}
        <svg viewBox="0 0 44 48" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="decoy-card" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f3dca6" />
              <stop offset="100%" stopColor="#e0be7c" />
            </linearGradient>
          </defs>
          {/* stick it stands on */}
          <rect x="21" y="34" width="2" height="13" rx="1" fill="#a97b3c" />
          {/* head cut-out */}
          <circle cx="22" cy="13" r="8.5" fill="url(#decoy-card)" stroke="#b07d2e" strokeWidth="1.8" strokeDasharray="4 2.5" />
          {/* shell cut-out */}
          <path d="M9 32 Q9 20 22 20 Q35 20 35 32 Q35 39 22 39 Q9 39 9 32 Z"
            fill="url(#decoy-card)" stroke="#b07d2e" strokeWidth="1.8" strokeDasharray="4 2.5" strokeLinejoin="round" />
          {/* googly disguise eyes */}
          <circle cx="18" cy="12" r="3.2" fill="white" stroke="#8a5a1c" strokeWidth="1" />
          <circle cx="26" cy="12" r="3.2" fill="white" stroke="#8a5a1c" strokeWidth="1" />
          <circle cx="18.8" cy="12.8" r="1.5" fill="#1c1917" />
          <circle cx="25.2" cy="12.8" r="1.5" fill="#1c1917" />
          {/* joke moustache */}
          <path d="M15 17 Q18.5 20 22 17.5 Q25.5 20 29 17 Q26 22 22 19.5 Q18 22 15 17 Z" fill="#7a4a17" />
          {/* scribbled scute lines */}
          <path d="M22 22 L22 37 M14 30 Q22 27 30 30" fill="none" stroke="#b07d2e" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
        </svg>
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#d97706] text-white text-[10px] font-black rounded-full flex items-center justify-center border border-white shadow">
          {turnsLeft}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />
      </motion.div>
    </div>
  );
};

export const LeafSprite = ({ hitsLeft }: { hitsLeft: number }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className={`relative w-full h-full flex items-center justify-center ${hitsLeft === 1 ? "opacity-70" : ""}`}>
        <svg viewBox="0 0 48 48" className="w-11 h-11 drop-shadow-md">
          <defs>
            <linearGradient id="leaf-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
          <path
            d="M24 3 C38 12 42 28 24 45 C6 28 10 12 24 3 Z"
            fill="url(#leaf-grad)"
            stroke="#14532d"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Veins */}
          <path d="M24 7 L24 41 M24 15 Q30 17 33 14 M24 15 Q18 17 15 14 M24 25 Q31 27 35 24 M24 25 Q17 27 13 24 M24 34 Q29 36 31 34 M24 34 Q19 36 17 34"
            fill="none" stroke="#dcfce7" strokeWidth="1.3" opacity="0.7" strokeLinecap="round" />
        </svg>
        <div className="absolute -top-0.5 -right-0.5 flex gap-0.5">
          {[...Array(hitsLeft)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-white rounded-full border border-[#1e5d3a]" />
          ))}
        </div>
      </div>
    </div>
  );
};
