"use client";

import { Goal, House, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/home", icon: House },
  { href: "/torneios", icon: Trophy },
  { href: "/practice", icon: Goal },
  { href: "/profile", icon: User },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="w-full fixed bottom-0 flex items-center text-gray-500 h-[68px] bg-blue-950/50 backdrop-blur-md">
      {items.map(({ href, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center relative ${
              active ? "text-white" : ""
            }`}
          >
            <Icon size={25} />
            <span
              className={`absolute -bottom-3 w-1.5 h-1.5 rounded-full transition-opacity ${
                active ? "bg-white opacity-100" : "opacity-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
