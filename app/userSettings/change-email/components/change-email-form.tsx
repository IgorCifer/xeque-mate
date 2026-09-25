"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";


const changeEmailSchema = z
  .object({
    newEmail: z.email("Digite um e-mail válido."),
    confirmEmail: z.email("Digite um e-mail válido."),
    password: z.string().min(8, "Digite sua senha."),
  })
  .refine((data) => data.newEmail === data.confirmEmail, {
    message: "Os e-mails não coincidem.",
    path: ["confirmEmail"],
  });

type ChangeEmailForm = z.infer<typeof changeEmailSchema>;

export function ChangeEmailClient() {
  const router = useRouter();

  const [formData, setFormData] = useState<ChangeEmailForm>({
    newEmail: "",
    confirmEmail: "",
    password: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ChangeEmailForm, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof ChangeEmailForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validateForm() {
    const result = changeEmailSchema.safeParse(formData);

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: Partial<Record<keyof ChangeEmailForm, string>> = {};

    for (const issue of result.error.issues) {
      const path = issue.path[0] as keyof ChangeEmailForm | undefined;
      if (!path) continue;
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }

    setErrors(fieldErrors);
    return false;
  }

    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return; 

    setIsLoading(true);

    try {
        const { error } = await authClient.changeEmail({
        newEmail: formData.newEmail,
        callbackURL: "/home",
        });

        if (error) {
        alert(error.message || "Erro ao alterar e-mail.");
        setIsLoading(false);
        return;
        }

        alert("E-mail atualizado com sucesso!");
        router.push("/userSettings");
    } catch (err) {
        console.error(err);
        alert("Erro inesperado ao alterar e-mail.");
    } finally {
        setIsLoading(false);
    }
}


  return (
    <div className=" text-white">
      <header className="pt-6 px-5 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center text-base mb-4"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </button>
      </header>

      <main className="flex-1 px-5 pb-6">
        <div className="mt-1 mb-4">
          <h1 className="text-2xl font-bold">Alterar E-mail</h1>
          <p className="mt-2 text-base text-white">
            Preencha os campos abaixo para alterar os dados do seu email.
          </p>
        </div>

        <Card className="mt-4 rounded-2xl border border-white/40 bg-white/5 backdrop-blur-md">
          <CardContent className="px-4 py-5 space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <input
                  name="newEmail"
                  type="email"
                  placeholder="Digite seu novo e-mail"
                  value={formData.newEmail}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`
                    w-full mt-1 p-3
                    bg-[#F5F8FA] border border-neutral-400 rounded-lg
                    focus:outline-none focus:ring-1
                    text-[10px] text-black
                    ${errors.newEmail ? "border-red-500" : ""}
                  `}
                />
                {errors.newEmail && (
                  <p className="text-red-600 text-xs">{errors.newEmail}</p>
                )}
              </div>

              <div className="space-y-1">
                <input
                  name="confirmEmail"
                  type="email"
                  placeholder="Confirme o seu novo e-mail"
                  value={formData.confirmEmail}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`
                    w-full mt-1 p-3
                    bg-[#F5F8FA] border border-neutral-400 rounded-lg
                    focus:outline-none focus:ring-1
                    text-[10px] text-black
                    ${errors.confirmEmail ? "border-red-500" : ""}
                  `}
                />
                {errors.confirmEmail && (
                  <p className="text-red-600 text-xs">
                    {errors.confirmEmail}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`
                      w-full mt-1 p-3
                      bg-[#F5F8FA] border border-neutral-400 rounded-lg
                      focus:outline-none focus:ring-1
                      text-[10px] text-black
                      pr-10
                      ${errors.password ? "border-red-500" : ""}
                    `}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    aria-label={showPassword ? "ocultar senha" : "mostrar senha"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-xs">{errors.password}</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-sm bg-[#6BAAFD] hover:bg-[#1E50A4] hover:border-[#152E59] transition text-white text-xs font-bold py-3 border-b-4 border-[#5C9CF0]"
                >
                  {isLoading ? "Confirmando..." : "Confirmar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
