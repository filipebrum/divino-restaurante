import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMenuCategories } from "@/lib/menu";
import { DigitalMenuExplorer } from "@/components/DigitalMenuExplorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cardápio Digital",
  description:
    "Confira o cardápio completo do Divino Restaurante: entradas, pratos principais, massas, risotos, sobremesas e bebidas com filtros rápidos.",
};

export default async function CardapioPage() {
  const categories = await getMenuCategories();

  return (
    <div className="bg-canvas pb-20 pt-10 text-ink sm:pt-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-terracotta"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Voltar ao início
        </Link>

        <header className="mt-6 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
            Divino Restaurante
          </p>
          <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            Cardápio Digital
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
            Navegue por todas as categorias, pesquise ingredientes ou filtre por
            preferências alimentares. Ideal também para acesso via QR Code nas
            mesas.
          </p>
        </header>

        <div className="mt-10">
          <DigitalMenuExplorer categories={categories} />
        </div>
      </div>
    </div>
  );
}
