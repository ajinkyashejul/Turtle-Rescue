import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Skull } from "lucide-react";

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

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      animate={{
        y: isCrawling ? [0, -2, 0] : 0,
        rotate: isCrawling ? [rotation - 8, rotation + 8, rotation - 8] : rotation,
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
        {/* Shadow */}
        {!isDead && (
          <div className="absolute bottom-2 w-10 h-4 bg-black/20 rounded-full blur-md -z-10" />
        )}

        {/* Custom Cute Baby Turtle */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Fins - Front Left */}
          <motion.div
            className="absolute top-2 -left-1.5 w-6 h-3.5 bg-[#4ade80] rounded-full border-2 border-[#166534] origin-right z-0"
            animate={isCrawling ? { rotate: [-45, 45, -45] } : { rotate: 0 }}
            transition={{ duration: 0.2, repeat: isCrawling ? Infinity : 0 }}
          />
          {/* Fins - Front Right */}
          <motion.div
            className="absolute top-2 -right-1.5 w-6 h-3.5 bg-[#4ade80] rounded-full border-2 border-[#166534] origin-left z-0"
            animate={isCrawling ? { rotate: [45, -45, 45] } : { rotate: 0 }}
            transition={{ duration: 0.2, repeat: isCrawling ? Infinity : 0 }}
          />
          {/* Fins - Back Left */}
          <motion.div
            className="absolute bottom-2 -left-1 w-5 h-3 bg-[#4ade80] rounded-full border-2 border-[#166534] origin-right z-0"
            animate={isCrawling ? { rotate: [35, -35, 35] } : { rotate: 0 }}
            transition={{ duration: 0.2, repeat: isCrawling ? Infinity : 0, delay: 0.05 }}
          />
          {/* Fins - Back Right */}
          <motion.div
            className="absolute bottom-2 -right-1 w-5 h-3 bg-[#4ade80] rounded-full border-2 border-[#166534] origin-left z-0"
            animate={isCrawling ? { rotate: [-35, 35, -35] } : { rotate: 0 }}
            transition={{ duration: 0.2, repeat: isCrawling ? Infinity : 0, delay: 0.05 }}
          />

          {/* Tail */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-3 bg-[#4ade80] rounded-full border border-[#166534] z-0" />

          {/* Shell */}
          <div
            className={`
             relative w-11 h-12 bg-[#22c55e] rounded-[45%] border-4 border-[#166534] shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.2)] z-10 flex items-center justify-center overflow-hidden
             ${isInShell ? "bg-[#5d4037] border-[#3e2723]" : ""}
           `}
          >
            {/* Shell Pattern - Hexagonal-ish */}
            <div className="absolute inset-0 opacity-20 flex flex-col items-center justify-center gap-1">
              <div className="flex gap-1">
                <div className="w-3 h-3 border border-black rotate-45" />
                <div className="w-3 h-3 border border-black rotate-45" />
              </div>
              <div className="w-4 h-4 border border-black rotate-45" />
              <div className="flex gap-1">
                <div className="w-3 h-3 border border-black rotate-45" />
                <div className="w-3 h-3 border border-black rotate-45" />
              </div>
            </div>
          </div>

          {/* Head */}
          {!isInShell && (
            <motion.div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-6 h-7 bg-[#4ade80] rounded-full border-2 border-[#166534] z-20 flex flex-col items-center pt-1.5"
              animate={isCrawling ? { y: [0, -1, 0] } : {}}
            >
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-black rounded-full" />
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
              {/* Blush */}
              <div className="flex justify-between w-full px-1 mt-0.5 opacity-50">
                <div className="w-1.5 h-1 bg-pink-400 rounded-full" />
                <div className="w-1.5 h-1 bg-pink-400 rounded-full" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Status Overlays */}
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
  const bodyFill = isShadow ? "black" : isHunter ? "#fed7aa" : "#f7fafc";
  const wingFill = isShadow ? "black" : isHunter ? "#fdba74" : "#edf2f7";
  const stroke = isShadow ? "black" : isHunter ? "#9a3412" : "#cbd5e0";
  return (
    <div
      className={`relative ${
        isShadow ? "opacity-20 blur-[2px] grayscale brightness-0" : "drop-shadow-2xl"
      }`}
    >
      <motion.svg
        viewBox="0 0 100 60"
        className={`${isShadow ? "w-16 h-10" : "w-24 h-16"}`}
        fill={isShadow ? "black" : "#4a5568"}
      >
        {/* Body */}
        <path
          d="M30,30 Q50,20 70,30 Q50,40 30,30"
          fill={bodyFill}
          stroke={stroke}
          strokeWidth="1"
        />
        {/* Left Wing */}
        <motion.path
          d="M50,25 Q30,0 10,20 Q30,15 50,25"
          fill={wingFill}
          stroke={stroke}
          strokeWidth="1"
          animate={{ rotateX: [0, 60, 0], y: [0, 5, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: "25px", originX: "50px" }}
        />
        {/* Right Wing */}
        <motion.path
          d="M50,25 Q70,0 90,20 Q70,15 50,25"
          fill={wingFill}
          stroke={stroke}
          strokeWidth="1"
          animate={{ rotateX: [0, 60, 0], y: [0, 5, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: "25px", originX: "50px" }}
        />
        {/* Head */}
        <circle cx="72" cy="28" r="4" fill={bodyFill} stroke={stroke} strokeWidth="1" />
        <path d="M75,28 L82,28 L75,31 Z" fill={isShadow ? "black" : "#ecc94b"} />
        {/* Hunter's angry brow */}
        {isHunter && !isShadow && (
          <path d="M68,24 L76,26" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" />
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
      <motion.div
        className="relative w-12 h-9 bg-[#ef4444] rounded-[40%] border-2 border-[#991b1b] shadow-lg flex items-center justify-center"
        animate={isMoving ? { x: [-1, 1, -1], y: [0, -2, 0] } : {}}
        transition={{ duration: 0.2, repeat: Infinity }}
      >
        {/* Eye Stalks */}
        <div className="absolute -top-3 left-3 w-0.5 h-3 bg-[#991b1b]" />
        <div className="absolute -top-4 left-3 -translate-x-1/2 w-2 h-2 bg-white rounded-full border border-[#991b1b] flex items-center justify-center">
          <div className="w-1 h-1 bg-black rounded-full" />
        </div>
        <div className="absolute -top-3 right-3 w-0.5 h-3 bg-[#991b1b]" />
        <div className="absolute -top-4 right-3 translate-x-1/2 w-2 h-2 bg-white rounded-full border border-[#991b1b] flex items-center justify-center">
          <div className="w-1 h-1 bg-black rounded-full" />
        </div>

        {/* Claws (Pincers) */}
        <motion.div
          className="absolute -top-2 -left-4 w-5 h-4 bg-[#ef4444] rounded-full border-2 border-[#991b1b] origin-right"
          animate={{ rotate: [0, -30, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          <div className="absolute top-1 left-0 w-2 h-1 bg-[#991b1b] rounded-full" />
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-4 w-5 h-4 bg-[#ef4444] rounded-full border-2 border-[#991b1b] origin-left"
          animate={{ rotate: [0, 30, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          <div className="absolute top-1 right-0 w-2 h-1 bg-[#991b1b] rounded-full" />
        </motion.div>

        {/* Scuttling Legs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`left-${i}`}
            className="absolute -left-3 w-4 h-1 bg-[#dc2626] rounded-full origin-right"
            style={{ top: `${25 + i * 25}%` }}
            animate={isMoving ? { rotate: [-20, 20, -20] } : { rotate: -15 }}
            transition={{ duration: 0.1, repeat: Infinity, delay: i * 0.03 }}
          />
        ))}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`right-${i}`}
            className="absolute -right-3 w-4 h-1 bg-[#dc2626] rounded-full origin-left"
            style={{ top: `${25 + i * 25}%` }}
            animate={isMoving ? { rotate: [20, -20, 20] } : { rotate: 15 }}
            transition={{ duration: 0.1, repeat: Infinity, delay: i * 0.03 }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export const SnakeSprite = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="relative w-14 h-10"
        animate={{ x: [-2, 2, -2] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Body segments in a wave */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-5 h-5 bg-[#84cc16] rounded-full border-2 border-[#3f6212] shadow-md"
            style={{ left: `${i * 9}px` }}
            animate={{ y: [i % 2 === 0 ? -3 : 3, i % 2 === 0 ? 3 : -3, i % 2 === 0 ? -3 : 3] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        {/* Head */}
        <motion.div
          className="absolute -right-1 top-0 w-6 h-6 bg-[#a3e635] rounded-full border-2 border-[#3f6212] z-10 flex items-center justify-center shadow-md"
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
            <div className="w-1.5 h-1.5 bg-black rounded-full" />
          </div>
          {/* Tongue */}
          <motion.div
            className="absolute -right-2 top-1/2 w-2.5 h-0.5 bg-red-500"
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.8 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export const OctopusSprite = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="relative w-12 h-12"
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Dome head */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-9 bg-[#a855f7] rounded-t-full rounded-b-[30%] border-2 border-[#6b21a8] shadow-lg flex flex-col items-center justify-center z-10">
          <div className="flex gap-2 mt-1">
            <div className="w-2 h-2.5 bg-white rounded-full flex items-end justify-center">
              <div className="w-1 h-1 bg-black rounded-full mb-0.5" />
            </div>
            <div className="w-2 h-2.5 bg-white rounded-full flex items-end justify-center">
              <div className="w-1 h-1 bg-black rounded-full mb-0.5" />
            </div>
          </div>
          {/* Frown */}
          <div className="w-3 h-1.5 border-b-2 border-[#6b21a8] rounded-b-full rotate-180 mt-0.5" />
        </div>
        {/* Tentacles */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-2 h-5 bg-[#a855f7] border border-[#6b21a8] rounded-b-full origin-top"
            style={{ left: `${6 + i * 8}px` }}
            animate={{ rotate: [i % 2 === 0 ? -15 : 15, i % 2 === 0 ? 15 : -15, i % 2 === 0 ? -15 : 15] }}
            transition={{ duration: 1 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
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
        {/* Fake egg body */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fef9c3] to-[#fde68a] rounded-t-[60%] rounded-b-[40%] border-2 border-dashed border-[#d97706] shadow-md flex items-center justify-center">
          <span className="text-[16px]">🥸</span>
        </div>
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
      <div
        className={`relative w-full h-full bg-[#2e8b57] rounded-full flex items-center justify-center shadow-md border-2 border-[#1e5d3a] ${
          hitsLeft === 1 ? "opacity-60" : ""
        }`}
      >
        {/* Leaf veins */}
        <svg viewBox="0 0 40 40" className="w-8 h-8 text-white/40">
          <path
            d="M20 4 C10 14, 10 26, 20 36 C30 26, 30 14, 20 4 Z M20 8 L20 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          {[...Array(hitsLeft)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-white rounded-full border border-[#1e5d3a]" />
          ))}
        </div>
      </div>
    </div>
  );
};
