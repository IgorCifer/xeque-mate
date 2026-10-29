import type { ReactNode } from "react";
import Image from "next/image";

export function AuthScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-6 py-12 sm:p-12">
        <div className="mb-4 flex justify-center">
          <Image
            src="/xequeLogo.jpg"
            className="rounded-full object-cover"
            alt="Logo"
            width={120}
            height={120}
          />
        </div>
        <h1 className="mb-2 text-center text-2xl text-white">{title}</h1>
        {children}
      </div>
    </div>
  );
}
