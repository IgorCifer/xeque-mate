import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  changeEmailSchema,
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "./schemas";

function fieldErrors(schema: z.ZodType, input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) return {};
  return z.flattenError(result.error).fieldErrors;
}

describe("loginSchema", () => {
  it("aceita e-mail e senha válidos", () => {
    expect(loginSchema.safeParse({ email: "ana@teste.com", password: "12345678" }).success).toBe(
      true,
    );
  });

  it("recusa e-mail inválido e senha curta, com a mensagem de cada campo", () => {
    expect(fieldErrors(loginSchema, { email: "ana", password: "123" })).toEqual({
      email: ["Digite um e-mail válido."],
      password: ["A senha deve ter pelo menos 8 caracteres."],
    });
  });
});

describe("registerSchema", () => {
  const valido = {
    name: "Ana",
    email: "ana@teste.com",
    password: "12345678",
    repeatPassword: "12345678",
  };

  it("aceita um cadastro válido", () => {
    expect(registerSchema.safeParse(valido).success).toBe(true);
  });

  it("recusa nome curto", () => {
    expect(fieldErrors(registerSchema, { ...valido, name: "A" })).toEqual({
      name: ["Digite ao menos 2 letras."],
    });
  });

  it("recusa senhas diferentes no campo de repetir", () => {
    expect(fieldErrors(registerSchema, { ...valido, repeatPassword: "87654321" })).toEqual({
      repeatPassword: ["Senhas diferentes."],
    });
  });
});

describe("changePasswordSchema", () => {
  it("aceita quando a confirmação bate com a nova senha", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "senha-atual",
        newPassword: "senha-nova",
        confirmPassword: "senha-nova",
      }).success,
    ).toBe(true);
  });

  it("recusa confirmação diferente", () => {
    expect(
      fieldErrors(changePasswordSchema, {
        currentPassword: "senha-atual",
        newPassword: "senha-nova",
        confirmPassword: "senha-outra",
      }),
    ).toEqual({ confirmPassword: ["As senhas não coincidem."] });
  });
});

describe("changeEmailSchema", () => {
  it("aceita quando os dois e-mails batem", () => {
    expect(
      changeEmailSchema.safeParse({
        newEmail: "novo@teste.com",
        confirmEmail: "novo@teste.com",
        password: "12345678",
      }).success,
    ).toBe(true);
  });

  it("recusa e-mails diferentes e senha vazia, com os dois erros de uma vez", () => {
    expect(
      fieldErrors(changeEmailSchema, {
        newEmail: "novo@teste.com",
        confirmEmail: "outro@teste.com",
        password: "",
      }),
    ).toEqual({
      confirmEmail: ["Os e-mails não coincidem."],
      password: ["Digite sua senha."],
    });
  });
});
