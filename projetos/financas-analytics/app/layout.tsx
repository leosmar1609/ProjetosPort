import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/layout/NavBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Painel Financeiro",
    template: "%s | Painel Financeiro",
  },
  description: "Dashboard de finanças pessoais com gráficos, indicadores e exportação para Excel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-plano font-sans text-tinta">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
