"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Loader2,
  FolderPlus,
} from "lucide-react";
import { formatPrice, parseCurrencyToCents } from "@/lib/format";

export interface AdminMenuItemRow {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  tags: string;
  featured: boolean;
  available: boolean;
  categoryId: string;
}

export interface AdminCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  items: AdminMenuItemRow[];
}

export function MenuManager({
  initialCategories,
  needsClientFetch = false,
}: {
  initialCategories: AdminCategoryRow[];
  needsClientFetch?: boolean;
}) {
  const [categories, setCategories] =
    useState<AdminCategoryRow[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Formulário de item (criar/editar)
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategories[0]?.id ?? "");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [available, setAvailable] = useState(true);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // Formulário rápido de categoria
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  async function refreshMenu() {
    const res = await adminFetch("/api/admin/menu");
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data.categories);
    if (data.categories?.[0]?.id && !categoryId) {
      setCategoryId(data.categories[0].id);
    }
  }

  useEffect(() => {
    if (!needsClientFetch) return;
    adminFetch("/api/admin/menu")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories) {
          setCategories(data.categories);
          if (data.categories[0]?.id) {
            setCategoryId((prev) => prev || data.categories[0].id);
          }
        }
      })
      .catch(() => {});
  }, [needsClientFetch]);

  function openCreateItem() {
    setEditingItemId(null);
    setName("");
    setDescription("");
    setPriceText("");
    setCategoryId(categories[0]?.id ?? "");
    setTags("");
    setFeatured(false);
    setAvailable(true);
    setItemError(null);
    setShowItemForm(true);
  }

  function openEditItem(item: AdminMenuItemRow) {
    setEditingItemId(item.id);
    setName(item.name);
    setDescription(item.description);
    setPriceText((item.priceCents / 100).toFixed(2).replace(".", ","));
    setCategoryId(item.categoryId);
    setTags(item.tags);
    setFeatured(item.featured);
    setAvailable(item.available);
    setItemError(null);
    setShowItemForm(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    setItemError(null);
    const priceCents = parseCurrencyToCents(priceText);
    if (priceCents <= 0) {
      setItemError("Informe um preço válido em reais (ex.: 49,90).");
      return;
    }

    setSavingItem(true);
    try {
      const payload = {
        name,
        description,
        priceCents,
        categoryId,
        tags,
        featured,
        available,
      };
      const url = editingItemId
        ? `/api/admin/menu/${editingItemId}`
        : "/api/admin/menu";
      const method = editingItemId ? "PATCH" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setItemError(data.error || "Não foi possível salvar o item.");
        return;
      }

      await refreshMenu();
      setShowItemForm(false);
    } finally {
      setSavingItem(false);
    }
  }

  async function toggleField(
    item: AdminMenuItemRow,
    field: "available" | "featured"
  ) {
    setBusyId(item.id);
    try {
      const res = await adminFetch(`/api/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !item[field] }),
      });
      if (res.ok) {
        await refreshMenu();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteItem(id: string) {
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshMenu();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) return;
    setSavingCat(true);
    try {
      const res = await adminFetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, description: catDescription }),
      });
      if (res.ok) {
        setCatName("");
        setCatDescription("");
        setShowCatForm(false);
        await refreshMenu();
      }
    } finally {
      setSavingCat(false);
    }
  }

  const visibleCategories =
    selectedCategory === "all"
      ? categories
      : categories.filter((c) => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            Cozinha & Vitrine
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">
            Gestão do Cardápio Digital
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Alterações salvas aqui atualizam imediatamente o site e o cardápio
            público dos clientes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCatForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            <FolderPlus className="h-4 w-4" />
            Nova Categoria
          </button>
          <button
            type="button"
            id="admin-new-menu-item-btn"
            onClick={openCreateItem}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-terracotta"
          >
            <Plus className="h-4 w-4" />
            Novo Prato / Bebida
          </button>
        </div>
      </div>

      {/* Formulário Nova Categoria */}
      {showCatForm && (
        <form
          onSubmit={handleCreateCategory}
          className="rounded-2xl border border-line bg-card p-6 space-y-4"
        >
          <h2 className="font-display text-2xl font-semibold text-ink">
            Criar Categoria do Cardápio
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Nome da categoria *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex.: Executivos do Dia, Carta de Vinhos..."
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Subtítulo (opcional)
              </label>
              <input
                type="text"
                value={catDescription}
                onChange={(e) => setCatDescription(e.target.value)}
                placeholder="Breve descrição da seção"
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCatForm(false)}
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink-soft"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingCat}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-canvas hover:bg-terracotta-dark"
            >
              {savingCat && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salvar Categoria
            </button>
          </div>
        </form>
      )}

      {/* Formulário Novo/Editar Item */}
      {showItemForm && (
        <form
          onSubmit={handleSaveItem}
          className="rounded-2xl border border-line bg-card p-6 space-y-4"
        >
          <h2 className="font-display text-2xl font-semibold text-ink">
            {editingItemId ? "Editar Item do Cardápio" : "Adicionar Novo Item"}
          </h2>

          {itemError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {itemError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-semibold text-ink-muted">
                Nome do prato / bebida *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Risoto de Camarão"
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Categoria *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Preço (R$) *
              </label>
              <input
                type="text"
                required
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                placeholder="79,90"
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-ink-muted">
                Descrição *
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ingredientes, preparo e acompanhamentos..."
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-ink-muted">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex.: Favorito da Casa, Vegetariano, Sem Glúten"
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-6 pt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-terracotta"
                />
                Destaque na Home
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="h-4 w-4 accent-olive"
                />
                Disponível
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowItemForm(false)}
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink-soft"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingItem}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-canvas hover:bg-terracotta-dark disabled:opacity-60"
            >
              {savingItem && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingItemId ? "Salvar Alterações" : "Adicionar ao Cardápio"}
            </button>
          </div>
        </form>
      )}

      {/* Abas de filtro por categoria */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            selectedCategory === "all"
              ? "bg-ink text-canvas"
              : "bg-card border border-line text-ink-soft hover:text-ink"
          }`}
        >
          Todas as Categorias
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              selectedCategory === cat.id
                ? "bg-ink text-canvas"
                : "bg-card border border-line text-ink-soft hover:text-ink"
            }`}
          >
            {cat.name} ({cat.items.length})
          </button>
        ))}
      </div>

      {/* Lista por categoria */}
      <div className="space-y-8">
        {visibleCategories.map((cat) => (
          <section
            key={cat.id}
            className="rounded-2xl border border-line bg-card p-6"
          >
            <div className="border-b border-line-soft pb-3">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {cat.name}
              </h2>
              {cat.description && (
                <p className="text-xs text-ink-muted">{cat.description}</p>
              )}
            </div>

            {cat.items.length === 0 ? (
              <p className="py-6 text-sm text-ink-muted">
                Nenhum item nesta categoria ainda.
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {cat.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-display text-xl font-semibold ${
                            item.available
                              ? "text-ink"
                              : "text-ink-muted line-through"
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="font-display text-lg font-semibold text-terracotta-dark">
                          {formatPrice(item.priceCents)}
                        </span>
                        {!item.available && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-800">
                            Esgotado / Oculto
                          </span>
                        )}
                        {item.featured && (
                          <span className="rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-terracotta-dark">
                            Destaque
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft">{item.description}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        title={
                          item.available
                            ? "Marcar como esgotado/oculto"
                            : "Tornar disponível no cardápio"
                        }
                        disabled={busyId === item.id}
                        onClick={() => toggleField(item, "available")}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          item.available
                            ? "border-olive/40 bg-olive/10 text-olive"
                            : "border-line bg-paper text-ink-muted"
                        }`}
                      >
                        {item.available ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Oculto
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        title="Alternar destaque na página inicial"
                        disabled={busyId === item.id}
                        onClick={() => toggleField(item, "featured")}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                          item.featured
                            ? "border-terracotta/40 bg-terracotta/10 text-terracotta"
                            : "border-line text-ink-muted hover:text-ink"
                        }`}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Editar item"
                        onClick={() => openEditItem(item)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-terracotta hover:text-terracotta"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Excluir item"
                        disabled={busyId === item.id}
                        onClick={() => handleDeleteItem(item.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
