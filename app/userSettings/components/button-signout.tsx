"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function ButtonSignOut() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/login");
        },
      },    
    });
}

  return (
    <button
      className="mt-4 ml-4 flex items-center text-sm text-red-400 font-semibold"
      onClick={signOut}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sair
    </button>
  );
}

