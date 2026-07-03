import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Skull } from "lucide-react";

// All creatures are hand-drawn SVGs sharing one style: soft radial gradients,
// deep outline strokes, a white specular highlight, and eyes with glints.

const svgFx = { transformBox: "fill-box", transformOrigin: "center" } as const;

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
  const [rotation, setRotation] = useState(0);
  const prevPos = useRef({ row, col });
  const uid = useRef(`t${Math.floor(row * 7 + col)}`);

  useEffect(() => {
    if (prevPos.current.row !== row || prevPos.current.col !== col) {
      const dx = col - prevPos.current.col;
      const dy = row - prevPos.current.row;
      if (dx !== 0 || dy !== 0) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        setRotation(angle);
      }

      setIsCrawling(true);
      const timer = setTimeout(() => setIsCrawling(false), 1000);
      prevPos.current = { row, col };
      return () => clearTimeout(timer);
    }
  }, [row, col]);

  const flipperAnim = (dir: 1 | -1, delay = 0) =>
    isCrawling
      ? { rotate: [dir * -30, dir * 30, dir * -30], transition: { duration: 0.25, repeat: Infinity, delay } }
      : { rotate: 0 };

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      animate={{
        y: isCrawling ? [0, -2, 0] : 0,
        rotate: isCrawling ? [rotation - 6, rotation + 6, rotation - 6] : rotation,
      }}
      transition={{
        y: { duration: 0.4, repeat: isCrawling ? 2 : 0 },
        rotate: { duration: 0.25, repeat: isCrawling ? 4 : 0 },
      }}
    >
      <div
        className={`
        relative w-16 h-16 transition-all duration-500 flex items-center justify-center
        ${isInShell ? "scale-[0.6] sm:scale-75" : "scale-[0.8] sm:scale-100"}
        ${isDead ? "grayscale opacity-40 rotate-180" : ""}
      `}
      >
        {!isDead && (
          <div className="absolute bottom-1 w-11 h-4 bg-black/25 rounded-full blur-md -z-10" />
        )}

        <svg viewBox="0 0 64 72" className="w-14 h-[63px] drop-shadow-sm">
          <defs>
            <radialGradient id={`${uid.current}-shell`} cx="42%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#5eea8b" />
              <stop offset="55%" stopColor="#2fc463" />
              <stop offset="100%" stopColor="#1a9a4a" />
            </radialGradient>
            <radialGradient id={`${uid.current}-hide`} cx="42%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#a8846b" />
              <stop offset="60%" stopColor="#7d5b42" />
              <stop offset="100%" stopColor="#5a3d2a" />
            </radialGradient>
            <linearGradient id={`${uid.current}-skin`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8cf2a9" />
              <stop offset="100%" stopColor="#3fbf6d" />
            </linearGradient>
          </defs>

          {!isInShell && (
            <g>
              {/* Flippers */}
              <motion.ellipse cx="10" cy="30" rx="9" ry="5" fill={`url(#${uid.current}-skin)`} stroke="#14532d" strokeWidth="2" style={svgFx} animate={flipperAnim(-1)} />
              <motion.ellipse cx="54" cy="30" rx="9" ry="5" fill={`url(#${uid.current}-skin)`} stroke="#14532d" strokeWidth="2" style={svgFx} animate={flipperAnim(1)} />
              <motion.ellipse cx="13" cy="55" rx="7.5" ry="4.5" fill={`url(#${uid.current}-skin)`} stroke="#14532d" strokeWidth="2" style={svgFx} animate={flipperAnim(1, 0.08)} />
              <motion.ellipse cx="51" cy="55" rx="7.5" ry="4.5" fill={`url(#${uid.current}-skin)`} stroke="#14532d" strokeWidth="2" style={svgFx} animate={flipperAnim(-1, 0.08)} />
              {/* Tail */}
              <path d="M32 66 L28 71 Q32 73 36 71 Z" fill={`url(#${uid.current}-skin)`} stroke="#14532d" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Head */}
              <motion.g animate={isCrawling ? { y: [0, -1.5, 0], transition: { duration: 0.4, repeat: Infinity } } : {}}>
                <circle cx="32" cy="11" r="9" fill={`url(#${uid.current}-skin)`} stroke="#14532d" strokeWidth="2" />
                {/* Eyes with glints */}
                <circle cx="28.4" cy="9.5" r="2.3" fill="#1c1917" />
                <circle cx="35.6" cy="9.5" r="2.3" fill="#1c1917" />
                <circle cx="29.2" cy="8.7" r="0.8" fill="white" />
                <circle cx="36.4" cy="8.7" r="0.8" fill="white" />
                {/* Blush */}
                <ellipse cx="25.5" cy="13" rx="1.8" ry="1" fill="#fb7185" opacity="0.55" />
                <ellipse cx="38.5" cy="13" rx="1.8" ry="1" fill="#fb7185" opacity="0.55" />
                {/* Smile */}
                <path d="M30 14.5 Q32 16 34 14.5" fill="none" stroke="#14532d" strokeWidth="1.2" strokeLinecap="round" />
              </motion.g>
            </g>
          )}

          {/* Shell */}
          <ellipse
            cx="32" cy="42" rx="19" ry="23"
            fill={isInShell ? `url(#${uid.current}-hide)` : `url(#${uid.current}-shell)`}
            stroke={isInShell ? "#3e2723" : "#14532d"}
            strokeWidth="3"
          />
          {/* Shell rim */}
          <ellipse cx="32" cy="42" rx="14.5" ry="18" fill="none" stroke={isInShell ? "#3e2723" : "#14532d"} strokeWidth="1.4" opacity="0.55" />
          {/* Scute pattern */}
          <g stroke={isInShell ? "#3e2723" : "#14532d"} strokeWidth="1.3" opacity="0.5" fill="none" strokeLinejoin="round">
            <path d="M32 30 L38.5 36 L36 44.5 L28 44.5 L25.5 36 Z" />
            <path d="M32 30 L32 24.5 M38.5 36 L44 33 M36 44.5 L41 50.5 M28 44.5 L23 50.5 M25.5 36 L20 33" />
          </g>
          {/* Specular highlight */}
          <ellipse cx="26" cy="31" rx="6" ry="3.6" fill="white" opacity="0.35" transform="rotate(-24 26 31)" />
        </svg>

        {isDead && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <Skull className="w-6 h-6 text-red-900/50" />
          </div>
        )}
        {isInShell && (
          <div className="absolute -top-1 -right-1 bg-[#5d4037] text-white text-[8px] px-1 rounded-full font-bold uppercase tracking-tighter shadow-sm border border-white/20 z-30">
            Shell
          </div>
        )}
      </div>
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
  const stroke = isShadow ? "black" : isHunter ? "#9a3412" : "#64748b";
  return (
    <div
      className={`relative ${
        isShadow ? "opacity-25 blur-[2px] grayscale brightness-0" : "drop-shadow-lg"
      }`}
    >
      <motion.svg viewBox="0 0 100 60" className={`${isShadow ? "w-16 h-10" : "w-24 h-16"}`}>
        <defs>
          <linearGradient id={`${uid.current}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isHunter ? "#ffedd5" : "#ffffff"} />
            <stop offset="100%" stopColor={isHunter ? "#fdba74" : "#cbd5e1"} />
          </linearGradient>
          <linearGradient id={`${uid.current}-wing`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isHunter ? "#fed7aa" : "#f1f5f9"} />
            <stop offset="100%" stopColor={isHunter ? "#f59e0b" : "#94a3b8"} />
          </linearGradient>
        </defs>
        {/* Tail feathers */}
        <path d="M30 30 L18 36 L22 30 L18 24 Z" fill={isShadow ? "black" : `url(#${uid.current}-wing)`} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
        {/* Body */}
        <path d="M26 30 Q46 18 70 28 Q52 42 30 33 Z" fill={isShadow ? "black" : `url(#${uid.current}-body)`} stroke={stroke} strokeWidth="1.3" />
        {/* Left Wing */}
        <motion.path
          d="M50 26 Q30 0 8 18 Q30 14 50 26"
          fill={isShadow ? "black" : `url(#${uid.current}-wing)`}
          stroke={stroke}
          strokeWidth="1.2"
          animate={{ rotateX: [0, 60, 0], y: [0, 5, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: "26px", originX: "50px" }}
        />
        {/* Right Wing */}
        <motion.path
          d="M50 26 Q70 0 92 18 Q70 14 50 26"
          fill={isShadow ? "black" : `url(#${uid.current}-wing)`}
          stroke={stroke}
          strokeWidth="1.2"
          animate={{ rotateX: [0, 60, 0], y: [0, 5, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: "26px", originX: "50px" }}
        />
        {/* Head */}
        <circle cx="72" cy="27" r="6" fill={isShadow ? "black" : `url(#${uid.current}-body)`} stroke={stroke} strokeWidth="1.2" />
        {/* Beak */}
        <path d="M77 26 L86 28 L77 31 Z" fill={isShadow ? "black" : "#f59e0b"} stroke={isShadow ? "black" : "#b45309"} strokeWidth="0.8" strokeLinejoin="round" />
        {/* Eye */}
        {!isShadow && (
          <>
            <circle cx="73.5" cy="25.5" r="1.6" fill="#1c1917" />
            <circle cx="74" cy="25" r="0.55" fill="white" />
            {isHunter && (
              <path d="M69.5 22.5 L77 24.5" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
            )}
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
          <radialGradient id="crab-body" cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ff8a7a" />
            <stop offset="55%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </radialGradient>
          <radialGradient id="crab-claw" cx="40%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#ff7b6b" />
            <stop offset="100%" stopColor="#c62b2b" />
          </radialGradient>
        </defs>

        {/* Legs */}
        {[0, 1, 2].map((i) => (
          <motion.g key={i} style={svgFx} animate={isMoving ? { rotate: [-9, 9, -9], transition: { duration: 0.12, repeat: Infinity, delay: i * 0.03 } } : {}}>
            <path d={`M22 ${37 + i * 5} Q12 ${39 + i * 6} 6 ${34 + i * 7}`} fill="none" stroke="#b91c1c" strokeWidth="2.6" strokeLinecap="round" />
            <path d={`M54 ${37 + i * 5} Q64 ${39 + i * 6} 70 ${34 + i * 7}`} fill="none" stroke="#b91c1c" strokeWidth="2.6" strokeLinecap="round" />
          </motion.g>
        ))}

        {/* Claws */}
        <motion.g style={{ transformBox: "fill-box", transformOrigin: "80% 80%" }} animate={{ rotate: [0, -16, 0] }} transition={{ duration: 0.45, repeat: Infinity }}>
          <path d="M20 22 Q6 12 8 24 Q9 32 20 30 Z" fill="url(#crab-claw)" stroke="#7f1d1d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 17 L14 22" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
        <motion.g style={{ transformBox: "fill-box", transformOrigin: "20% 80%" }} animate={{ rotate: [0, 16, 0] }} transition={{ duration: 0.45, repeat: Infinity }}>
          <path d="M56 22 Q70 12 68 24 Q67 32 56 30 Z" fill="url(#crab-claw)" stroke="#7f1d1d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M66 17 L62 22" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
        </motion.g>

        {/* Eye stalks */}
        <path d="M31 22 L28 13" stroke="#7f1d1d" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M45 22 L48 13" stroke="#7f1d1d" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="28" cy="11" r="4" fill="white" stroke="#7f1d1d" strokeWidth="1.6" />
        <circle cx="48" cy="11" r="4" fill="white" stroke="#7f1d1d" strokeWidth="1.6" />
        <circle cx="28.8" cy="11.5" r="1.7" fill="#1c1917" />
        <circle cx="47.2" cy="11.5" r="1.7" fill="#1c1917" />
        <circle cx="29.3" cy="10.8" r="0.6" fill="white" />
        <circle cx="46.7" cy="10.8" r="0.6" fill="white" />

        {/* Body */}
        <ellipse cx="38" cy="34" rx="18" ry="13" fill="url(#crab-body)" stroke="#7f1d1d" strokeWidth="2.4" />
        {/* Shell texture */}
        <path d="M27 30 Q38 24 49 30" fill="none" stroke="#7f1d1d" strokeWidth="1.2" opacity="0.4" />
        <path d="M26 36 Q38 31 50 36" fill="none" stroke="#7f1d1d" strokeWidth="1.2" opacity="0.3" />
        {/* Highlight */}
        <ellipse cx="31" cy="28.5" rx="5.5" ry="2.8" fill="white" opacity="0.35" transform="rotate(-18 31 28.5)" />
        {/* Smile */}
        <path d="M34 40 Q38 43 42 40" fill="none" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round" />
      </motion.svg>
    </div>
  );
};

export const SnakeSprite = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute bottom-3 w-12 h-2.5 bg-black/20 rounded-full blur-md" />
      <motion.svg
        viewBox="0 0 80 44"
        className="w-16 h-9 drop-shadow-sm"
        animate={{ x: [-2, 2, -2] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="snake-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="55%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </linearGradient>
          <radialGradient id="snake-head" cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#d9f99d" />
            <stop offset="100%" stopColor="#65a30d" />
          </radialGradient>
        </defs>

        {/* Undulating body */}
        <motion.g
          animate={{ y: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M6 26 Q14 14 24 24 Q34 34 44 24 Q52 16 58 22"
            fill="none"
            stroke="#365314"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M6 26 Q14 14 24 24 Q34 34 44 24 Q52 16 58 22"
            fill="none"
            stroke="url(#snake-body)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Diamond back pattern */}
          <g fill="#365314" opacity="0.45">
            <path d="M13 20 l3 -2.5 3 2.5 -3 2.5 Z" />
            <path d="M26 25 l3 -2.5 3 2.5 -3 2.5 Z" />
            <path d="M40 25 l3 -2.5 3 2.5 -3 2.5 Z" />
          </g>
          {/* Tail tip */}
          <path d="M7 27 Q2 29 1 25" fill="none" stroke="#4d7c0f" strokeWidth="4" strokeLinecap="round" />
        </motion.g>

        {/* Head */}
        <motion.g
          animate={{ y: [1.5, -1.5, 1.5] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx="63" cy="21" rx="10" ry="8" fill="url(#snake-head)" stroke="#365314" strokeWidth="2.2" />
          {/* Eyes */}
          <circle cx="61" cy="17.5" r="2.6" fill="#fefce8" stroke="#365314" strokeWidth="0.8" />
          <circle cx="67" cy="17.5" r="2.6" fill="#fefce8" stroke="#365314" strokeWidth="0.8" />
          <ellipse cx="61.3" cy="17.8" rx="1" ry="1.7" fill="#1c1917" />
          <ellipse cx="67.3" cy="17.8" rx="1" ry="1.7" fill="#1c1917" />
          <circle cx="61.7" cy="17" r="0.45" fill="white" />
          <circle cx="67.7" cy="17" r="0.45" fill="white" />
          {/* Nostrils */}
          <circle cx="68" cy="22.5" r="0.6" fill="#365314" />
          <circle cx="70.5" cy="21.5" r="0.6" fill="#365314" />
          {/* Forked tongue */}
          <motion.g
            style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
            animate={{ scaleX: [0, 1, 1, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.9 }}
          >
            <path d="M72 23 Q77 24 79 22 M79 22 L78 20 M79 22 L80 24" fill="none" stroke="#e11d48" strokeWidth="1.4" strokeLinecap="round" />
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
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <radialGradient id="octo-head" cx="40%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="55%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7e22ce" />
          </radialGradient>
        </defs>

        {/* Tentacles */}
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 14 + i * 9;
          const dir = i % 2 === 0 ? 1 : -1;
          return (
            <motion.g
              key={i}
              style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
              animate={{ rotate: [dir * -10, dir * 10, dir * -10] }}
              transition={{ duration: 1 + i * 0.12, repeat: Infinity, ease: "easeInOut" }}
            >
              <path
                d={`M${x} 40 Q${x + dir * 4} 50 ${x - dir * 3} 58`}
                fill="none"
                stroke="#7e22ce"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d={`M${x} 40 Q${x + dir * 4} 50 ${x - dir * 3} 58`}
                fill="none"
                stroke="#a855f7"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
              {/* Suckers */}
              <circle cx={x + dir * 2.5} cy={49} r="1.1" fill="#f3e8ff" opacity="0.8" />
              <circle cx={x - dir * 1} cy={55} r="1" fill="#f3e8ff" opacity="0.7" />
            </motion.g>
          );
        })}

        {/* Head dome */}
        <path
          d="M12 38 Q10 12 32 10 Q54 12 52 38 Q46 45 32 45 Q18 45 12 38 Z"
          fill="url(#octo-head)"
          stroke="#581c87"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Spots */}
        <circle cx="20" cy="20" r="1.6" fill="#e9d5ff" opacity="0.6" />
        <circle cx="43" cy="17" r="1.3" fill="#e9d5ff" opacity="0.6" />
        <circle cx="47" cy="26" r="1.1" fill="#e9d5ff" opacity="0.5" />
        {/* Highlight */}
        <ellipse cx="24" cy="17" rx="6" ry="3.4" fill="white" opacity="0.4" transform="rotate(-22 24 17)" />

        {/* Eyes */}
        <circle cx="25" cy="30" r="5" fill="white" stroke="#581c87" strokeWidth="1.4" />
        <circle cx="39" cy="30" r="5" fill="white" stroke="#581c87" strokeWidth="1.4" />
        <circle cx="26" cy="31" r="2.4" fill="#1c1917" />
        <circle cx="38" cy="31" r="2.4" fill="#1c1917" />
        <circle cx="26.8" cy="30.2" r="0.8" fill="white" />
        <circle cx="38.8" cy="30.2" r="0.8" fill="white" />
        {/* Frown */}
        <path d="M29 39.5 Q32 37.5 35 39.5" fill="none" stroke="#581c87" strokeWidth="1.6" strokeLinecap="round" />
      </motion.svg>
    </div>
  );
};

export const DecoySprite = ({ turnsLeft }: { turnsLeft: number }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, y: -30 }}
        animate={{ scale: 1, y: 0, rotate: [-3, 3, -3] }}
        transition={{ rotate: { duration: 2, repeat: Infinity } }}
        className="relative w-10 h-12"
      >
        <svg viewBox="0 0 40 48" className="w-full h-full drop-shadow-sm">
          <defs>
            <radialGradient id="decoy-shell" cx="40%" cy="30%" r="85%">
              <stop offset="0%" stopColor="#fefce8" />
              <stop offset="100%" stopColor="#fde047" />
            </radialGradient>
          </defs>
          <path
            d="M20 2 Q36 14 35 30 Q34 45 20 46 Q6 45 5 30 Q4 14 20 2 Z"
            fill="url(#decoy-shell)"
            stroke="#d97706"
            strokeWidth="2"
            strokeDasharray="5 3"
            strokeLinejoin="round"
          />
          {/* Googly disguise eyes + moustache */}
          <circle cx="14" cy="22" r="4" fill="white" stroke="#92400e" strokeWidth="1.2" />
          <circle cx="26" cy="22" r="4" fill="white" stroke="#92400e" strokeWidth="1.2" />
          <circle cx="15" cy="23" r="1.8" fill="#1c1917" />
          <circle cx="25" cy="23" r="1.8" fill="#1c1917" />
          <path d="M12 30 Q16 34 20 31 Q24 34 28 30 Q25 36 20 33 Q15 36 12 30 Z" fill="#78350f" />
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
