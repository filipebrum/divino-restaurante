"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  CalendarCheck,
  Wine,
  ArrowUpRight,
  MapPin,
} from "lucide-react";

const VINNERO_URL = "https://app.vinnero.com.br";

interface NavItem {
  href: string;
  label: string;
  external?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Cardápio" },
  { href: VINNERO_URL, label: "Carta de Vinhos", external: true },
  { href: "/#a-casa", label: "A Casa" },
  { href: "/#horarios", label: "Horários & Local" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link
          href="/"
          id="nav-brand-logo"
          aria-label="diVino Restaurante — Página inicial"
          className="group flex shrink-0 items-center focus:outline-none"
        >
          <Image
            src="/images/divino-logo.png"
            alt="diVino Restaurante"
            width={150}
            height={66}
            priority
            className="h-10 w-auto object-contain transition-opacity duration-300 group-hover:opacity-85 sm:h-12"
          />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 lg:flex"
        >
          {navItems.map((item) => {
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="nav-vinnero-link"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors duration-300 hover:text-terracotta"
                >
                  <Wine className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                </a>
              );
            }

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/") &&
                  !item.href.includes("#") &&
                  pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 text-sm font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-forest after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold"
                    : "text-ink-soft hover:text-terracotta"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/reservas"
            id="nav-cta-reservas"
            className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-card shadow-[0_8px_20px_-10px_rgba(43,58,44,0.45)] transition-all duration-300 hover:bg-terracotta hover:shadow-[0_10px_24px_-10px_rgba(140,74,50,0.45)]"
          >
            <CalendarCheck className="h-4 w-4 text-gold" aria-hidden="true" />
            Reservar Mesa
          </Link>
        </nav>

        <div className="flex items-center gap-2.5 lg:hidden">
          <Link
            href="/reservas"
            className="hidden items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-semibold text-card transition-colors duration-300 hover:bg-terracotta sm:inline-flex"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            Reservar Mesa
          </Link>

          <button
            type="button"
            id="nav-mobile-toggle"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card text-forest transition-colors duration-300 hover:border-terracotta hover:text-terracotta"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-card px-5 py-5 shadow-[0_20px_40px_-24px_rgba(34,32,30,0.25)] lg:hidden">
          <nav aria-label="Navegação mobile" className="flex flex-col gap-1.5">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium text-ink transition-colors duration-300 hover:bg-canvas hover:text-terracotta"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Wine className="h-4 w-4 text-terracotta" aria-hidden="true" />
                    {item.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                    Vinnero
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-3 text-sm font-medium text-ink transition-colors duration-300 hover:bg-canvas hover:text-terracotta"
                >
                  {item.label}
                </Link>
              )
            )}

            <div className="mt-3 border-t border-line-soft pt-4">
              <Link
                href="/reservas"
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3.5 text-sm font-semibold text-card transition-colors duration-300 hover:bg-terracotta"
              >
                <CalendarCheck className="h-4 w-4 text-gold" aria-hidden="true" />
                Reservar Mesa
              </Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
                <MapPin className="h-3.5 w-3.5 text-terracotta" aria-hidden="true" />
                Vale do Sol • Nova Lima, MG
              </p>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
