import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import prisma from "./prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";

// Ações de conta que exigem a senha atual. Sem envio de e-mail, a senha é a
// única prova de que quem está com a sessão aberta é o dono da conta.
const PATHS_WITH_PASSWORD = ["/change-email", "/delete-user"];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    // Não há verificação de e-mail, então a troca é imediata.
    changeEmail: { enabled: true, updateEmailWithoutVerification: true },
    deleteUser: { enabled: true },
  },
  hooks: {
    // Roda antes da validação do endpoint, com o corpo original da requisição.
    before: createAuthMiddleware(async (ctx) => {
      if (!PATHS_WITH_PASSWORD.includes(ctx.path)) return;

      const password = ctx.body?.password;
      if (typeof password !== "string" || !password) {
        throw new APIError("BAD_REQUEST", { message: "Informe sua senha." });
      }

      const session = await getSessionFromCtx(ctx);
      if (!session) {
        throw new APIError("UNAUTHORIZED", { message: "Não autenticado." });
      }

      const account = await ctx.context.internalAdapter.findCredentialAccount(session.user.id);
      const valid =
        !!account?.password &&
        (await ctx.context.password.verify({ hash: account.password, password }));
      if (!valid) {
        throw new APIError("BAD_REQUEST", { message: "Senha incorreta." });
      }

      // Sem verificação, o better-auth responde sucesso sem mudar nada quando o
      // e-mail já é de outra conta; aqui a recusa fica explícita (o cadastro já
      // revela se um e-mail existe).
      if (ctx.path === "/change-email") {
        const newEmail = String(ctx.body?.newEmail ?? "").toLowerCase();
        if (newEmail && (await ctx.context.internalAdapter.findUserByEmail(newEmail))) {
          throw new APIError("BAD_REQUEST", { message: "Este e-mail já está em uso." });
        }
      }
    }),
  },
});
