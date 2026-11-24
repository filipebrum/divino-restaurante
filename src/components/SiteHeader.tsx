"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, CalendarCheck, Lock } from "lucide-react";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Cardápio Digital" },
  { href: "/reservas", label: "Reservas" },
  { href: "/#a-casa", label: "A Casa" },
  { href: "/#horarios", label: "Horários & Local" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Link
          href="/"
          id="nav-brand-logo"
          aria-label="diVino Restaurante — Página inicial"
          className="group flex items-center focus:outline-none"
        >
          <Image
            src="/images/divino-logo.png"
            alt="diVino Restaurante"
            width={150}
            height={66}
            priority
            className="h-10 w-auto object-contain transition-opacity group-hover:opacity-90 sm:h-12"
          />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 md:flex"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-terracotta"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            id="nav-admin-link"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Área Interna
          </Link>
          <Link
            href="/reservas"
            id="nav-cta-reservas"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-all hover:bg-terracotta"
          >
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Reservar Mesa
          </Link>
        </nav>

        <button
          type="button"
          id="nav-mobile-toggle"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-terracotta hover:text-terracotta md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-line/80 bg-card px-5 py-5 md:hidden">
          <nav aria-label="Navegação mobile" className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              Área Interna (Equipe)
            </Link>
            <Link
              href="/reservas"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-terracotta"
            >
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Reservar Mesa
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
