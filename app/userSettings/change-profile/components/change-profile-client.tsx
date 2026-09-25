"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Image as ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const changeProfileSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(50, "O nome deve ter no máximo 50 caracteres."),
});

type ChangeProfileForm = z.infer<typeof changeProfileSchema>;

export function ChangeProfileClient() {
  const router = useRouter();

  const [formData, setFormData] = useState<ChangeProfileForm>({
    name: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ChangeProfileForm, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl] = useState<string | null>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof ChangeProfileForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validateForm() {
    const result = changeProfileSchema.safeParse(formData);

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: Partial<Record<keyof ChangeProfileForm, string>> = {};
    for (const issue of result.error.issues) {
      const path = issue.path[0] as keyof ChangeProfileForm | undefined;
      if (!path) continue;
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    setErrors(fieldErrors);
    return false;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload: { name: string; image?: string } = {
        name: formData.name,
      };

      if (imageUrl) {
        payload.image = imageUrl;
      }

      const { error } = await authClient.updateUser(payload);

      if (error) {
        alert(error.message || "Erro ao atualizar perfil.");
        setIsLoading(false);
        return;
      }

      alert("Perfil atualizado com sucesso!");
      router.back();
    } catch (err) {
      console.error(err);
      alert("Erro inesperado ao atualizar perfil.");
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
          <h1 className="text-2xl font-bold">Alterar Perfil</h1>
          <p className="mt-2 text-base text-white/80">
            Preencha os campos abaixo para alterar os dados do seu perfil.
          </p>
        </div>

        <Card className="mt-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md">
          <CardContent className="px-4 py-6 space-y-6">

            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-[#B3B6BF] overflow-hidden flex items-center justify-center">
                  {previewUrl ? (

                    <img
                      src={previewUrl}
                      alt="Pré-visualização do avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-white" />
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#6BAAFD] flex items-center justify-center cursor-pointer border border-white/70">
                  <Pencil className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </label>
              </div>

              <p className="text-[10px] text-white/70">
                Toque no ícone para selecionar uma nova foto de perfil.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <div className="relative">
                  <input
                    name="name"
                    type="text"
                    placeholder="Digite seu novo nome"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`
                      w-full mt-1 p-3
                      bg-[#F5F8FA] border border-neutral-400 rounded-[999px]
                      focus:outline-none focus:ring-1
                      text-[10px] text-black
                      pr-10
                      ${errors.name ? "border-red-500" : ""}
                    `}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
                    <Pencil className="w-3 h-3" />
                  </span>
                </div>
                {errors.name && (
                  <p className="text-red-600 text-xs">{errors.name}</p>
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
