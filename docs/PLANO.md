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
- Never write code comments (`//`, `/* */`, JSX `{/* */}`), not even to explain a change. When editing a file, remove the comments it already has.

### Git workflow

- `main` always works. One branch per phase: `phase-<n>-<name>` (e.g. `phase-0-setup`). One commit per plan item. Each phase goes into `main` through a pull request, merged with a merge commit (keeps the per-item commits).
- Commits follow Conventional Commits 1.0: `<type>(<scope>): <subject>`
  - subject: imperative mood, lowercase, no trailing period, at most 72 characters (aim for ~50)
  - body (optional): what changed and why, wrapped at 72 characters
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore` (dependencies use `chore(deps)`).
- Scopes: `db`, `deps`, `config`, `auth`, `tournaments`, `puzzles`, `points`, `achievements`, `profile`, `ranking`, `ui`.

Example:

```
fix(tournaments): block changes to finished tournaments

Result edits and round regeneration were still allowed after a
tournament was finished, which let points be awarded twice.
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
- `User.wins` nunca é incrementado: "Primeira Vitória" e "Campeão de Rodada" são impossíveis. *(resolvido no 4.2: a coluna saiu e as vitórias são contadas das partidas)*
- `/api/achievements/check-login` nunca é chamado. *(resolvido no 4.4, junto com a sequência, que dependia das linhas de `session`)*
- *(achado no 0.11)* Conquistas só são checadas ao aceitar convite: `AchievementService.recordMatchWin` e `recordTournamentWin` nunca são chamados. O criador não ganha "Primeiro Torneio" pelo próprio torneio, e "Campeão Estreante"/"Lenda dos Torneios" não desbloqueiam ao finalizar (só se o vencedor aceitar outro convite depois). Além disso, o vencedor é decidido só por `pontos` (sem o desempate de `awardTournamentPoints`). Itens 4.8 e 4.9. *(checagens resolvidas no 4.8, vencedor no 4.9)*
- *(achado no 3.9)* Excluir a conta apaga em cascata os torneios que a pessoa criou (com as partidas de todos) e as partidas que ela jogou em torneios de outros. Os placares desnormalizados dos adversários em `Participante` continuam contando essas partidas, e em torneio aberto as rodadas ficam com buracos. Não testado a fundo; deduzido do schema (todas as relações são `Cascade`). O mesmo vale para "Sair"/"Excluir" de um torneio finalizado como participante (`DELETE .../participantes/[pid]` permite sair depois de finalizado e apaga as partidas da pessoa). Ver "Depois".
- O perfil mostra "Sequência de X dias" fixo. `getWeeklyPosition` calcula a posição de todos os tempos e carrega todos os usuários.
- `NavBar` duplicado na home (`LayoutWrapper` e `app/home/page.tsx`).
- O limite de 5 torneios (criados e participando) conta os finalizados: o usuário fica bloqueado para sempre depois do quinto.
- O suíço gera todas as rodadas de uma vez, sem considerar resultados (melhoria de regra, fica para depois).

### E. Limpeza

- Não usados: `app/data/get-weekly-puzzle.ts`, `app/practice/utils/getWeeklyEnd.ts` (duplica `dates.ts`), `getUserPointsHistory`, `hasPuzzleCompletedToday` e `awardPoints` (sem uso desde o 3.4) em `lib/points.ts`, `GET /api/achievements`, `scripts/check-participante.{js,ts}`, `tailwind.config.ts`. Dependência `pg` (ninguém importa; o Prisma 6 não precisa dela; veio com o adapter removido em 1.4).
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
- Trocar e-mail e excluir conta exigem a senha atual, conferida no servidor por um hook do better-auth (item 3.9, 26/09/2026).
- Convite é um link aberto pelo id do torneio (UUID): qualquer usuário logado com o link entra enquanto não houver confrontos. O modelo `Convite` foi removido (item 3.7, 26/09/2026).
- Torneio finalizado é definitivo: não pode ser reaberto, e partidas e resultados ficam somente leitura. Nome, data, modo e descrição continuam editáveis (item 3.4, 26/09/2026).
- Limites de torneio separados e só para os em andamento: 5 criados e 5 de outras pessoas; o torneio que a pessoa criou não conta como participação (item 4.3, 27/09/2026).
- Vitórias em partidas são contadas das `Partida`, sem contador; bye não conta. A coluna `User.wins` foi removida (item 4.2, 27/09/2026). Só contam partidas de torneios finalizados, e as conquistas de vitória e de campeão são checadas ao finalizar (item 4.8, 27/09/2026).
- Sequência de dias conta os dias em que a pessoa usou o app (qualquer página logada), não só os logins, no fuso de Brasília. Fica na tabela `user_activity_day` (item 4.4, 27/09/2026).
- Ranking semanal (lista e posição no perfil) soma o `PointsHistory` da semana corrente, de domingo 00h no fuso de Brasília; empate divide a posição (1, 2, 2, 4) (item 4.6, 27/09/2026).
- Classificação do torneio: pontos, depois Buchholz, Sonneborn-Berger e vitórias, todos tirados das partidas (bye e partida sem resultado não contam no desempate). Empate em tudo divide a posição (1, 1, 3), e os empatados recebem os pontos e a conquista da posição. Nome e ordem de inscrição não são critério (item 4.9, 27/09/2026).

**Em aberto** (decidir ao chegar no item)

- Nada no momento.

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
- [x] **2.2** Testar `deltaFromResultado`, incluindo edição de resultado (vitória → empate, empate → derrota, etc.) e bye.
  `test(tournaments): cover result delta calculation`
- [x] **2.3** Extrair a ordenação de desempate de `awardTournamentPoints` para uma função pura, sem mudar comportamento.
  `refactor(points): extract tournament ranking sort`
- [x] **2.4** Testar o desempate (pontos desc, vitórias desc, derrotas asc).
  `test(points): cover tournament tie-breaks`

## Fase 3: segurança e regras de pontos — branch `phase-3-security`

- [x] **3.1** Extrair `getDailyPuzzle`/`getWeeklyPuzzle` para `app/data/`, reaproveitando a lógica das pages, sem mudar comportamento.
  `refactor(puzzles): extract daily and weekly puzzle selection`
- [x] **3.2** `POST /api/puzzles/complete` passa a aceitar só o `puzzleId` do dia/semana, calculado no servidor. Limitação aceita: a regra de dica/reinício continua confiando no cliente.
  `fix(puzzles): only accept current daily or weekly puzzle`
  *Outro `puzzleId` é recusado com 409 e a mensagem "Este não é o desafio atual. Recarregue a página." (o cliente já exibe o `message`). Quem abre a página antes da virada e resolve depois também é recusado, de propósito: trocar pelo id atual daria pontos por um puzzle não resolvido.*
  *Atenção: no build de produção as páginas dos desafios ainda são estáticas (até o 4.1), então mostrariam o puzzle do dia do build e a API recusaria a partir do dia seguinte. Em dev não acontece. Fazer o 4.1 antes de publicar.*
- [x] **3.3** Bloquear `POST`/`DELETE /rodadas` e `PATCH` de resultado quando `finalizado`.
  `fix(tournaments): block changes to finished tournaments`
  *As três rotas respondem 409 depois da checagem de criador; o botão "Excluir Confrontos" também fica desativado em torneio finalizado (gerar e o seletor de resultado já ficavam). Com isso, o `finalizado: false` do `DELETE /rodadas` deixou de ter efeito.*
  *Brecha que sobra para o 3.4: `PUT /api/torneios/[id]` aceita `{ finalizado: false }` e reabre o torneio (testado: depois disso o `PATCH` volta a funcionar e finalizar de novo concede pontos outra vez).*
- [x] **3.4** Finalizar de forma atômica: `updateMany` com `finalizado: false` no `where`; conceder pontos só se `count === 1`, na mesma transação. Decidir sobre reabrir torneio: hoje o `PUT` aceita `finalizado: false` sem restrição (ver 3.3).
  `fix(points): award tournament points only once`
  *Decisão: finalizado é definitivo. O `PUT` recusa `finalizado: false` em torneio finalizado (409) e uma finalização repetida responde 409 "Torneio já finalizado". `awardTournamentPoints` recebe a transação; se a concessão falhar, a finalização é desfeita (antes o torneio ficava finalizado sem pontos). O `DELETE /rodadas` não mexe mais em `finalizado`.*
  *Teste: 5 `PUT finalizado: true` simultâneos → um 200 e quatro 409, 3 concessões para 3 participantes (repetido 7 vezes). A primeira corrida deu um 500 (P2028, a transação não conseguiu começar em 2 s) porque o `import()` dinâmico de `lib/points` compilava dentro da transação no dev; virou import estático.*
  *Sobra: o `PATCH` de resultado lê `finalizado` antes de gravar; se a finalização acontecer exatamente entre a leitura e a gravação, o resultado muda depois dos pontos. Janela de milissegundos, só o criador faz as duas coisas.*
- [x] **3.5** `GET` do convite exige login e deixa de devolver o registro do convite (token). *(Reescrito em 26/09/2026: o texto original pedia "ser o criador", mas quem chama esse `GET` é a página que o convidado abre, `app/torneios/[id]/convite/page.tsx`; o criador monta o link no cliente e nunca chama a rota.)*
  `fix(tournaments): require login to view invite`
  *Sem login: 401 "Faça login para ver o convite". Logado (convidado ou criador): 200 com `{ torneio }`, sem `convite`. A página só usava `data.torneio`, então não mudou. O `GET` ainda cria o registro `Convite` na primeira visita; isso sai ou muda no 3.7.*
- [x] **3.6** Remover a rota duplicada e quebrada `convite/aceitar`.
  `refactor(tournaments): remove unused invite accept route`
- [x] **3.7** Aplicar a decisão do convite (validar token/expiração, ou remover o modelo `Convite`). Em qualquer caso, o `GET` do convite para de gravar no banco; com token, gerar o link vira uma ação só do criador (a parte "ser o criador" que saiu do 3.5). Corrigir também o link de convite, fixo em `http://192.168.0.7:3000` em `app/torneios/[id]/page.tsx` (usar `window.location.origin`).
  `feat(tournaments): validate invite token and expiration` *ou* `refactor(db): drop unused invite model`
  *Decisão: link aberto. Migration `20260926174234_drop_convite` apaga a tabela `convite` (só ela: o diff entre banco e schema não trouxe mais nada). O `GET` do convite não grava mais nada; o link usa `window.location.origin`. Efeito colateral bom: a FK `convite.criadoPorId` era `RESTRICT` e impediria excluir a conta de quem criou torneio (3.9). Conferido: `migrate deploy` num banco vazio aplica as duas migrations e bate com o schema. Commitado junto com o 3.6, a pedido.*
- [x] **3.8** Retirar `email` dos `select` de participantes.
  `fix(tournaments): stop exposing participant emails`
  *5 `select` em `GET /api/torneios/[id]` e `/participando`, mais os tipos que citavam o campo; nenhuma tela exibia o e-mail. Commitado junto com o 3.9, a pedido.*
- [x] **3.9** Habilitar `changeEmail` e `deleteUser` em `lib/auth.ts`. Antes, verificar o que o better-auth exige (senha, sessão recente, verificação por e-mail), já que não há envio de e-mail configurado.
  `fix(auth): enable email change and account deletion`
  *O que o better-auth 1.7.6 exige: trocar e-mail sem envio de e-mail só funciona com `updateEmailWithoutVerification` (e só para e-mail não verificado, o caso de todos aqui) e não aceita senha; excluir conta aceita senha, mas sem ela exclui se a sessão tiver menos de 24 h (`freshAge`); trocar para um e-mail já usado responde sucesso sem mudar nada.*
  *Decisão: senha obrigatória nas duas ações, conferida num hook `before` em `lib/auth.ts` (roda antes da validação do endpoint, com o corpo original); o hook também recusa e-mail já em uso com mensagem clara. A tela de trocar e-mail passou a enviar a senha que já pedia (via `authClient.$fetch`); a de excluir ganhou o campo. Testado: sem senha/senha errada → 400, sem login → 401, com senha → troca/exclui; excluir funciona para quem criou torneio e jogou partidas (efeito em cascata registrado no Diagnóstico D).*
- [x] **3.10** Proteger `/ranking`, `/profile` (trocar `notFound()` por `redirect`), `/practice` (layout existente) e `/torneios` (novo `app/torneios/layout.tsx` server-side). O layout é barreira de UX; a proteção real continua nas rotas de API, que não devem perder suas checagens.
  `fix(auth): require login on protected pages`
  *Feito com `requireSession()` (`lib/session.ts`, com `cache` do React) chamado nas próprias páginas de servidor (`/ranking`, `/profile`, `/practice`, desafios), e não só no layout: o guia de autenticação do Next 16 avisa que o layout não impede a página de rodar nem de aparecer no payload, e essas páginas leem o banco direto. Os layouts de `/torneios` e `/practice` cobrem as páginas client (dados vêm da API). Testado: as 13 páginas protegidas dão 307 → `/login` sem sessão e 200 com; `/login` e `/registrar` seguem abertas. Efeito colateral: `/ranking` e `/practice/*` viraram dinâmicas (ver 4.1).*
- [x] **3.11** Inserir o criador como participante na criação do torneio (`POST`) e deixar o `GET /api/torneios/[id]` somente leitura.
  `fix(tournaments): add creator as participant on creation`
  *O `POST` já inscrevia o criador e a rota de remover participante já recusa remover o líder, então a inserção no `GET` só cobria torneios anteriores a isso (o banco foi recriado na Fase 0). O `GET` deixou de gravar e passou a ordenar os participantes por inscrição (`createdAt`), mantendo o criador em primeiro; a tela acha o líder pelo `criadorId`. Testado: 1 inscrito logo após o `POST`; remover o líder → 400; com a inscrição do criador apagada à mão, 4 `GET`s não recriam nada.*

*Fim da fase (26/09/2026): `tsc`, `vitest` (38) e `npm run build` sem erros; lint no total conhecido (10 erros, 13 warnings, item 5.5); `/ranking` e `/practice/*` saem dinâmicas (ƒ). Roteiro com 2 usuários pela API contra o build de produção (`next start`): 49/49 checagens ok (páginas protegidas, cadastro/login, convite, rodadas e edição de resultado, finalização com 3 cliques simultâneos, ranking e perfil, puzzles, trocar e-mail e excluir conta), sem erro no log. A interface no navegador não foi conferida visualmente.*

## Fase 4: funcionalidades quebradas — branch `phase-4-fixes`

- [x] **4.1** Marcar como dinâmicas as páginas de ranking e de puzzles.
  *(Adiantado pelo 3.10: ao ler a sessão da requisição, `/ranking` e `/practice/*` já saem dinâmicas (ƒ) no build. Resta conferir e marcar; provavelmente sem mudança de código.)*
  `docs: confirm ranking and puzzle pages render dynamically`
  *Sem mudança de código. As cinco páginas chamam `requireSession()`, que lê `headers()`, e isso já as torna dinâmicas. O guia do Next 16 (`connection`) diz que `connection()`/`dynamic = 'force-dynamic'` só são necessários quando a página não usa APIs da requisição; acrescentar seria redundante. Conferido em 27/09/2026 com `npm run build`: `/ranking`, `/practice`, `/practice/daily-challenge`, `/practice/weekly-challenge` e `/practice/training-game` saem ƒ; só `/_not-found`, `/login` e `/registrar` saem estáticas (○). Se um dia alguma dessas páginas deixar de exigir login, o `requireSession()` sai e ela precisa de `await connection()` no lugar.*
- [x] **4.2** ~~Incrementar `User.wins` no `PATCH` de resultado com a mesma lógica de delta.~~ Contar as vitórias em partidas a partir das `Partida` e remover `User.wins`.
  `fix(achievements): count match wins from played matches`
  *Decisão (27/09/2026): sem contador. Manter `User.wins` exigiria acertá-lo em todo caminho que muda ou apaga partidas (editar resultado, excluir confrontos, sair do torneio, excluir conta em cascata), e bastava esquecer um para o número ficar errado; excluir confrontos e lançar de novo fabricaria vitórias. `calculateUserProgress` passou a contar as partidas com `WHITE_WIN` jogadas de brancas (com `blackId`, então bye não conta) ou `BLACK_WIN` de pretas, e a migration `20260927180741_drop_user_wins` apaga a coluna. Os testes de 2.2 não mudaram: a regra saiu do delta.*
  *Testado com um script contra o banco local: torneio com vitória de brancas, vitória de pretas, 2 byes, empate e partida sem resultado dá a=2, b=0, c=1; "Primeira Vitória" desbloqueia; depois de apagar as partidas, 0 para todos. `migrate diff` entre banco e schema sem diferença. As conquistas ainda só são checadas no aceite do convite; chamar `recordMatchWin` no `PATCH` é o 4.8.*
- [x] **4.3** Limite de 5 torneios conta só os não finalizados.
  `fix(tournaments): count only active tournaments toward limit`
  *Decisão (27/09/2026): limites separados. Até 5 torneios em andamento criados (`POST /api/torneios`) e até 5 em andamento de outras pessoas (`POST .../convite`). Desde o 3.11 o criador também é participante, então o próprio torneio contava como participação: quem criava 5 não entrava em nenhum outro, e quem participava de 5 ainda podia criar mais 5. A tela `/torneios` usa a mesma regra nos contadores e no bloqueio do botão; as listas continuam mostrando os finalizados.*
  *Testado pela API com 3 usuários: 6º criado barrado, liberado depois de finalizar um; 6º torneio de outros barrado, liberado quando um deles é finalizado; os 5 criados não impedem entrar em torneio de outro. Sobra: contar e criar não são atômicos, então dois pedidos simultâneos podem passar do limite por um (não afeta pontos).*
- [x] **4.4** ~~Chamar `check-login` após o login.~~ Registrar os dias de uso numa tabela própria e calcular a sequência a partir dela; chamar `check-login` a cada dia de uso.
  `fix(achievements): track daily activity for login streaks`
  *Achado: a sequência era calculada das linhas de `session`, mas o `sign-out` do better-auth apaga a linha da sessão, e quem continua logado não cria sessão nova (dura 7 dias). Quem saía e entrava perdia os dias anteriores, e quem ficava logado nunca passava de 1: "Começo da Jornada" e "Dedicado" eram quase impossíveis. Só chamar a rota depois do login não resolveria.*
  *Decisão (27/09/2026): tabela `user_activity_day` (uma linha por usuário por dia, chave `(userId, day)`, migration `20260927182037_add_user_activity_day`). O dia é o de Brasília (`America/Sao_Paulo`), não o fuso do servidor. `recordDailyLogin` grava o dia com `createMany` + `skipDuplicates` (sem erro em chamadas simultâneas) e checa as conquistas. Quem chama é `DailyActivityCheck`, um componente client no `LayoutWrapper` (fora de `/login` e `/registrar`): um `POST` por dia, na primeira página que a pessoa abre, repetido se a aba ficar aberta até o dia seguinte e ela navegar. A resposta alimenta o toast. A gravação não fica no `requireSession()` porque ele roda durante a renderização (e nos prefetches), e mutação na renderização não é boa prática. A lógica da sequência virou função pura em `lib/activity.ts` (9 testes).*
  *Testado pelo servidor de dev: cadastro → `check-login` duas vezes no mesmo dia → 1 linha; sem login → 401; logout e login de novo → o dia continua lá; com os 2 dias anteriores inseridos, o `check-login` desbloqueia "Começo da Jornada" e o progresso dá sequência atual 3 e maior 3; excluir a conta apaga os dias em cascata. O toast na tela não foi conferido no navegador.*
  *Achado de passagem (fora do item): `useAchievementToast` perde conquistas quando várias chegam juntas. O `forEach(showAchievement)` usa o mesmo `achievement` desatualizado (null) em todas as chamadas, então só a última aparece e a fila nunca é usada. Afeta também o aceite de convite. *(corrigido no 4.8)*
- [x] **4.5** Mostrar a sequência real no perfil (`AchievementService.calculateUserProgress` já calcula `currentStreak`).
  `fix(profile): show actual login streak`
  *O cálculo da sequência saiu de `calculateUserProgress` para `AchievementService.calculateStreaks`, que ela reaproveita. O perfil chama só esse método, sem as contagens de torneios e vitórias. O texto fixo "Sequência de X dias" virou `currentStreak`, com "dia" no singular.*
  *Testado pelo servidor de dev com um usuário novo: sem dias → 0 dias; depois do `check-login` → 1 dia; hoje e os 2 dias anteriores → 3 dias; ontem e anteontem → 2 (a sequência continua viva até o fim de hoje); só anteontem → 0. `tsc` e `vitest` passando.*
  *Limitação: o `check-login` roda no cliente depois da renderização. Se o perfil for a primeira página do dia, ele mostra a sequência sem o dia de hoje (ex.: 2 em vez de 3, ou 0 em vez de 1 depois de uma falha) até a próxima navegação. Ver "Depois".*
- [x] **4.6** Corrigir `getWeeklyPosition` conforme a decisão sobre "posição semanal", sem carregar todos os usuários.
  `fix(profile): compute weekly ranking position`
  *Achado: `getWeeklyPosition` ordenava por `User.points` (total de sempre), então o perfil mostrava a posição geral com o rótulo "Ranking Semanal". A lista semanal (`getWeeklyRanking`) usava outra regra, os últimos 7 dias em janela móvel.*
  *Decisão (27/09/2026): a semana é a corrente, de domingo 00h até agora no fuso de Brasília (mesmo começo de semana do puzzle semanal), e quem empata divide a posição (1, 2, 2, 4). `weekStart` em `lib/activity.ts` calcula o começo da semana; `withTiedPositions` em `lib/ranking.ts` numera a lista (9 testes novos). `getWeeklyRanking` agrupa, ordena e corta no banco (`having` > 0, `orderBy` pela soma). `getWeeklyPosition` soma os pontos da pessoa na semana e conta só os usuários com soma maior; sem pontos na semana, fica "Sem posição". Os rankings mensal e de todos os tempos não mudaram.*
  *Testado pelo servidor de dev com 6 usuários e pontos inseridos em `points_history`: 30, 20 (em duas linhas), 20, 50 às 23h59 de sábado, 10 às 00h00 de domingo e nenhum. Perfis: 1º, 2º, 2º, sem posição, 4º, sem posição; a lista semanal de `/ranking` numerou igual. `tsc`, `vitest` (56) e `eslint` nos arquivos alterados passando.*
  *Achados de passagem (fora do item): o diálogo de ranking do perfil passa a lista semanal para as três abas (`ProfileClient`), e `getAllTimeRanking` é importado sem uso em `app/profile/page.tsx`. O puzzle semanal troca no domingo pelo horário do servidor (`getWeekOfYear`), não pelo de Brasília; com o servidor em UTC, a troca acontece às 21h de sábado e o ranking às 00h de domingo. Ver "Depois".*
- [x] **4.7** Remover o `NavBar` duplicado da home.
  `fix(ui): remove duplicate navbar on home`
  *Os dois eram `fixed bottom-0` e ficavam um sobre o outro: parecia um só, mas o fundo semitransparente saía mais escuro na home e os links apareciam duas vezes para teclado e leitor de tela. Testado com usuário logado: `/home` passou de 2 para 1 `<nav>`.*
- [x] **4.8** Checar conquistas nos eventos que as disparam: criador ao criar o torneio (`recordTournamentJoined`), vitória de partida no `PATCH` de resultado (`recordMatchWin`, depende de 4.2) e vencedor ao finalizar (`recordTournamentWin`). Devolver as conquistas desbloqueadas na resposta, como o aceite de convite já faz.
  `fix(achievements): check achievements after tournament events`
  *Decisão (27/09/2026): vitória em partida só conta em torneio finalizado. Até finalizar, o criador ainda pode trocar o resultado, e conquista nunca é retirada: checar no `PATCH` daria "Primeira Vitória" por uma vitória que depois vira empate. `calculateUserProgress` passou a contar só as `Partida` de torneios finalizados, e o `PATCH` de resultado não checa conquistas. O texto do item citava `recordMatchWin` no `PATCH`; ele e `recordTournamentWin` deram lugar a `recordTournamentFinished`.*
  *`POST /api/torneios` checa o criador. A finalização checa todos os participantes depois da transação (o serviço usa o cliente global, não o `tx`): quem ganhou partidas recebe as de vitória, e o 1º colocado as de campeão. Quem finaliza é sempre o criador; as conquistas dos outros são gravadas e aparecem no perfil, mas a resposta só traz as de quem fez o pedido, então só ele vê o toast.*
  *Achado: o aceite de convite mostrava o toast e logo fazia `router.push("/torneios")`, que desmonta a página e o toast junto; a criação de torneio faria o mesmo. O `AchievementProvider` (listado como não usado em E) passou a envolver o `LayoutWrapper`, que persiste entre navegações, e as telas usam `useAchievements()`: criação, página do torneio, convite e `DailyActivityCheck`. Fica um toast só na tela.*
  *Corrigida também a fila do toast (achado no 4.4, estava em "Depois"): com a checagem na finalização, o vencedor do primeiro torneio desbloqueia "Primeira Vitória" e "Campeão Estreante" juntas, e só a última aparecia. `useAchievementToast` guarda a fila no estado com atualizações funcionais e mostra o primeiro item.*
  *Com mais lugares checando, duas checagens simultâneas da mesma pessoa tentariam gravar a mesma conquista, e a segunda cairia na chave única `(userId, achievementId)` com 500. O desbloqueio passou a usar `createMany` com `skipDuplicates` e só devolve a conquista se a linha foi criada.*
  *Testado pela API com 3 usuários: criar o 1º torneio → "Primeiro Torneio"; criar o 2º → nada; lançar vitória da convidada e depois trocar para vitória do criador → `PATCH` sem conquistas e ninguém ganha "Primeira Vitória"; `check-login` antes de finalizar → nada; finalizar com o criador em 1º → "Primeira Vitória" e "Campeão Estreante" na mesma resposta; finalizar de novo → 409; torneio de 3 com bye, finalizado por outro criador → a convidada que venceu a partida ganha "Primeira Vitória" sem estar na resposta. `tsc` e `vitest` (56) passando; o ESLint nos arquivos alterados só aponta erros antigos (5.5). Os dois toasts em sequência não foram conferidos no navegador.*
- [x] **4.9** `calculateUserProgress` decide o vencedor do torneio só por `pontos`; usar a ordenação de desempate extraída em 2.3 (`lib/tournament-ranking.ts`). O `GET /api/torneios/[id]` tem uma terceira cópia da regra, com o nome como último critério: num empate total, a tela pode mostrar em 1º quem não recebeu os pontos de 1º. Decidir o critério final (nome? ordem de inscrição?) e usar a mesma função nos três lugares.
  `fix(achievements): use tie-breaks to decide tournament winner`
  *Decisão (27/09/2026): nome e ordem de inscrição não dizem nada sobre o torneio, então o desempate passou a ser o de torneio suíço: pontos, Buchholz (soma dos pontos dos adversários), Sonneborn-Berger (pontos dos adversários vencidos mais metade dos empatados) e vitórias. Derrotas saíram: com pontos e vitórias iguais, só diferem se alguém tiver partida sem resultado. Bye e partida sem resultado não entram no Buchholz nem no SB. Empate em tudo divide a posição (1, 1, 3): os empatados recebem os pontos da posição, e quem fica em 1º dividido ganha a conquista de campeão.*
  *`rankTournament` (`lib/tournament-ranking.ts`) recebe participantes e partidas e devolve a lista ordenada com `buchholz`, `sonnebornBerger` e `posicao`. Os três lugares usam ela: `awardTournamentPoints` dá os pontos pela `posicao` (não mais pelo índice), `calculateUserProgress` conta os torneios finalizados em que a pessoa ficou em 1º, e o `GET /api/torneios/[id]` monta o `ranking`. As duas tabelas da página do torneio ganharam as colunas "#", "Buchholz" e "SB". `sortTournamentRanking` saiu; os testes foram reescritos para os critérios novos (10 de `rankTournament`, 2 de `compareTournamentRanking`).*
  *Testado pela API com 3 usuários e 3 rodadas, em que cada um tem um bye e vence um dos outros (A vence B, B vence C, C vence A): o `GET` mostra os três em 1º com 2 pontos, 2 vitórias, Buchholz 4 e SB 2; ao finalizar, os três recebem 100 pontos (`tournament_1st`) e "Primeira Vitória" e "Campeão Estreante". `tsc` e `vitest` (57) passando; o ESLint nos arquivos alterados só aponta avisos antigos (5.5). A tabela na tela não foi conferida no navegador, e o caso em que o Buchholz decide entre posições diferentes só foi coberto pelos testes unitários.*

## Fase 5: limpeza — branch `phase-5-cleanup`

- [x] **5.1** Remover o código morto listado em E.
  `refactor: remove unused modules`
  *`getWeeklyEnd.ts` não estava sem uso: `app/practice/page.tsx` importava dele. A página passou a importar de `dates.ts`, que tem as mesmas funções e ainda `getDailyEndDate`. Com o `GET /api/achievements` apagado, `AchievementService.getUserProgress` (só repassava para `calculateUserProgress`) perdeu o único uso e saiu junto. O `components.json` apontava o shadcn para o `tailwind.config.ts`; ficou `"config": ""`, que é o valor do shadcn para Tailwind 4 (sem `@config` no CSS, o Tailwind 4 nunca leu esse arquivo, então os estilos não mudam). `pg` e `@types/pg` saíram do `package.json`; o `pg` continua citado no lockfile só como peer opcional do better-auth.*
  *Verificado: `tsc`, `vitest` (57) e `npm run build` sem erros; `/ranking` e `/practice/*` seguem ƒ. O lint caiu para 9 erros e 13 warnings (o erro a menos era o `require()` de `scripts/check-participante.js`). O build falhou uma vez por causa de tipos antigos de um `next dev` anterior (`.next/dev/types`, que citavam a rota apagada); apagar essa pasta resolveu, e ela é recriada pelo próximo `next dev`.*
- [x] **5.2** Unificar `getAchievements` com `AchievementService.getUserAchievements`.
  `refactor(achievements): remove duplicated achievements query`
  *O perfil era o único que usava `getAchievements` e sempre passava o `userId`. O ramo sem usuário nunca rodava, e o resto era uma cópia de `getUserAchievements`. O perfil passou a chamar `AchievementService.getUserAchievements`, e `app/data/get-achievements.tsx` foi apagado.*
  *Testado pelo servidor de dev com um usuário novo: perfil com as 8 conquistas bloqueadas; depois de criar um torneio, "Primeiro Torneio" aparece desbloqueada e as outras 7 continuam bloqueadas. `tsc` e `vitest` (57) passando. No teste, o banco local estava sem as migrations do 4.2 e do 4.4, e o perfil dava 500 (`user_activity_day` não existia); `prisma migrate deploy` resolveu.*
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
- O que a exclusão de conta deve fazer com torneios e partidas de outros (achado no 3.9): anonimizar o jogador em vez de apagar em cascata, ou bloquear a exclusão enquanto houver torneio aberto.
- Testes de integração das rotas de API.
- CI no GitHub Actions rodando `tsc`, `eslint` e `vitest` em cada PR.
- Sequência do perfil atrasada um dia na primeira visita do dia (achado no 4.5): o `DailyActivityCheck` poderia chamar `router.refresh()` quando o `check-login` gravar um dia novo, o que exige a rota informar isso na resposta.
- Diálogo de ranking do perfil com as três abas mostrando a lista semanal: passar as listas mensal e de todos os tempos, ou tirar as abas do diálogo (achado no 4.6).
- Puzzle semanal e diário trocam pelo horário do servidor (`getWeekOfYear`/`getDayOfYear` em `app/data/get-challenge-puzzle.ts`), não pelo de Brasília como a sequência e o ranking semanal (achado no 4.6).
- Rankings mensal e de todos os tempos ainda numeram empates em sequência (1, 2, 3), ao contrário do semanal (achado no 4.6).
- Voltar à página de origem depois do login (ex.: `/login?next=/torneios/[id]/convite`). Hoje o login sempre leva a `/home`, então quem abre um convite deslogado precisa abrir o link de novo (achado no 3.10).
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
