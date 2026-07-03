// Dumps the bot's winning action sequence for a level as JSON, so the
// Playwright UI test can replay it click-by-click in the real browser.
// Run: npx tsx scripts/dump-actions.ts <levelId> <difficulty>

import { LEVELS } from "../src/levels";
import { createLevelState, applyTurn } from "../src/engine";
import { Difficulty, PlayerAction, GameState, MAX_TURTLES, TURTLE_PATHS } from "../src/types";
import { getDangerCells } from "../src/engine";

// -- same bot as simulate.ts (kept in sync by importing would be nicer, but
//    simulate.ts is a script; duplicate the small core here) --

function candidateActions(s: GameState): PlayerAction[] {
  const actions: PlayerAction[] = [];
  const active = s.turtles
    .filter((t) => t.state === "active")
    .sort((a, b) => b.pathStep - a.pathStep);
  for (const t of active) actions.push({ type: "move", turtleId: t.id });
  if (s.powers.sprint > 0)
    for (const t of active) actions.push({ type: "sprint", turtleId: t.id });
  if (s.nextEggIndex < MAX_TURTLES) actions.push({ type: "hatch" });
  actions.push({ type: "wait" });
  if (s.powers.shell > 0)
    for (const t of active) actions.push({ type: "shell", turtleId: t.id });
  if (s.powers.leaf > 0) {
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

function score(s: GameState): number {
  const safe = s.turtles.filter((t) => t.state === "safe").length;
  const dead = s.turtles.filter((t) => t.state === "dead").length;
  let v = safe * 2000 - dead * 5000;
  if (s.status === "won") v += 100000;
  if (s.status === "lost") v -= 100000;
  for (const t of s.turtles) if (t.state === "active") v += t.pathStep * 30;
  v += s.nextEggIndex * 10;
  v += Object.values(s.powers).reduce((a, b) => a + b, 0) * 15;
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
    if (s1 === s) continue;
    let val: number;
    if (s1.status !== "playing") {
      val = score(s1);
    } else {
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

const levelId = Number(process.argv[2] || 1);
const difficulty = (process.argv[3] || "normal") as Difficulty;
const level = LEVELS.find((l) => l.id === levelId)!;
let s = createLevelState(level, difficulty);
const actions: PlayerAction[] = [];
while (s.status === "playing" && s.turnCount < 300) {
  const a = bestAction(s);
  actions.push(a);
  s = applyTurn(s, a);
}
console.log(
  JSON.stringify(
    {
      levelId,
      difficulty,
      result: s.status,
      saved: s.turtles.filter((t) => t.state === "safe").length,
      actions,
    },
    null,
    2
  )
);
