import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/confirm-provider";

const montserrat = Montserrat({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xeque-Mate",
  description:
    "Clube de xadrez com torneios, desafios diários e semanais, ranking de pontos e conquistas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <TooltipProvider>
        <body
          className={`${montserrat.className} bg-[url("../assets/background-image.png")] antialiased min-h-screen`}
        >
          <ConfirmProvider>
            <AppShell>{children}</AppShell>
          </ConfirmProvider>
          <Toaster position="top-center" theme="light" />
        </body>
      </TooltipProvider>
    </html>
  );
}
