"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  Leaf,
  WheatOff,
  RotateCcw,
  Wine,
  ArrowUpRight,
} from "lucide-react";
import type { MenuCategoryDTO } from "@/lib/menu";
import { formatPrice, parseTags } from "@/lib/format";

const VINNERO_URL = "https://app.vinnero.com.br";

interface DigitalMenuExplorerProps {
  categories: MenuCategoryDTO[];
}

const DIETARY_FILTERS = [
  { id: "Favorito da Casa", label: "Favoritos da Casa", icon: Sparkles },
  { id: "Vegetariano", label: "Vegetariano", icon: Leaf },
  { id: "Sem Glúten", label: "Sem Glúten", icon: WheatOff },
] as const;

export function DigitalMenuExplorer({ categories }: DigitalMenuExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return categories
      .filter(
        (category) =>
          selectedCategory === "all" || category.slug === selectedCategory
      )
      .map((category) => {
        const items = category.items.filter((item) => {
          const itemTags = parseTags(item.tags);
          const matchesTag = !selectedTag || itemTags.includes(selectedTag);
          const matchesQuery =
            !normalizedQuery ||
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.description.toLowerCase().includes(normalizedQuery) ||
            item.tags.toLowerCase().includes(normalizedQuery);
          return matchesTag && matchesQuery;
        });

        return { ...category, items };
      })
      .filter((category) => category.items.length > 0);
  }, [categories, selectedCategory, selectedTag, query]);

  const totalVisibleItems = useMemo(
    () => filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0),
    [filteredCategories]
  );

  const hasActiveFilters =
    selectedCategory !== "all" || selectedTag !== null || query.trim() !== "";

  function resetFilters() {
    setSelectedCategory("all");
    setSelectedTag(null);
    setQuery("");
  }

  return (
    <div className="space-y-8">
      {/* Banner de Harmonização — Carta de Vinhos Vinnero */}
      <aside
        aria-label="Carta de Vinhos Digital Vinnero"
        className="relative overflow-hidden rounded-xl border border-gold/35 bg-forest p-6 text-card shadow-[0_18px_40px_-24px_rgba(43,58,44,0.45)] sm:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gold/10 blur-2xl"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-gold uppercase">
              <Wine className="h-4 w-4" aria-hidden="true" />
              Carta de Vinhos Digital • Vinnero
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold leading-snug text-card sm:text-3xl">
              Harmonize sua experiência
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-card/85 sm:text-base">
              Explore nossa seleção de rótulos nacionais e importados com notas
              de degustação e sugestões do chef em nossa Carta de Vinhos
              Digital.
            </p>
          </div>

          <a
            id="menu-vinnero-cta"
            href={VINNERO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-semibold text-ink shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:text-forest"
          >
            Acessar Carta de Vinhos Vinnero
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </aside>

      {/* Barra de busca e filtros */}
      <div className="rounded-xl border border-line bg-card p-5 shadow-[0_10px_28px_-18px_rgba(43,58,44,0.12)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <label htmlFor="menu-search-input" className="sr-only">
              Buscar pratos, ingredientes ou bebidas
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              id="menu-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar prato, ingrediente ou bebida..."
              className="w-full rounded-xl border border-line bg-canvas py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted transition-colors duration-300 focus:border-forest focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DIETARY_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedTag === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  id={`menu-tag-${filter.id.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() =>
                    setSelectedTag((prev) =>
                      prev === filter.id ? null : filter.id
                    )
                  }
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? "border-terracotta bg-terracotta text-card shadow-sm"
                      : "border-line bg-canvas text-ink-soft hover:border-gold hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {filter.label}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                id="menu-reset-filters"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-ink-muted transition-colors duration-300 hover:text-terracotta"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Abas de categorias — rolagem suave no mobile e quebra elegante no desktop */}
        <div
          role="tablist"
          aria-label="Categorias do cardápio"
          className="mt-5 flex gap-2 overflow-x-auto border-t border-line-soft pt-5 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
        >
          <button
            type="button"
            role="tab"
            id="menu-tab-all"
            aria-selected={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold tracking-[0.04em] transition-all duration-300 ${
              selectedCategory === "all"
                ? "bg-forest text-card shadow-sm"
                : "border border-line-soft bg-canvas text-ink-soft hover:border-gold hover:text-ink"
            }`}
          >
            Todo o Cardápio
          </button>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.slug;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                id={`menu-tab-${category.slug}`}
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(category.slug)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold tracking-[0.04em] transition-all duration-300 ${
                  isSelected
                    ? "bg-forest text-card shadow-sm"
                    : "border border-line-soft bg-canvas text-ink-soft hover:border-gold hover:text-ink"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contador sutil */}
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>
          Exibindo{" "}
          <strong className="font-semibold text-ink">{totalVisibleItems}</strong>{" "}
          {totalVisibleItems === 1 ? "opção" : "opções"}
        </span>
        <span>Valores em Reais (R$)</span>
      </div>

      {/* Lista editorial por categoria */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-line bg-card px-6 py-14 text-center">
          <p className="font-display text-2xl font-medium text-ink">
            Nenhum Prato Encontrado Com Esses Filtros
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Tente ajustar sua busca ou visualizar todas as categorias do nosso
            cardápio.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-card transition-colors duration-300 hover:bg-terracotta"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Mostrar cardápio completo
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredCategories.map((category) => (
            <section
              key={category.id}
              aria-labelledby={`cat-heading-${category.slug}`}
              className="space-y-6"
            >
              <div className="border-b border-line pb-4">
                <h3
                  id={`cat-heading-${category.slug}`}
                  className="font-display text-3xl font-semibold tracking-tight text-forest sm:text-4xl"
                >
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {category.description}
                  </p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {category.items.map((item) => {
                  const tags = parseTags(item.tags);
                  return (
                    <article
                      key={item.id}
                      className="group flex flex-col justify-between rounded-xl border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/80 hover:shadow-[0_14px_34px_-16px_rgba(43,58,44,0.16)] sm:p-6"
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="font-display text-2xl font-semibold leading-snug text-ink transition-colors duration-300 group-hover:text-terracotta">
                            {item.name}
                          </h4>
                          <span
                            aria-hidden="true"
                            className="menu-leader hidden h-3 flex-1 sm:block"
                          />
                          <span className="shrink-0 font-sans text-base font-semibold tabular-nums text-terracotta sm:text-lg">
                            {formatPrice(item.priceCents)}
                          </span>
                        </div>
                        <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                          {item.description}
                        </p>
                      </div>

                      {tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 pt-2">
                          {tags.map((tag) => {
                            const isChef = tag === "Favorito da Casa";
                            return (
                              <span
                                key={tag}
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                                  isChef
                                    ? "border-terracotta/25 bg-terracotta/10 text-terracotta-dark"
                                    : "border-forest/20 bg-forest/8 text-forest"
                                }`}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
