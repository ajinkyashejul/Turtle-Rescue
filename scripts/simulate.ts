// Self-play verification: a depth-2 greedy bot plays every level on every
// difficulty through the real game engine. Proves each level is winnable
// and reports how tight the tuning is.
//
// Run: npx tsx scripts/simulate.ts

import { LEVELS, DIFFICULTIES } from "../src/levels";
import { createLevelState, applyTurn, getDangerCells } from "../src/engine";
import {
  GameState,
  PlayerAction,
  Difficulty,
  MAX_TURTLES,
  TURTLE_PATHS,
} from "../src/types";

function candidateActions(s: GameState): PlayerAction[] {
  const actions: PlayerAction[] = [];
  const active = s.turtles
    .filter((t) => t.state === "active")
    .sort((a, b) => b.pathStep - a.pathStep);

  for (const t of active) actions.push({ type: "move", turtleId: t.id });
  if (s.powers.sprint > 0)
    for (const t of active) actions.push({ type: "sprint", turtleId: t.id });
  for (let i = 0; i < MAX_TURTLES; i++) {
    if (!s.hatchedEggs.includes(i)) actions.push({ type: "hatch", eggIndex: i });
  }
  actions.push({ type: "wait" });
  if (s.powers.shell > 0)
    for (const t of active) actions.push({ type: "shell", turtleId: t.id });
  if (s.powers.leaf > 0) {
    // Try shielding each active turtle's current and next cell
    const spots = new Set<string>();
    for (const t of active) {
      spots.add(`${t.row},${t.col}`);
      const path = TURTLE_PATHS[t.pathIndex];
      if (t.pathStep + 1 < path.length) {
        const [r, c] = path[t.pathStep + 1];
        spots.add(`${r},${c}`);
      }
    }
    for (const key of spots) {
      const [row, col] = key.split(",").map(Number);
      actions.push({ type: "leaf", row, col });
    }
  }
  if (s.powers.decoy > 0) {
    for (const [row, col] of [[2, 0], [2, 4], [4, 0], [4, 4]] as const) {
      actions.push({ type: "decoy", row, col });
    }
  }
  if (s.powers.freeze > 0 && s.freezeTurns === 0) actions.push({ type: "freeze" });
  return actions;
}

function powersTotal(s: GameState): number {
  return Object.values(s.powers).reduce((a, b) => a + b, 0);
}

function score(s: GameState): number {
  const safe = s.turtles.filter((t) => t.state === "safe").length;
  const dead = s.turtles.filter((t) => t.state === "dead").length;
  let v = safe * 2000 - dead * 5000;
  if (s.status === "won") v += 100000;
  if (s.status === "lost") v -= 100000;

  for (const t of s.turtles) {
    if (t.state === "active") v += t.pathStep * 30;
  }
  v += s.hatchedEggs.length * 10;
  v += powersTotal(s) * 15; // hoard powers — spending must earn its keep

  // Standing where a predator strikes next is asking for trouble
  const danger = getDangerCells(s);
  for (const t of s.turtles) {
    if (t.state !== "active") continue;
    if (danger.some((d) => d.row === t.row && d.col === t.col)) v -= 400;
  }
  return v;
}

function bestAction(s: GameState): PlayerAction {
  let best: PlayerAction = { type: "wait" };
  let bestVal = -Infinity;
  for (const a1 of candidateActions(s)) {
    const s1 = applyTurn(s, a1);
    if (s1 === s) continue; // invalid action
    let val: number;
    if (s1.status !== "playing") {
      val = score(s1);
    } else {
      // depth 2: assume we also pick our best follow-up
      val = -Infinity;
      for (const a2 of candidateActions(s1)) {
        const s2 = applyTurn(s1, a2);
        if (s2 === s1) continue;
        val = Math.max(val, score(s2));
      }
      if (val === -Infinity) val = score(s1);
    }
    if (val > bestVal) {
      bestVal = val;
      best = a1;
    }
  }
  return best;
}

function playLevel(levelId: number, difficulty: Difficulty) {
  const level = LEVELS.find((l) => l.id === levelId)!;
  let s = createLevelState(level, difficulty);
  const MAX_TURNS = 300;
  while (s.status === "playing" && s.turnCount < MAX_TURNS) {
    s = applyTurn(s, bestAction(s));
  }
  const safe = s.turtles.filter((t) => t.state === "safe").length;
  const dead = s.turtles.filter((t) => t.state === "dead").length;
  return {
    status: s.turnCount >= MAX_TURNS ? "timeout" : s.status,
    safe,
    dead,
    required: s.requiredRescues,
    turns: s.turnCount,
    coins: s.coinsEarned,
  };
}

let failures = 0;
console.log("Self-play verification (depth-2 greedy bot)\n");
for (const level of LEVELS) {
  for (const diff of Object.keys(DIFFICULTIES) as Difficulty[]) {
    const r = playLevel(level.id, diff);
    const ok = r.status === "won";
    if (!ok) failures++;
    console.log(
      `${ok ? "✅" : "❌"} L${level.id} ${level.name.padEnd(18)} [${diff.padEnd(6)}] ` +
        `${String(r.status).padEnd(7)} saved ${r.safe}/${MAX_TURTLES} (need ${r.required}), ` +
        `lost ${r.dead}, ${r.turns} turns, ${r.coins} coins`
    );
  }
}
console.log(failures === 0 ? "\nAll levels winnable on all difficulties." : `\n${failures} FAILED runs.`);
process.exit(failures === 0 ? 0 : 1);
