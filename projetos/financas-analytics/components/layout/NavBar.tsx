import Link from "next/link";
import { Wallet } from "lucide-react";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/transacoes", label: "Transações" },
];

export function NavBar() {
  return (
    <header className="border-b border-borda bg-superficie">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-tinta">
          <Wallet size={20} className="text-cat-1" />
          Painel Financeiro
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-tinta-secundaria hover:bg-plano hover:text-tinta"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
