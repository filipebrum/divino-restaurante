"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles, Leaf, WheatOff, RotateCcw } from "lucide-react";
import type { MenuCategoryDTO } from "@/lib/menu";
import { formatPrice, parseTags } from "@/lib/format";

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
      {/* Barra de busca e filtros */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(31,25,20,0.04)] sm:p-6">
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
              className="w-full rounded-full border border-line bg-canvas py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted transition-colors focus:border-terracotta focus:outline-none"
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
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "border-terracotta bg-terracotta text-canvas"
                      : "border-line bg-canvas text-ink-soft hover:border-terracotta/50 hover:text-ink"
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
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:text-terracotta"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Abas de categorias */}
        <div
          role="tablist"
          aria-label="Categorias do cardápio"
          className="mt-5 flex flex-wrap gap-2 border-t border-line-soft pt-5"
        >
          <button
            type="button"
            role="tab"
            id="menu-tab-all"
            aria-selected={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all ${
              selectedCategory === "all"
                ? "bg-ink text-canvas"
                : "bg-paper/80 text-ink-soft hover:bg-paper hover:text-ink"
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
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all ${
                  isSelected
                    ? "bg-ink text-canvas"
                    : "bg-paper/80 text-ink-soft hover:bg-paper hover:text-ink"
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
          Exibindo <strong className="font-semibold text-ink">{totalVisibleItems}</strong>{" "}
          {totalVisibleItems === 1 ? "opção" : "opções"}
        </span>
        <span>Preços em Reais (R$)</span>
      </div>

      {/* Lista editorial por categoria */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card px-6 py-14 text-center">
          <p className="font-display text-2xl font-medium text-ink">
            Nenhum item encontrado com esses filtros
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Tente ajustar sua busca ou visualizar todas as categorias do cardápio.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-terracotta"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
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
                  className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
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
                      className="group flex flex-col justify-between rounded-2xl border border-line/90 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-[0_10px_28px_-12px_rgba(31,25,20,0.12)] sm:p-6"
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="font-display text-2xl font-semibold leading-snug text-ink transition-colors group-hover:text-terracotta-dark">
                            {item.name}
                          </h4>
                          <span
                            aria-hidden="true"
                            className="menu-leader hidden h-3 flex-1 sm:block"
                          />
                          <span className="shrink-0 font-display text-xl font-semibold text-terracotta-dark">
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
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                  isChef
                                    ? "bg-terracotta/10 text-terracotta-dark"
                                    : "bg-olive/10 text-olive"
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
