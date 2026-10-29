"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authRequestError } from "../auth-request";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const error = await authRequestError(() => authClient.signOut(), "Não foi possível sair.");
      if (error) {
        toast.error(error);
        return;
      }
      router.replace("/login");
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={handleClick}
      className="mt-4 ml-1 justify-start px-3 text-sm font-semibold text-red-400 hover:bg-white/10 hover:text-red-300"
    >
      <LogOut />
      Sair
    </Button>
  );
}
