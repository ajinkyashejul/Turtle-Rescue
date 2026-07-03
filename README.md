# 🐢 Turtle Rescue

A turn-based strategy game: hatch baby turtles and guide them across a
predator-filled beach to the ocean. Every action you take advances the turn —
and the predators.

## Features

- **5-level campaign**, each introducing a new predator movement pattern:
  vertical/horizontal sweeps, diagonal sweeps, 2-D loop patrols, double-speed
  crabs, a **hunter seagull** that chases your turtles, and an octopus that
  guards the shoreline.
- **3 difficulties** (Easy / Normal / Hard) — resources, rescue quota, and coin
  payout scale, but predator choreography stays learnable.
- **5 powers**: 🍃 Leaf shield · 🛡 Shell hide · ⚡ Sprint · ❄ Freeze · 🥚 Decoy.
- **Coin economy**: every rescued turtle pays out instantly; coins persist in
  your browser and buy more powers in the Beach Shop. Perfect levels earn a bonus.
- **Fair-play telegraphing**: every predator's next strike cell is always shown.

Design rationale for all of the above lives in [decision.md](decision.md).

## Run locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev        # http://localhost:3000
```

## Verify

Game rules are a pure engine (`src/engine.ts`), so the game can prove itself:

```bash
npm run lint       # typecheck
npm run simulate   # a bot plays every level on every difficulty and must win
```

`scripts/play.mjs` additionally replays a winning run click-by-click in a real
browser (Playwright), and `scripts/check-freeze.mjs` verifies the Freeze power
visually:

```bash
npm run dump-actions 1 normal > /tmp/l1.json
node scripts/play.mjs /tmp/l1.json /tmp
node scripts/check-freeze.mjs /tmp
```

---

Originally scaffolded in [AI Studio](https://ai.studio/apps/040d25af-a44a-415f-837b-0b768e4897e5).
