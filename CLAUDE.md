# Turtle-Rescue — project notes

## Working branch: `ajinkya`

All active work happens on the **`ajinkya`** branch.

## ⚠️ Always push `ajinkya` to BOTH remotes

This checkout has two remotes:

| Remote   | Repository                     | Purpose |
|----------|--------------------------------|---------|
| `origin` | `ishanjajoo/Turtle-Rescue`     | Shared/upstream repo (its `main` is deployed elsewhere) |
| `fork`   | `ajinkyashejul/Turtle-Rescue`  | Personal fork — connected to the Vercel project `turtle-rescue`, **production branch = `ajinkya`** |

After committing on `ajinkya`, **push to both**:

```bash
git push origin ajinkya   # shared repo
git push fork   ajinkya   # personal fork → triggers Vercel production deploy
```

Pushing to `fork` is what makes changes go live: every commit on `fork`'s `ajinkya`
branch auto-deploys to production on Vercel (project `turtle-rescue`,
`turtle-rescue-pearl.vercel.app`).

## Git identity note

The terminal here authenticates as GitHub account **`ajinkya-mili`** (a collaborator on
`ishanjajoo/Turtle-Rescue`). Vercel is connected via the separate **`ajinkyashejul`**
account, which owns the `fork`.

For `git push fork ajinkya` to work, `ajinkya-mili` must be a **collaborator** on
`ajinkyashejul/Turtle-Rescue`. If a push to `fork` returns `permission denied`, add
`ajinkya-mili` as a collaborator at:
`https://github.com/ajinkyashejul/Turtle-Rescue/settings/access`
