# Xeque-Mate

Aplicativo web para clubes de xadrez: torneios no sistema suíço, desafios de puzzles diário e semanal, ranking de pontos e conquistas.

## Funcionalidades

- **Torneios**: crie um torneio, convide jogadores por link, gere as rodadas no sistema suíço e lance os resultados. A classificação usa pontos e, no desempate, Buchholz, Sonneborn-Berger e vitórias. Ao finalizar o torneio, cada participante recebe pontos pela sua colocação.
- **Desafios**: um puzzle por dia (rating 1200–1699) e um por semana (1700–2000), iguais para todos os jogadores e tirados da base aberta do Lichess. Resolver o desafio dá pontos.
- **Jogo treino**: partida livre contra jogadas aleatórias do computador.
- **Ranking**: classificação semanal, mensal e geral pelos pontos acumulados.
- **Perfil e conquistas**: sequência de dias de uso, posição no ranking semanal e galeria de conquistas (primeiro torneio, primeira vitória, campeão e outras).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) com React 19 e TypeScript
- Tailwind CSS 4 e [shadcn/ui](https://ui.shadcn.com)
- [Prisma 6](https://www.prisma.io) com PostgreSQL 16
- [better-auth](https://www.better-auth.com), com login por e-mail e senha
- [chess.js](https://github.com/jhlywa/chess.js), [react-chessboard](https://github.com/Clariity/react-chessboard) e [tournament-pairings](https://github.com/slashinfty/tournament-pairings)
- [Vitest](https://vitest.dev) para os testes

## Rodando localmente

Pré-requisitos: Node.js 20.9 ou mais recente, e Docker para o banco.

1. Instale as dependências e gere o cliente do Prisma:

   ```bash
   npm install
   npx prisma generate
   ```

2. Crie o `.env` a partir do exemplo e preencha o `BETTER_AUTH_SECRET` (o próprio `.env.example` mostra como gerar um):

   ```bash
   cp .env.example .env
   ```

3. Suba o PostgreSQL, aplique as migrations e cadastre as conquistas:

   ```bash
   docker compose up -d --wait
   npx prisma migrate deploy
   npm run db:seed
   ```

4. Importe os puzzles (veja a seção abaixo). Sem eles, as páginas dos desafios ficam vazias.

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   O app abre em [http://localhost:3000](http://localhost:3000). O `npm run dev` também aceita conexões da rede local, o que ajuda a testar pelo celular. Para ouvir só na própria máquina, use `npx next dev -H 127.0.0.1`.

## Importando os puzzles

Os puzzles vêm da [base de puzzles do Lichess](https://database.lichess.org/#puzzles) (licença CC0). O arquivo tem cerca de 1 GB descompactado e não fica no repositório.

1. Baixe o `lichess_db_puzzle.csv.zst` e descompacte-o (por exemplo, com `zstd -d lichess_db_puzzle.csv.zst`).
2. Coloque o `lichess_db_puzzle.csv` em `prisma/seed/`. O `.gitignore` já ignora esse arquivo.
3. Rode a importação:

   ```bash
   npx tsx prisma/seed/seed-puzzles.ts
   ```

O script lê o arquivo aos poucos, sem carregá-lo inteiro na memória, e importa até 12.000 puzzles com rating entre 1200 e 2000, popularidade a partir de 90 e ao menos 1.000 partidas jogadas. Pode ser rodado de novo sem duplicar nada. Para apagar os puzzles importados, use `npx tsx prisma/seed/clear-puzzles.ts`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Serve o build de produção |
| `npm test` | Roda os testes (Vitest) |
| `npm run lint` | Roda o ESLint |
| `npx tsc --noEmit` | Checa os tipos |
| `npm run db:seed` | Cadastra as conquistas |

## Estrutura

- `app/`: páginas, rotas de API (`app/api`) e consultas usadas pelas páginas no servidor (`app/data`)
- `components/`: componentes de interface (shadcn/ui) e o aviso de conquistas
- `lib/`: regras compartilhadas, como autenticação, pontos, classificação de torneio e conquistas
- `prisma/`: schema, migrations e scripts de seed
