# Xeque-Mate: diagnóstico e plano de reorganização

## Contexto

Fork pessoal do projeto original do grupo (Next.js 16 + Prisma 6 + better-auth + PostgreSQL). O projeto está parado desde 14/12/2025, **nunca foi publicado e nunca teve banco hospedado nem usuários reais**, então o banco pode ser recriado do zero sem cuidado com dados existentes. O estado original está marcado com a tag `original-state`.

Objetivo: primeiro fazer o projeto voltar a rodar e corrigir o que está quebrado; só depois pensar em melhorias.

Este arquivo é a fonte de verdade do trabalho. Cada item é uma mudança isolada; o usuário revisa, commita e só então passa ao próximo. Ao concluir um item, marcar o checkbox.

---

## Convenções (copiar para o CLAUDE.md no item 0.1)

### Working rules

- Reply to the user in Portuguese (pt-BR). Keep UI strings and domain names in Portuguese, as the codebase already does. Commit messages are in English.
- Analysis tasks are read-only: do not modify files unless asked.
- Work on one item of `docs/PLANO.md` at a time. Do not refactor beyond the item.
- Never bump a major version. Never run `npm audit fix --force`.
- Never commit, push or create branches; the user does that. When an item is done: summarize what changed, explain how to verify it, suggest a commit message, and tick the item's checkbox in `docs/PLANO.md`.
- Never stage `.env` or `prisma/seed/*.csv`.

### Git workflow

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

---

## Diagnóstico

### A. Impede de rodar

- O cliente Prisma não foi gerado (`app/generated/prisma2` não existe). Os 46 erros de `tsc` vêm todos daí (12 TS2307 e 34 TS7006 em cascata).
- Não existe `.env` nem `.env.example`. Variáveis necessárias: `DATABASE_URL`, `NEXT_PUBLIC_AUTH_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- As migrations estão incompletas: nenhuma cria `torneio`, `participante`, `partida`, `convite`, `Puzzle` nem o enum `ResultadoPartida` (provavelmente criados com `db push`), mas migrations posteriores fazem `ALTER TABLE "torneio"` e referenciam `"Puzzle"`. `prisma migrate deploy` falha num banco novo. Há drift: FKs de `UserAchievement` são RESTRICT na migration e Cascade no schema.
- O CSV de puzzles do Lichess não está no repositório. O usuário já tem o arquivo localmente (~1 GB).
- `npm run lint` chama `next lint`, removido no Next 16.
- Existe um `package-lock.json` vazio (89 bytes) na raiz do repositório, sem `package.json`. Faz o Next inferir a raiz errada do workspace.

### B. Dependências

- `next` fixado em 16.0.3, com 2 vulnerabilidades críticas (RCE, inclusive específica de Windows) e várias altas. Correção: 16.3.x (minor).
- Prisma mistura versões: `prisma`/`@prisma/client` na 6.19 e `@prisma/adapter-pg` na 7.0.1, nunca importado.
- `chess.js` e `react-chessboard` são importados em `app/practice/training-game/page.tsx` sem estarem declarados (vêm por acaso de `@react-chess-tools/react-chess-puzzle`).
- `nanoid` é importado em `app/api/torneios/[id]/route.ts`, não é usado e não está declarado.
- Majors fora deste plano: Prisma 7, TS 7, ESLint 10, lucide 1.x, react-chess-puzzle 2.x.

### C. Segurança e regras de negócio

- Pontos de puzzle podem ser acumulados à vontade: `POST /api/puzzles/complete` aceita qualquer `puzzleId`. A regra de perder elegibilidade por dica/reinício existe só no navegador.
- Pontos de torneio podem ser concedidos várias vezes: `PUT finalizado:true` concede, `DELETE /rodadas` volta `finalizado` para false, e finalizar de novo concede outra vez. `PATCH` de resultado e `POST /rodadas` não bloqueiam torneios finalizados. Dois cliques simultâneos em "finalizar" também podem conceder em dobro.
- O convite não valida nada: `GET /api/torneios/[id]/convite` não exige login nem ser o criador; o aceite nunca valida o token. `token`, `aceito`, `usadoPor` e `expiresAt` não são usados.
- Rota duplicada e quebrada: `app/api/torneios/[id]/convite/aceitar/route.ts` usa `params.id` sem `await`. Ninguém a chama.
- `GET /api/torneios/[id]` e `/participando` retornam o e-mail de todos os participantes.
- Trocar e-mail e excluir conta não funcionam: `lib/auth.ts` não habilita `user.changeEmail.enabled` nem `user.deleteUser.enabled`.
- Páginas sem proteção de login: `/torneios/*`, `/practice/*`, `/ranking`, `/profile` (esta faz `notFound()` em vez de redirecionar).
- `GET /api/torneios/[id]` grava no banco (insere o criador como participante se faltar).

### D. Funcionalidades quebradas ou incompletas

- `/ranking`, `/practice`, `/practice/daily-challenge` e `/practice/weekly-challenge` são pré-renderizadas no build: em produção ficariam congeladas na data do deploy (e o build exige banco).
- `User.wins` nunca é incrementado: "Primeira Vitória" e "Campeão de Rodada" são impossíveis.
- `/api/achievements/check-login` nunca é chamado.
- *(achado no 0.11)* Conquistas só são checadas ao aceitar convite: `AchievementService.recordMatchWin` e `recordTournamentWin` nunca são chamados. O criador não ganha "Primeiro Torneio" pelo próprio torneio, e "Campeão Estreante"/"Lenda dos Torneios" não desbloqueiam ao finalizar (só se o vencedor aceitar outro convite depois). Além disso, o vencedor é decidido só por `pontos` (sem o desempate de `awardTournamentPoints`). Itens 4.8 e 4.9.
- O perfil mostra "Sequência de X dias" fixo. `getWeeklyPosition` calcula a posição de todos os tempos e carrega todos os usuários.
- `NavBar` duplicado na home (`LayoutWrapper` e `app/home/page.tsx`).
- O limite de 5 torneios (criados e participando) conta os finalizados: o usuário fica bloqueado para sempre depois do quinto.
- O suíço gera todas as rodadas de uma vez, sem considerar resultados (melhoria de regra, fica para depois).

### E. Limpeza

- Não usados: `components/achievement-provider.tsx`, `app/data/get-weekly-puzzle.ts`, `app/practice/utils/getWeeklyEnd.ts` (duplica `dates.ts`), `getUserPointsHistory` e `hasPuzzleCompletedToday` em `lib/points.ts`, `GET /api/achievements`, `scripts/check-participante.{js,ts}`, `tailwind.config.ts`. Dependência `pg` (ninguém importa; o Prisma 6 não precisa dela; veio com o adapter removido em 1.4).
- `getAchievements` (`app/data/get-achievements.tsx`) duplica `AchievementService.getUserAchievements`.
- `new PrismaClient()` avulso em `app/practice/{daily,weekly}-challenge/page.tsx` e `app/data/get-weekly-puzzle.ts`.
- Rotas com o truque "params pode ou não ser Promise"; no Next 16 é sempre Promise.
- ESLint: 11 erros e 13 warnings.
- `app/layout.tsx` com metadata "Create Next App" e `lang="en"`. README é o template padrão.

---

## Decisões

**Tomadas**

- Banco novo, local, via Docker (Docker 29 instalado, sem psql local). Nunca houve banco hospedado, então a baseline de migrations é segura.
- Commits em inglês, Conventional Commits, conforme a seção Convenções.
- Mover o app para a raiz do repositório (item 0.2).

**Em aberto** (decidir ao chegar no item)

- 3.4: torneio finalizado é definitivo, ou pode ser reaberto com estorno de pontos?
- 3.7: convite com token secreto e expiração, ou link aberto pelo id (removendo o modelo `Convite`)?
- 4.6: o que conta como "posição semanal" (pontos de `PointsHistory` na semana corrente?).

---

## Fase 0: fazer rodar — branch `phase-0-setup`

- [x] **0.1** Adicionar `docs/PLANO.md` e o CLAUDE.md gerado pelo `/init`, com as seções *Working rules* e *Git workflow* acima e uma linha apontando para `docs/PLANO.md` como plano ativo.
  `docs: add restructuring plan and working rules`
- [x] **0.2** Remover o `package-lock.json` vazio da raiz e mover o app da subpasta para a raiz do repositório (com `git mv`, para preservar o histórico). Apagar as sobras não versionadas (`node_modules`, `.next`) e rodar `npm install` na raiz. *(feito manualmente; o CLAUDE.md já descreve o app na raiz)*
  `chore: move app to repository root`
- [x] **0.3** Criar `docker-compose.yml` com um serviço `postgres:16` (porta 5432, volume nomeado).
  `chore(db): add docker compose for local postgres`
- [x] **0.4** Criar `.env.example` com as 4 variáveis, sem valores reais. O usuário cria o `.env` a partir dele. Confirmar que `.env` está no `.gitignore`.
  `chore(config): add env example`
- [x] **0.5** Trocar o script `lint` para `eslint .`.
  `chore(config): replace next lint with eslint cli`
- [x] **0.6** Rodar `npx prisma generate` e `npx tsc --noEmit`; registrar os erros reais que sobrarem. *(sem commit)*
  *Resultado: `tsc` sem nenhum erro após gerar o cliente (6.19.0). Os 46 erros eram todos do cliente ausente. O lint seguiu igual (11 erros, 13 warnings).*
- [x] **0.7** Recriar as migrations como baseline única: remover as 7 antigas com `git rm` (o histórico as preserva), gerar `prisma/migrations/0_init/migration.sql` com `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` e aplicar com `npx prisma migrate deploy`. Elimina também o drift de FKs.
  `chore(db): replace migrations with single baseline`
- [x] **0.8** Rodar o seed de conquistas (`npm run db:seed`). *(sem commit)*
- [x] **0.9** Adicionar `prisma/seed/*.csv` ao `.gitignore` **antes** de copiar o CSV para `prisma/seed/`.
  `chore: ignore lichess puzzle csv`
- [x] **0.10** Analisar `prisma/seed/seed-puzzles.ts` sem executar: lê em stream ou tudo na memória? Insere em lotes? Filtra por rating/popularidade? O parser bate com o cabeçalho do CSV atual do Lichess? Propor ajustes (ex.: importar só as faixas de rating usadas no diário e no semanal) e, se aprovados, aplicar. Depois rodar a importação.
  `fix(puzzles): filter puzzle import by popularity and fail loudly`
  *Análise: o script já lia em stream, inseria em lotes de 500 (`skipDuplicates`), filtrava pela faixa 1200–2000 (união do diário e do semanal) e o parser batia com o cabeçalho atual do CSV. Problemas: sem filtro de qualidade (~17% dos puzzles da faixa têm popularidade < 80), saía com código 0 em caso de erro, o log somava o lote em vez do que foi criado, e um rating vazio (`NaN`) passava pelo filtro.*
  *Ajustes aplicados: filtro `popularity >= 90` e `nbPlays >= 1000`; código de saída 1 em erro; log com processados/novos pelo retorno do `createMany`; linhas com número inválido são puladas. O limite de 12.000 conta os processados, não os novos, para a reexecução continuar idempotente (não avança para os próximos 12.000 do arquivo).*
  *Resultado: 12.000 puzzles importados em ~8 s (8.237 na faixa do diário, 8.237 ÷ 365 ≈ 22 anos; 3.763 na do semanal). Reexecução: 0 novos.*
- [x] **0.11** Subir com `npx next dev -H 127.0.0.1` e percorrer as telas com 2 usuários. Registrar o resultado na seção "Linha de base" abaixo.
  `docs: record baseline manual test results`

Se aparecer "too many clients" no Postgres durante os testes, antecipar o item 5.3.

*Fim da fase (25/09/2026): `npm run build` sem erros; `/ranking` e `/practice/*` saem estáticas (○), como previsto no item 4.1. Roteiro manual: ver "Linha de base".*

## Fase 1: dependências (sem major) — branch `phase-1-deps`

- [x] **1.1** Atualizar `next` e `eslint-config-next` para 16.3.x. Remover do CLAUDE.md a regra temporária do `npx next dev`.
  `chore(deps): bump next to 16.3`
- [x] **1.2** Declarar `chess.js` e `react-chessboard` nas versões já instaladas.
  `chore(deps): declare chess.js and react-chessboard`
- [x] **1.3** Remover o import não usado de `nanoid`.
  `refactor(tournaments): remove unused nanoid import`
- [x] **1.4** Remover a dependência `@prisma/adapter-pg`.
  `chore(deps): remove unused prisma pg adapter`
- [x] **1.5** `npm update` (patch/minor) e `npm audit fix` **sem** `--force`. Ignorar a sugestão de downgrade do Prisma. Conferir login e cadastro depois (better-auth muda entre minors).
  `chore(deps): update dependencies within current majors`
  *Resultado: só o lockfile mudou (better-auth 1.4.1 → 1.7.6, Prisma 6.19.0 → 6.19.3, react-chessboard 5.8.6 → 5.12.1, entre outros). `react`/`react-dom` seguem fixados em 19.2.0. Audit: de 17 para 3 vulnerabilidades, todas altas e da cadeia `prisma` → `@prisma/config` → `deepmerge-ts` (só na CLI; a "correção" é o downgrade ignorado). Lint ganhou 1 erro por regra nova do `eslint-plugin-react-hooks` 7.1 (`components/ui/carousel.tsx`, fica para 5.5).*

*Fim da fase (26/09/2026): `npm run build` sem erros; roteiro da linha de base sem falhas (48 passos); cadastro, login, logout e login de usuário antigo ok no better-auth 1.7.6.*

## Fase 2: testes do núcleo — branch `phase-2-tests`

- [x] **2.1** Instalar e configurar Vitest; adicionar script `test`.
  `test: set up vitest`
- [ ] **2.2** Testar `deltaFromResultado`, incluindo edição de resultado (vitória → empate, empate → derrota, etc.) e bye.
  `test(tournaments): cover result delta calculation`
- [ ] **2.3** Extrair a ordenação de desempate de `awardTournamentPoints` para uma função pura, sem mudar comportamento.
  `refactor(points): extract tournament ranking sort`
- [ ] **2.4** Testar o desempate (pontos desc, vitórias desc, derrotas asc).
  `test(points): cover tournament tie-breaks`

## Fase 3: segurança e regras de pontos — branch `phase-3-security`

- [ ] **3.1** Extrair `getDailyPuzzle`/`getWeeklyPuzzle` para `app/data/`, reaproveitando a lógica das pages, sem mudar comportamento.
  `refactor(puzzles): extract daily and weekly puzzle selection`
- [ ] **3.2** `POST /api/puzzles/complete` passa a aceitar só o `puzzleId` do dia/semana, calculado no servidor. Limitação aceita: a regra de dica/reinício continua confiando no cliente.
  `fix(puzzles): only accept current daily or weekly puzzle`
- [ ] **3.3** Bloquear `POST`/`DELETE /rodadas` e `PATCH` de resultado quando `finalizado`.
  `fix(tournaments): block changes to finished tournaments`
- [ ] **3.4** Finalizar de forma atômica: `updateMany` com `finalizado: false` no `where`; conceder pontos só se `count === 1`, na mesma transação. Decidir sobre reabrir torneio.
  `fix(points): award tournament points only once`
- [ ] **3.5** `GET` do convite exige login e ser o criador.
  `fix(tournaments): restrict invite link to tournament creator`
- [ ] **3.6** Remover a rota duplicada e quebrada `convite/aceitar`.
  `refactor(tournaments): remove unused invite accept route`
- [ ] **3.7** Aplicar a decisão do convite (validar token/expiração, ou remover o modelo `Convite`).
  `feat(tournaments): validate invite token and expiration` *ou* `refactor(db): drop unused invite model`
- [ ] **3.8** Retirar `email` dos `select` de participantes.
  `fix(tournaments): stop exposing participant emails`
- [ ] **3.9** Habilitar `changeEmail` e `deleteUser` em `lib/auth.ts`. Antes, verificar o que o better-auth exige (senha, sessão recente, verificação por e-mail), já que não há envio de e-mail configurado.
  `fix(auth): enable email change and account deletion`
- [ ] **3.10** Proteger `/ranking`, `/profile` (trocar `notFound()` por `redirect`), `/practice` (layout existente) e `/torneios` (novo `app/torneios/layout.tsx` server-side). O layout é barreira de UX; a proteção real continua nas rotas de API, que não devem perder suas checagens.
  `fix(auth): require login on protected pages`
- [ ] **3.11** Inserir o criador como participante na criação do torneio (`POST`) e deixar o `GET /api/torneios/[id]` somente leitura.
  `fix(tournaments): add creator as participant on creation`

## Fase 4: funcionalidades quebradas — branch `phase-4-fixes`

- [ ] **4.1** Marcar como dinâmicas as páginas de ranking e de puzzles.
  `fix(ranking): render ranking and puzzle pages dynamically`
- [ ] **4.2** Incrementar `User.wins` no `PATCH` de resultado com a mesma lógica de delta. Estender os testes de 2.2 antes.
  `fix(achievements): track match wins`
- [ ] **4.3** Limite de 5 torneios conta só os não finalizados.
  `fix(tournaments): count only active tournaments toward limit`
- [ ] **4.4** Chamar `check-login` após o login.
  `fix(achievements): check login streak on sign-in`
- [ ] **4.5** Mostrar a sequência real no perfil (`AchievementService.calculateUserProgress` já calcula `currentStreak`).
  `fix(profile): show actual login streak`
- [ ] **4.6** Corrigir `getWeeklyPosition` conforme a decisão sobre "posição semanal", sem carregar todos os usuários.
  `fix(profile): compute weekly ranking position`
- [ ] **4.7** Remover o `NavBar` duplicado da home.
  `fix(ui): remove duplicate navbar on home`
- [ ] **4.8** Checar conquistas nos eventos que as disparam: criador ao criar o torneio (`recordTournamentJoined`), vitória de partida no `PATCH` de resultado (`recordMatchWin`, depende de 4.2) e vencedor ao finalizar (`recordTournamentWin`). Devolver as conquistas desbloqueadas na resposta, como o aceite de convite já faz.
  `fix(achievements): check achievements after tournament events`
- [ ] **4.9** `calculateUserProgress` decide o vencedor do torneio só por `pontos`; usar a ordenação de desempate extraída em 2.3.
  `fix(achievements): use tie-breaks to decide tournament winner`

## Fase 5: limpeza — branch `phase-5-cleanup`

- [ ] **5.1** Remover o código morto listado em E.
  `refactor: remove unused modules`
- [ ] **5.2** Unificar `getAchievements` com `AchievementService.getUserAchievements`.
  `refactor(achievements): remove duplicated achievements query`
- [ ] **5.3** Usar só o singleton de `lib/prisma.ts`.
  `refactor(db): use shared prisma client everywhere`
- [ ] **5.4** Simplificar `params` para `await context.params`.
  `refactor: simplify route params handling`
- [ ] **5.5** Corrigir os erros e warnings do ESLint (um commit por área, se ficar grande).
  `fix: resolve eslint errors`
- [ ] **5.6** Ajustar metadata e `lang="pt-BR"` em `app/layout.tsx`.
  `fix(ui): set page metadata and pt-BR language`
- [ ] **5.7** Escrever o README (o que é, stack, como rodar localmente, como importar puzzles).
  `docs: write project readme`

## Depois (fora deste plano)

- Suíço rodada a rodada, considerando resultados (prioridade para uso real no clube).
- Testes de integração das rotas de API.
- CI no GitHub Actions rodando `tsc`, `eslint` e `vitest` em cada PR.
- Majors (Prisma 7, etc.), cada um em item próprio: ler o changelog, adaptar o código, testar a tela afetada.
  - **react-chess-puzzle 0.6.2 → 2.x** (primeiro da fila): a linha 0.6 não recebe mais correções (última versão em 11/2025). Na 2.x, `@react-chess-tools/react-chess-game` virou peer dependency (instalar direto) e a API provavelmente mudou; afeta `WeeklyPuzzleClient.tsx` (desafios diário e semanal). Fazer depois de 3.1/3.2, com o fluxo dos puzzles já corrigido. Levantado em 25/09/2026, com a 2.1.0 como a mais recente.
- Deploy.

---

## Verificação

**Ao fim de cada item:** `git diff` revisado, `npx tsc --noEmit` e, a partir da Fase 2, `npx vitest run`. Testar na mão a tela afetada.

**Ao fim de cada fase:** `npm run build` sem erros e o roteiro manual completo.

**Ao fim do plano:**

- `npx tsc --noEmit`, `npx eslint .` e `npx vitest run` sem erros.
- Na saída do `npm run build`, `/ranking` e `/practice/*` aparecem como dinâmicas (ƒ), não estáticas (○).
- `npx prisma migrate reset` num banco vazio aplica tudo do zero.
- Roteiro manual com 2 usuários: registrar, logar, criar torneio, convidar pelo link, aceitar, gerar rodadas, lançar e editar resultados, finalizar (inclusive clicando duas vezes), conferir pontos no ranking e conquistas no perfil, resolver o puzzle diário, tentar resolver de novo ou mandar outro `puzzleId` (deve ser recusado), trocar e-mail e excluir conta.

---

## Linha de base (preencher no item 0.11)

Executado em 25/09/2026 com 2 usuários de teste (A cria, B é convidado), percorrendo os fluxos via HTTP com sessões reais do better-auth (`fetch` com cookies) e conferindo os efeitos no banco. Cobre API, renderização no servidor (todas as páginas respondem 200, sem erro no log) e dados; **a interface no navegador (tabuleiro, toasts, layout) não foi conferida visualmente**.

| Fluxo | Funciona? | Observação |
|---|---|---|
| Cadastro e login | Sim | Cadastro, login e recusa de senha errada (401) ok. |
| Criar torneio | Sim | Cria, aparece na lista; páginas do torneio e de edição renderizam. |
| Convidar e aceitar | Sim | Link gerado e aceite ok; aceitar duas vezes é recusado. Falhas de C confirmadas por leitura (sem checagem de criador/token). |
| Gerar rodadas | Sim | 1 rodada, 1 partida A×B; não criador recebe 403. |
| Lançar / editar resultado | Sim | Vitória → empate → vitória do outro lado recalcula certo (sem resíduo); não criador recebe 403. |
| Finalizar torneio | Parcial | Pontos certos (1º 100, 2º 60 em `points_history`). Mas `User.wins` fica 0 e nenhuma conquista é checada (ver D; itens 4.2, 4.8). Dupla concessão (C) não testada. |
| Ranking | Sim | Página renderiza. Também abre sem login (C). |
| Conquistas no perfil | Parcial | Página renderiza. Só B ganhou "Primeiro Torneio" (ao aceitar o convite); o criador não, e o vencedor não ganhou "Campeão Estreante" (ver D). Sem login dá 404 (C). |
| Puzzle diário | Sim | Puzzle exibido; completar dá 15 pontos, repetir é recusado. |
| Puzzle semanal | Sim | Puzzle exibido; completar dá 50 pontos, repetir é recusado. |
| Modo treino | Sim (servidor) | Página renderiza; o jogo em si roda no navegador e não foi testado. |

Extras: trocar e-mail (400 `CHANGE_EMAIL_IS_DISABLED`) e excluir conta (404, "Delete user is disabled") falham como previsto em C. `/torneios`, `/practice` e `/ranking` abrem sem login (200).
