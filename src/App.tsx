/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Skull,
  CheckCircle2,
  RotateCcw,
  Info,
  Leaf as LeafIcon,
  Shield,
  Zap,
  Snowflake,
  Egg as EggIcon,
  Hourglass,
  Coins,
  Lock,
  Play,
  X,
  ShoppingBag,
  Home,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import {
  GameState,
  Difficulty,
  PowerType,
  PlayerAction,
  GRID_ROWS,
  GRID_COLS,
  MAX_TURTLES,
  TURTLE_PATHS,
} from './types';
import { LEVELS, DIFFICULTIES, POWERS, POWER_ORDER } from './levels';
import { createLevelState, applyTurn, getDangerCells, EMPTY_POWERS } from './engine';
import {
  TurtleSprite,
  FlyingBird,
  CrabSprite,
  SnakeSprite,
  OctopusSprite,
  DecoySprite,
  LeafSprite,
} from './sprites';

// ---------- Persistent meta progression ----------

interface Meta {
  coins: number;
  unlockedLevel: number;
}

const META_KEY = 'turtle-rescue-meta-v1';

const loadMeta = (): Meta => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        coins: Math.max(0, Number(parsed.coins) || 0),
        unlockedLevel: Math.min(LEVELS.length, Math.max(1, Number(parsed.unlockedLevel) || 1)),
      };
    }
  } catch {
    // corrupted storage — start fresh
  }
  return { coins: 0, unlockedLevel: 1 };
};

// ---------- Shared visuals ----------

const VideoBackground = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.src = '/background.mp4';
      video.muted = true;

      const handleInteraction = () => {
        video.play().catch(() => {});
      };

      document.body.addEventListener('click', handleInteraction);
      video.play().catch(() => {});

      return () => {
        document.body.removeEventListener('click', handleInteraction);
      };
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden bg-black">
      <video
        ref={videoRef}
        id="bg-video"
        muted
        loop
        playsInline
        className="absolute w-full h-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
    </div>
  );
};

const CoinBadge = ({ coins }: { coins: number }) => (
  <motion.div
    key={coins}
    initial={{ scale: 1.3 }}
    animate={{ scale: 1 }}
    className="flex items-center gap-1.5 bg-[#fbbf24] text-[#78350f] px-3 py-1.5 rounded-full border-2 border-[#b45309] shadow-[2px_2px_0px_0px_rgba(120,53,15,0.6)] font-black text-sm"
  >
    <Coins size={16} />
    {coins}
  </motion.div>
);

const PathOverlay = () => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 500 600"
      preserveAspectRatio="none"
    >
      {TURTLE_PATHS.map((path, i) => {
        let d = `M ${path[0][1] * 100 + 50} ${path[0][0] * 100 + 50}`;
        for (let j = 0; j < path.length - 1; j++) {
          const [r1, c1] = path[j];
          const [r2, c2] = path[j + 1];
          const x1 = c1 * 100 + 50;
          const y1 = r1 * 100 + 50;
          const x2 = c2 * 100 + 50;
          const y2 = r2 * 100 + 50;
          d += ` C ${x1} ${y1 - 50}, ${x2} ${y2 + 50}, ${x2} ${y2}`;
        }

        return (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke="#fdf5e6"
              strokeWidth="24"
              strokeLinecap="round"
              className="opacity-10 blur-md"
            />
            <path
              d={d}
              fill="none"
              stroke="#fdf5e6"
              strokeWidth="12"
              strokeLinecap="round"
              className="sand-trail"
            />
            <path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeDasharray="4 8"
              className="opacity-20"
            />
          </g>
        );
      })}
    </svg>
  );
};

const cellStyle = (row: number, col: number) => ({
  top: `${(row / GRID_ROWS) * 100}%`,
  left: `${(col / GRID_COLS) * 100}%`,
  width: `${100 / GRID_COLS}%`,
  height: `${100 / GRID_ROWS}%`,
});

const BirdSwoop = ({ row, col, turnCount, isHunter }: { row: number; col: number; turnCount: number; isHunter: boolean }) => {
  if (turnCount === 0) return null;

  return (
    <motion.div
      key={turnCount}
      initial={{ x: -600, y: -400, opacity: 0, scale: 2.5, rotate: -30 }}
      animate={{
        x: [-600, 0, 0, 600],
        y: [-400, 0, 0, -400],
        opacity: [0, 1, 1, 0],
        scale: [2.5, 1, 1, 0.6],
        rotate: [-30, 0, 0, 30],
      }}
      transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1], ease: 'easeInOut' }}
      className="absolute z-50 pointer-events-none"
      style={cellStyle(row, col)}
    >
      <div className="w-full h-full flex items-center justify-center">
        <FlyingBird isHunter={isHunter} />
      </div>
    </motion.div>
  );
};

const BirdShadow: React.FC<{ row: number; col: number }> = ({ row, col }) => (
  <motion.div className="absolute z-10 pointer-events-none" animate={cellStyle(row, col)}>
    <motion.div
      className="w-full h-full flex items-center justify-center"
      animate={{ x: [0, 15, 0, -15, 0], y: [0, -10, 0, 10, 0], scale: [1, 1.1, 1, 0.9, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    >
      <FlyingBird isShadow />
    </motion.div>
  </motion.div>
);

const DangerRing: React.FC<{ row: number; col: number }> = ({ row, col }) => (
  <motion.div className="absolute z-10 pointer-events-none" animate={cellStyle(row, col)}>
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        className="w-3/5 h-3/5 rounded-full border-4 border-red-500/70"
        animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  </motion.div>
);

const FrozenBadge = () => (
  <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="w-10 h-10 bg-sky-200/80 rounded-full border-2 border-sky-400 flex items-center justify-center backdrop-blur-[1px]"
    >
      <Snowflake size={20} className="text-sky-600" />
    </motion.div>
  </div>
);

const Confetti = () => {
  const pieces = useMemo(
    () =>
      [...Array(40)].map((_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 10) * 0.15,
        color: ['#fbbf24', '#4ade80', '#60a5fa', '#f472b6', '#fdf5e6'][i % 5],
        rotate: (i * 73) % 360,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-sm"
          style={{ left: `${p.left}%`, top: '-5%', backgroundColor: p.color }}
          initial={{ y: 0, rotate: p.rotate, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 360, opacity: [1, 1, 0.6] }}
          transition={{ duration: 3.5, delay: p.delay, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
};

// ---------- Power toolbar ----------

const POWER_ICONS: Record<PowerType, React.ReactNode> = {
  leaf: <LeafIcon size={18} />,
  shell: <Shield size={18} />,
  sprint: <Zap size={18} />,
  freeze: <Snowflake size={18} />,
  decoy: <EggIcon size={18} />,
};

const POWER_COLORS: Record<PowerType, { active: string; idle: string }> = {
  leaf: {
    active: 'bg-[#2e8b57] text-white ring-4 ring-[#1e5d3a] scale-105 shadow-lg',
    idle: 'bg-[#f0fdf4] text-[#2e8b57] border-2 border-[#2e8b57] hover:bg-[#2e8b57] hover:text-white',
  },
  shell: {
    active: 'bg-[#8b4513] text-white ring-4 ring-[#4a3728] scale-105 shadow-lg',
    idle: 'bg-[#fff7ed] text-[#8b4513] border-2 border-[#8b4513] hover:bg-[#8b4513] hover:text-white',
  },
  sprint: {
    active: 'bg-[#ca8a04] text-white ring-4 ring-[#854d0e] scale-105 shadow-lg',
    idle: 'bg-[#fefce8] text-[#ca8a04] border-2 border-[#ca8a04] hover:bg-[#ca8a04] hover:text-white',
  },
  freeze: {
    active: 'bg-[#0284c7] text-white ring-4 ring-[#075985] scale-105 shadow-lg',
    idle: 'bg-[#f0f9ff] text-[#0284c7] border-2 border-[#0284c7] hover:bg-[#0284c7] hover:text-white',
  },
  decoy: {
    active: 'bg-[#d97706] text-white ring-4 ring-[#92400e] scale-105 shadow-lg',
    idle: 'bg-[#fffbeb] text-[#d97706] border-2 border-[#d97706] hover:bg-[#d97706] hover:text-white',
  },
};

type Tool = 'move' | 'leaf' | 'shell' | 'sprint' | 'decoy';

// ---------- Screens ----------

interface TitleScreenProps {
  meta: Meta;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onStart: (levelId: number) => void;
}

const TitleScreen = ({ meta, difficulty, setDifficulty, onStart }: TitleScreenProps) => (
  <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8 py-10">
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex flex-col items-center gap-2"
    >
      <motion.div
        animate={{ y: [-4, 4, -4], rotate: [-3, 3, -3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 scale-125"
      >
        <TurtleSprite isInShell={false} isDead={false} row={0} col={0} />
      </motion.div>
      <h1 className="text-5xl sm:text-6xl font-black uppercase italic tracking-tighter text-white drop-shadow-[3px_3px_0px_rgba(74,55,40,1)]">
        Turtle Rescue
      </h1>
      <p className="text-white/80 font-bold uppercase tracking-widest text-xs">
        Guide every hatchling home
      </p>
    </motion.div>

    <div className="w-full bg-white/85 backdrop-blur-md rounded-3xl border-2 border-[#4a3728] shadow-[6px_6px_0px_0px_rgba(74,55,40,1)] p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="font-black uppercase italic tracking-tight text-lg">Your Treasure</span>
        <CoinBadge coins={meta.coins} />
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-widest opacity-50 mb-2">Difficulty</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`
                py-3 rounded-xl font-black uppercase text-sm transition-all border-2
                ${difficulty === d
                  ? 'bg-[#4a3728] text-white border-[#4a3728] shadow-lg scale-[1.03]'
                  : 'bg-white text-[#4a3728] border-[#4a3728]/30 hover:border-[#4a3728]'}
              `}
            >
              {DIFFICULTIES[d].label}
            </button>
          ))}
        </div>
        <p className="text-xs opacity-60 mt-2 min-h-[1.5rem]">{DIFFICULTIES[difficulty].description}</p>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-widest opacity-50 mb-2">Choose Level</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LEVELS.map((level) => {
            const locked = level.id > meta.unlockedLevel;
            return (
              <button
                key={level.id}
                onClick={() => !locked && onStart(level.id)}
                disabled={locked}
                className={`
                  text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3
                  ${locked
                    ? 'opacity-40 border-[#4a3728]/20 cursor-not-allowed'
                    : 'border-[#4a3728]/30 hover:border-[#4a3728] hover:bg-[#4a3728]/5 hover:scale-[1.01]'}
                `}
              >
                <div className="w-9 h-9 shrink-0 rounded-lg bg-[#2e8b57] text-white flex items-center justify-center font-black">
                  {locked ? <Lock size={16} /> : level.id}
                </div>
                <div className="min-w-0">
                  <p className="font-black uppercase italic text-sm leading-tight">{level.name}</p>
                  <p className="text-[11px] opacity-60 truncate">{level.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => onStart(1)}
        className="w-full bg-[#2e8b57] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-[#1e5d3a] transition-all shadow-[0_5px_0_0_#1e5d3a] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2"
      >
        <Play size={22} /> Start Rescue
      </button>
    </div>
  </div>
);

interface ShopModalProps {
  coins: number;
  levelId: number;
  onBuy: (p: PowerType) => void;
  onClose: () => void;
}

const ShopModal = ({ coins, levelId, onBuy, onClose }: ShopModalProps) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="relative w-full max-w-md bg-[#4a3728] text-white p-6 border-4 border-white shadow-2xl rounded-3xl"
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fbbf24] rounded-xl flex items-center justify-center shadow-lg rotate-3 text-[#78350f]">
            <ShoppingBag size={22} />
          </div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">Beach Shop</h3>
        </div>
        <div className="flex items-center gap-3">
          <CoinBadge coins={coins} />
          <button
            data-testid="shop-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {POWER_ORDER.map((p) => {
          const info = POWERS[p];
          const locked = info.unlockLevel > levelId;
          const affordable = coins >= info.price;
          return (
            <div
              key={p}
              className={`flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 ${locked ? 'opacity-40' : ''}`}
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white/10 flex items-center justify-center">
                {POWER_ICONS[p]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black uppercase italic text-sm">{info.name}</p>
                <p className="text-[11px] text-white/60 leading-tight">
                  {locked ? `Unlocks at level ${info.unlockLevel}` : info.description}
                </p>
              </div>
              <button
                data-testid={`buy-${p}`}
                onClick={() => onBuy(p)}
                disabled={locked || !affordable}
                className={`
                  shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl font-black text-xs uppercase transition-all
                  ${!locked && affordable
                    ? 'bg-[#fbbf24] text-[#78350f] hover:scale-105 shadow-[0_3px_0_0_#b45309] active:shadow-none active:translate-y-0.5'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'}
                `}
              >
                <Coins size={12} /> {info.price}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-white/40 mt-4 text-center uppercase tracking-widest">
        Shopping never costs a turn
      </p>
    </motion.div>
  </div>
);

const TutorialModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="relative w-full max-w-2xl bg-[#4a3728] text-white p-8 border-4 border-white shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#2e8b57]/20 rounded-full -ml-16 -mb-16 blur-2xl" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2e8b57] rounded-xl flex items-center justify-center shadow-lg rotate-3">
              <Info size={24} className="text-white" />
            </div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">How to Play</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm leading-relaxed">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="font-black text-[#4ade80] mb-1 uppercase italic tracking-wider">1. Hatch & Move</p>
            <p className="text-white/80">
              Click an <strong>Egg</strong> to hatch a turtle, then click the turtle to move it one
              step toward the ocean. Every action advances the turn — and the predators.
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="font-black text-red-400 mb-1 uppercase italic tracking-wider">2. Read the Danger</p>
            <p className="text-white/80">
              <strong>Red rings</strong> mark exactly where each predator strikes next. A turtle on a
              marked cell after your move is in trouble!
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="font-black text-[#4ade80] mb-1 uppercase italic tracking-wider">3. Powers</p>
            <p className="text-white/80">
              🍃 <strong>Leaf</strong> shields a cell (3 hits) · 🛡 <strong>Shell</strong> hides a turtle for a
              turn · ⚡ <strong>Sprint</strong> moves 2 steps · ❄ <strong>Freeze</strong> stops predators for 2
              turns · 🥚 <strong>Decoy</strong> lures hunters away.
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="font-black text-[#fbbf24] mb-1 uppercase italic tracking-wider">4. Earn Coins</p>
            <p className="text-white/80">
              Every rescued turtle earns <strong>coins</strong> — save all five for a bonus! Spend them
              in the <strong>Shop</strong> on more powers. Coins are yours forever.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-white text-[#4a3728] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#4ade80] hover:text-[#166534] transition-all shadow-[0_4px_0_0_#d2b48c] active:shadow-none active:translate-y-1"
        >
          Got it, let's save them!
        </button>
      </div>
    </motion.div>
  </div>
);

// ---------- Main App ----------

export default function App() {
  const [meta, setMeta] = useState<Meta>(loadMeta);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [game, setGame] = useState<GameState | null>(null);
  const [carriedAtLevelStart, setCarriedAtLevelStart] = useState<Record<PowerType, number>>(EMPTY_POWERS);
  const [activeTool, setActiveTool] = useState<Tool>('move');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const bankedRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
      // storage unavailable — play without persistence
    }
  }, [meta]);

  const level = useMemo(
    () => (game ? LEVELS.find((l) => l.id === game.levelId)! : null),
    [game?.levelId]
  );

  const startLevel = (levelId: number, carried: Record<PowerType, number> = EMPTY_POWERS) => {
    const cfg = LEVELS.find((l) => l.id === levelId)!;
    setCarriedAtLevelStart(carried);
    setGame(createLevelState(cfg, difficulty, carried));
    setActiveTool('move');
    bankedRef.current = 0;
    if (levelId === 1 && meta.unlockedLevel === 1) setShowTutorial(true);
  };

  const dispatch = (action: PlayerAction) => {
    setGame((prev) => (prev ? applyTurn(prev, action) : prev));
  };

  // Coins bank the moment they are earned — every rescue pays out instantly
  useEffect(() => {
    if (!game) return;
    const delta = game.coinsEarned - bankedRef.current;
    if (delta > 0) {
      bankedRef.current = game.coinsEarned;
      setMeta((m) => ({ ...m, coins: m.coins + delta }));
    }
  }, [game?.coinsEarned]);

  // Beating a level unlocks the next one
  useEffect(() => {
    if (!game || game.status !== 'won') return;
    setMeta((m) => ({
      ...m,
      unlockedLevel: Math.max(m.unlockedLevel, Math.min(LEVELS.length, game.levelId + 1)),
    }));
  }, [game?.status]);

  const buyPower = (p: PowerType) => {
    if (!game || meta.coins < POWERS[p].price) return;
    setMeta((m) => ({ ...m, coins: m.coins - POWERS[p].price }));
    setGame((g) => (g ? { ...g, powers: { ...g.powers, [p]: g.powers[p] + 1 } } : g));
  };

  const handleTurtleClick = (turtleId: number) => {
    if (!game || game.status !== 'playing') return;
    if (activeTool === 'shell') {
      dispatch({ type: 'shell', turtleId });
      setActiveTool('move');
    } else if (activeTool === 'sprint') {
      dispatch({ type: 'sprint', turtleId });
      setActiveTool('move');
    } else if (activeTool === 'move') {
      dispatch({ type: 'move', turtleId });
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!game || game.status !== 'playing') return;
    if (activeTool === 'leaf') {
      dispatch({ type: 'leaf', row, col });
      setActiveTool('move');
    } else if (activeTool === 'decoy') {
      dispatch({ type: 'decoy', row, col });
      setActiveTool('move');
    }
  };

  const dangerCells = useMemo(() => (game ? getDangerCells(game) : []), [game]);

  const unlockedPowers = useMemo(
    () => (game ? POWER_ORDER.filter((p) => POWERS[p].unlockLevel <= game.levelId) : []),
    [game?.levelId]
  );

  const safeCount = game ? game.turtles.filter((t) => t.state === 'safe').length : 0;
  const deadCount = game ? game.turtles.filter((t) => t.state === 'dead').length : 0;

  return (
    <div
      className={`
        min-h-screen relative font-sans text-[#4a3728] selection:bg-[#d2b48c] selection:text-white overflow-hidden flex flex-col items-center justify-center p-4
        ${activeTool === 'leaf' || activeTool === 'decoy' ? 'cursor-crosshair' : ''}
        ${activeTool === 'shell' || activeTool === 'sprint' ? 'cursor-help' : ''}
      `}
    >
      <VideoBackground />
      <div className="absolute inset-0 bg-white/10 -z-10" />

      {!game && (
        <TitleScreen
          meta={meta}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={(id) => startLevel(id)}
        />
      )}

      {game && level && (
        <div className="relative z-10 w-full max-w-4xl flex flex-col gap-4">
          {/* Header / HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border-2 border-[#4a3728] shadow-[4px_4px_0px_0px_rgba(74,55,40,1)]">
            {/* Power toolbar */}
            <div className="flex gap-2 flex-wrap">
              {unlockedPowers.map((p) => {
                const count = game.powers[p];
                const isToggle = p !== 'freeze';
                const isActive = activeTool === p;
                return (
                  <button
                    key={p}
                    data-testid={`power-${p}`}
                    onClick={() => {
                      if (p === 'freeze') {
                        dispatch({ type: 'freeze' });
                      } else {
                        setActiveTool(isActive ? 'move' : (p as Tool));
                      }
                    }}
                    disabled={
                      game.status !== 'playing' ||
                      count <= 0 ||
                      (p === 'freeze' && game.freezeTurns > 0)
                    }
                    title={POWERS[p].description}
                    className={`
                      w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all flex flex-col items-center justify-center disabled:opacity-40
                      ${isToggle && isActive ? POWER_COLORS[p].active : POWER_COLORS[p].idle}
                    `}
                  >
                    {POWER_ICONS[p]}
                    <span className="text-[10px] font-black mt-0.5">{count}</span>
                  </button>
                );
              })}
              {/* Wait */}
              <button
                data-testid="wait-button"
                onClick={() => dispatch({ type: 'wait' })}
                disabled={game.status !== 'playing'}
                title="Let a turn pass — predators move, turtles hold still"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all flex flex-col items-center justify-center disabled:opacity-40 bg-white text-[#4a3728] border-2 border-[#4a3728]/40 hover:bg-[#4a3728] hover:text-white"
              >
                <Hourglass size={18} />
                <span className="text-[9px] font-black mt-0.5 uppercase">Wait</span>
              </button>
            </div>

            {/* Title / status */}
            <div className="flex-1 flex flex-col items-center min-w-[140px]">
              <h1 className="text-lg sm:text-2xl font-black uppercase italic tracking-tighter text-[#4a3728] leading-none text-center">
                {level.id}. {level.name}
              </h1>
              <div className="flex gap-3 text-[10px] font-bold uppercase opacity-60 mt-1">
                <span data-testid="saved-count">Saved: {safeCount}/{MAX_TURTLES}</span>
                <span>Need: {game.requiredRescues}</span>
                <span>Lost: {deadCount}</span>
              </div>
              {game.freezeTurns > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-sky-600 mt-1">
                  <Snowflake size={11} /> Frozen: {game.freezeTurns} turn{game.freezeTurns > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Right controls */}
            <div className="flex gap-2 items-center">
              <button data-testid="shop-button" onClick={() => setShowShop(true)} className="hover:scale-105 transition-transform">
                <CoinBadge coins={meta.coins} />
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="w-10 h-10 rounded-full bg-[#4a3728]/10 flex items-center justify-center hover:bg-[#4a3728] hover:text-white transition-all"
              >
                <Info size={18} />
              </button>
              <button
                onClick={() => startLevel(game.levelId, carriedAtLevelStart)}
                title="Restart level"
                className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 border-2 border-red-200 hover:bg-red-600 hover:text-white transition-all"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setGame(null)}
                title="Back to title"
                className="w-10 h-10 rounded-full bg-[#4a3728]/10 flex items-center justify-center hover:bg-[#4a3728] hover:text-white transition-all"
              >
                <Home size={18} />
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="flex flex-col gap-4 items-center">
            <div className="w-full max-w-2xl flex flex-col gap-4">
              <div className="relative aspect-[5/6] bg-transparent overflow-hidden rounded-2xl">
                {/* Goal Row */}
                <div className="absolute top-0 left-0 right-0 h-[16.66%] flex items-center justify-center overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 blur-sm"></div>
                </div>

                <PathOverlay />

                {/* Grid Nodes (Interactive) */}
                <div className="absolute inset-0 grid grid-rows-6 grid-cols-5">
                  {[...Array(GRID_ROWS * GRID_COLS)].map((_, i) => {
                    const row = Math.floor(i / GRID_COLS);
                    const col = i % GRID_COLS;

                    const isPartOfPath = TURTLE_PATHS.some((path) =>
                      path.some(([r, c]) => r === row && c === col)
                    );

                    const isSpawn = row === 5;
                    const isGoal = row === 0;
                    const placeable = row >= 1 && row <= 4;

                    return (
                      <div
                        key={i}
                        data-testid={`cell-${row}-${col}`}
                        onClick={() => handleCellClick(row, col)}
                        className={`
                          relative flex items-center justify-center cursor-pointer
                          transition-all duration-300
                          ${isGoal ? 'pointer-events-none' : ''}
                          hover:bg-white/10
                          ${(activeTool === 'leaf' || activeTool === 'decoy') && placeable ? 'hover:ring-2 hover:ring-white/60 rounded-lg' : ''}
                        `}
                      >
                        {!isGoal && (
                          <div
                            className={`
                            w-1.5 h-1.5 rounded-full
                            ${isPartOfPath ? 'bg-white/60 scale-150 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/10'}
                            ${isSpawn ? 'bg-white/80 scale-[2] shadow-[0_0_12px_rgba(255,255,255,0.8)]' : ''}
                          `}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Danger telegraphing */}
                {dangerCells.map((d, i) => {
                  const def = game.predatorDefs.find((x) => x.id === d.defId)!;
                  return def.kind === 'seagull' ? (
                    <BirdShadow key={`shadow-${d.defId}`} row={d.row} col={d.col} />
                  ) : (
                    <DangerRing key={`danger-${d.defId}-${i}`} row={d.row} col={d.col} />
                  );
                })}

                {/* Leaves */}
                <AnimatePresence>
                  {game.leaves.map((leaf) => (
                    <motion.div
                      key={leaf.id}
                      initial={{ scale: 2, opacity: 0, y: -50 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute z-20 pointer-events-none"
                      style={cellStyle(leaf.row, leaf.col)}
                    >
                      <LeafSprite hitsLeft={leaf.hitsLeft} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Decoys */}
                <AnimatePresence>
                  {game.decoys.map((decoy) => (
                    <motion.div
                      key={decoy.id}
                      exit={{ scale: 0, opacity: 0, rotate: 30 }}
                      className="absolute z-20 pointer-events-none"
                      style={cellStyle(decoy.row, decoy.col)}
                    >
                      <DecoySprite turnsLeft={decoy.turnsLeft} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Turtles */}
                <AnimatePresence>
                  {game.turtles.map((turtle) => {
                    if (turtle.state === 'safe') return null;
                    return (
                      <motion.div
                        key={turtle.id}
                        layoutId={`turtle-${turtle.id}`}
                        data-testid={`turtle-${turtle.id}`}
                        initial={{ scale: 0 }}
                        animate={{
                          scale: turtle.state === 'dead' ? 0.8 : 1,
                          opacity: turtle.state === 'dead' ? 0.5 : 1,
                          top: `${(turtle.row / GRID_ROWS) * 100}%`,
                          left: `${(turtle.col / GRID_COLS) * 100}%`,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTurtleClick(turtle.id);
                        }}
                        className="absolute z-30 cursor-pointer"
                        style={{
                          width: `${100 / GRID_COLS}%`,
                          height: `${100 / GRID_ROWS}%`,
                        }}
                      >
                        <TurtleSprite
                          isInShell={turtle.isInShell}
                          isDead={turtle.state === 'dead'}
                          row={turtle.row}
                          col={turtle.col}
                        />
                        {(activeTool === 'shell' || activeTool === 'sprint') &&
                          turtle.state === 'active' && (
                            <div className="absolute inset-0 rounded-full ring-2 ring-white animate-pulse pointer-events-none"></div>
                          )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Predators */}
                {game.predators.map((p) => {
                  const def = game.predatorDefs.find((d) => d.id === p.defId)!;
                  const frozen = game.freezeTurns > 0;

                  if (def.kind === 'seagull') {
                    return (
                      <React.Fragment key={p.defId}>
                        {frozen ? (
                          <motion.div className="absolute z-40 pointer-events-none" animate={cellStyle(p.row, p.col)}>
                            <div className="w-full h-full flex items-center justify-center opacity-90 saturate-50">
                              <FlyingBird isHunter={def.movement === 'hunter'} />
                            </div>
                            <FrozenBadge />
                          </motion.div>
                        ) : (
                          <BirdSwoop
                            row={p.row}
                            col={p.col}
                            turnCount={game.turnCount}
                            isHunter={def.movement === 'hunter'}
                          />
                        )}
                      </React.Fragment>
                    );
                  }

                  const Sprite =
                    def.kind === 'crab' ? (
                      <CrabSprite row={p.row} col={p.col} />
                    ) : def.kind === 'snake' ? (
                      <SnakeSprite />
                    ) : (
                      <OctopusSprite />
                    );

                  return (
                    <motion.div
                      key={p.defId}
                      data-testid={`predator-${p.defId}`}
                      animate={cellStyle(p.row, p.col)}
                      className={`absolute z-40 pointer-events-none ${frozen ? 'saturate-50' : ''}`}
                    >
                      {Sprite}
                      {frozen && <FrozenBadge />}
                    </motion.div>
                  );
                })}

                {/* Coin pops on rescue */}
                <AnimatePresence>
                  {game.events.rescued.map((r) => (
                    <motion.div
                      key={`coin-${game.events.turn}-${r.id}`}
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 1, 0], y: [-0, -20, -45, -60], scale: [0.5, 1.2, 1, 0.8] }}
                      transition={{ duration: 1.6, times: [0, 0.2, 0.8, 1] }}
                      className="absolute z-[60] pointer-events-none"
                      style={cellStyle(r.row, r.col)}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="bg-[#fbbf24] text-[#78350f] font-black text-sm px-2.5 py-1 rounded-full border-2 border-[#b45309] shadow-lg whitespace-nowrap">
                          +{game.coinPerRescue} 🪙
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {game.events.blocked.map((b, i) => (
                    <motion.div
                      key={`block-${game.events.turn}-${i}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 1.6] }}
                      transition={{ duration: 1.2 }}
                      className="absolute z-[60] pointer-events-none"
                      style={cellStyle(b.row, b.col)}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl drop-shadow">🛡️</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Level End Overlay */}
                <AnimatePresence>
                  {game.status !== 'playing' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 z-50 bg-[#4a3728]/90 flex flex-col items-center justify-center text-center p-6"
                    >
                      {game.status === 'won' && <Confetti />}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                      >
                        {game.status === 'won' ? (
                          <>
                            {game.levelId === LEVELS.length ? (
                              <Trophy size={64} className="text-[#fbbf24] mx-auto mb-4" />
                            ) : (
                              <CheckCircle2 size={64} className="text-[#4ade80] mx-auto mb-4" />
                            )}
                            <h2 data-testid="level-result" className="text-4xl font-black text-white uppercase italic mb-2">
                              {game.levelId === LEVELS.length ? 'Beach Hero!' : 'Level Clear!'}
                            </h2>
                            <p className="text-white/70 mb-1">
                              {safeCount} of {MAX_TURTLES} turtles reached the ocean.
                            </p>
                            <p className="flex items-center justify-center gap-1.5 text-[#fbbf24] font-black text-lg mb-6">
                              <Coins size={18} /> +{game.coinsEarned} coins earned
                              {safeCount === MAX_TURTLES && (
                                <span className="text-xs bg-[#fbbf24] text-[#78350f] px-2 py-0.5 rounded-full uppercase">
                                  Perfect!
                                </span>
                              )}
                            </p>
                          </>
                        ) : (
                          <>
                            <Skull size={64} className="text-red-500 mx-auto mb-4" />
                            <h2 data-testid="level-result" className="text-4xl font-black text-white uppercase italic mb-2">
                              The Tide Turns
                            </h2>
                            <p className="text-white/70 mb-1">
                              {safeCount} saved, {deadCount} lost — you needed {game.requiredRescues}.
                            </p>
                            {game.coinsEarned > 0 && (
                              <p className="flex items-center justify-center gap-1.5 text-[#fbbf24] font-black mb-6">
                                <Coins size={16} /> +{game.coinsEarned} coins kept
                              </p>
                            )}
                            {game.coinsEarned === 0 && <div className="mb-6" />}
                          </>
                        )}

                        <div className="flex flex-wrap gap-3 justify-center">
                          {game.status === 'won' && game.levelId < LEVELS.length && (
                            <button
                              data-testid="next-level"
                              onClick={() => startLevel(game.levelId + 1, game.powers)}
                              className="bg-[#4ade80] text-[#166534] px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2"
                            >
                              Next Level <ChevronRight size={18} />
                            </button>
                          )}
                          <button
                            data-testid="retry-level"
                            onClick={() => startLevel(game.levelId, carriedAtLevelStart)}
                            className="bg-white text-[#4a3728] px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-[#2e8b57] hover:text-white transition-colors flex items-center gap-2"
                          >
                            <RotateCcw size={18} /> {game.status === 'won' ? 'Replay' : 'Try Again'}
                          </button>
                          <button
                            onClick={() => setGame(null)}
                            className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-white/25 transition-colors flex items-center gap-2"
                          >
                            <Home size={18} /> Menu
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Eggs at the bottom */}
              <div className="flex justify-center gap-4 sm:gap-8 py-6 bg-black/5 rounded-b-2xl border-t border-black/10">
                {[...Array(MAX_TURTLES)].map((_, i) => {
                  const isHatched = i < game.nextEggIndex;
                  return (
                    <motion.button
                      key={i}
                      data-testid={`egg-${i}`}
                      whileHover={!isHatched ? { scale: 1.15, y: -8 } : {}}
                      whileTap={!isHatched ? { scale: 0.9 } : {}}
                      onClick={() => dispatch({ type: 'hatch' })}
                      disabled={isHatched || game.status !== 'playing'}
                      className={`
                        relative w-14 h-[70px] sm:w-16 sm:h-20 transition-all duration-700
                        ${isHatched ? 'opacity-10 grayscale scale-75' : 'cursor-pointer hover:drop-shadow-2xl'}
                      `}
                    >
                      <div
                        className={`
                        absolute inset-0 bg-gradient-to-br from-[#fdf5e6] to-[#f5f5dc] rounded-t-[60%] rounded-b-[40%] border-2 border-[#d2b48c] shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.05),4px_4px_8px_rgba(0,0,0,0.1)]
                        ${isHatched ? 'border-dashed opacity-50' : ''}
                      `}
                      >
                        {!isHatched && (
                          <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <div className="absolute top-4 left-3 w-1 h-1 bg-[#8b4513] rounded-full" />
                            <div className="absolute top-6 right-4 w-1.5 h-1.5 bg-[#8b4513] rounded-full" />
                            <div className="absolute bottom-8 left-5 w-1 h-1 bg-[#8b4513] rounded-full" />
                            <div className="absolute bottom-10 right-6 w-1 h-1 bg-[#8b4513] rounded-full" />
                            <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-[#8b4513] rounded-full" />
                          </div>
                        )}

                        {!isHatched && (
                          <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100">
                            <path
                              d="M30,40 L45,35 L40,50 L60,45 L55,65 L75,60"
                              fill="none"
                              stroke="#8b4513"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M70,20 L60,30 L75,35 L65,50"
                              fill="none"
                              stroke="#8b4513"
                              strokeWidth="1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity="0.5"
                            />
                          </svg>
                        )}
                      </div>

                      {!isHatched && (
                        <motion.div
                          animate={{ y: [0, -4, 0], rotate: [-2, 2, -2] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute -top-6 left-1/2 -translate-x-1/2 scale-50 drop-shadow-md"
                        >
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-6 h-7 bg-[#4ade80] rounded-full border-2 border-[#166534] flex flex-col items-center pt-1.5">
                              <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-black rounded-full" />
                                <div className="w-2 h-2 bg-black rounded-full" />
                              </div>
                            </div>
                            <div className="w-11 h-12 bg-[#22c55e] rounded-[45%] border-4 border-[#166534]" />
                          </div>
                        </motion.div>
                      )}

                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/20 rounded-full blur-md" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showShop && game && (
          <ShopModal
            coins={meta.coins}
            levelId={game.levelId}
            onBuy={buyPower}
            onClose={() => setShowShop(false)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none opacity-30 text-[10px] font-mono uppercase tracking-widest">
        <span>© 2026 Turtle Rescue Corp</span>
        <span>Build v2.0.0</span>
      </div>
    </div>
  );
}
