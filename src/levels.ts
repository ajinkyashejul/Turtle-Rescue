import { Difficulty, LevelConfig, PowerType } from "./types";

// Helper builders keep the path tables readable
const verticalPath = (col: number): [number, number][] =>
  [0, 1, 2, 3, 4, 5, 4, 3, 2, 1].map((r) => [r, col]);

const horizontalPath = (row: number): [number, number][] =>
  [4, 3, 2, 1, 0, 1, 2, 3].map((c) => [row, c]);

const DIAGONAL_SWEEP: [number, number][] = [
  [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [3, 3], [2, 2], [1, 1],
];

// Rectangular 2-D patrol across rows 2-3 (the mid-beach)
const MID_LOOP: [number, number][] = [
  [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [2, 4], [2, 3], [2, 2], [2, 1], [2, 0],
];

// Small loops for snakes
const UPPER_SNAKE_LOOP: [number, number][] = [
  [1, 1], [1, 2], [1, 3], [2, 3], [2, 2], [2, 1],
];
const LOWER_SNAKE_LOOP: [number, number][] = [
  [3, 1], [3, 2], [3, 3], [4, 3], [4, 2], [4, 1],
];

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "First Steps",
    tagline: "Learn the beach. One seagull, one crab.",
    predators: [
      { id: "gull-1", kind: "seagull", movement: "path", path: verticalPath(2), speed: 1 },
      { id: "crab-1", kind: "crab", movement: "path", path: horizontalPath(3), speed: 1 },
    ],
    grants: { leaf: 2, shell: 2 },
    requiredRescues: 2,
  },
  {
    id: 2,
    name: "Crosswinds",
    tagline: "The seagull sweeps diagonally. The crab roams two rows.",
    predators: [
      { id: "gull-1", kind: "seagull", movement: "path", path: DIAGONAL_SWEEP, speed: 1 },
      { id: "crab-1", kind: "crab", movement: "path", path: MID_LOOP, speed: 1 },
    ],
    grants: { leaf: 2, shell: 1, sprint: 2 },
    requiredRescues: 3,
  },
  {
    id: 3,
    name: "Snake in the Sand",
    tagline: "A snake patrols the dunes and the crab is fast.",
    predators: [
      { id: "gull-1", kind: "seagull", movement: "path", path: verticalPath(1), speed: 1 },
      { id: "crab-1", kind: "crab", movement: "path", path: horizontalPath(3), speed: 2 },
      { id: "snake-1", kind: "snake", movement: "path", path: UPPER_SNAKE_LOOP, speed: 1 },
    ],
    grants: { leaf: 2, shell: 1, sprint: 1, freeze: 2 },
    requiredRescues: 3,
  },
  {
    id: 4,
    name: "The Hunter",
    tagline: "This seagull hunts. Lure it away.",
    predators: [
      { id: "gull-1", kind: "seagull", movement: "hunter", path: [[0, 2]], speed: 1 },
      { id: "crab-1", kind: "crab", movement: "path", path: MID_LOOP, speed: 1 },
      { id: "snake-1", kind: "snake", movement: "path", path: LOWER_SNAKE_LOOP, speed: 1 },
    ],
    grants: { leaf: 3, shell: 2, sprint: 1, freeze: 1, decoy: 2 },
    requiredRescues: 3,
  },
  {
    id: 5,
    name: "Full Tide",
    tagline: "Everything at once — and an octopus guards the shore.",
    predators: [
      { id: "gull-1", kind: "seagull", movement: "hunter", path: [[0, 2]], speed: 1 },
      { id: "crab-1", kind: "crab", movement: "path", path: horizontalPath(3), speed: 2 },
      { id: "snake-1", kind: "snake", movement: "path", path: LOWER_SNAKE_LOOP, speed: 1 },
      { id: "octo-1", kind: "octopus", movement: "path", path: horizontalPath(1), speed: 1 },
    ],
    grants: { leaf: 3, shell: 2, sprint: 2, freeze: 2, decoy: 2 },
    requiredRescues: 4,
  },
];

export interface DifficultyConfig {
  label: string;
  description: string;
  grantBonus: Partial<Record<PowerType, number>>;
  requiredDelta: number;
  coinPerRescue: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    description: "Extra supplies, smaller quota. 1 coin per rescue.",
    grantBonus: { leaf: 2, shell: 1 },
    requiredDelta: -1,
    coinPerRescue: 1,
  },
  normal: {
    label: "Normal",
    description: "The intended experience. 2 coins per rescue.",
    grantBonus: {},
    requiredDelta: 0,
    coinPerRescue: 2,
  },
  hard: {
    label: "Hard",
    description: "Bigger quota, no mercy. 3 coins per rescue.",
    grantBonus: {},
    requiredDelta: 1,
    coinPerRescue: 3,
  },
};

export interface PowerInfo {
  name: string;
  description: string;
  price: number;
  unlockLevel: number;
}

export const POWERS: Record<PowerType, PowerInfo> = {
  leaf: {
    name: "Leaf",
    description: "Shields a cell. Absorbs 3 attacks, then withers.",
    price: 3,
    unlockLevel: 1,
  },
  shell: {
    name: "Shell",
    description: "A turtle hides in its shell for one turn. Immune to attacks.",
    price: 4,
    unlockLevel: 1,
  },
  sprint: {
    name: "Sprint",
    description: "A turtle scrambles 2 steps along its path in one turn.",
    price: 4,
    unlockLevel: 2,
  },
  freeze: {
    name: "Freeze",
    description: "A cold gust — all predators skip 2 turns (no moves, no attacks).",
    price: 6,
    unlockLevel: 3,
  },
  decoy: {
    name: "Decoy",
    description: "A fake egg. Hunters chase it; absorbs a strike. Lasts 3 turns.",
    price: 5,
    unlockLevel: 4,
  },
};

export const POWER_ORDER: PowerType[] = ["leaf", "shell", "sprint", "freeze", "decoy"];
