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

## Git identity note (per-remote auth — configured folder-locally)

Two GitHub accounts are involved, and each remote authenticates as the right one:

- **`origin`** (`ishanjajoo/...`) → pushes as **`ajinkya-mili`** over HTTPS (via `gh`),
  who is a collaborator on the shared repo.
- **`fork`** (`ajinkyashejul/...`) → pushes as **`ajinkyashejul`** over SSH, using the
  personal key `~/.ssh/id_ed25519_personal`, who owns the fork + the Vercel project.

This is wired up with repo-local config (no global changes, no collaborator needed):

```bash
# fork remote uses SSH; this repo forces the personal SSH key
git remote get-url fork        # git@github.com:ajinkyashejul/Turtle-Rescue.git
git config --local core.sshCommand
# → ssh -i /Users/ajinkyashejul/.ssh/id_ed25519_personal -o IdentitiesOnly=yes
```

Commit identity in this folder is already set to `ajinkyashejul` /
`ajinkyashejul4195@gmail.com`.
