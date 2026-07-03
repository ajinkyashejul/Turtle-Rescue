# Turtle Rescue — Design Decisions

*Game-design evaluation of the proposed improvements, and the decisions taken.
Evaluated against what makes small web games viral and appealing: instant clarity,
"one more try" fairness, visible progression, and moments worth sharing.*

---

## 1. Evaluation of the proposed ideas

### 1a. Improve graphics — **Adopted, focused on game-feel, not art replacement**
The existing hand-built CSS/SVG turtle, crab and egg sprites are genuinely charming
and read as a coherent style — replacing them with stock art would make the game
*more generic*, not more viral. What the prototype lacks is **feedback and juice**,
which is what players actually perceive as "good graphics":

- **Danger telegraphing**: every predator's next strike cell is now shown as a pulsing
  red ring. This is the single highest-impact change — Crossy Road / Frogger-likes go
  viral because deaths always feel *fair* ("I saw it coming, I messed up"), never random.
- **Reward feedback**: coins fly up with a `+N 🪙` pop when a turtle reaches the ocean;
  confetti bursts on level completion.
- **New predator sprites** (snake, octopus) built in the same cute CSS/SVG style.
- **Title screen, level-select and difficulty UI** so the game feels like a product,
  not a prototype. Kept the video ocean background — it's a strong asset.
- **Freeze/decoy visual states** (ice tint, ❄ badge) so every power has readable feedback.

### 1b. Difficulty levels — **Adopted: Easy / Normal / Hard as a global modifier**
Decision: difficulty changes **resources, rescue quota and coin multiplier** — *not*
predator movement patterns. Rationale: each level's predator choreography must stay
learnable and memorizable (that's the puzzle). If Hard changed the patterns, players
couldn't transfer what they learned, and difficulty would feel like randomness.

| | Easy | Normal | Hard |
|---|---|---|---|
| Power grants | +2 leaves, +1 shell bonus | baseline | baseline (no bonus) |
| Rescue quota | −1 turtle | baseline | +1 turtle |
| Coins per rescue | 1 | 2 | 3 |

Hard paying 3× coins creates the viral "risk it for the reward" loop — the economy
itself nudges players toward the harder, more shareable experience.

### 1c. More movement complexity — **Adopted: 5 movement archetypes across a 5-level campaign**
The complaint is exactly right: one vertical bird + one horizontal crab is solved in
two plays. Instead of making those two smarter (which caps out fast), the game now has
a **movement vocabulary** introduced one level at a time — the classic "teach one
mechanic per level" structure (Angry Birds, Cut the Rope):

| Pattern | Predator | Introduced |
|---|---|---|
| Vertical sweep | Seagull | Level 1 (existing) |
| Horizontal sweep | Crab | Level 1 (existing) |
| Diagonal sweep | Seagull | Level 2 |
| Rectangular loop patrol (2-D) | Crab / Snake | Levels 2–3 |
| Speed-2 movement | Crab | Level 3 |
| **Hunter AI** — chases the nearest turtle | Seagull | Level 4 |
| Goal-line guard | Octopus | Level 5 |

The Hunter is the key addition: a predator that *reacts to the player* converts the
game from a solvable pattern-puzzle into a dynamic evade game, which is what gives
late levels replay value. A **Wait** action was added — with cycling predators,
letting a turn pass is a legitimate tactic and was previously impossible.

### 1d. More powers as levels increase — **Adopted: 3 new powers, one unlocked per level**
Each new power is the *counter* to the mechanic introduced alongside it, so unlocks
feel earned and immediately useful:

| Power | Effect | Unlocks | Counters |
|---|---|---|---|
| 🍃 Leaf | Shields a cell; absorbs 3 attacks then withers | Level 1 | everything (limited) |
| 🛡 Shell | Turtle hides for 1 turn (now a **limited** resource) | Level 1 | timing mistakes |
| ⚡ Sprint | Move a turtle 2 steps in one turn | Level 2 | diagonal/loop sweeps |
| ❄ Freeze | All predators skip 2 turns (move *and* attacks) | Level 3 | speed-2 crab |
| 🪺 Decoy | Lure: hunters chase it, absorbs one predator's strike, 3 turns | Level 4 | Hunter AI |

Balance change: Shell was previously **infinite**, which made it strictly dominant
(why ever place a leaf?). It is now a counted resource, which also makes the coin
economy meaningful.

### 1e. Reward system (coins) — **Adopted, with persistence and a shop**
Exactly as requested, plus the two things that make economies sticky:

- **1 coin per rescued turtle** (× difficulty multiplier), +5 flat bonus for a
  perfect level (all 5 saved). Coins are awarded even on a failed level — effort is
  never worth zero, which keeps retry motivation positive.
- **Coins persist in `localStorage`** across sessions, along with level unlocks —
  a returning player keeps their wealth. This is the #1 retention mechanic available
  to a client-side game.
- **Shop** (opened from the in-game coin badge; shopping never consumes a turn):
  Leaf 3 · Shell 4 · Sprint 4 · Decoy 5 · Freeze 6 coins.
- Unspent powers **carry over between levels**, so saving all 5 turtles early
  compounds — a light "economy skill" layer for expert players.

## 2. Ideas evaluated and deliberately NOT taken

- **Replacing sprites with image/asset packs** — loses the distinctive handmade charm; rejected.
- **Difficulty changing predator patterns** — breaks learnability; rejected (see 1b).
- **Real-time predator movement** — would destroy the calm, "thinky" identity that
  differentiates this from a thousand reflex games; the turn-based loop *is* the hook.
- **Random predator movement** — randomness without telegraphing reads as unfair; every
  predator stays deterministic and its next strike is always shown.
- **Sound effects / music** — high value but needs licensed assets; logged as the top
  follow-up (Web Audio "pop"/"splash"/coin chimes would add a lot).
- **Daily challenges / share-your-score cards** — the natural next viral step once the
  campaign exists; out of scope for this pass.

## 3. Architecture decisions

- Game rules extracted into a **pure, framework-free engine** (`src/engine.ts`) with
  level data in `src/levels.ts`. This allowed the game to be **verified by self-play**:
  a bot (`scripts/simulate.mjs`) plays every level on every difficulty through the real
  engine, proving each level is winnable and that quotas are tuned (not too easy, not
  impossible). UI verified by actually playing turns in a real browser via Playwright.
- Turn order preserved from the prototype: player acts → predators move → attacks
  resolve → rescues score → shells reset. All new powers slot into this pipeline.
- Meta-progression (coins, unlocked levels, difficulty) stored in one versioned
  `localStorage` key.
