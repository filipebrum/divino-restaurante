"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import {
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Clock,
} from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  FINANCIAL_STATUS_LABELS,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "@/lib/constants";
import {
  formatDateBR,
  formatMonthLabel,
  formatPrice,
  parseCurrencyToCents,
} from "@/lib/format";

export interface FinancialEntryRow {
  id: string;
  type: string;
  category: string;
  description: string;
  amountCents: number;
  occurredAt: string;
  dueDate: string | null;
  status: string;
  paymentMethod: string | null;
  notes: string | null;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function toYearMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-olive/15 text-olive",
  PENDING: "bg-amber-100 text-amber-900",
  OVERDUE: "bg-red-100 text-red-800",
};

export function FinanceManager({
  initialEntries,
  needsClientFetch = false,
}: {
  initialEntries: FinancialEntryRow[];
  needsClientFetch?: boolean;
}) {
  const [entries, setEntries] = useState<FinancialEntryRow[]>(initialEntries);
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Formulário de lançamento
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [occurredAt, setOccurredAt] = useState(todayISO);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"PAID" | "PENDING" | "OVERDUE">("PAID");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsClientFetch) return;
    adminFetch("/api/admin/finance")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.entries) setEntries(data.entries);
      })
      .catch(() => {});
  }, [needsClientFetch]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    for (const e of entries) {
      set.add(toYearMonth(e.occurredAt));
    }
    return Array.from(set).sort().reverse();
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesMonth =
        monthFilter === "ALL" || toYearMonth(e.occurredAt) === monthFilter;
      const matchesType = typeFilter === "ALL" || e.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      const matchesQuery =
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.notes?.toLowerCase().includes(q) ?? false);
      return matchesMonth && matchesType && matchesStatus && matchesQuery;
    });
  }, [entries, monthFilter, typeFilter, statusFilter, search]);

  const summary = useMemo(() => {
    let paidIncome = 0;
    let paidExpense = 0;
    let pendingPayable = 0;
    let pendingReceivable = 0;

    const incomeByCat = new Map<string, number>();
    const expenseByCat = new Map<string, number>();

    for (const e of filtered) {
      if (e.type === "INCOME") {
        if (e.status === "PAID") paidIncome += e.amountCents;
        else pendingReceivable += e.amountCents;
        incomeByCat.set(e.category, (incomeByCat.get(e.category) ?? 0) + e.amountCents);
      } else {
        if (e.status === "PAID") paidExpense += e.amountCents;
        else pendingPayable += e.amountCents;
        expenseByCat.set(e.category, (expenseByCat.get(e.category) ?? 0) + e.amountCents);
      }
    }

    return {
      paidIncome,
      paidExpense,
      netBalance: paidIncome - paidExpense,
      pendingPayable,
      pendingReceivable,
      incomeBreakdown: Array.from(incomeByCat.entries()).sort((a, b) => b[1] - a[1]),
      expenseBreakdown: Array.from(expenseByCat.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [filtered]);

  async function refreshEntries() {
    const res = await adminFetch("/api/admin/finance");
    if (!res.ok) return;
    const data = await res.json();
    setEntries(data.entries);
  }

  function handleTypeChange(nextType: "INCOME" | "EXPENSE") {
    setType(nextType);
    const list = nextType === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!(list as readonly string[]).includes(category)) {
      setCategory(list[0]);
    }
  }

  function openNewEntry(defaultType: "INCOME" | "EXPENSE" = "INCOME") {
    setEditingId(null);
    setType(defaultType);
    setCategory(
      defaultType === "INCOME" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
    );
    setDescription("");
    setAmountText("");
    setOccurredAt(todayISO());
    setDueDate("");
    setStatus("PAID");
    setPaymentMethod("PIX");
    setNotes("");
    setFormError(null);
    setShowForm(true);
  }

  function openEditEntry(entry: FinancialEntryRow) {
    setEditingId(entry.id);
    setType(entry.type === "EXPENSE" ? "EXPENSE" : "INCOME");
    setCategory(entry.category);
    setDescription(entry.description);
    setAmountText((entry.amountCents / 100).toFixed(2).replace(".", ","));
    setOccurredAt(toDateInput(entry.occurredAt));
    setDueDate(toDateInput(entry.dueDate));
    setStatus(
      entry.status === "PENDING" || entry.status === "OVERDUE"
        ? entry.status
        : "PAID"
    );
    setPaymentMethod(entry.paymentMethod ?? "PIX");
    setNotes(entry.notes ?? "");
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const amountCents = parseCurrencyToCents(amountText);
    if (amountCents <= 0) {
      setFormError("Informe um valor válido em reais (ex.: 1.250,00).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type,
        category,
        description,
        amountCents,
        occurredAt,
        dueDate,
        status,
        paymentMethod,
        notes,
      };
      const url = editingId
        ? `/api/admin/finance/${editingId}`
        : "/api/admin/finance";
      const method = editingId ? "PATCH" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Não foi possível salvar o lançamento.");
        return;
      }

      await refreshEntries();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function markAsPaid(id: string) {
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/finance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (res.ok) {
        await refreshEntries();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function deleteEntry(id: string) {
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/finance/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  function exportCSV() {
    const header = [
      "Data",
      "Tipo",
      "Categoria",
      "Descrição",
      "Valor (R$)",
      "Status",
      "Vencimento",
      "Pagamento",
      "Observações",
    ];
    const rows = filtered.map((e) => [
      formatDateBR(e.occurredAt),
      e.type === "INCOME" ? "Entrada" : "Saída",
      e.category,
      e.description.replace(/;/g, ","),
      (e.amountCents / 100).toFixed(2).replace(".", ","),
      FINANCIAL_STATUS_LABELS[e.status] ?? e.status,
      e.dueDate ? formatDateBR(e.dueDate) : "",
      e.paymentMethod ?? "",
      (e.notes ?? "").replace(/;/g, ","),
    ]);

    const csvContent =
      "\uFEFF" + [header, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financeiro-divino-${monthFilter === "ALL" ? "geral" : monthFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const categoryOptions =
    type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const maxIncomeCat = summary.incomeBreakdown[0]?.[1] ?? 1;
  const maxExpenseCat = summary.expenseBreakdown[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            Sistema Interno · Financeiro
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">
            Fluxo de Caixa & Contas
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Controle entradas, saídas, contas a pagar/receber e exporte
            planilhas CSV com um clique.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            id="finance-export-csv-btn"
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
          <button
            type="button"
            id="finance-new-expense-btn"
            onClick={() => openNewEntry("EXPENSE")}
            className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/40 bg-terracotta/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-terracotta-dark transition-colors hover:bg-terracotta hover:text-canvas"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Despesa
          </button>
          <button
            type="button"
            id="finance-new-income-btn"
            onClick={() => openNewEntry("INCOME")}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-olive"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Receita
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Receitas (Pagas)</span>
            <TrendingUp className="h-4 w-4 text-olive" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-olive">
            {formatPrice(summary.paidIncome)}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Despesas (Pagas)</span>
            <TrendingDown className="h-4 w-4 text-terracotta" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-terracotta-dark">
            {formatPrice(summary.paidExpense)}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Saldo Realizado</span>
            <Wallet className="h-4 w-4 text-ink" />
          </div>
          <p
            className={`mt-2 font-display text-2xl font-semibold ${
              summary.netBalance >= 0 ? "text-ink" : "text-red-700"
            }`}
          >
            {formatPrice(summary.netBalance)}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>A Pagar</span>
            <Clock className="h-4 w-4 text-amber-700" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-amber-900">
            {formatPrice(summary.pendingPayable)}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>A Receber</span>
            <Clock className="h-4 w-4 text-olive" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">
            {formatPrice(summary.pendingReceivable)}
          </p>
        </div>
      </div>

      {/* Formulário Novo/Editar Lançamento */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line bg-card p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {editingId ? "Editar Lançamento" : "Registrar Lançamento Financeiro"}
            </h2>
            <div className="flex rounded-full bg-paper p-1">
              <button
                type="button"
                onClick={() => handleTypeChange("INCOME")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  type === "INCOME"
                    ? "bg-olive text-canvas"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Entrada (Receita)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("EXPENSE")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  type === "EXPENSE"
                    ? "bg-terracotta text-canvas"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Saída (Despesa)
              </button>
            </div>
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-ink-muted">
                Descrição *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Fechamento de caixa sábado, Fornecedor carnes..."
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Valor (R$) *
              </label>
              <input
                type="text"
                required
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                placeholder="1.250,00"
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Data do lançamento *
              </label>
              <input
                type="date"
                required
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Vencimento (opcional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Situação
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "PAID" | "PENDING" | "OVERDUE")
                }
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              >
                <option value="PAID">Pago / Recebido</option>
                <option value="PENDING">Pendente</option>
                <option value="OVERDUE">Vencido</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Forma de pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-xs font-semibold text-ink-muted">
                Observações (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Número da nota fiscal, fornecedor, centro de custo..."
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink-soft"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-canvas hover:bg-terracotta disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingId ? "Salvar Alterações" : "Salvar Lançamento"}
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2.5">
          <select
            aria-label="Filtrar por mês"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-full border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink focus:border-terracotta focus:outline-none"
          >
            <option value="ALL">Todos os períodos</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthLabel(ym)}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por tipo"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-full border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink focus:border-terracotta focus:outline-none"
          >
            <option value="ALL">Entradas e Saídas</option>
            <option value="INCOME">Somente Entradas</option>
            <option value="EXPENSE">Somente Saídas</option>
          </select>

          <select
            aria-label="Filtrar por status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink focus:border-terracotta focus:outline-none"
          >
            <option value="ALL">Todos os status</option>
            <option value="PAID">Pago / Recebido</option>
            <option value="PENDING">Pendente</option>
            <option value="OVERDUE">Vencido</option>
          </select>
        </div>

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descrição, categoria..."
            className="w-full rounded-full border border-line bg-canvas py-2 pl-10 pr-4 text-sm focus:border-terracotta focus:outline-none"
          />
        </div>
      </div>

      {/* Resumo visual por categoria */}
      {(summary.incomeBreakdown.length > 0 ||
        summary.expenseBreakdown.length > 0) && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Entradas por Categoria
            </h2>
            <div className="mt-4 space-y-3">
              {summary.incomeBreakdown.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  Nenhuma receita neste filtro.
                </p>
              ) : (
                summary.incomeBreakdown.map(([cat, cents]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-ink">{cat}</span>
                      <span className="font-semibold text-olive">
                        {formatPrice(cents)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
                      <div
                        className="h-full rounded-full bg-olive"
                        style={{
                          width: `${Math.max(6, Math.round((cents / maxIncomeCat) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Despesas por Categoria
            </h2>
            <div className="mt-4 space-y-3">
              {summary.expenseBreakdown.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  Nenhuma despesa neste filtro.
                </p>
              ) : (
                summary.expenseBreakdown.map(([cat, cents]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-ink">{cat}</span>
                      <span className="font-semibold text-terracotta-dark">
                        {formatPrice(cents)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
                      <div
                        className="h-full rounded-full bg-terracotta"
                        style={{
                          width: `${Math.max(6, Math.round((cents / maxExpenseCat) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Lançamentos */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              <tr>
                <th className="px-5 py-3.5">Data</th>
                <th className="px-5 py-3.5">Descrição & Categoria</th>
                <th className="px-5 py-3.5">Pagamento</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Valor</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-ink-muted"
                  >
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isIncome = entry.type === "INCOME";
                  return (
                    <tr
                      key={entry.id}
                      className="transition-colors hover:bg-canvas/60"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-ink-soft">
                        <div>{formatDateBR(entry.occurredAt)}</div>
                        {entry.dueDate && entry.status !== "PAID" && (
                          <div className="text-[11px] text-amber-800">
                            Venc.: {formatDateBR(entry.dueDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">
                          {entry.description}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {entry.category}
                          {entry.notes ? ` · ${entry.notes}` : ""}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-ink-soft">
                        {entry.paymentMethod || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            STATUS_BADGE[entry.status] ?? "bg-paper text-ink"
                          }`}
                        >
                          {FINANCIAL_STATUS_LABELS[entry.status] ?? entry.status}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                          isIncome ? "text-olive" : "text-terracotta-dark"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatPrice(entry.amountCents)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {entry.status !== "PAID" && (
                            <button
                              type="button"
                              title="Dar baixa (marcar como pago)"
                              disabled={busyId === entry.id}
                              onClick={() => markAsPaid(entry.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-olive/15 px-2.5 py-1 text-[11px] font-semibold text-olive hover:bg-olive hover:text-canvas"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Baixar
                            </button>
                          )}
                          <button
                            type="button"
                            title="Editar lançamento"
                            onClick={() => openEditEntry(entry)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft hover:border-terracotta hover:text-terracotta"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Excluir lançamento"
                            disabled={busyId === entry.id}
                            onClick={() => deleteEntry(entry.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
