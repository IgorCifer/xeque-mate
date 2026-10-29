import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Digite um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Digite ao menos 2 letras."),
    email: z.email("Digite um e-mail válido."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    repeatPassword: z.string(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Senhas diferentes.",
    path: ["repeatPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "A senha atual deve ter pelo menos 8 caracteres."),
    newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const changeEmailSchema = z
  .object({
    newEmail: z.email("Digite um e-mail válido."),
    confirmEmail: z.email("Digite um e-mail válido."),
    password: z.string().min(8, "Digite sua senha."),
  })
  .refine((data) => data.newEmail === data.confirmEmail, {
    message: "Os e-mails não coincidem.",
    path: ["confirmEmail"],
  });
