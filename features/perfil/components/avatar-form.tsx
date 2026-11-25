"use client";

import { startTransition, useActionState, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ImageUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-provider";
import type { ActionResult, ActionState } from "@/lib/actions";
import { removeAvatarAction, updateAvatarAction } from "../actions";
import { AVATAR_SOURCE_MAX_BYTES, AVATAR_TYPES } from "../domain/avatar";
import { cropAvatar } from "./crop-avatar";
import { UserAvatar } from "./user-avatar";

function notify(result: ActionResult, fallback: string) {
  if (result.ok) {
    toast.success(result.message ?? fallback);
    return;
  }
  const fieldError = Object.values(result.fieldErrors ?? {}).flat().find(Boolean);
  toast.error(result.error ?? fieldError ?? "Não foi possível salvar a foto.");
}

type AvatarFormProps = {
  image: string | null;
  name: string;
};

export function AvatarForm({ image, name }: AvatarFormProps) {
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);

  const [, uploadAction, uploading] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateAvatarAction(prev, formData);
      notify(result ?? { ok: false }, "Foto atualizada.");
      return result;
    },
    null,
  );

  const [, removeAction, removing] = useActionState(async () => {
    const result = await removeAvatarAction();
    notify(result ?? { ok: false }, "Foto removida.");
    return result;
  }, null);

  const busy = preparing || uploading || removing;

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Escolha uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > AVATAR_SOURCE_MAX_BYTES) {
      toast.error("A imagem deve ter no máximo 10 MB.");
      return;
    }

    setPreparing(true);
    let avatar: File;
    try {
      avatar = await cropAvatar(file);
    } catch {
      toast.error("Não foi possível ler esta imagem.");
      return;
    } finally {
      setPreparing(false);
    }

    const formData = new FormData();
    formData.set("avatar", avatar);
    startTransition(() => uploadAction(formData));
  }

  async function handleRemove() {
    const confirmed = await confirm({
      title: "Remover foto?",
      description: "Seu perfil volta a mostrar o ícone padrão.",
      confirmLabel: "Remover",
      destructive: true,
    });
    if (confirmed) startTransition(() => removeAction());
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <UserAvatar image={image} name={name} className="size-24 rounded-2xl" />

      <div className="flex w-full flex-col gap-2">
        <input
          ref={inputRef}
          id="avatar"
          type="file"
          accept={AVATAR_TYPES.join(",")}
          onChange={handleFile}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full rounded-sm bg-brand-400 hover:bg-brand-600 hover:border-brand-900 transition text-white text-xs font-bold py-3 border-b-4 border-brand-500"
        >
          <ImageUp className="size-4" />
          {preparing || uploading ? "Enviando..." : image ? "Trocar foto" : "Escolher foto"}
        </Button>
        {image ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={busy}
            className="w-full text-xs text-white hover:bg-white/10 hover:text-white"
          >
            <Trash2 className="size-4" />
            {removing ? "Removendo..." : "Remover foto"}
          </Button>
        ) : null}
        <p className="text-center text-xs text-white/60 sm:text-left">
          JPEG, PNG ou WebP de até 10 MB. A foto é recortada no centro em formato quadrado.
        </p>
      </div>
    </div>
  );
}
