"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Digite um email válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type LoginFormValues = {
  email: string;
  password: string;
};

type LoginErrors = {
  email?: string;
  password?: string;
  global?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: LoginErrors = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as keyof LoginErrors;
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    await authClient.signIn.email(
      {
        email: form.email,
        password: form.password,
        callbackURL: "/home",
      },
      {
        onRequest: () => setIsLoading(true),
        onSuccess: () => {
          setIsLoading(false);
          router.push("/home");
        },
        onError: (ctx) => {
          setIsLoading(false);
          setErrors({ global: "Email ou senha Inválidos." });
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
          Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
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
          {errors.global && (
            <p className="text-red-600 text-xs text-center">{errors.global}</p>
          )}
          <div className="mt-12 space-y-4">
            <button
              type="submit"
              className="w-full p-3 bg-[#6BAAFD] text-white rounded-sm border-b-4 border-[#5C9CF0] text-xs font-bold hover:bg-[#1E50A4] hover:border-[#152E59] transition"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
            <label className="text-xs font-bold flex justify-center text-white">
              Não possui conta?
            </label>
            <Link
              href="/registrar"
              className="w-full p-3 block text-center bg-[#5AC0CB] text-white rounded-sm border-b-4 border-[#348C95] text-xs font-bold hover:bg-[#49a9b2] transition"
            >
              Cadastrar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
