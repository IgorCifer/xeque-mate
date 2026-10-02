# Arquitetura

Convenções que todo código novo segue. Vale para as duas trilhas da base comum e para as áreas da Etapa 2 do [plano 2](PLANO.md).

O código que ainda não segue estas regras é legado: ele fica como está até a área dele ser refeita, e então sai. Código novo não se apoia em código legado quando existe o equivalente no padrão novo.

Os exemplos daqui são ilustrativos. O exemplo real, com a pilha inteira funcionando, é o fluxo de referência ([#21](https://github.com/IgorCifer/xeque-mate/issues/21)), linkado aqui quando ficar pronto.

As escolhas seguem os guias do Next 16 que vêm no pacote (`node_modules/next/dist/docs/`): em especial *Data Security*, *Mutating Data*, *Forms* e *Server Actions*.

## Visão geral

```
página (Server Component)
  ├─ lê a sessão com requireActor()
  ├─ busca dados na DAL ────────────► features/<area>/dal.ts ──► Prisma
  └─ renderiza componentes com os DTOs
        └─ componentes client (só onde há interação)
              └─ chamam Server Actions ─► features/<area>/actions.ts
                                              ├─ requireActor() + zod
                                              ├─ chamam a DAL
                                              └─ refresh() / revalidatePath()

DAL pública (dal.ts) ──► DAL interna de outra área (internal.ts), dentro da mesma transação
```

- **Nada de `fetch` para as nossas próprias rotas nem de `fetch` dentro de `useEffect`.** A página de servidor lê os dados, e a action atualiza a tela na mesma resposta.
- **Rotas de API (`app/api/*`) só quando algo de fora do React precisa chamar o servidor.** Hoje é só o better-auth (`app/api/auth/[...all]`). As rotas atuais são legado e saem quando a área delas for refeita.

## Pastas

```
app/                      rotas finas: page, layout, loading, error
features/
  <area>/
    components/           componentes da área
    actions.ts            Server Actions ("use server")
    dal.ts                acesso a dados público: recebe o actor ("server-only")
    internal.ts           acesso a dados interno: sem actor, só para outra DAL ("server-only")
    schemas.ts            schemas zod (usados no cliente e no servidor)
    types.ts              DTOs e tipos da área
    domain/               regras puras, sem banco (ex.: pareamento, desempate)
components/
  ui/                     primitivos do shadcn
  <nome>.tsx              componentes compartilhados entre áreas (ex.: AppShell)
hooks/                    hooks compartilhados
lib/                      infraestrutura: prisma, auth, sessão, utils
```

Uma área grande pode quebrar `dal.ts` e `actions.ts` em pastas (`dal/`, `actions/`), com um arquivo por assunto.

As features são `torneios`, `desafios`, `treino`, `ranking`, `pontos`, `conquistas`, `perfil` e `conta`. Pontos e conquistas são usados por várias áreas: `features/pontos` e `features/conquistas` expõem funções internas que as outras chamam, e o dono delas é o Igor (trilha A). Mudança nelas é pedida por issue.

**Entre áreas:** uma feature só importa de outra os `dal`, `internal` e `types`, nunca `components` nem `actions`. O `internal` de outra área só pode ser importado a partir de uma DAL. Se duas áreas precisam do mesmo componente, ele sobe para `components/`.

## Dados: DAL

A DAL é o único lugar que fala com o Prisma.

- Todo `dal.ts` e `internal.ts` começa com `import "server-only"`. Um import acidental num componente client vira erro de build.
- **A DAL pública recebe quem está agindo (`actor`) como primeiro argumento** e faz a checagem de permissão ali dentro. Nunca confia que a página ou o layout checou: Server Actions são endpoints públicos, e qualquer um pode chamá-las com qualquer argumento. Quem lê a sessão são as páginas e as actions, com `requireActor()`, e a DAL não depende de cookies. Por isso ela é testada chamando as funções direto.
- A DAL devolve **DTOs**: objetos só com os campos que a tela usa. Nada de devolver a linha inteira do Prisma nem o e-mail de outras pessoas.
- Operações que precisam ser atômicas (ex.: finalizar e conceder pontos) usam `prisma.$transaction` dentro da DAL.
- Erros esperados viram erros de domínio de `lib/errors.ts`, todos derivados de `DomainError`. A action transforma esses erros em mensagem; um erro inesperado sobe para o `error.tsx`. A mensagem é mostrada ao usuário, então vai em português.
  - `NotFoundError`: não encontrado;
  - `ForbiddenError`: sem permissão;
  - `ConflictError`: estado mudou ou já foi feito (ex.: torneio já finalizado);
  - `RuleViolationError`: regra de negócio violada (ex.: limite de torneios).

```ts
import "server-only";
import prisma from "@/lib/prisma";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import type { Actor } from "@/lib/session";

export async function renameTorneio(actor: Actor, torneioId: string, nome: string) {
  const torneio = await prisma.torneio.findUnique({
    where: { id: torneioId },
    select: { criadorId: true },
  });
  if (!torneio) throw new NotFoundError("Torneio não encontrado");
  if (torneio.criadorId !== actor.userId) {
    throw new ForbiddenError("Somente o criador pode editar o torneio");
  }
  await prisma.torneio.update({ where: { id: torneioId }, data: { nome } });
}
```

### Funções públicas e internas

Nem toda operação tem alguém agindo. Conceder pontos ao finalizar um torneio é consequência da finalização, não ação de uma pessoa, e precisa rodar dentro da mesma transação.

| | Pública (`dal.ts`) | Interna (`internal.ts`) |
|---|---|---|
| Primeiro argumento | `actor` | os dados da operação |
| Checa permissão | sim | não: quem chama já checou |
| Transação | abre a sua, se precisar | aceita `tx` opcional (padrão: `prisma`) |
| Quem chama | páginas e actions | só outra DAL, da mesma área ou de outra |

```ts
import "server-only";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma2/client";

export async function awardTournamentPoints(
  torneioId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const participantes = await tx.participante.findMany({ where: { torneioId } });
  for (const p of participantes) {
    await tx.pointsHistory.create({
      data: { userId: p.userId, points: 10, reason: "tournament_other", referenceId: torneioId },
    });
  }
}
```

```ts
import "server-only";
import prisma from "@/lib/prisma";
import { awardTournamentPoints } from "@/features/pontos/internal";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { Actor } from "@/lib/session";

export async function finalizeTorneio(actor: Actor, torneioId: string) {
  const torneio = await prisma.torneio.findUnique({
    where: { id: torneioId },
    select: { criadorId: true },
  });
  if (!torneio) throw new NotFoundError("Torneio não encontrado");
  if (torneio.criadorId !== actor.userId) {
    throw new ForbiddenError("Somente o criador pode finalizar o torneio");
  }
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.torneio.updateMany({
      where: { id: torneioId, finalizado: false },
      data: { finalizado: true },
    });
    if (count === 0) throw new ConflictError("Torneio já finalizado");
    await awardTournamentPoints(torneioId, tx);
  });
}
```

O primeiro exemplo simplifica a regra de pontos; a regra real de colocação está em `lib/points.ts`.

## Mutações: Server Actions

Toda Server Action segue os mesmos passos:
1. `requireActor()`;
2. valida a entrada com o schema zod;
3. chama a DAL;
4. atualiza a tela.

A action fica fina: regra de negócio mora na DAL ou em `domain/`.

- **Retorno:** sempre um `ActionState` (`lib/actions.ts`). Nunca lança erro esperado para o cliente.
  - `ActionResult` é `{ ok: true, message? }` ou `{ ok: false, error?, fieldErrors? }`.
  - `ActionState` é `ActionResult | null`. O `null` é o estado inicial do `useActionState` (`useActionState(action, null)`), para a tela distinguir "nada enviado ainda" de "deu certo".
  - Os helpers são `toFieldErrors(zodError)` para entrada inválida e `toActionError(error)` para erro de domínio; qualquer outro erro é lançado de novo.
- **Atualizar a tela:** `refresh()` quando só a página atual muda; `revalidatePath(...)` quando outra rota também mostra o dado; `redirect(...)` quando a ação leva a outra página.
- **Paralelismo:** o Next executa as actions de um mesmo cliente uma de cada vez. Se precisar de trabalho em paralelo, faça dentro de uma action só.

```ts
"use server";

import { refresh } from "next/cache";
import { requireActor } from "@/lib/session";
import { toActionError, toFieldErrors, type ActionState } from "@/lib/actions";
import { renameTorneioSchema } from "./schemas";
import { renameTorneio } from "./dal";

export async function renameTorneioAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = renameTorneioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toFieldErrors(parsed.error);
  try {
    await renameTorneio(actor, parsed.data.torneioId, parsed.data.nome);
  } catch (error) {
    return toActionError(error);
  }
  refresh();
  return { ok: true };
}
```

Os helpers estão em `lib/session.ts` (`requireActor`, `Actor`), `lib/errors.ts` (erros de domínio) e `lib/actions.ts` (`ActionState`, `ActionResult`, `toActionError`, `toFieldErrors`). O `requireActor` usa o `requireSession`, que guarda a sessão em cache durante a requisição e redireciona para `/login` sem sessão. As páginas que precisam do nome ou do e-mail continuam usando o `requireSession`.

## Formulários e validação

- **Formulário com Server Action:** `<form action={formAction}>` num componente client, com `const [state, formAction, pending] = useActionState(action, null)`.
  - O `pending` desabilita o botão.
  - Com `state?.ok === false`, `state.fieldErrors` mostra o erro de cada campo e `state.error` o erro geral.
  - `state?.ok === true` é a hora do toast de sucesso.
- **Schemas no `schemas.ts` da área:** a action valida sempre. O cliente pode reusar o mesmo schema, ou atributos HTML como `required`, só para dar retorno mais cedo; nunca como a única validação.
- **zod 4:** erros por campo com `z.flattenError(error).fieldErrors`, que é o que o `toFieldErrors` faz. O `error.flatten()` dos exemplos antigos não existe mais.
- **Botões fora de formulário** (ex.: lançar o resultado num seletor): chamar a action dentro de `startTransition`, ou com `useActionState` e `formAction` num `<form>` pequeno.

## Componentes

- **Servidor por padrão.** `"use client"` só no menor componente que precisa de estado, efeito ou evento. A página nunca é client inteira.
- **Props tipadas** com os DTOs de `types.ts`. Nada de redefinir `Torneio` em cada tela.
- **Nunca definir um componente dentro de outro.** Ele é recriado a cada renderização e perde o estado.
- **Compound components** quando várias partes dividem estado ou precisam ser montadas em ordens diferentes (ex.: seletor de rodada com lista e painel, tabela de classificação com cabeçalho e linhas). A raiz guarda o estado num contexto, e as partes são exportadas juntas. Componente simples, sem estado compartilhado, recebe props normais.

```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const RodadasContext = createContext<{ atual: number; setAtual: (n: number) => void } | null>(null);

function useRodadas() {
  const ctx = useContext(RodadasContext);
  if (!ctx) throw new Error("Rodadas.* precisa estar dentro de Rodadas.Root");
  return ctx;
}

function Root({ inicial, children }: { inicial: number; children: ReactNode }) {
  const [atual, setAtual] = useState(inicial);
  return <RodadasContext.Provider value={{ atual, setAtual }}>{children}</RodadasContext.Provider>;
}

function Tab({ rodada }: { rodada: number }) {
  const { atual, setAtual } = useRodadas();
  return (
    <button aria-pressed={atual === rodada} onClick={() => setAtual(rodada)}>
      Rodada {rodada}
    </button>
  );
}

function Panel({ rodada, children }: { rodada: number; children: ReactNode }) {
  const { atual } = useRodadas();
  return atual === rodada ? <div>{children}</div> : null;
}

export const Rodadas = { Root, Tab, Panel };
```

- **Primitivos** vêm de `components/ui` (shadcn). Nada de `<button>`, `<input>` ou `<select>` crus em tela nova. A próxima seção diz quando usar cada um.
- **Ícones:** só `lucide-react`.

### Primitivos

| Primitivo | Quando usar |
|---|---|
| `Button` | Toda ação clicável: enviar formulário, abrir diálogo, navegar com `asChild` + `Link`. A variante diz o peso: `default` para a ação principal da tela, `outline`/`secondary` para as outras, `ghost` em barra e lista, `destructive` para apagar, `link` para ação que parece link. |
| `Input` + `Label` | Todo campo de texto, número, data ou senha. O `Label` aponta para o campo com `htmlFor`. Com erro, o campo recebe `aria-invalid` (o estilo de erro já vem dele) e a mensagem do `fieldErrors` fica logo abaixo. |
| `Select` | Escolher uma opção de uma lista fixa e curta (modo do torneio, resultado da partida). Num formulário, passe `name` no `Select` para o valor ir no `FormData`. Lista longa ou com busca não é `Select`. |
| `Dialog` | Conteúdo ou formulário curto que abre por cima da tela, sem trocar de página (ex.: ranking, editar um campo). Sempre com `DialogTitle`. Fluxo longo ganha página própria. |
| `AlertDialog` | Só confirmação de ação destrutiva ou que não volta atrás: finalizar torneio, apagar rodadas, excluir conta. Não fecha clicando fora, e a ação de confirmar usa `variant="destructive"` quando apaga algo. Na tela, use o `useConfirm()` (ver "Feedback e erros") em vez de montar o diálogo à mão. |
| Sonner (`toast`) | Resultado de uma ação: sucesso, ou erro geral (`state.error`). Erro de campo não vira toast. A tela chama `toast` de `sonner`; o `Toaster` já está montado no `app/layout.tsx`. |
| `Tabs` | Alternar entre visões da mesma página sem sair dela (rodadas, classificação e partidas). Se cada visão precisa de link próprio, use rotas. |
| `Table` | Dados em linhas e colunas que a pessoa compara (classificação, histórico de pontos). A tabela já rola na horizontal, mas no celular mostre só as colunas essenciais e esconda o resto com `hidden md:table-cell`. Lista de itens sem colunas é lista, não tabela. |
| `Badge` | Rótulo curto de estado ou categoria ao lado de outro conteúdo: "Finalizado", "Em andamento", "Bye", o modo do torneio. Não é botão. |
| `Skeleton` | Espaço reservado enquanto carrega, no `loading.tsx` ou no `fallback` do `Suspense`, com o formato do conteúdo que vem. Nada de spinner no lugar de conteúdo. |
| `Card` | Bloco que agrupa um assunto na tela (um torneio na lista, um desafio). |
| `Tooltip` | Informação extra e dispensável num ícone ou botão. Não funciona no toque, então nada importante fica só nele. |
| `Carousel` | Itens em sequência que passam para o lado. Hoje só a home usa. |

**Primitivo novo** entra por `npx shadcn@latest add <nome>` num PR próprio. Duas coisas a conferir depois:

- o registry atual importa o `cn` do pacote `cn`: troque para `@/lib/utils` e não instale o pacote;
- o comando pergunta se sobrescreve primitivos que já existem (ex.: `button`): responda que não, porque eles podem ter ajustes nossos.

## Feedback e erros

- **Nunca `alert`, `confirm` nem `prompt`.** Resultado de ação vira toast (sonner), e confirmação de ação destrutiva usa o `useConfirm()`. O legado troca os seus quando a área for refeita. O exemplo em uso é a tela de excluir conta (`app/userSettings/account-delete`).
- **Aviso:** `toast.success(...)` e `toast.error(...)` de `sonner`, chamados de qualquer componente client. O `Toaster` fica no `app/layout.tsx`, então o toast continua visível depois de um `router.push` ou `redirect`.
- **Confirmação:** `useConfirm()` de `components/confirm-provider.tsx` devolve uma função que abre o AlertDialog padrão e devolve `Promise<boolean>`: `true` em confirmar; `false` em cancelar ou `Esc`. O `ConfirmProvider` também fica no `app/layout.tsx`. A `description` é obrigatória e diz o que se perde; `destructive: true` deixa o botão vermelho.

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-provider";
import { deleteRodadasAction } from "../actions";

export function DeleteRodadasButton({ torneioId }: { torneioId: string }) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    const confirmed = await confirm({
      title: "Excluir os confrontos?",
      description: "Todas as partidas e resultados deste torneio serão apagados.",
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!confirmed) return;
    startTransition(async () => {
      const result = await deleteRodadasAction(torneioId);
      if (result?.ok) toast.success("Confrontos excluídos");
      else toast.error(result?.error ?? "Não foi possível excluir os confrontos");
    });
  }

  return (
    <Button variant="destructive" disabled={pending} onClick={handleClick}>
      Excluir confrontos
    </Button>
  );
}
```

- **Conquista desbloqueada:** `showAchievement(achievement)` de `components/achievement-toast.tsx`, para cada item de `unlockedAchievements`. É um toast do sonner com o visual próprio da conquista. O `useAchievements()` de `components/achievement-provider.tsx` só repassa essa função e fica até as telas de torneios migrarem.
- **Erro de campo** aparece junto do campo, vindo de `fieldErrors`.
- **Erro inesperado** sobe para o `error.tsx` do segmento, e **carregamento** usa `loading.tsx` ou `Suspense` com `Skeleton`.

## Estilo

- Tailwind com os **tokens de tema** do `globals.css` (issue #14). Nada de cor em hex nas classes.
- **Mobile first:** a classe sem prefixo é o celular, e `md:`/`lg:` ajustam o desktop. Toda tela nova é conferida nos dois tamanhos.
- **Classes condicionais** com `cn()` de `lib/utils.ts`.

## Nomes

- **Textos da interface:** em português.
- **Identificadores:** os nomes do domínio seguem o schema do Prisma, em português (`torneio`, `partida`, `rodada`, `participante`, `resultado`). Verbos e termos técnicos ficam em inglês, como o código já faz em `deltaFromResultado`: `getTorneio`, `listRodadas`, `renameTorneioAction`, `TorneioDTO`.
- **Arquivos** em kebab-case (`standings-table.tsx`), e **componentes** em PascalCase.
- **Server Actions** terminam em `Action`, e **schemas** em `Schema`.
- **Nada de comentários no código** (regra do `CLAUDE.md`).

## Testes

| O quê | Como | Arquivo |
|---|---|---|
| Regras puras (`domain/`) | teste unitário | `*.test.ts` ao lado do arquivo |
| DAL pública e interna | teste de integração contra o banco de teste, chamando a função com um `actor` (ou sem, se for interna) | `*.int.test.ts` ao lado do arquivo |
| Server Actions | sem teste próprio: são finas e a DAL já é testada | — |

**Os testes de integração conferem o estado do banco, e a chamada da operação fica isolada num helper.** Enquanto a área é legado, o helper chama a rota; quando a área migrar, só o helper passa a chamar a DAL, e as asserções continuam as mesmas.

```ts
async function finalizar(actor: Actor, torneioId: string) {
  return callRoute(PUT, `/api/torneios/${torneioId}`, actor, { finalizado: true });
}

it("concede os pontos uma vez só, mesmo com pedidos simultâneos", async () => {
  const { criador, torneioId } = await seedTorneioComTresJogadores();
  await Promise.allSettled(Array.from({ length: 5 }, () => finalizar(criador, torneioId)));
  const pontos = await prisma.pointsHistory.count({ where: { referenceId: torneioId } });
  expect(pontos).toBe(3);
});
```

Depois da migração, `finalizar` vira `() => finalizeTorneio(actor, torneioId)`, e o teste não muda.

- **`server-only` no Vitest:** o pacote não está instalado; o Next resolve o import sozinho no build. No Vitest, ele é apontado para um módulo vazio por `resolve.alias` no `vitest.config.mts`.
- **Onde ficam:** os helpers comuns estão em `test/integration/`:
  - `createUser`, que cria o usuário com sessão real do better-auth;
  - `callRoute`, que chama um route handler direto;
  - `resetDatabase`, que limpa as tabelas antes de cada teste;
  - em `ops/`, um helper por operação de cada área.

  Os testes das áreas que ainda são legado ficam em `test/integration/<area>.int.test.ts`. Quando a área migra, os testes dela vão para o lado da DAL, e o helper de operação passa a chamar a DAL.
- **Banco de teste:** `xequemate_test`, criado e migrado sozinho na primeira execução. A configuração recusa qualquer banco cujo nome não termine em `_test`.
- **E2E com Playwright** fica para quando as telas pararem de mudar ("Depois" no plano).

## Transição

- **Uma área de cada vez, pelo dono.** Ao refazer uma área, o código dela vai para `features/<area>`, e as rotas, componentes e helpers antigos dela são apagados no mesmo trabalho.
- **Até lá, o legado fica como está.** Não se refatora código de outra área "de passagem". Se algo quebrar ou precisar mudar, abre-se uma issue para o dono.
- **Os helpers de `lib/`** que hoje são de uma área só (ex.: `lib/tournament-ranking.ts`, `lib/match-results.ts`) mudam para o `domain/` da área quando ela for refeita.
