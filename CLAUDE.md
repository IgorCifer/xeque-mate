# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Xeque-Mate is a chess club web app (tournaments, daily/weekly Lichess puzzles, points ranking, achievements). Fork of a group project that was never deployed and has no real data, so the database can be recreated freely. Two developers work on it in parallel.

**Active plan:** [docs/PLANO.md](docs/PLANO.md) holds the roadmap, the diagnosis and the dated decisions. Tasks live in GitHub issues, and their status in the GitHub Project; the plan only links to the issues. Plan 1 (finished) is archived in [docs/PLANO-1.md](docs/PLANO-1.md).

## Working rules

- Reply to the user in Portuguese (pt-BR). Keep UI strings and domain names in Portuguese, as the codebase already does. Commit messages and PR titles are in English.
- Analysis tasks are read-only: do not modify files unless asked.
- Work on one issue at a time. Do not refactor beyond the issue.
- Bump a major version only in the task dedicated to it. Never run `npm audit fix --force`.
- Never commit, push or create branches; the user does that. When a task is done: summarize what changed, explain how to verify it, and suggest the PR title (it becomes the squash commit). If the task settled a decision, record it with the date under "Decisões" in `docs/PLANO.md`.
- Never stage `.env` or `prisma/seed/*.csv`.
- Never write code comments (`//`, `/* */`, JSX `{/* */}`), not even to explain a change. When editing a file, remove the comments it already has.
- Stay inside the task's area. If a change is needed in the other developer's area, suggest opening an issue for them instead of editing it.

## Git workflow

- `main` always works. One branch per task, created from an up-to-date `main` and named `<area>/<short-kebab-summary>` (e.g. `torneios/formato-todos-contra-todos`). Never branch off another task branch.
- One small pull request per task. `main` is protected: changes only land through a PR, and the CI job **Check** (`.github/workflows/ci.yml`: `prisma generate`, `tsc`, lint, tests, build) must pass with the branch up to date with `main`; this applies to admins too. The author merges their own PR with **squash**, so `main` gets one commit per task. Head branches are deleted automatically after the merge.
- Areas (issue labels and branch prefixes): `base-dados`, `base-ui`, `torneios`, `desafios`, `perfil-conta`, `design`. Stage 2 owners: tournaments → Iago (@IagoFsv); challenges, training game, profile, ranking and account → Igor (@IgorCifer). Points and achievements (`features/pontos`, `features/conquistas`) are owned by Igor; other areas call their internal functions and request changes through issues.
- Migrations: at most one per PR. Rebase on `main` right before generating it with `prisma migrate dev`; if `main` got another migration meanwhile, delete yours and generate it again.
- Shared files (`components/ui`, `app/globals.css`, the app shell, `lib/prisma.ts`, `package.json`): change them in a small PR of their own and tell the other developer. Keep the signatures of the internal functions in `features/pontos` and `features/conquistas` stable (`awardTournamentPoints(torneioId, tx?)`, `record*(userId)`); tournaments call them.
- The PR title is the squash commit message and follows Conventional Commits 1.0: `<type>(<scope>): <subject>`
  - subject: imperative mood, lowercase, no trailing period, at most 72 characters (aim for ~50)
  - the PR description (optional body): what changed and why
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci` (dependencies use `chore(deps)`).
- Scopes: `db`, `deps`, `config`, `auth`, `tournaments`, `puzzles`, `training`, `points`, `achievements`, `profile`, `ranking`, `ui`.

Example:

```
fix(tournaments): block changes to finished tournaments

Result edits and round regeneration were still allowed after a
tournament was finished, which let points be awarded twice.
```

## Commands

```bash
nvm use                      # Node version from .nvmrc (24), same as CI
npm install
npx prisma generate          # required before tsc/dev/build; output is gitignored
npm run dev                  # dev server on 0.0.0.0 (reachable from the LAN); `npx next dev -H 127.0.0.1` for localhost only
npm run build
npx tsc --noEmit             # type check
npm test                     # unit + integration (integration needs the docker postgres up)
npm run test:unit            # unit tests only, no database
npm run test:int             # integration tests only (database xequemate_test, created and migrated automatically)
npm run lint                 # eslint . (clean; keep it at zero problems)

docker compose up -d --wait  # local postgres 16 on 127.0.0.1:5432 (URL in .env.example)
npx prisma migrate deploy    # apply migrations (0_init baseline + later ones)
npx prisma migrate dev       # create a migration; in Prisma 7 it no longer runs generate or the seed, run them after
npm run db:seed              # seeds the Achievement rows (prisma/seed.ts)
npx tsx prisma/seed/seed-puzzles.ts   # imports 12k puzzles from prisma/seed/lichess_db_puzzle.csv (rating 1200-2000, popularity >= 90, plays >= 1000); idempotent
npx tsx prisma/seed/clear-puzzles.ts
```

Required env vars (`.env`, not committed; copy from `.env.example`): `DATABASE_URL`, `NEXT_PUBLIC_AUTH_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

Tests use Vitest 4 with two projects in `vitest.config.mts`. `unit` runs `*.test.ts`. `integration` runs `*.int.test.ts` sequentially against `TEST_DATABASE_URL` (default `postgresql://xequemate:xequemate@localhost:5432/xequemate_test`; the config refuses any database whose name does not end in `_test`, because every test truncates all tables except `Achievement` and `_prisma_migrations`). Its global setup runs `prisma migrate deploy` and the achievements seed. Helpers live in `test/integration/`: `createUser` (real better-auth session cookie), `callRoute` (calls a route handler directly), and one helper per operation in `test/integration/ops/` (e.g. `finalizar`). Tests assert database state; when an area moves to the DAL, only the operation helper changes. `server-only` is aliased to an empty module. Logs show only for failing tests (`silent: "passed-only"`). Vitest 5 would need `@types/node` >= 22, a major bump.

## Architecture

**New code follows [docs/ARQUITETURA.md](docs/ARQUITETURA.md):** a Data Access Layer with public functions (`features/<area>/dal.ts`, `server-only`, take the `actor`, check permissions, return DTOs) and internal ones (`internal.ts`, no `actor`, optional `tx: Prisma.TransactionClient`, called only by another DAL), thin Server Actions validated with zod, forms with `useActionState`, code grouped by area under `features/`, and shadcn primitives. The rest of this section describes the current code, which is legacy and is migrated area by area; do not extend legacy patterns (API routes plus `fetch` in `useEffect`) in new code.

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui (`components/ui`), Prisma 7 + PostgreSQL, better-auth. Path alias `@/*` maps to the repository root.

**Layout.** The app lives at the repository root. `app/` holds pages, `app/api/*` route handlers, `app/data/*` server-side query helpers and `app/components/` (legacy shared components). Root `components/` holds shadcn primitives, the achievement toast, `ConfirmProvider` and the app shell: `AppShell` (`components/app-shell.tsx`) adds the header, the navigation (bottom bar on mobile, sidebar from `md`) and a width container for the content everywhere except `/login` and `/registrar`. The root layout mounts the sonner `Toaster` and `ConfirmProvider`: feedback uses `toast` from `sonner` and `useConfirm()` (`Promise<boolean>`), never `alert`/`confirm`/`prompt`. Business logic shared by routes lives in `lib/`.

**Data flow.** Server components read data directly (via `app/data/*` or Prisma). Client components mutate through `fetch` to `app/api/*` route handlers, which authorize with `auth.api.getSession({ headers: req.headers })` and check ownership (e.g. `torneio.criadorId`). In Next 16 route/page `params` is a Promise and must be awaited. Protected pages call `requireSession()` (`lib/session.ts`, redirects to `/login`) themselves, since a layout does not stop its page from rendering; `app/torneios/layout.tsx` and `app/practice/layout.tsx` also call it to cover client-component pages, whose data comes from the API.

**Prisma.** Prisma 7 (`^7.10.0`; the npm `latest` tag points at an 8.x release candidate, so never install `prisma@latest`). The schema uses the `prisma-client` generator with output `app/generated/prisma2`; import types/enums from `@/app/generated/prisma2/client` and the shared client as the default export of `lib/prisma.ts`. Every client needs the `@prisma/adapter-pg` driver adapter: `lib/prisma.ts` for the app, `createScriptClient()` from `prisma/script-client.ts` for seeds and scripts. The database URL lives only in `prisma.config.ts` (not in `schema.prisma`), which loads `.env` via dotenv; the seed command is configured there too. `npm audit` reports high vulnerabilities only in the Prisma CLI's dev dependency chain (`@prisma/config` → `deepmerge-ts`, and `mysql2`, which is never loaded with Postgres); do not try to fix them with `--force`. The `user`, `session`, `account` and `verification` models belong to better-auth's schema; do not rename their fields.

**Auth.** `lib/auth.ts` (server, email/password only, mounted at `app/api/auth/[...all]`) and `lib/auth-client.ts` (browser `authClient`, uses `NEXT_PUBLIC_AUTH_URL`). No email is ever sent, so email change is immediate (`updateEmailWithoutVerification`). A `hooks.before` middleware requires and checks the current `password` in the body of `/change-email` and `/delete-user`, and rejects an email already in use; the client sends it (`authClient.$fetch` for change-email, whose typed method has no password field). Deleting a user cascades to everything they own, including tournaments they created and matches they played in others' tournaments.

**Tournaments** (`Torneio`, `Participante`, `Partida`):
- The invite is an open link by tournament id (`/torneios/[id]/convite`): any logged-in user who has it can view (`GET .../convite`) and join (`POST .../convite`) until rounds are generated; there is no invite model or token.
- The creator is enrolled as a `Participante` when the tournament is created (`POST /api/torneios`) and cannot be removed; `GET /api/torneios/[id]` is read-only.
- Limits count only tournaments not `finalizado`: at most 5 created (checked on `POST /api/torneios`) and 5 joined in other people's tournaments (checked on `POST .../convite`; the ones the user created don't count). `app/torneios/page.tsx` mirrors both in its counters.
- `Partida.whiteId`/`blackId` reference `Participante.id`, not `User.id`. `blackId = null` is a bye, stored as `WHITE_WIN`.
- Standings (`pontos` as float, `vitorias`, `derrotas`, `empates`, `partidas`) are denormalized on `Participante` and maintained incrementally: byes are credited when the round is created; `PATCH .../partidas/[partidaId]` applies the difference between the old and new result via `deltaFromResultado`; `DELETE .../rodadas` wipes matches and resets all stats.
- `POST .../rodadas` builds Swiss pairings with `tournament-pairings`, generating up to 10 rounds in one call (shuffled in round 1, avoiding rematches and repeat byes).
- Finishing (`PUT /api/torneios/[id]` with `finalizado: true`) is final: in one transaction, an `updateMany` guarded by `finalizado: false` flips the flag and, only if it matched, `awardTournamentPoints(id, tx)` awards the points, so repeated or concurrent requests award once (409). Once `finalizado`, the tournament cannot be reopened, and `POST`/`DELETE .../rodadas` and the result `PATCH` answer 409; name, date, mode and description stay editable.

**Points.** Global ranking is `User.points`, always changed together with a `PointsHistory` row in one transaction, by the internal functions in `features/pontos/internal.ts` (`completePuzzle`, `awardTournamentPoints`), which use `withTransaction` from `lib/prisma.ts` to join the caller's transaction or open their own. Tournament placement comes from `rankTournament` (`lib/tournament-ranking.ts`), used by `awardTournamentPoints`, `calculateUserProgress` and `GET /api/torneios/[id]`: `pontos`, then Buchholz, Sonneborn-Berger and `vitorias` (byes and matches without a result don't count toward tie-breaks); a full tie shares the position (1, 1, 3) and its prize. Values and prize rules are in `features/pontos/domain/rules.ts` (`POINTS_CONFIG`, `tournamentPrize`, `puzzlePrize`). `PuzzleCompletion` is unique per `(userId, puzzleId, type)`.

**Puzzles.** `Puzzle` rows come from the Lichess puzzle CSV (~1 GB, gitignored, placed in `prisma/seed/`). The daily and weekly puzzles are chosen deterministically by `getDailyPuzzle`/`getWeeklyPuzzle` in `app/data/get-challenge-puzzle.ts`: filter by rating band (daily 1200–1699, weekly 1700–2000), order by `externalId`, pick index `seed % count` (seed `year * 1000 + dayOfYear` or `year * 100 + weekOfYear`). Both render `WeeklyPuzzleClient`, which posts to `/api/puzzles/complete`; the route recomputes the current puzzle for the type and rejects any other `puzzleId` with 409. The hint/reset rule that forfeits points is still client-only. The training game (`app/practice/training-game`) uses `chess.js` + `react-chessboard` directly.

**Achievements.** The profile reads them through the public DAL `features/conquistas/dal.ts` (`getAchievements`, `getStreaks`). `Achievement` rows are seeded with fixed UUIDs that must match `ACHIEVEMENT_IDS` in `features/conquistas/domain/rules.ts`, where `achievementsDue(progress)` lists what is due. The internal functions in `features/conquistas/internal.ts` recompute progress from existing data (participations, match wins counted from `Partida` rows of finished tournaments with byes excluded, finished tournaments won, and login streaks from `UserActivityDay`, one row per user per day of use in the São Paulo time zone) and unlocks what is due. Routes call `recordTournamentJoined`, `recordTournamentFinished` and `recordDailyLogin` after relevant events (joining or creating a tournament; finishing one checks every participant, since results stay editable until then) and return the requester's newly unlocked achievements; pages show them with `showAchievement` from `components/achievement-toast.tsx` (a sonner `toast.custom`, so it survives navigation); the legacy `useAchievements()` hook just returns it. `DailyActivityCheck` (rendered by `AppShell`) posts to `/api/achievements/check-login` once per day of use, which records the day and checks achievements.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
