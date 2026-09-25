"use client";

import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Digite ao menos 2 letras."),
  email: z.email("Digite um email válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  repeatPassword: z.string(),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Senhas diferentes.",
  path: ["repeatPassword"],
});

type FormValues = {
  name: string;
  email: string;
  password: string;
  repeatPassword: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  repeatPassword?: string;
  global?: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormValues>({
    name: "",
    email: "",
    password: "",
    repeatPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as keyof FormErrors;
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    await authClient.signUp.email(
      {
        name: form.name,
        email: form.email,
        password: form.password,
        callbackURL: "/home",
      },
      {
        onRequest: () => setIsLoading(true),
        onSuccess: (ctx) => {
          console.log("Usuário cadastrado com sucesso!", ctx);
          setIsLoading(false);
          router.push("/home");
        },
        onError: () => {
          setIsLoading(false);
          setErrors({ global: "Não foi possível cadastrar. Tente novamente." })
        },
      }
    );
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-[url('/background-image.png')]">
      <div className="w-full max-w-md p-12">
        <div className="flex justify-center mb-4">
          <Image
            src="/xequeLogo.jpg"
            className="object-cover rounded-full"
            alt="Logo"
            width={120}
            height={120}
          />
        </div>
        <h1 className="text-2xl mb-2 text-center text-white">
          Cadastro de Usuário
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 p-3 bg-[#F5F8FA] border border-neutral-400 rounded-[4px] focus:outline-none focus:ring-1 text-[10px]"
              placeholder="Nome"
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-600 text-xs">{errors.name}</p>}
          </div>
          <div>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1 p-3 bg-[#F5F8FA] border border-neutral-400 rounded-[4px] focus:outline-none focus:ring-1 text-[10px]"
              placeholder="Email"
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-600 text-xs">{errors.email}</p>}
          </div>
          <div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full mt-1 p-3 bg-[#F5F8FA] border border-neutral-400 rounded-[4px] focus:outline-none focus:ring-1 text-[10px]"
              placeholder="Senha"
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-600 text-xs">{errors.password}</p>}
          </div>
          <div>
            <input
              type="password"
              name="repeatPassword"
              value={form.repeatPassword}
              onChange={(e) => setForm({ ...form, repeatPassword: e.target.value })}
              className="w-full mt-1 p-3 bg-[#F5F8FA] border border-neutral-400 rounded-[4px] focus:outline-none focus:ring-1 text-[10px]"
              placeholder="Repetir senha"
              disabled={isLoading}
            />
            {errors.repeatPassword && <p className="text-red-600 text-xs">{errors.repeatPassword}</p>}
          </div>
           {errors.global && (
            <p className="text-red-600 text-xs text-center">{errors.global}</p>
          )}
          <div className="mt-12 space-y-4">
            <button
              type="submit"
              className="w-full p-3 bg-[#6BAAFD] text-white rounded-sm border-b-4 border-[#5C9CF0] text-xs font-bold hover:bg-[#1E50A4] hover:border-[#152E59] transition"
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </button>
            <label className="text-xs font-bold flex justify-center text-white">
              Já possui uma conta?
            </label>
            <Link
              href="/login"
              className="w-full p-3 block text-center bg-[#5AC0CB] text-white rounded-sm border-b-4 border-[#348C95] text-xs font-bold hover:bg-[#49a9b2] transition"
            >Entrar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
