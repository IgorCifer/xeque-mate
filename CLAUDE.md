# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Xeque-Mate is a chess club web app (tournaments, daily/weekly Lichess puzzles, points ranking, achievements). Personal fork of a group project that was never deployed and has no real data, so the database can be recreated freely.

**Active plan:** [docs/PLANO.md](docs/PLANO.md) is the source of truth for ongoing work. It holds the diagnosis of known bugs, the pending decisions and the ordered checklist of items.

## Working rules

- Reply to the user in Portuguese (pt-BR). Keep UI strings and domain names in Portuguese, as the codebase already does. Commit messages are in English.
- Analysis tasks are read-only: do not modify files unless asked.
- Work on one item of `docs/PLANO.md` at a time. Do not refactor beyond the item.
- Never bump a major version. Never run `npm audit fix --force`.
- Never commit, push or create branches; the user does that. When an item is done: summarize what changed, explain how to verify it, suggest a commit message, and tick the item's checkbox in `docs/PLANO.md`.
- Never stage `.env` or `prisma/seed/*.csv`.

## Git workflow

- `main` always works. One branch per phase: `phase-<n>-<name>` (e.g. `phase-0-setup`). One commit per plan item. Each phase goes into `main` through a pull request, merged with a merge commit (keeps the per-item commits).
- Commits follow Conventional Commits 1.0: `<type>(<scope>): <subject>`
  - subject: imperative mood, lowercase, no trailing period, at most 72 characters (aim for ~50)
  - body (optional): what changed and why, wrapped at 72 characters
  - footer: `Refs: plan <n.m>`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore` (dependencies use `chore(deps)`).
- Scopes: `db`, `deps`, `config`, `auth`, `tournaments`, `puzzles`, `points`, `achievements`, `profile`, `ranking`, `ui`.

Example:

```
fix(tournaments): block changes to finished tournaments

Result edits and round regeneration were still allowed after a
tournament was finished, which let points be awarded twice.

Refs: plan 3.3
```

## Commands

```bash
npm install
npx prisma generate          # required before tsc/dev/build; output is gitignored
npm run dev                  # dev server on 0.0.0.0 (reachable from the LAN); `npx next dev -H 127.0.0.1` for localhost only
npm run build
npx tsc --noEmit             # type check
npm run lint                 # eslint . (11 errors / 13 warnings known; plan 5.5)

docker compose up -d --wait  # local postgres 16 on 127.0.0.1:5432 (URL in .env.example)
npx prisma migrate deploy    # apply migrations (single 0_init baseline)
npm run db:seed              # seeds the Achievement rows (prisma/seed.ts)
npx tsx prisma/seed/seed-puzzles.ts   # imports 12k puzzles from prisma/seed/lichess_db_puzzle.csv (rating 1200-2000, popularity >= 90, plays >= 1000); idempotent
npx tsx prisma/seed/clear-puzzles.ts
```

Required env vars (`.env`, not committed; copy from `.env.example`): `DATABASE_URL`, `NEXT_PUBLIC_AUTH_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. There is no test runner yet (Vitest arrives in plan phase 2).

## Architecture

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui (`components/ui`), Prisma 6 + PostgreSQL, better-auth. Path alias `@/*` maps to the repository root.

**Layout.** The app lives at the repository root. `app/` holds pages, `app/api/*` route handlers, `app/data/*` server-side query helpers and `app/components/` (app shell: `LayoutWrapper` adds header and bottom `NavBar` everywhere except `/login` and `/registrar`). Root `components/` holds shadcn primitives and the achievement toast. Business logic shared by routes lives in `lib/`.

**Data flow.** Server components read data directly (via `app/data/*` or Prisma). Client components mutate through `fetch` to `app/api/*` route handlers, which authorize with `auth.api.getSession({ headers: req.headers })` and check ownership (e.g. `torneio.criadorId`). In Next 16 route/page `params` is a Promise and must be awaited.

**Prisma.** The schema uses the new `prisma-client` generator with output `app/generated/prisma2`; import types/enums from `@/app/generated/prisma2/client` and the shared client as the default export of `lib/prisma.ts`. `prisma.config.ts` loads `.env` via dotenv. The `user`, `session`, `account` and `verification` models belong to better-auth's schema; do not rename their fields.

**Auth.** `lib/auth.ts` (server, email/password only, mounted at `app/api/auth/[...all]`) and `lib/auth-client.ts` (browser `authClient`, uses `NEXT_PUBLIC_AUTH_URL`).

**Tournaments** (`Torneio`, `Participante`, `Partida`, `Convite`):
- `Partida.whiteId`/`blackId` reference `Participante.id`, not `User.id`. `blackId = null` is a bye, stored as `WHITE_WIN`.
- Standings (`pontos` as float, `vitorias`, `derrotas`, `empates`, `partidas`) are denormalized on `Participante` and maintained incrementally: byes are credited when the round is created; `PATCH .../partidas/[partidaId]` applies the difference between the old and new result via `deltaFromResultado`; `DELETE .../rodadas` wipes matches and resets all stats.
- `POST .../rodadas` builds Swiss pairings with `tournament-pairings`, generating up to 10 rounds in one call (shuffled in round 1, avoiding rematches and repeat byes).
- Finishing (`PUT /api/torneios/[id]` with `finalizado: true`) calls `awardTournamentPoints` in `lib/points.ts`.

**Points.** Global ranking is `User.points`, always changed together with a `PointsHistory` row in one transaction (`awardPoints`, `completePuzzle`). Tournament placement ranks by `pontos` desc, `vitorias` desc, `derrotas` asc. Values are in `POINTS_CONFIG`. `PuzzleCompletion` is unique per `(userId, puzzleId, type)`.

**Puzzles.** `Puzzle` rows come from the Lichess puzzle CSV (~1 GB, gitignored, placed in `prisma/seed/`). The daily and weekly puzzles are chosen deterministically in their page files (`app/practice/{daily,weekly}-challenge/page.tsx`): filter by rating band (daily 1200–1699, weekly 1700–2000), order by `externalId`, pick index `(year * 1000 + period) % count`. Both render `WeeklyPuzzleClient`, which posts to `/api/puzzles/complete`. The training game (`app/practice/training-game`) uses `chess.js` + `react-chessboard` directly.

**Achievements.** `Achievement` rows are seeded with fixed UUIDs that must match `ACHIEVEMENT_IDS` in `lib/achievements.ts`. `AchievementService` recomputes progress from existing data (participations, `User.wins`, finished tournaments won, distinct days with a `Session` for login streaks) and unlocks what is due. Routes call its `record*` methods after relevant events and return the newly unlocked achievements for the client toast.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
