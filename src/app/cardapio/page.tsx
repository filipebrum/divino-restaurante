import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMenuCategories } from "@/lib/menu";
import { DigitalMenuExplorer } from "@/components/DigitalMenuExplorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cardápio Digital",
  description:
    "Confira o cardápio autoral do diVino Restaurante no Vale do Sol, Nova Lima/MG: entradas, pratos principais, massas, sobremesas e harmonização com a Carta de Vinhos Vinnero.",
};

export default async function CardapioPage() {
  const categories = await getMenuCategories();

  return (
    <div className="bg-canvas pb-24 pt-10 text-ink sm:pt-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted transition-colors duration-300 hover:text-terracotta"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Voltar ao início
        </Link>

        <header className="mt-6 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            diVino Restaurante • Vale do Sol
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-forest sm:text-6xl">
            Cardápio da Casa
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
            Explore nossa cozinha autoral preparada com ingredientes frescos da
            estação. Pesquise pratos, filtre por preferências alimentares e
            consulte nossa Carta de Vinhos Digital no Vinnero.
          </p>
        </header>

        <div className="mt-10">
          <DigitalMenuExplorer categories={categories} />
        </div>
      </div>
    </div>
  );
}
