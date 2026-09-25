"use client";

import { useRouter } from "next/navigation";
import {
ChevronRight,
Wrench,
Lock,
User,
Trash2,
ChevronLeft,
} from "lucide-react";
import { ButtonSignOut } from "@/app/userSettings/components/button-signout";

type SettingsItemProps = {
icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
label: string;
onClick: () => void;
};

function SettingsItem({ icon: Icon, label, onClick }: SettingsItemProps) {
return (
<button onClick={onClick} className="w-full flex items-center justify-between px-3 py-3 rounded-md hover:bg-white/10 transition" >
<div className="flex items-center space-x-3">
<Icon className="w-4 h-4" />
<span className="text-sm">{label}</span>
</div>
<ChevronRight className="w-4 h-4" />
</button>
);
}

export function SettingsClient() {
const router = useRouter();

return (
<div className="text-white">
<header className="pt-6 px-5 pb-3">
<button
onClick={() => router.back()}
className="flex items-center text-base mb-4"
>
<ChevronLeft className="w-5 h-5 mr-1" />
<span>Voltar</span>
</button>
</header>

  <div 
    className="px-5 pb-6 mb-[-15]">
    <h1 className="text-2xl font-bold">Configurações</h1>
  </div>

  <main className="flex-1 px-4 pt-4 pb-24 space-y-2">
    <SettingsItem
      icon={Wrench}
      label="Alterar endereço de e-mail"
      onClick={() => router.push("/userSettings/change-email")}
    />
    <SettingsItem
      icon={Lock}
      label="Alterar Senha"
      onClick={() => router.push("/userSettings/change-password")}
    />
    <SettingsItem
      icon={User}
      label="Alterar Perfil"
      onClick={() => router.push("/userSettings/change-profile")}
    />
    <SettingsItem
      icon={Trash2}
      label="Apagar Conta"
      onClick={() => router.push("/userSettings/account-delete")}
    />
    <ButtonSignOut />
  </main>
</div>
);
}