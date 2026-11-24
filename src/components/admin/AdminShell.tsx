"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Wallet,
  ReceiptText,
  Landmark,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

import { clearClientAuthToken } from "@/lib/admin-fetch";

interface AdminShellProps {
  userName: string;
  userRole: string;
  onLogout?: () => void;
  children: React.ReactNode;
}

const navLinks = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarDays, exact: false },
  { href: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed, exact: false },
  {
    href: "/admin/fechamento-mesas",
    label: "Fechamento de Mesas",
    icon: ReceiptText,
    exact: false,
  },
  {
    href: "/admin/caixa-geral",
    label: "Caixa Geral",
    icon: Landmark,
    exact: false,
  },
  {
    href: "/admin/financeiro",
    label: "Contas & Fluxo",
    icon: Wallet,
    exact: false,
  },
];

export function AdminShell({
  userName,
  userRole,
  onLogout,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    clearClientAuthToken();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    if (onLogout) {
      onLogout();
      return;
    }
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const isSubpage = pathname !== "/admin";
  const currentSection = navLinks.find((l) => isActive(l.href, l.exact));

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="border-b border-line px-6 py-5">
          <Link href="/admin" className="block" onClick={() => setSidebarOpen(false)}>
            <Image
              src="/images/divino-logo.png"
              alt="diVino Restaurante"
              width={136}
              height={60}
              priority
              className="h-11 w-auto object-contain"
            />
          </Link>
          <p className="mt-2 text-xs text-ink-muted">
            {userName} · {userRole}
          </p>
        </div>

        <nav aria-label="Navegação interna" className="space-y-1 p-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-ink text-canvas"
                    : "text-ink-soft hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-1.5 border-t border-line p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          Ver Site Público
        </Link>
        <button
          type="button"
          id="admin-logout-btn"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sair do Painel
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-card lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-card shadow-xl">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-ink-muted hover:bg-paper hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Área Principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card/95 px-5 py-3.5 backdrop-blur-md lg:hidden">
          <button
            type="button"
            aria-label="Abrir navegação interna"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/admin" aria-label="Voltar à Visão Geral">
            <Image
              src="/images/divino-logo.png"
              alt="diVino Restaurante"
              width={110}
              height={48}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-terracotta hover:underline"
          >
            Site
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8 sm:py-8">
          {/* Barra de retorno rápido para todas as subpáginas da Área Interna */}
          {isSubpage && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  id="admin-back-overview-btn"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-xs font-semibold text-ink shadow-2xs transition-colors hover:border-terracotta hover:text-terracotta"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Voltar ao Início do Painel
                </Link>
                {currentSection && (
                  <span className="hidden text-xs text-ink-muted sm:inline">
                    Área Interna /{" "}
                    <strong className="font-semibold text-ink">
                      {currentSection.label}
                    </strong>
                  </span>
                )}
              </div>

              {/* Atalhos rápidos entre módulos em telas compactas (onde a sidebar fica recolhida) */}
              <div className="flex flex-wrap items-center gap-1.5 lg:hidden">
                {navLinks
                  .filter((l) => !l.exact)
                  .map((link) => {
                    const active = isActive(link.href, false);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                          active
                            ? "bg-ink text-canvas"
                            : "bg-paper text-ink-soft hover:text-ink"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
