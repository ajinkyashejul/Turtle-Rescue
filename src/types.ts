export type TurtleState = "active" | "safe" | "dead";

export interface Turtle {
  id: number;
  col: number;
  row: number;
  state: TurtleState;
  isInShell: boolean;
  pathIndex: number; // Index of the path in TURTLE_PATHS
  pathStep: number; // Current step in the assigned path
}

export interface Leaf {
  id: number;
  row: number;
  col: number;
  hitsLeft: number;
}

export interface Decoy {
  id: number;
  row: number;
  col: number;
  turnsLeft: number;
}

export type PowerType = "leaf" | "shell" | "sprint" | "freeze" | "decoy";

export type PredatorKind = "seagull" | "crab" | "snake" | "octopus";

// How a predator moves each turn:
//  - path: cycles through a fixed list of cells (covers vertical, horizontal,
//    diagonal and 2-D loop patrols — the path shape defines the pattern)
//  - hunter: moves `speed` steps toward the nearest decoy, else nearest turtle
export type MovementKind = "path" | "hunter";

export interface PredatorDef {
  id: string;
  kind: PredatorKind;
  movement: MovementKind;
  path: [number, number][]; // [row, col] cycle; for hunters, path[0] is the start cell
  speed: number; // path steps (or hunter steps) per turn
}

export interface PredatorState {
  defId: string;
  row: number;
  col: number;
  pathIndex: number;
}

export type Difficulty = "easy" | "normal" | "hard";

export interface LevelConfig {
  id: number;
  name: string;
  tagline: string;
  predators: PredatorDef[];
  // Powers granted when the level starts (added on top of carried-over inventory)
  grants: Partial<Record<PowerType, number>>;
  requiredRescues: number; // baseline (normal difficulty)
}

export interface TurnEvents {
  turn: number;
  rescued: { id: number; row: number; col: number }[];
  killed: { id: number; row: number; col: number }[];
  blocked: { row: number; col: number }[];
  decoyEaten: { row: number; col: number }[];
}

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  levelId: number;
  difficulty: Difficulty;
  predatorDefs: PredatorDef[];
  predators: PredatorState[];
  turtles: Turtle[];
  leaves: Leaf[];
  decoys: Decoy[];
  powers: Record<PowerType, number>;
  nextEggIndex: number;
  freezeTurns: number;
  requiredRescues: number; // difficulty-adjusted
  coinPerRescue: number; // difficulty-adjusted
  coinsEarned: number; // this level
  status: GameStatus;
  turnCount: number;
  events: TurnEvents;
}

export type PlayerAction =
  | { type: "hatch" }
  | { type: "move"; turtleId: number }
  | { type: "sprint"; turtleId: number }
  | { type: "shell"; turtleId: number }
  | { type: "leaf"; row: number; col: number }
  | { type: "decoy"; row: number; col: number }
  | { type: "freeze" }
  | { type: "wait" };

// 5 Curved paths that intersect
export const TURTLE_PATHS: [number, number][][] = [
  [[5, 0], [4, 0], [3, 1], [2, 2], [1, 1], [0, 0]], // Path 0
  [[5, 1], [4, 2], [3, 3], [2, 2], [1, 1], [0, 1]], // Path 1
  [[5, 2], [4, 1], [3, 0], [2, 1], [1, 2], [0, 2]], // Path 2
  [[5, 3], [4, 4], [3, 3], [2, 2], [1, 3], [0, 3]], // Path 3
  [[5, 4], [4, 3], [3, 2], [2, 3], [1, 4], [0, 4]], // Path 4
];

export const GRID_ROWS = 6;
export const GRID_COLS = 5;
export const MAX_TURTLES = 5;
export const LEAF_HITS = 3; // attacks a leaf absorbs before withering
export const DECOY_TURNS = 3; // turns a decoy survives
export const FREEZE_TURNS = 2; // turns predators stay frozen (incl. the action turn)
export const PERFECT_BONUS = 5; // flat coin bonus for saving all turtles
