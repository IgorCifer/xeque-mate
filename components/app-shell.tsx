"use client";

import { Goal, House, Trophy, User, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DailyActivityCheck from "@/app/components/DailyActivityCheck";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string[];
};

const navItems: NavItem[] = [
  { href: "/home", label: "Início", icon: House },
  { href: "/torneios", label: "Torneios", icon: Trophy },
  { href: "/practice", label: "Prática", icon: Goal },
  { href: "/profile", label: "Perfil", icon: User, match: ["/userSettings"] },
];

const routesWithoutShell = ["/login", "/registrar"];

function isActive(pathname: string, item: NavItem) {
  return [item.href, ...(item.match ?? [])].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (routesWithoutShell.includes(pathname)) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="text-white flex items-center justify-center gap-4 p-4 bg-blue-950/50 backdrop-blur-md">
        <div className="relative w-10 h-10">
          <Image
            fill
            className="object-contain"
            src="/logo.png"
            alt="Clube Xeque-Mate de Iguatu"
          />
        </div>
        <h2>Clube Xeque Mate de Iguatu</h2>
      </header>

      <div className="flex flex-1">
        <aside className="hidden md:block md:w-56 md:shrink-0 bg-blue-950/50 backdrop-blur-md">
          <nav aria-label="Navegação principal" className="sticky top-0 flex flex-col gap-1 p-3">
            {navItems.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/10 hover:text-white",
                    active && "bg-white/15 text-white"
                  )}
                >
                  <Icon size={22} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-center text-gray-500 h-[68px] bg-blue-950/50 backdrop-blur-md"
      >
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center justify-center relative",
                active && "text-white"
              )}
            >
              <Icon size={25} />
              <span
                className={cn(
                  "absolute -bottom-3 w-1.5 h-1.5 rounded-full transition-opacity opacity-0",
                  active && "bg-white opacity-100"
                )}
              />
            </Link>
          );
        })}
      </nav>

      <DailyActivityCheck />
    </div>
  );
}
