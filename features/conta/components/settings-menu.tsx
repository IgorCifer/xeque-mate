import Link from "next/link";
import { ChevronRight, Lock, Trash2, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";

const ITEMS = [
  { href: "/userSettings/change-email", label: "Alterar endereço de e-mail", icon: Wrench },
  { href: "/userSettings/change-password", label: "Alterar Senha", icon: Lock },
  { href: "/userSettings/change-profile", label: "Alterar Perfil", icon: User },
  { href: "/userSettings/account-delete", label: "Apagar Conta", icon: Trash2 },
];

export function SettingsMenu() {
  return (
    <nav aria-label="Configurações da conta" className="space-y-2">
      <ul className="space-y-2">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Button
              asChild
              variant="ghost"
              className="h-auto w-full justify-between px-3 py-3 font-normal text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={href}>
                <span className="flex items-center gap-3">
                  <Icon />
                  {label}
                </span>
                <ChevronRight />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      <SignOutButton />
    </nav>
  );
}
