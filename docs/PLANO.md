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
- A base comum é dividida entre os dois: a trilha A (dados e infra) fica com o Igor (@IgorCifer) e a trilha B (interface) com o Iago (@IagoFsv). A #8, de arquitetura, é dos dois (28/09/2026).
- Um PR por tarefa. O próprio autor faz o merge por **squash**, com o título do PR no padrão Conventional Commits, e o PR só entra com o CI passando. O repositório só aceita squash, usa o título do PR como título do commit e apaga a branch depois do merge (28/09/2026).
- Arquitetura (#8), registrada em [ARQUITETURA.md](ARQUITETURA.md) (29/09/2026). Revisada pelo Iago e mergeada no PR #22, sem alterações (01/10/2026).
  - **Dados:** leitura por uma Data Access Layer (DAL). A DAL tem funções públicas (`dal.ts`: recebem o `actor`, checam a permissão, devolvem DTOs) e internas (`internal.ts`: sem `actor`, aceitam um `tx` opcional e só são chamadas por outra DAL). Mutações por Server Actions finas. Rotas de API ficam só para o better-auth. É a abordagem que o guia de segurança de dados do Next 16 recomenda para projetos novos, e ela deixa a DAL testável sem simular requisições.
  - **Pastas:** código por área em `features/<area>/`, com as rotas de `app/` finas.
  - **Formulários:** `useActionState` com zod validando na action.
- Pontos e conquistas (`features/pontos`, `features/conquistas`) têm dono: o Igor, trilha A. As outras áreas chamam as funções internas deles e pedem mudanças por issue (29/09/2026).
- A #11 fica só com os helpers de DAL e Server Actions. O fluxo de exemplo virou uma issue própria, o **fluxo de referência**, que vem depois da #11, da #15 e da #16. Assim ele mostra a pilha inteira, com primitivos e toast, e é o arquivo que os dois copiam na Etapa 2 (29/09/2026).
- A classificação do torneio passa a ser **derivada das partidas**, sem os contadores em `Participante`. É o mesmo raciocínio que tirou o `User.wins`: os contadores precisam ser acertados em todo caminho que mexe em partidas, e o `rankTournament` já calcula tudo a partir delas. Saem o `deltaFromResultado` e o crédito do bye na criação da rodada, e o pareamento suíço usa a classificação derivada (29/09/2026).
- A exclusão de conta **anonimiza em vez de apagar** (29/09/2026):
  - o nome vira "Jogador removido", o e-mail vira um marcador único (o campo é único e obrigatório no better-auth) e a imagem sai;
  - sessões e contas são apagadas;
  - é uma action própria, no lugar do `deleteUser` do better-auth, que apaga a linha;
  - os resultados de todo mundo ficam preservados, e dado anonimizado fica fora do escopo da LGPD.
- Na eliminatória, uma partida empatada continua `DRAW`, e o organizador marca quem avançou no desempate jogado fora do app (armageddon, blitz). É um campo opcional na `Partida`, obrigatório só em empate de eliminatória (29/09/2026).
- Tokens de cor (#14): as cores do app ficam num `@theme` próprio no `globals.css`, separado das variáveis do shadcn, que os componentes de `components/ui` continuam usando. Os nomes são de papel com escala numérica (`brand`, `info`, `success`, `danger`, `alert`), em que o número maior é o tom mais escuro, e de papel simples para cores únicas (`warning`, `surface`, `surface-foreground`, `placeholder`). Os valores são os hex de antes, sem juntar tons parecidos, para o visual não mudar. Juntar tons e definir a paleta final fica para a Etapa 3. Cor nova entra como token, nunca como `[#...]` na classe (01/10/2026).
- Primitivos do shadcn (#15): os componentes novos usam o `cn` de `lib/utils.ts`, e não o pacote `cn` que o registry atual instala, para existir um `cn` só no projeto. Os primitivos que já existiam não são sobrescritos pelo `shadcn add`. O `ARQUITETURA.md` tem a tabela de quando usar cada um (01/10/2026).
- Feedback padrão (#16): o `Toaster` do sonner e o `ConfirmProvider` ficam no `app/layout.tsx`. Confirmação de ação destrutiva usa o `useConfirm()`, que abre o AlertDialog padrão e devolve `Promise<boolean>`, para a tela confirmar com um `await` sem montar o diálogo à mão. O **toast de conquista passa para o sonner** (`toast.custom`), com o mesmo visual: uma fila só de avisos, sem dois sistemas disputando o topo da tela, e o `AchievementProvider` sai da casca. O `useAchievements()` continua com a mesma assinatura, então as telas de torneios não mudam. A tela de excluir conta é o exemplo em uso; as outras trocam `alert`/`confirm`/`prompt` quando a área delas for refeita (01/10/2026).
- Casca responsiva (#18): o `AppShell` fica em `components/app-shell.tsx` e monta o `DailyActivityCheck`; o `Toaster` e o `ConfirmProvider` continuam no `app/layout.tsx`, como decidido na #16, e o `AchievementProvider` já tinha saído. A navegação tem os mesmos quatro itens de antes (Início, Torneios, Prática, Perfil): só ícones na barra de baixo do celular e ícone com nome na lateral a partir de `md`. Um item fica ativo na rota dele e nas subrotas (`/torneios/[id]` marca Torneios), e `/userSettings` marca Perfil; o `/ranking` não tem item e não marca nenhum. O conteúdo fica num container `max-w-5xl` centralizado. O cabeçalho mantém a altura de antes no desktop, porque a engrenagem do perfil é posicionada com `absolute` a partir do topo da página (03/10/2026).
- Donos da Etapa 2: **torneios com o Iago**; **desafios, treino, perfil, ranking e conta com o Igor**, que já é o dono de pontos e conquistas. A exclusão de conta com anonimização fica com o Igor, combinada com o Iago, porque mexe em dados de torneio (03/10/2026).
- Fluxo de referência (#21): **alterar perfil** (`/userSettings/change-profile`), na área do Igor, para o exemplo não entrar na área de torneios. A página de servidor lê pela DAL de `features/perfil`, a action valida com zod e revalida o `/profile`, e o formulário usa `Input`/`Label`/`Button`, `fieldErrors` e toast. A **troca de foto saiu**: só mostrava uma prévia e nunca salvava; upload de verdade entra na área de conta da Etapa 2 (03/10/2026).
- ESLint 10 (#13) adiado: o `eslint-plugin-react`, trazido pelo `eslint-config-next` 16, usa `context.getFilename()`, que o ESLint 10 removeu, e o lint quebra. Retomar quando o plugin declarar suporte a `^10` (03/10/2026).
- Nos torneios, **paridade antes de funcionalidade nova**: primeiro a área migra com o mesmo comportamento, e só depois vêm as regras novas, em passos separados (ver Etapa 2). Se algo quebrar, dá para saber se foi a mudança de estrutura ou a regra nova (29/09/2026).

**Em aberto** (decidir ao chegar na tarefa)

- Desafios: subir o react-chess-puzzle para 2.x ou montar um tabuleiro próprio com `chess.js` + `react-chessboard`.
- Anonimização: o que some junto (histórico de pontos, conquistas, puzzles resolvidos) e se a pessoa sai dos rankings.

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
  - issues da Etapa 1 criadas (#8 a #18, e depois a #21). As que não dependem de nada estão em Ready; as outras, em Backlog.
- Repositório configurado para aceitar só squash (título do commit = título do PR) e apagar a branch depois do merge.

### Etapa 1: base comum

Começa com uma tarefa conjunta e curta: o `docs/ARQUITETURA.md`. Depois, as duas trilhas correm em paralelo.

| Tarefa | Trilha | Issue |
|---|---|---|
| **Convenções de arquitetura** (`docs/ARQUITETURA.md`): pastas por área (`features/<area>/{components,actions,dal,internal,schemas,types,domain}`, com as rotas de `app/` finas), DAL pública e interna + Server Actions, formulários com `useActionState` e zod, primitivos em `components/ui`, *compound components* quando as partes dividem estado, nenhum componente definido dentro de outro | as duas | [#8](https://github.com/IgorCifer/xeque-mate/issues/8) |
| **CI no GitHub Actions:** `tsc`, `eslint`, os testes unitários e `build` em cada PR. Vem antes dos testes de integração para proteger tudo desde já | A: dados e infra (Igor) | [#9](https://github.com/IgorCifer/xeque-mate/issues/9) |
| **Testes de integração:** Vitest contra um banco Postgres de teste, com helpers de usuário e de `actor` e o alias do `server-only`. Cobrem o comportamento atual das regras críticas (convite, rodadas, resultado, finalização concorrente, puzzles, check-login), chamando as rotas e as funções de `lib/` direto. As asserções olham o estado do banco (pontos concedidos uma vez, placar sem resíduo), e a chamada fica isolada num helper; quando a área migrar, só o helper troca da rota para a DAL. Acrescenta o serviço Postgres ao CI | A | [#10](https://github.com/IgorCifer/xeque-mate/issues/10) |
| **Padrão de DAL e Server Actions:** `requireActor`/`Actor`, `ActionState`, `toActionError` e os erros de domínio em `lib/errors.ts`, com testes. Só os helpers, sem tela | A | [#11](https://github.com/IgorCifer/xeque-mate/issues/11) |
| **Fluxo de referência:** um fluxo pequeno de ponta a ponta com a pilha inteira: DAL, Server Action, `useActionState`, `Input`/`Label` (#15), `fieldErrors` e toast (#16). É o arquivo que os dois copiam na Etapa 2. Depende da #11, da #15 e da #16 | A | [#21](https://github.com/IgorCifer/xeque-mate/issues/21) |
| **Prisma 7**, com `@prisma/adapter-pg` (ler o guia de migração antes) | A | [#12](https://github.com/IgorCifer/xeque-mate/issues/12) |
| **ESLint 10** | A | [#13](https://github.com/IgorCifer/xeque-mate/issues/13) |
| **Tokens:** as cores hex repetidas viram variáveis de tema no `globals.css`, sem mudar nada no visual | B: interface (Iago) | [#14](https://github.com/IgorCifer/xeque-mate/issues/14) |
| **Primitivos do shadcn que faltam:** Input, Label, Select, Dialog/AlertDialog, Sonner, Tabs, Table, Badge, Skeleton | B | [#15](https://github.com/IgorCifer/xeque-mate/issues/15) |
| **Feedback padrão:** toast para avisos e AlertDialog para confirmações, no lugar de `alert`/`confirm`/`prompt`. A trilha entrega os componentes, e cada área troca os seus | B | [#16](https://github.com/IgorCifer/xeque-mate/issues/16) |
| **Uma biblioteca de ícones:** o `react-icons` sai e o `lucide` sobe para 1.x no mesmo PR, porque as duas mudanças mexem nos mesmos ícones | B | [#17](https://github.com/IgorCifer/xeque-mate/issues/17) |
| **Casca responsiva:** `AppShell` no lugar de `LayoutWrapper`, `navbar` e `tittle-header`, com barra embaixo no celular, navegação lateral a partir de `md` e container de largura. `DailyActivityCheck` continua montado nele | B | [#18](https://github.com/IgorCifer/xeque-mate/issues/18) |

### Etapa 2: áreas em paralelo

Divisão: **torneios** com o Iago e **desafios, treino, perfil e conta** com o Igor, que também é o dono de pontos e conquistas. Cada área é refeita já nos padrões da Etapa 1, copiando do fluxo de referência (#21). Em cada área, primeiro vem a **paridade** (migrar com o mesmo comportamento) e só depois as regras novas, em issues separadas.

**A [#33](https://github.com/IgorCifer/xeque-mate/issues/33) (pontos e conquistas) vem primeiro:** a lista, o convite e a finalização de torneios dependem dela, assim como os desafios e o perfil.

**Igor: pontos, conquistas, desafios, treino, perfil e conta**

| Issue | Tarefa | Depende de |
|---|---|---|
| [#33](https://github.com/IgorCifer/xeque-mate/issues/33) | Pontos e conquistas em `features/pontos` e `features/conquistas` | — |
| [#47](https://github.com/IgorCifer/xeque-mate/issues/47) | Jogo treino: fim de partida e nova partida | — |
| [#51](https://github.com/IgorCifer/xeque-mate/issues/51) | Conta (paridade): login, cadastro e configurações nos componentes novos | — |
| [#43](https://github.com/IgorCifer/xeque-mate/issues/43) | Desafios (paridade): diário e semanal | #33 |
| [#44](https://github.com/IgorCifer/xeque-mate/issues/44) | Desafios: tabuleiro novo e erros do navegador | #43 |
| [#45](https://github.com/IgorCifer/xeque-mate/issues/45) | Desafios: troca do puzzle no fuso de Brasília | #43 |
| [#46](https://github.com/IgorCifer/xeque-mate/issues/46) | Desafios: perda de pontos por dica ou reinício no servidor | #44 |
| [#48](https://github.com/IgorCifer/xeque-mate/issues/48) | Perfil e ranking (paridade) | #33 |
| [#49](https://github.com/IgorCifer/xeque-mate/issues/49) | Ranking: abas certas e empates divididos | #48 |
| [#50](https://github.com/IgorCifer/xeque-mate/issues/50) | Perfil: sequência atualizada na primeira visita do dia | #48 |
| [#52](https://github.com/IgorCifer/xeque-mate/issues/52) | Conta: voltar à página de origem depois do login | #51 |
| [#53](https://github.com/IgorCifer/xeque-mate/issues/53) | Conta: exclusão com anonimização (combinar com o Iago) | #51, #38 |
| [#54](https://github.com/IgorCifer/xeque-mate/issues/54) | Conta: upload de foto de perfil | #51 |

**Iago: torneios**, em passos. Cada passo só começa com o anterior mergeado e os testes passando.

| Issue | Tarefa | Depende de |
|---|---|---|
| [#34](https://github.com/IgorCifer/xeque-mate/issues/34) | Paridade: página do torneio e edição | — |
| [#35](https://github.com/IgorCifer/xeque-mate/issues/35) | Paridade: lista e criação | #33 |
| [#36](https://github.com/IgorCifer/xeque-mate/issues/36) | Paridade: convite | #33 |
| [#37](https://github.com/IgorCifer/xeque-mate/issues/37) | Paridade: rodadas, resultados e participantes | #34 |
| [#38](https://github.com/IgorCifer/xeque-mate/issues/38) | Paridade: finalizar torneio (fim da paridade; `app/api/torneios` sai inteiro) | #33, #37 |
| [#39](https://github.com/IgorCifer/xeque-mate/issues/39) | Classificação derivada das partidas | #38 |
| [#40](https://github.com/IgorCifer/xeque-mate/issues/40) | Suíço rodada a rodada | #39 |
| [#41](https://github.com/IgorCifer/xeque-mate/issues/41) | Formato todos contra todos | #40 |
| [#42](https://github.com/IgorCifer/xeque-mate/issues/42) | Formato eliminatória (com o campo de quem avançou em caso de empate) | #41 |

### Etapa 3: design visual

Identidade visual, tokens finais e um layout de desktop caprichado, aplicados por área.

### Depois

- Deploy.
- Testes E2E com Playwright, quando as telas pararem de mudar.
- Acompanhamento de torneio ao vivo, se um dia fizer sentido.
