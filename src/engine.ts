// Pure, framework-free game rules. Used by the React UI and by the
// self-play verification bot (scripts/simulate.mjs).

import {
  Difficulty,
  GameState,
  LevelConfig,
  PlayerAction,
  PowerType,
  PredatorDef,
  PredatorState,
  Turtle,
  DECOY_TURNS,
  FREEZE_TURNS,
  LEAF_HITS,
  MAX_TURTLES,
  PERFECT_BONUS,
  TURTLE_PATHS,
} from "./types";
import { DIFFICULTIES } from "./levels";

export const EMPTY_POWERS: Record<PowerType, number> = {
  leaf: 0,
  shell: 0,
  sprint: 0,
  freeze: 0,
  decoy: 0,
};

export function createLevelState(
  level: LevelConfig,
  difficulty: Difficulty,
  carriedPowers: Record<PowerType, number> = EMPTY_POWERS
): GameState {
  const diff = DIFFICULTIES[difficulty];
  const powers = { ...EMPTY_POWERS };
  (Object.keys(powers) as PowerType[]).forEach((p) => {
    powers[p] =
      (carriedPowers[p] || 0) + (level.grants[p] || 0) + (diff.grantBonus[p] || 0);
  });

  return {
    levelId: level.id,
    difficulty,
    predatorDefs: level.predators,
    predators: level.predators.map((def) => ({
      defId: def.id,
      row: def.path[0][0],
      col: def.path[0][1],
      pathIndex: 0,
    })),
    turtles: [],
    leaves: [],
    decoys: [],
    powers,
    hatchedEggs: [],
    freezeTurns: 0,
    requiredRescues: Math.max(1, level.requiredRescues + diff.requiredDelta),
    coinPerRescue: diff.coinPerRescue,
    coinsEarned: 0,
    status: "playing",
    turnCount: 0,
    events: { turn: 0, rescued: [], killed: [], blocked: [], decoyEaten: [] },
  };
}

const defOf = (state: GameState, p: PredatorState): PredatorDef =>
  state.predatorDefs.find((d) => d.id === p.defId)!;

function stepHunter(
  pos: { row: number; col: number },
  target: { row: number; col: number }
): { row: number; col: number } {
  const dr = target.row - pos.row;
  const dc = target.col - pos.col;
  if (dr === 0 && dc === 0) return pos;
  // Close the larger gap first; ties favor the row so swoops look vertical
  if (Math.abs(dr) >= Math.abs(dc)) {
    return { row: pos.row + Math.sign(dr), col: pos.col };
  }
  return { row: pos.row, col: pos.col + Math.sign(dc) };
}

function nearestTo(
  pos: { row: number; col: number },
  candidates: { row: number; col: number }[]
): { row: number; col: number } | null {
  let best: { row: number; col: number } | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = Math.abs(c.row - pos.row) + Math.abs(c.col - pos.col);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function movePredator(state: GameState, p: PredatorState): PredatorState {
  const def = defOf(state, p);
  if (def.movement === "hunter") {
    const targets: { row: number; col: number }[] =
      state.decoys.length > 0
        ? state.decoys
        : state.turtles.filter((t) => t.state === "active");
    const target = nearestTo(p, targets);
    if (!target) return p;
    let pos = { row: p.row, col: p.col };
    for (let i = 0; i < def.speed; i++) pos = stepHunter(pos, target);
    return { ...p, row: pos.row, col: pos.col };
  }
  const nextIndex = (p.pathIndex + def.speed) % def.path.length;
  const [row, col] = def.path[nextIndex];
  return { ...p, pathIndex: nextIndex, row, col };
}

// Where each predator will be after its next move — the danger cells the UI
// telegraphs. When frozen, predators neither move nor attack, so no danger.
export function getDangerCells(
  state: GameState
): { row: number; col: number; defId: string }[] {
  if (state.status !== "playing" || state.freezeTurns > 0) return [];
  return state.predators.map((p) => {
    const next = movePredator(state, p);
    return { row: next.row, col: next.col, defId: p.defId };
  });
}

function validateAction(state: GameState, action: PlayerAction): boolean {
  switch (action.type) {
    case "hatch":
      return (
        action.eggIndex >= 0 &&
        action.eggIndex < MAX_TURTLES &&
        !state.hatchedEggs.includes(action.eggIndex)
      );
    case "move": {
      const t = state.turtles.find((x) => x.id === action.turtleId);
      return (
        !!t &&
        t.state === "active" &&
        t.pathStep + 1 < TURTLE_PATHS[t.pathIndex].length
      );
    }
    case "sprint": {
      const t = state.turtles.find((x) => x.id === action.turtleId);
      return (
        state.powers.sprint > 0 &&
        !!t &&
        t.state === "active" &&
        t.pathStep + 1 < TURTLE_PATHS[t.pathIndex].length
      );
    }
    case "shell": {
      const t = state.turtles.find((x) => x.id === action.turtleId);
      return state.powers.shell > 0 && !!t && t.state === "active";
    }
    case "leaf":
      return (
        state.powers.leaf > 0 &&
        action.row >= 1 &&
        action.row <= 4 &&
        !state.leaves.some((l) => l.row === action.row && l.col === action.col)
      );
    case "decoy":
      return (
        state.powers.decoy > 0 &&
        action.row >= 1 &&
        action.row <= 4 &&
        !state.decoys.some((d) => d.row === action.row && d.col === action.col)
      );
    case "freeze":
      return state.powers.freeze > 0 && state.freezeTurns === 0;
    case "wait":
      return true;
  }
}

function moveTurtleAlongPath(t: Turtle, steps: number): Turtle {
  const path = TURTLE_PATHS[t.pathIndex];
  const nextStep = Math.min(t.pathStep + steps, path.length - 1);
  const [row, col] = path[nextStep];
  return { ...t, pathStep: nextStep, row, col };
}

export function applyTurn(state: GameState, action: PlayerAction): GameState {
  if (state.status !== "playing" || !validateAction(state, action)) return state;

  let s: GameState = {
    ...state,
    turtles: state.turtles.map((t) => ({ ...t })),
    leaves: state.leaves.map((l) => ({ ...l })),
    decoys: state.decoys.map((d) => ({ ...d })),
    predators: state.predators.map((p) => ({ ...p })),
    powers: { ...state.powers },
    events: {
      turn: state.turnCount + 1,
      rescued: [],
      killed: [],
      blocked: [],
      decoyEaten: [],
    },
  };

  // 1. Player action
  switch (action.type) {
    case "hatch": {
      // The clicked egg hatches onto ITS OWN path — egg N is the start of path N
      const pathIndex = action.eggIndex;
      const [row, col] = TURTLE_PATHS[pathIndex][0];
      s.turtles.push({
        id: pathIndex + 1,
        row,
        col,
        state: "active",
        isInShell: false,
        pathIndex,
        pathStep: 0,
      });
      s.hatchedEggs = [...s.hatchedEggs, action.eggIndex];
      break;
    }
    case "move":
      s.turtles = s.turtles.map((t) =>
        t.id === action.turtleId ? moveTurtleAlongPath(t, 1) : t
      );
      break;
    case "sprint":
      s.powers.sprint -= 1;
      s.turtles = s.turtles.map((t) =>
        t.id === action.turtleId ? moveTurtleAlongPath(t, 2) : t
      );
      break;
    case "shell":
      s.powers.shell -= 1;
      s.turtles = s.turtles.map((t) =>
        t.id === action.turtleId ? { ...t, isInShell: true } : t
      );
      break;
    case "leaf":
      s.powers.leaf -= 1;
      s.leaves.push({
        id: s.turnCount * 100 + action.col,
        row: action.row,
        col: action.col,
        hitsLeft: LEAF_HITS,
      });
      break;
    case "decoy":
      s.powers.decoy -= 1;
      s.decoys.push({
        id: s.turnCount * 100 + action.col,
        row: action.row,
        col: action.col,
        turnsLeft: DECOY_TURNS,
      });
      break;
    case "freeze":
      s.powers.freeze -= 1;
      s.freezeTurns = FREEZE_TURNS;
      break;
    case "wait":
      break;
  }

  const frozen = s.freezeTurns > 0;

  // 2. Predators move (frozen predators hold still)
  if (!frozen) {
    s.predators = s.predators.map((p) => movePredator(s, p));
  }

  // 3. Attacks resolve (frozen predators can't attack either)
  if (!frozen) {
    const eatenDecoys = new Set<number>();
    const busyPredators = new Set<string>();
    // A predator that lands on a decoy spends its turn destroying it
    for (const p of s.predators) {
      const decoy = s.decoys.find((d) => d.row === p.row && d.col === p.col);
      if (decoy && !eatenDecoys.has(decoy.id)) {
        eatenDecoys.add(decoy.id);
        busyPredators.add(p.defId);
        s.events.decoyEaten.push({ row: p.row, col: p.col });
      }
    }
    s.decoys = s.decoys.filter((d) => !eatenDecoys.has(d.id));

    for (const p of s.predators) {
      if (busyPredators.has(p.defId)) continue;
      s.turtles = s.turtles.map((t) => {
        if (t.state !== "active" || t.isInShell) return t;
        if (t.row !== p.row || t.col !== p.col) return t;
        const leaf = s.leaves.find(
          (l) => l.row === t.row && l.col === t.col && l.hitsLeft > 0
        );
        if (leaf) {
          leaf.hitsLeft -= 1;
          s.events.blocked.push({ row: t.row, col: t.col });
          return t;
        }
        s.events.killed.push({ id: t.id, row: t.row, col: t.col });
        return { ...t, state: "dead" as const };
      });
    }
    s.leaves = s.leaves.filter((l) => l.hitsLeft > 0);
  }

  // 4. Decoys age out
  s.decoys = s.decoys
    .map((d) => ({ ...d, turnsLeft: d.turnsLeft - 1 }))
    .filter((d) => d.turnsLeft > 0);

  // 5. Rescues: active turtles that reached the ocean row
  s.turtles = s.turtles.map((t) => {
    if (t.state === "active" && t.row === 0) {
      s.events.rescued.push({ id: t.id, row: t.row, col: t.col });
      s.coinsEarned += s.coinPerRescue;
      return { ...t, state: "safe" as const };
    }
    return t;
  });

  // 6. Shells last a single turn; freeze ticks down
  s.turtles = s.turtles.map((t) => ({ ...t, isInShell: false }));
  if (s.freezeTurns > 0) s.freezeTurns -= 1;

  // 7. End conditions
  const safe = s.turtles.filter((t) => t.state === "safe").length;
  const dead = s.turtles.filter((t) => t.state === "dead").length;
  if (safe + dead === MAX_TURTLES) {
    if (safe >= s.requiredRescues) {
      s.status = "won";
      if (safe === MAX_TURTLES) s.coinsEarned += PERFECT_BONUS;
    } else {
      s.status = "lost";
    }
  } else if (dead > MAX_TURTLES - s.requiredRescues) {
    // Quota can no longer be met
    s.status = "lost";
  }

  s.turnCount += 1;
  return s;
}
