import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";

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
          <LayoutWrapper>{children}</LayoutWrapper>
        </body>
      </TooltipProvider>
    </html>
  );
}
