"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";


const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "A senha atual deve ter pelo menos 8 caracteres."),
    newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export function ChangePasswordClient() {
  const router = useRouter();

  const [formData, setFormData] = useState<ChangePasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ChangePasswordForm, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof ChangePasswordForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validateForm() {
    const result = changePasswordSchema.safeParse(formData);

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: Partial<Record<keyof ChangePasswordForm, string>> = {};

    for (const issue of result.error.issues) {
      const path = issue.path[0] as keyof ChangePasswordForm | undefined;
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
    const { error } = await authClient.changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      revokeOtherSessions: true,
    });

    if (error) {
      alert(error.message || "Erro ao alterar senha.");
      setIsLoading(false);
      return;
    }

    alert("Senha alterada com sucesso! Faça login novamente com a nova senha.");
    router.push("/login");
  } catch (err) {
    console.error(err);
    alert("Erro inesperado ao alterar senha.");
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
        <div className="mt-1 mb-4 ">
          <h1 className="text-2xl font-bold">Alterar Senha</h1>
          <p className="mt-2 text-base text-white">
            Preencha os campos abaixo para atualizar sua senha.
          </p>
        </div>

        <Card className="mt-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md">
          <CardContent className="px-4 py-5 space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    name="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Digite a sua senha atual"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`
                      w-full mt-1 p-3
                      bg-[#F5F8FA] border border-neutral-400 rounded-[4px]
                      focus:outline-none focus:ring-1
                      text-[10px] text-black
                      pr-10
                      ${errors.currentPassword ? "border-red-500" : ""}
                    `}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    aria-label={showCurrent ? "ocultar senha" : "mostrar senha"}
                    onClick={() => setShowCurrent((prev) => !prev)}
                  >
                    {showCurrent ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-600 text-xs">{errors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="Digite a nova senha"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`
                      w-full mt-1 p-3
                      bg-[#F5F8FA] border border-neutral-400 rounded-[4px]
                      focus:outline-none focus:ring-1
                      text-[10px] text-black
                      pr-10
                      ${errors.newPassword ? "border-red-500" : ""}
                    `}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    aria-label={showNew ? "ocultar senha" : "mostrar senha"}
                    onClick={() => setShowNew((prev) => !prev)}
                  >
                    {showNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-600 text-xs">{errors.newPassword}</p>
                )}
              </div>


              <div className="space-y-1">
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirme a nova senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`
                      w-full mt-1 p-3
                      bg-[#F5F8FA] border border-neutral-400 rounded-[4px]
                      focus:outline-none focus:ring-1
                      text-[10px] text-black
                      pr-10
                      ${errors.confirmPassword ? "border-red-500" : ""}
                    `}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    aria-label={showConfirm ? "ocultar senha" : "mostrar senha"}
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-xs">{errors.confirmPassword}</p>
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
