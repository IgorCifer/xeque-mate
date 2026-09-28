# Xeque-Mate: plano 2

## Contexto

O plano 1 ([PLANO-1.md](PLANO-1.md)) fez o projeto voltar a rodar e fechou as falhas mais graves:
- banco recriável do zero;
- dependências em dia dentro dos majors;
- pontos à prova de repetição;
- convite, conta e páginas protegidas;
- conquistas;
- desempate suíço;
- lint zerado.

Ele consertou o que existia sem redesenhar nada, de propósito. Por isso muita coisa funciona, mas parece frágil.

O plano 2 é para **dois devs** trabalhando em paralelo. Primeiro vem uma base comum curta, que fixa os padrões que os dois vão seguir. Depois, cada um refaz uma área já nesse padrão. O design visual fica por último.

Este arquivo guarda o roteiro, o diagnóstico e as decisões. **As tarefas ficam nas issues do GitHub**, e o andamento no [Project](https://github.com/users/IgorCifer/projects/1), nas colunas *Backlog / Ready / In progress / Done*. Aqui só entram os links das issues, sem checkbox, para os dois não editarem as mesmas linhas.

As regras de trabalho e o fluxo de git estão no [CLAUDE.md](../CLAUDE.md).

---

## Decisões

**Tomadas**

- Tela responsiva, pensada primeiro para o celular: barra de navegação embaixo no celular e navegação lateral no desktop (28/09/2026).
- Torneios presenciais: o organizador cria, pareia e lança os resultados, e os jogadores acompanham. Além do suíço, entram outros formatos, como todos contra todos e eliminatória (28/09/2026).
- Os majors (Prisma 7, ESLint 10, lucide 1.x) sobem na base comum. O Prisma 7 vem depois dos testes de integração, e o lucide 1.x vai junto da troca do `react-icons`. A exceção é o react-chess-puzzle 2.x, que sobe na área dos desafios: atualizá-lo é reescrever os desafios, e fazer isso na base seria refazer a área duas vezes (28/09/2026).
- Tarefas em Issues e num Project do GitHub, com uma label por área. Uma issue sai de Backlog para Ready quando as dependências dela estão prontas (28/09/2026).
- A base comum é dividida entre os dois: um cuida de dados e infra, o outro de interface (28/09/2026).
- Um PR por tarefa. O próprio autor faz o merge por **squash**, com o título do PR no padrão Conventional Commits, e o PR só entra com o CI passando (28/09/2026).

**Em aberto** (decidir ao chegar na tarefa)

- Quem fica com cada trilha da Etapa 1 e com cada área da Etapa 2.
- Desafios: subir o react-chess-puzzle para 2.x ou montar um tabuleiro próprio com `chess.js` + `react-chessboard`.
- Torneios: continuar guardando a classificação em `Participante` ou calculá-la das partidas. `rankTournament`, em `lib/tournament-ranking.ts`, já calcula tudo a partir das partidas.
- Exclusão de conta: anonimizar o jogador ou bloquear a exclusão enquanto houver torneio em andamento.

---

## Diagnóstico

Levantado no código em 28/09/2026.

### Estrutura e componentes

- **Telas grandes:** são ~7,2 mil linhas de código próprio. `app/torneios/[id]/page.tsx` tem 813 linhas e 12 `useState`; `app/torneios/page.tsx`, 376.
- **Primitivos pouco usados:** só existem 4 componentes do shadcn (`button`, `card`, `carousel`, `tooltip`). Há 47 `<button>` crus contra `Button` usado em 7 arquivos, além de 19 `<input>` e 3 `<select>` crus.
- **Nada compartilhado:** os tipos são redefinidos em cada tela (`Torneio` em 3 lugares, `Achievement` em 2), e `modeImage` tem 3 cópias.
- **Feedback e dados improvisados:** 57 `alert`/`confirm`/`prompt`. Seis telas client buscam dados com `fetch` dentro de `useEffect`, cada uma com o próprio tratamento de erro.
- **Validação só nos formulários:** o zod aparece em 5 formulários de conta e em nenhuma rota de API. O código de sessão e de "é o dono?" se repete em cada rota.
- **Componentes espalhados:** ficam em `app/components`, `components/` e `app/userSettings/components`. Há duas bibliotecas de ícones (`react-icons` e `lucide`) e nomes com erro (`tittle-header`).
- **Tema do shadcn ignorado:** o `globals.css` tem 98 variáveis sem uso, e as cores estão fixas em hex espalhado (`#5C9CF0` 20 vezes, `#6BAAFD` 16 vezes).

### Layout

- **Feito só para celular:** a navegação é uma barra fixa embaixo. Há 70 classes `sm:` contra 1 `md:` e 2 `lg:`, e não existe layout de desktop.

### Torneios

- **Só um formato:** o suíço, que gera todas as rodadas de uma vez, sem olhar os resultados.
- **Classificação frágil:** a classificação fica em `Participante` e é atualizada por incremento a cada resultado.
- **Exclusão de conta destrutiva:** excluir a conta apaga em cascata os torneios que a pessoa criou e as partidas que ela jogou em torneios de outros. Os placares dos adversários ficam errados. Sair de um torneio finalizado também apaga as partidas.
- **Telas monolíticas:** tudo numa página só.
- **Sobras conhecidas:**
  - o `PATCH` de resultado lê `finalizado` antes de gravar, o que deixa uma janela de milissegundos com a finalização;
  - contar e criar no limite de 5 torneios não são atômicos.

### Desafios e treino

- **Biblioteca abandonada:** o `@react-chess-tools/react-chess-puzzle` 0.6 não recebe mais correções, e o navegador acusa erros nas duas páginas de desafio. *O texto do erro ainda precisa ser coletado no indicador do Next.*
- **Regra de pontos no cliente:** quem usa dica ou reinicia perde os pontos, mas essa regra só existe no navegador.
- **Troca no fuso errado:** o puzzle diário e o semanal trocam pelo horário do servidor, não pelo de Brasília como a sequência e o ranking.
- **Jogo treino sem fim:** não mostra quando a partida acaba (mate, afogamento, empate) e não tem botão de nova partida.

### Perfil, ranking e conta

- **Ranking do perfil:** o diálogo tem três abas que mostram a mesma lista semanal.
- **Empates em sequência:** os rankings mensal e de todos os tempos numeram os empates em sequência (1, 2, 3), e o semanal divide (1, 2, 2, 4).
- **Sequência atrasada:** na primeira visita do dia, o perfil mostra a sequência sem o dia de hoje.
- **Login sem retorno:** o login sempre leva à `/home`, sem voltar à página de origem (`?next=`).

### Testes e infra

- **Testes só de funções puras:** são 57 (desempate, sequência, delta de resultado), e nenhuma rota de API tem teste. No plano 1, cada item foi conferido com scripts avulsos contra o servidor de dev.
- **Sem CI.**
- **Majors pendentes:** Prisma 7, ESLint 10, lucide 1.x e react-chess-puzzle 2.x.

Todos os itens de "Depois" do plano 1 foram absorvidos pelas etapas abaixo, menos o deploy.

---

## Roteiro

### Etapa 0: organizar o trabalho

Concluída em 28/09/2026.

- Plano 1 arquivado em `docs/PLANO-1.md`, este arquivo escrito e o `CLAUDE.md` atualizado para dois devs (PR #7).
- GitHub configurado:
  - [Project](https://github.com/users/IgorCifer/projects/1) com as colunas *Backlog / Ready / In progress / Done*;
  - labels de área: `base-dados`, `base-ui`, `torneios`, `desafios`, `perfil-conta`, `design`;
  - issues da Etapa 1 criadas (#8 a #18). As que não dependem de nada estão em Ready; as outras, em Backlog.
- Falta: deixar só "Allow squash merging" habilitado e ligar "Automatically delete head branches" nas configurações do repositório.

### Etapa 1: base comum

Começa com uma tarefa conjunta e curta: o `docs/ARQUITETURA.md`. Depois, as duas trilhas correm em paralelo.

| Tarefa | Trilha | Issue |
|---|---|---|
| **Convenções de arquitetura** (`docs/ARQUITETURA.md`): pastas por funcionalidade (`features/<area>/{components,server,schemas,types}`, com as rotas de `app/` finas), primitivos em `components/ui`, *compound components* quando as partes dividem estado, nenhum componente definido dentro de outro, a página de servidor busca os dados e o client só interage, tipos de domínio tirados do zod e do Prisma | as duas | [#8](https://github.com/IgorCifer/xeque-mate/issues/8) |
| **CI no GitHub Actions:** `tsc`, `eslint`, os testes unitários e `build` em cada PR. Vem antes dos testes de integração para proteger tudo desde já | A: dados e infra | [#9](https://github.com/IgorCifer/xeque-mate/issues/9) |
| **Testes de integração das rotas:** Vitest contra um banco Postgres de teste, com helpers de usuário e sessão. Cobrem convite, rodadas, resultado, finalização concorrente, puzzles e check-login. Acrescenta o serviço Postgres ao CI | A | [#10](https://github.com/IgorCifer/xeque-mate/issues/10) |
| **Padrão de API:** schema zod na entrada, formato único de erro (`{ error }` com status), helper de sessão e dono, cliente `fetch` tipado. Aplicado em 1 ou 2 rotas como exemplo; as áreas migram as delas | A | [#11](https://github.com/IgorCifer/xeque-mate/issues/11) |
| **Prisma 7**, com `@prisma/adapter-pg` (ler o guia de migração antes) | A | [#12](https://github.com/IgorCifer/xeque-mate/issues/12) |
| **ESLint 10** | A | [#13](https://github.com/IgorCifer/xeque-mate/issues/13) |
| **Tokens:** as cores hex repetidas viram variáveis de tema no `globals.css`, sem mudar nada no visual | B: interface | [#14](https://github.com/IgorCifer/xeque-mate/issues/14) |
| **Primitivos do shadcn que faltam:** Input, Label, Select, Dialog/AlertDialog, Sonner, Tabs, Table, Badge, Skeleton | B | [#15](https://github.com/IgorCifer/xeque-mate/issues/15) |
| **Feedback padrão:** toast para avisos e AlertDialog para confirmações, no lugar de `alert`/`confirm`/`prompt`. A trilha entrega os componentes, e cada área troca os seus | B | [#16](https://github.com/IgorCifer/xeque-mate/issues/16) |
| **Uma biblioteca de ícones:** o `react-icons` sai e o `lucide` sobe para 1.x no mesmo PR, porque as duas mudanças mexem nos mesmos ícones | B | [#17](https://github.com/IgorCifer/xeque-mate/issues/17) |
| **Casca responsiva:** `AppShell` no lugar de `LayoutWrapper`, `navbar` e `tittle-header`, com barra embaixo no celular, navegação lateral a partir de `md` e container de largura. `AchievementProvider` e `DailyActivityCheck` continuam montados nele | B | [#18](https://github.com/IgorCifer/xeque-mate/issues/18) |

### Etapa 2: áreas em paralelo

Sugestão de divisão: **torneios** com um dev e **desafios, treino, perfil e conta** com o outro. Cada área é refeita já nos padrões da Etapa 1. As issues são criadas ao chegar aqui.

**Torneios**
- **Formatos:** `Torneio.formato` com suíço rodada a rodada, todos contra todos e eliminatória, cada um com sua função de pareamento, testada.
- **Classificação e desempate** por formato (ver "Em aberto").
- **Fluxo do organizador presencial:** criar, inscrever, gerar a próxima rodada, lançar resultados e finalizar.
- **Telas refeitas** com os componentes e o padrão de API.
- **Exclusão de conta** que não apaga as partidas de outras pessoas.

**Desafios, treino, perfil e conta**
- **Desafios:** biblioteca nova ou tabuleiro próprio, correção dos erros do navegador, troca no fuso de Brasília e regra de dica/reinício no servidor.
- **Jogo treino:** fim de partida e botão de nova partida.
- **Perfil e ranking:** abas corretas, empates divididos em todos os rankings e sequência atualizada na primeira visita.
- **Conta:** telas de login, cadastro e configurações nos componentes novos, e `?next=` depois do login.

### Etapa 3: design visual

Identidade visual, tokens finais e um layout de desktop caprichado, aplicados por área.

### Depois

- Deploy.
- Testes E2E com Playwright, quando as telas pararem de mudar.
- Acompanhamento de torneio ao vivo, se um dia fizer sentido.
