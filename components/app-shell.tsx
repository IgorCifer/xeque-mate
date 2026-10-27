"use client";

import { ChevronsLeft, Goal, House, Trophy, User, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import DailyActivityCheck from "@/app/components/DailyActivityCheck";
import { SIDEBAR_COOKIE } from "@/components/sidebar-mode";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

export function AppShell({
  children,
  sidebarCollapsed,
}: {
  children: React.ReactNode;
  sidebarCollapsed: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);

  if (routesWithoutShell.includes(pathname)) return <>{children}</>;

  function toggleSidebar() {
    setCollapsed(!collapsed);
    document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? "expanded" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div className="flex min-h-dvh flex-col">
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
        <aside
          className={cn(
            "hidden md:flex md:shrink-0 md:flex-col overflow-x-clip bg-blue-950/50 backdrop-blur-md transition-[width] duration-200",
            collapsed ? "md:w-16" : "md:w-56"
          )}
        >
          <nav aria-label="Navegação principal" className="sticky top-0 flex flex-col gap-1 p-3">
            {navItems.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/10 hover:text-white",
                        active && "bg-white/15 text-white"
                      )}
                    >
                      <Icon size={22} className="shrink-0" />
                      <span
                        className={cn(
                          "whitespace-nowrap transition-opacity duration-200",
                          collapsed && "opacity-0"
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className={cn(!collapsed && "hidden")}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="sticky bottom-0 mt-auto p-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              className="flex rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronsLeft
                size={22}
                className={cn("transition-transform duration-200", collapsed && "rotate-180")}
              />
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">{children}</div>
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
