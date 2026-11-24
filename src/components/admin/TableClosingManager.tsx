"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard,
  QrCode,
  Banknote,
  Ticket,
  FileSpreadsheet,
  Upload,
  Trash2,
  PlusCircle,
  Search,
  Pencil,
  Check,
  AlertCircle,
  ArrowUpRight,
  Tag,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  CalendarRange,
  ClipboardList,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  aggregateTableClosings,
  buildTableClosingCSV,
  computeTableClosingMetrics,
  formatISODateBR,
  formatWeekdayShortBR,
  getWeekDates,
  parseTableClosingCSV,
  shiftISODate,
  toISODate,
  type ParsedCSVClosingRow,
  type TableClosingDTO,
} from "@/lib/table-closing";

interface TableClosingManagerProps {
  initialDate: string;
  initialWeekEntries: TableClosingDTO[];
  needsClientFetch?: boolean;
}

function parseInputCents(raw: string): number {
  const num = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

function centsToInput(cents: number): string {
  if (!cents) return "";
  return (cents / 100).toFixed(2);
}

export function TableClosingManager({
  initialDate,
  initialWeekEntries,
  needsClientFetch = false,
}: TableClosingManagerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [weekEntries, setWeekEntries] =
    useState<TableClosingDTO[]>(initialWeekEntries);
  const [loadingWeek, setLoadingWeek] = useState(needsClientFetch);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Modal Lançar / Editar Mesa
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tableId, setTableId] = useState("");
  const [subtotalStr, setSubtotalStr] = useState("");
  const [serviceStr, setServiceStr] = useState("");
  const [manualService, setManualService] = useState(false);
  const [discountStr, setDiscountStr] = useState("");
  const [tipStr, setTipStr] = useState("");
  const [creditStr, setCreditStr] = useState("");
  const [debitStr, setDebitStr] = useState("");
  const [pixStr, setPixStr] = useState("");
  const [cashStr, setCashStr] = useState("");
  const [othersStr, setOthersStr] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);

  // Modal Importar CSV
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ParsedCSVClosingRow[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState<string>("");
  const [replaceDates, setReplaceDates] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Confirmação
  const [confirmState, setConfirmState] = useState<{
    title: string;
    desc: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Sincronizar com Caixa Geral
  const [syncingCash, setSyncingCash] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  async function fetchWeek(targetDate: string) {
    setLoadingWeek(true);
    try {
      const res = await adminFetch(
        `/api/admin/table-closings?weekOf=${encodeURIComponent(targetDate)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setWeekEntries(data.entries ?? []);
    } finally {
      setLoadingWeek(false);
    }
  }

  useEffect(() => {
    if (!needsClientFetch) return;
    let active = true;
    adminFetch(
      `/api/admin/table-closings?weekOf=${encodeURIComponent(initialDate)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.entries) {
          setWeekEntries(data.entries);
        }
      })
      .finally(() => {
        if (active) setLoadingWeek(false);
      });
    return () => {
      active = false;
    };
  }, [needsClientFetch, initialDate]);

  async function handleDateChange(nextDate: string) {
    if (!nextDate) return;
    const prevWeekStart = getWeekDates(selectedDate)[0];
    const nextWeekStart = getWeekDates(nextDate)[0];
    setSelectedDate(nextDate);
    if (prevWeekStart !== nextWeekStart) {
      await fetchWeek(nextDate);
    }
  }

  const computedWeekEntries = useMemo(
    () => weekEntries.map(computeTableClosingMetrics),
    [weekEntries]
  );

  const dailyEntries = useMemo(
    () => computedWeekEntries.filter((e) => e.turnDate === selectedDate),
    [computedWeekEntries, selectedDate]
  );

  const filteredDailyEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dailyEntries;
    return dailyEntries.filter((e) => e.tableId.toLowerCase().includes(q));
  }, [dailyEntries, search]);

  const dailyTotals = useMemo(
    () => aggregateTableClosings(dailyEntries),
    [dailyEntries]
  );
  const filteredDailyTotals = useMemo(
    () => aggregateTableClosings(filteredDailyEntries),
    [filteredDailyEntries]
  );
  const weeklyTotals = useMemo(
    () => aggregateTableClosings(computedWeekEntries),
    [computedWeekEntries]
  );

  const weeklyByDay = useMemo(() => {
    return weekDates.map((date) => {
      const rows = computedWeekEntries.filter((e) => e.turnDate === date);
      return {
        date,
        label: formatWeekdayShortBR(date),
        rows,
        totals: aggregateTableClosings(rows),
      };
    });
  }, [weekDates, computedWeekEntries]);

  const maxDailyPaid = useMemo(
    () =>
      Math.max(
        1,
        ...weeklyByDay.map((d) => d.totals.totalPaidCents)
      ),
    [weeklyByDay]
  );

  const activeTotals = viewMode === "daily" ? dailyTotals : weeklyTotals;

  // --- Cálculos ao vivo no Modal de Lançamento ---
  const modalSubtotalCents = parseInputCents(subtotalStr);
  const modalServiceCents = manualService
    ? parseInputCents(serviceStr)
    : Math.round(modalSubtotalCents * 0.1);
  const modalDiscountCents = parseInputCents(discountStr);
  const modalTipCents = parseInputCents(tipStr);
  const modalBaseWithService = Math.max(
    0,
    modalSubtotalCents + modalServiceCents - modalDiscountCents
  );
  const modalWithoutService = Math.max(
    0,
    modalSubtotalCents - modalDiscountCents
  );
  const modalExpectedTotal = modalBaseWithService + modalTipCents;

  const modalCreditCents = parseInputCents(creditStr);
  const modalDebitCents = parseInputCents(debitStr);
  const modalPixCents = parseInputCents(pixStr);
  const modalCashCents = parseInputCents(cashStr);
  const modalOthersCents = parseInputCents(othersStr);
  const modalTotalPaid =
    modalCreditCents +
    modalDebitCents +
    modalPixCents +
    modalCashCents +
    modalOthersCents;
  const modalDiff = modalTotalPaid - modalExpectedTotal;
  const modalSurplusOverBase = modalTotalPaid - modalBaseWithService;
  const showSurplusShortcut =
    modalSurplusOverBase > 0 &&
    Math.abs(modalSurplusOverBase - modalTipCents) >= 1;

  function openNewModal() {
    setEditingId(null);
    setTableId("");
    setSubtotalStr("");
    setServiceStr("");
    setManualService(false);
    setDiscountStr("");
    setTipStr("");
    setCreditStr("");
    setDebitStr("");
    setPixStr("");
    setCashStr("");
    setOthersStr("");
    setModalOpen(true);
  }

  function openEditModal(item: TableClosingDTO) {
    setEditingId(item.id);
    setTableId(item.tableId);
    setSubtotalStr(centsToInput(item.subtotalCents));
    setServiceStr(centsToInput(item.serviceCents));
    setManualService(item.manualService);
    setDiscountStr(centsToInput(item.discountCents));
    setTipStr(centsToInput(item.tipCents));
    setCreditStr(centsToInput(item.creditCents));
    setDebitStr(centsToInput(item.debitCents));
    setPixStr(centsToInput(item.pixCents));
    setCashStr(centsToInput(item.cashCents));
    setOthersStr(centsToInput(item.othersCents));
    setModalOpen(true);
  }

  function handleSubtotalChange(val: string) {
    setSubtotalStr(val);
    if (!manualService) {
      const sub = parseInputCents(val);
      setServiceStr(sub > 0 ? centsToInput(Math.round(sub * 0.1)) : "");
    }
  }

  function handleToggleManualService(checked: boolean) {
    setManualService(checked);
    if (!checked) {
      const sub = parseInputCents(subtotalStr);
      setServiceStr(sub > 0 ? centsToInput(Math.round(sub * 0.1)) : "");
    }
  }

  function applyWaiveServiceShortcut() {
    setDiscountStr(centsToInput(modalServiceCents));
    showToast("Desconto igualado a 10% do consumo.");
  }

  function applySurplusAsTip() {
    if (modalSurplusOverBase > 0) {
      setTipStr(centsToInput(modalSurplusOverBase));
      showToast(
        `Sobra de ${formatPrice(modalSurplusOverBase)} adicionada à Caixinha!`
      );
    }
  }

  type PayMethodKey = "credit" | "debit" | "pix" | "cash" | "others";

  function fillMethodWithTotal(method: PayMethodKey) {
    const map: Record<PayMethodKey, number> = {
      credit: modalCreditCents,
      debit: modalDebitCents,
      pix: modalPixCents,
      cash: modalCashCents,
      others: modalOthersCents,
    };
    const setters: Record<PayMethodKey, (v: string) => void> = {
      credit: setCreditStr,
      debit: setDebitStr,
      pix: setPixStr,
      cash: setCashStr,
      others: setOthersStr,
    };
    const labels: Record<PayMethodKey, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      pix: "PIX",
      cash: "Dinheiro",
      others: "Outros",
    };

    const otherSum = (Object.keys(map) as PayMethodKey[])
      .filter((k) => k !== method)
      .reduce((acc, k) => acc + map[k], 0);

    const remaining = Math.max(0, modalExpectedTotal - otherSum);
    const valueToFill = remaining > 0 ? remaining : modalExpectedTotal;
    setters[method](centsToInput(valueToFill));

    if (otherSum === 0) {
      (Object.keys(setters) as PayMethodKey[])
        .filter((k) => k !== method)
        .forEach((k) => setters[k](""));
    }

    showToast(`${labels[method]} preenchido com ${formatPrice(valueToFill)}.`);
  }

  function clearAllPayments() {
    setCreditStr("");
    setDebitStr("");
    setPixStr("");
    setCashStr("");
    setOthersStr("");
    showToast("Campos de pagamento zerados.");
  }

  function fillRemainingBalance() {
    const remaining = modalExpectedTotal - modalTotalPaid;
    if (remaining <= 0) {
      showToast("A conta já está 100% coberta.");
      return;
    }
    const candidates: Array<[number, (v: string) => void]> = [
      [modalCreditCents, setCreditStr],
      [modalDebitCents, setDebitStr],
      [modalPixCents, setPixStr],
      [modalCashCents, setCashStr],
      [modalOthersCents, setOthersStr],
    ];
    const target = candidates.find(([v]) => v === 0) ?? candidates[0];
    target[1](centsToInput(target[0] + remaining));
    showToast(`Restante de ${formatPrice(remaining)} preenchido.`);
  }

  async function handleSaveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!tableId.trim()) return;
    setSavingEntry(true);

    try {
      const payload = {
        turnDate: selectedDate,
        tableId: tableId.trim(),
        subtotalCents: modalSubtotalCents,
        serviceCents: modalServiceCents,
        manualService,
        discountCents: modalDiscountCents,
        tipCents: modalTipCents,
        creditCents: modalCreditCents,
        debitCents: modalDebitCents,
        pixCents: modalPixCents,
        cashCents: modalCashCents,
        othersCents: modalOthersCents,
      };

      const url = editingId
        ? `/api/admin/table-closings/${editingId}`
        : "/api/admin/table-closings";
      const method = editingId ? "PATCH" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Erro ao salvar lançamento.");
        return;
      }

      await fetchWeek(selectedDate);
      setModalOpen(false);
      showToast(
        editingId
          ? `Mesa "${tableId.trim()}" atualizada!`
          : `Mesa "${tableId.trim()}" lançada no banco!`
      );
    } finally {
      setSavingEntry(false);
    }
  }

  function requestDeleteEntry(item: TableClosingDTO) {
    setConfirmState({
      title: `Excluir ${item.tableId}?`,
      desc: "Os dados desta mesa serão removidos permanentemente do banco.",
      onConfirm: async () => {
        const res = await adminFetch(`/api/admin/table-closings/${item.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setWeekEntries((prev) => prev.filter((e) => e.id !== item.id));
          showToast("Lançamento removido.");
        }
      },
    });
  }

  function requestClearDay() {
    if (dailyEntries.length === 0) {
      showToast("Nenhum lançamento no dia selecionado.");
      return;
    }
    setConfirmState({
      title: `Limpar lançamentos de ${formatISODateBR(selectedDate)}?`,
      desc: `Todos os ${dailyEntries.length} lançamentos deste dia serão removidos.`,
      onConfirm: async () => {
        const res = await adminFetch(
          `/api/admin/table-closings?date=${encodeURIComponent(selectedDate)}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setWeekEntries((prev) =>
            prev.filter((e) => e.turnDate !== selectedDate)
          );
          showToast("Lançamentos do dia apagados.");
        }
      },
    });
  }

  async function runConfirmedAction() {
    if (!confirmState) return;
    setConfirmBusy(true);
    try {
      await confirmState.onConfirm();
      setConfirmState(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  // --- Exportação CSV ---
  function handleExportCSV() {
    const targetRows =
      viewMode === "daily" ? dailyEntries : computedWeekEntries;
    if (targetRows.length === 0) {
      showToast("Não há dados para exportar neste período.");
      return;
    }

    const csv = buildTableClosingCSV(targetRows, viewMode === "weekly");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      viewMode === "daily"
        ? `fechamento_mesas_${selectedDate}.csv`
        : `fechamento_semanal_${weekDates[0]}_a_${weekDates[6]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Arquivo CSV exportado com sucesso!");
  }

  function downloadTemplateCSV() {
    const sample =
      "\uFEFF" +
      [
        "Mesa/Comanda;Subtotal (R$);Serviço 10% (R$);Desconto (R$);Caixinha (R$);Total c/ 10% (R$);Total s/ 10% (R$);Crédito (R$);Débito (R$);PIX (R$);Dinheiro (R$);Outros (R$);Total Pago (R$);Diferença (R$)",
        '"Mesa 01";180,00;18,00;0,00;12,00;198,00;180,00;100,00;0,00;110,00;0,00;0,00;210,00;0,00',
        '"Mesa 04";250,00;25,00;25,00;10,00;250,00;225,00;260,00;0,00;0,00;0,00;0,00;260,00;0,00',
      ].join("\n");

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_fechamento_mesas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  // --- Importação CSV ---
  async function handleCSVFileSelected(file: File | null) {
    if (!file) return;
    setImportFileName(file.name);
    const text = await file.text();
    const { rows, warnings } = parseTableClosingCSV(text, selectedDate);
    setImportRows(rows);
    setImportWarnings(warnings);
  }

  async function handleConfirmImport() {
    if (importRows.length === 0) return;
    setImporting(true);
    try {
      const res = await adminFetch("/api/admin/table-closings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: importRows,
          replaceDates,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportWarnings([data.error || "Erro ao importar CSV."]);
        return;
      }

      await fetchWeek(selectedDate);
      setImportOpen(false);
      setImportRows([]);
      setImportWarnings([]);
      setImportFileName("");
      showToast(`${data.importedCount} mesas importadas com sucesso!`);
    } finally {
      setImporting(false);
    }
  }

  // --- Enviar Fechamento do Dia direto para o Caixa Geral (/admin/caixa-geral) ---
  async function handleSyncToCashFlow() {
    if (dailyTotals.totalPaidCents <= 0) {
      showToast("Não há valor recebido neste dia para enviar ao Caixa Geral.");
      return;
    }
    setSyncingCash(true);
    try {
      const creditTotal = dailyTotals.creditCents + dailyTotals.othersCents;
      const entries: Array<Record<string, unknown>> = [
        { date: selectedDate, hist: "Vendas Crédito", creditCents: creditTotal },
        {
          date: selectedDate,
          hist: "Vendas Débito",
          debitCents: dailyTotals.debitCents,
        },
        {
          date: selectedDate,
          hist: "Vendas Dinheiro",
          dnhEntCents: dailyTotals.cashCents,
        },
        {
          date: selectedDate,
          hist: "PIX/Depósito",
          pixDepCents: dailyTotals.pixCents,
        },
        {
          date: selectedDate,
          hist: "Vendas Totais",
          vendasCents: dailyTotals.totalPaidCents,
        },
      ];

      if (dailyTotals.tipCents > 0) {
        entries.push({
          date: selectedDate,
          hist: "Caixinha",
          dnhSaiCents: dailyTotals.tipCents,
        });
      }

      const res = await adminFetch("/api/admin/caixa-geral/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey: selectedDate.slice(0, 7),
          entries,
        }),
      });

      if (res.ok) {
        showToast(
          `Fechamento (${formatPrice(
            dailyTotals.totalPaidCents
          )}) lançado nas linhas padrão do Caixa Geral!`
        );
      } else {
        showToast("Erro ao enviar fechamento ao Caixa Geral.");
      }
    } finally {
      setSyncingCash(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Controles */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            Conferência de Caixa & Auditoria de Contas
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">
            Fechamento de Mesas
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Controle diário por mesa/comanda com visão consolidada semanal e
            importação/exportação CSV.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-import-csv"
            onClick={() => {
              setImportRows([]);
              setImportWarnings([]);
              setImportFileName("");
              setReplaceDates(false);
              setImportOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            <Upload className="h-3.5 w-3.5 text-terracotta" />
            Importar CSV
          </button>

          <button
            type="button"
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-olive hover:text-olive"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-olive" />
            Exportar CSV
          </button>

          {viewMode === "daily" && (
            <>
              <button
                type="button"
                id="btn-sync-cashflow"
                disabled={syncingCash || dailyTotals.totalPaidCents === 0}
                onClick={handleSyncToCashFlow}
                title="Envia o Total Recebido do dia como receita de Salão/Mesas no Financeiro"
                className="inline-flex items-center gap-1.5 rounded-full border border-olive/40 bg-olive/10 px-4 py-2 text-xs font-semibold text-olive transition-colors hover:bg-olive hover:text-canvas disabled:opacity-45"
              >
                {syncingCash ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Lançar no Caixa
              </button>

              <button
                type="button"
                id="btn-clear-day"
                onClick={requestClearDay}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-card px-3.5 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar Dia
              </button>
            </>
          )}

          <button
            type="button"
            id="btn-new-table-closing"
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-terracotta"
          >
            <PlusCircle className="h-4 w-4" />
            Lançar Mesa
          </button>
        </div>
      </div>

      {/* Barra de Modo (Diário / Semanal) + Navegador de Data */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full bg-paper p-1">
          <button
            type="button"
            id="tab-view-daily"
            onClick={() => setViewMode("daily")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "daily"
                ? "bg-ink text-canvas"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Consumo Diário por Mesa
          </button>
          <button
            type="button"
            id="tab-view-weekly"
            onClick={() => setViewMode("weekly")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              viewMode === "weekly"
                ? "bg-ink text-canvas"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Faturamento Semanal
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label={viewMode === "daily" ? "Dia anterior" : "Semana anterior"}
            onClick={() =>
              handleDateChange(
                shiftISODate(selectedDate, viewMode === "daily" ? -1 : -7)
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-ink-soft hover:border-terracotta hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-1.5">
            <Calendar className="h-4 w-4 text-terracotta" />
            <input
              type="date"
              id="turn-date-input"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-ink outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            aria-label={viewMode === "daily" ? "Próximo dia" : "Próxima semana"}
            onClick={() =>
              handleDateChange(
                shiftISODate(selectedDate, viewMode === "daily" ? 1 : 7)
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-ink-soft hover:border-terracotta hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(toISODate(new Date()))}
            className="rounded-lg border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            Hoje
          </button>

          {loadingWeek && (
            <Loader2 className="h-4 w-4 animate-spin text-terracotta" />
          )}
        </div>
      </div>

      {/* 6 KPI Summary Cards (iguais ao modelo Google Sites) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Subtotal Consumo
          </span>
          <div className="mt-2 font-display text-2xl font-bold text-ink">
            {formatPrice(activeTotals.subtotalCents)}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            Bruto {viewMode === "daily" ? "do dia" : "da semana"}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Serviço (10%)
          </span>
          <div className="mt-2 font-display text-2xl font-bold text-blue-700">
            {formatPrice(activeTotals.serviceCents)}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">Taxa calculada</div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Descontos Total
          </span>
          <div className="mt-2 font-display text-2xl font-bold text-amber-700">
            {formatPrice(activeTotals.discountCents)}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            Isenções e abatimentos
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <Coins className="h-3.5 w-3.5" />
            Caixinha Total
          </span>
          <div className="mt-2 font-display text-2xl font-bold text-emerald-800">
            {formatPrice(activeTotals.tipCents)}
          </div>
          <div className="mt-1 text-[11px] font-medium text-emerald-700/80">
            Repasse à equipe
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Total Recebido
          </span>
          <div className="mt-2 font-display text-2xl font-bold text-indigo-700">
            {formatPrice(activeTotals.totalPaidCents)}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">
            Soma dos recebimentos
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Diferença Caixa
          </span>
          <div
            className={`mt-2 font-display text-2xl font-bold ${
              Math.abs(activeTotals.balanceCents) < 1
                ? "text-emerald-700"
                : activeTotals.balanceCents < 0
                ? "text-red-700"
                : "text-amber-700"
            }`}
          >
            {formatPrice(activeTotals.balanceCents)}
          </div>
          <div
            className={`mt-1 text-[11px] font-semibold ${
              Math.abs(activeTotals.balanceCents) < 1
                ? "text-emerald-700"
                : activeTotals.balanceCents < 0
                ? "text-red-700"
                : "text-amber-700"
            }`}
          >
            {Math.abs(activeTotals.balanceCents) < 1
              ? "Tudo Balanceado"
              : activeTotals.balanceCents < 0
              ? "Diferença negativa (Falta)"
              : "Sobra não alocada"}
          </div>
        </div>
      </div>

      {/* Arrecadação por Forma de Pagamento */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
          <span>
            Arrecadação por Forma de Pagamento (
            {viewMode === "daily"
              ? formatISODateBR(selectedDate)
              : `Semana ${formatISODateBR(weekDates[0])} a ${formatISODateBR(
                  weekDates[6]
                )}`}
            )
          </span>
          <span className="font-normal normal-case text-ink-muted">
            {activeTotals.count}{" "}
            {activeTotals.count === 1 ? "mesa registrada" : "mesas registradas"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3 md:grid-cols-5">
          <div className="rounded-xl border border-line-soft bg-canvas p-3">
            <span className="flex items-center justify-center gap-1 text-xs text-ink-soft">
              <CreditCard className="h-3.5 w-3.5 text-indigo-600" /> Crédito
            </span>
            <p className="mt-1 text-sm font-bold text-ink">
              {formatPrice(activeTotals.creditCents)}
            </p>
          </div>
          <div className="rounded-xl border border-line-soft bg-canvas p-3">
            <span className="flex items-center justify-center gap-1 text-xs text-ink-soft">
              <CreditCard className="h-3.5 w-3.5 text-sky-600" /> Débito
            </span>
            <p className="mt-1 text-sm font-bold text-ink">
              {formatPrice(activeTotals.debitCents)}
            </p>
          </div>
          <div className="rounded-xl border border-line-soft bg-canvas p-3">
            <span className="flex items-center justify-center gap-1 text-xs text-ink-soft">
              <QrCode className="h-3.5 w-3.5 text-teal-600" /> PIX
            </span>
            <p className="mt-1 text-sm font-bold text-ink">
              {formatPrice(activeTotals.pixCents)}
            </p>
          </div>
          <div className="rounded-xl border border-line-soft bg-canvas p-3">
            <span className="flex items-center justify-center gap-1 text-xs text-ink-soft">
              <Banknote className="h-3.5 w-3.5 text-emerald-600" /> Dinheiro
            </span>
            <p className="mt-1 text-sm font-bold text-ink">
              {formatPrice(activeTotals.cashCents)}
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-line-soft bg-canvas p-3 sm:col-span-1">
            <span className="flex items-center justify-center gap-1 text-xs text-ink-soft">
              <Ticket className="h-3.5 w-3.5 text-purple-600" /> Outros
            </span>
            <p className="mt-1 text-sm font-bold text-ink">
              {formatPrice(activeTotals.othersCents)}
            </p>
          </div>
        </div>
      </div>

      {/* VIEW 1: PLANILHA DIÁRIA POR MESA */}
      {viewMode === "daily" ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/50 p-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-xl font-semibold text-ink">
                Planilha de Mesas — {formatISODateBR(selectedDate)}
              </h2>
              <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink">
                {filteredDailyEntries.length}
              </span>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar mesa ou comanda..."
                className="w-56 rounded-full border border-line bg-card py-1.5 pl-9 pr-3 text-xs sm:w-64 sm:text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          {filteredDailyEntries.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-display text-2xl font-medium text-ink">
                Nenhuma mesa lançada em {formatISODateBR(selectedDate)}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Clique em <strong>Lançar Mesa</strong> ou em{" "}
                <strong>Importar CSV</strong> para preencher o fechamento deste
                turno.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-xs">
                <thead className="border-b border-line bg-paper/70 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="px-3 py-3">Mesa/Comanda</th>
                    <th className="px-3 py-3 text-right">Subtotal</th>
                    <th className="px-3 py-3 text-right">10% Serv.</th>
                    <th className="px-3 py-3 text-right">Desconto</th>
                    <th className="bg-emerald-50/70 px-3 py-3 text-right font-bold text-emerald-800">
                      Caixinha
                    </th>
                    <th className="px-3 py-3 text-right font-bold text-ink">
                      Total c/ 10%
                    </th>
                    <th className="px-3 py-3 text-right text-ink-muted">
                      Total s/ 10%
                    </th>
                    <th className="px-3 py-3 text-right text-indigo-700">
                      Crédito
                    </th>
                    <th className="px-3 py-3 text-right text-sky-700">Débito</th>
                    <th className="px-3 py-3 text-right text-teal-700">PIX</th>
                    <th className="px-3 py-3 text-right text-emerald-700">
                      Dinheiro
                    </th>
                    <th className="px-3 py-3 text-right text-purple-700">
                      Outros
                    </th>
                    <th className="px-3 py-3 text-right font-bold text-ink">
                      Total Pago
                    </th>
                    <th className="px-3 py-3 text-center">Status / Dif.</th>
                    <th className="px-3 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft text-ink-soft">
                  {filteredDailyEntries.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-canvas/70"
                    >
                      <td className="px-3 py-3 font-semibold text-ink">
                        {item.tableId}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-ink">
                        {formatPrice(item.subtotalCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-blue-700">
                        {formatPrice(item.serviceCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-amber-700">
                        {item.discountCents > 0
                          ? formatPrice(item.discountCents)
                          : "-"}
                      </td>
                      <td className="bg-emerald-50/40 px-3 py-3 text-right font-bold text-emerald-800">
                        {item.tipCents > 0 ? formatPrice(item.tipCents) : "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-ink">
                        {formatPrice(item.totalWithServiceCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-ink-muted">
                        {formatPrice(item.totalWithoutServiceCents)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-indigo-700">
                        {item.creditCents > 0
                          ? formatPrice(item.creditCents)
                          : "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-sky-700">
                        {item.debitCents > 0
                          ? formatPrice(item.debitCents)
                          : "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-teal-700">
                        {item.pixCents > 0 ? formatPrice(item.pixCents) : "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-emerald-700">
                        {item.cashCents > 0 ? formatPrice(item.cashCents) : "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-purple-700">
                        {item.othersCents > 0
                          ? formatPrice(item.othersCents)
                          : "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-ink">
                        {formatPrice(item.totalPaidCents)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {Math.abs(item.balanceCents) < 1 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <Check className="h-3 w-3" /> Ok
                          </span>
                        ) : item.balanceCents < 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                            <AlertCircle className="h-3 w-3" /> -
                            {formatPrice(Math.abs(item.balanceCents))}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            <ArrowUpRight className="h-3 w-3" /> +
                            {formatPrice(item.balanceCents)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            title="Editar mesa"
                            onClick={() => openEditModal(item)}
                            className="rounded p-1.5 text-ink-soft hover:bg-paper hover:text-terracotta"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Excluir mesa"
                            onClick={() => requestDeleteEntry(item)}
                            className="rounded p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-line bg-paper font-bold text-ink">
                  <tr>
                    <td className="px-3 py-3 text-[11px] uppercase">
                      Totais ({filteredDailyTotals.count})
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatPrice(filteredDailyTotals.subtotalCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-700">
                      {formatPrice(filteredDailyTotals.serviceCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-700">
                      {formatPrice(filteredDailyTotals.discountCents)}
                    </td>
                    <td className="bg-emerald-100/60 px-3 py-3 text-right text-emerald-900">
                      {formatPrice(filteredDailyTotals.tipCents)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatPrice(filteredDailyTotals.totalWithServiceCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-soft">
                      {formatPrice(filteredDailyTotals.totalWithoutServiceCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-indigo-800">
                      {formatPrice(filteredDailyTotals.creditCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-sky-800">
                      {formatPrice(filteredDailyTotals.debitCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-teal-800">
                      {formatPrice(filteredDailyTotals.pixCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-800">
                      {formatPrice(filteredDailyTotals.cashCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-purple-800">
                      {formatPrice(filteredDailyTotals.othersCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-indigo-700">
                      {formatPrice(filteredDailyTotals.totalPaidCents)}
                    </td>
                    <td
                      className={`px-3 py-3 text-center ${
                        Math.abs(filteredDailyTotals.balanceCents) < 1
                          ? "text-emerald-700"
                          : filteredDailyTotals.balanceCents < 0
                          ? "text-red-700"
                          : "text-amber-700"
                      }`}
                    >
                      {Math.abs(filteredDailyTotals.balanceCents) < 1
                        ? "Exato"
                        : (filteredDailyTotals.balanceCents > 0 ? "+" : "") +
                          formatPrice(filteredDailyTotals.balanceCents)}
                    </td>
                    <td className="px-3 py-3 text-center text-ink-muted">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: FATURAMENTO SEMANAL CONSOLIDADO (SEG–DOM) */
        <div className="space-y-5">
          {/* Barras comparativas da semana */}
          <div className="rounded-2xl border border-line bg-card p-6">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Evolução Diária na Semana ({formatISODateBR(weekDates[0])} a{" "}
              {formatISODateBR(weekDates[6])})
            </h2>
            <div className="mt-5 space-y-3">
              {weeklyByDay.map((day) => {
                const pct =
                  day.totals.totalPaidCents > 0
                    ? Math.max(
                        5,
                        Math.round(
                          (day.totals.totalPaidCents / maxDailyPaid) * 100
                        )
                      )
                    : 0;
                const isSelected = day.date === selectedDate;
                return (
                  <div
                    key={day.date}
                    className="grid grid-cols-12 items-center gap-3 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.date);
                        setViewMode("daily");
                      }}
                      className={`col-span-4 text-left font-semibold capitalize hover:text-terracotta sm:col-span-3 ${
                        isSelected ? "text-terracotta" : "text-ink"
                      }`}
                    >
                      {day.label}
                      <span className="ml-1.5 text-[11px] font-normal text-ink-muted">
                        ({day.totals.count}m)
                      </span>
                    </button>
                    <div className="col-span-5 h-3 overflow-hidden rounded-full bg-paper sm:col-span-6">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isSelected ? "bg-terracotta" : "bg-ink/80"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="col-span-3 text-right font-semibold text-ink">
                      {formatPrice(day.totals.totalPaidCents)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela Resumo por Dia da Semana */}
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className="border-b border-line bg-paper/50 p-4">
              <h2 className="font-display text-xl font-semibold text-ink">
                Fechamento Consolidado por Dia
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-xs">
                <thead className="border-b border-line bg-paper/70 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="px-4 py-3">Dia</th>
                    <th className="px-3 py-3 text-center">Mesas</th>
                    <th className="px-3 py-3 text-right">Subtotal</th>
                    <th className="px-3 py-3 text-right">10% Serv.</th>
                    <th className="px-3 py-3 text-right">Desconto</th>
                    <th className="px-3 py-3 text-right text-emerald-800">
                      Caixinha
                    </th>
                    <th className="px-3 py-3 text-right">Crédito</th>
                    <th className="px-3 py-3 text-right">Débito</th>
                    <th className="px-3 py-3 text-right">PIX</th>
                    <th className="px-3 py-3 text-right">Dinheiro</th>
                    <th className="px-3 py-3 text-right font-bold text-ink">
                      Total Recebido
                    </th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {weeklyByDay.map((day) => (
                    <tr
                      key={day.date}
                      className="transition-colors hover:bg-canvas/70"
                    >
                      <td className="px-4 py-3 font-semibold capitalize text-ink">
                        {day.label}
                      </td>
                      <td className="px-3 py-3 text-center text-ink-soft">
                        {day.totals.count}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatPrice(day.totals.subtotalCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-blue-700">
                        {formatPrice(day.totals.serviceCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-amber-700">
                        {formatPrice(day.totals.discountCents)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-emerald-800">
                        {formatPrice(day.totals.tipCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-indigo-700">
                        {formatPrice(day.totals.creditCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-sky-700">
                        {formatPrice(day.totals.debitCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-teal-700">
                        {formatPrice(day.totals.pixCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-emerald-700">
                        {formatPrice(day.totals.cashCents)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-ink">
                        {formatPrice(day.totals.totalPaidCents)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(day.date);
                            setViewMode("daily");
                          }}
                          className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-ink hover:border-terracotta hover:text-terracotta"
                        >
                          Abrir Dia
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-line bg-paper font-bold text-ink">
                  <tr>
                    <td className="px-4 py-3 text-[11px] uppercase">
                      Total Semana
                    </td>
                    <td className="px-3 py-3 text-center">
                      {weeklyTotals.count}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatPrice(weeklyTotals.subtotalCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-700">
                      {formatPrice(weeklyTotals.serviceCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-700">
                      {formatPrice(weeklyTotals.discountCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-800">
                      {formatPrice(weeklyTotals.tipCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-indigo-800">
                      {formatPrice(weeklyTotals.creditCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-sky-800">
                      {formatPrice(weeklyTotals.debitCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-teal-800">
                      {formatPrice(weeklyTotals.pixCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-800">
                      {formatPrice(weeklyTotals.cashCents)}
                    </td>
                    <td className="px-3 py-3 text-right text-indigo-700">
                      {formatPrice(weeklyTotals.totalPaidCents)}
                    </td>
                    <td className="px-4 py-3 text-right">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAR / EDITAR MESA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-6 py-4">
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink">
                  {editingId
                    ? `Editar ${tableId}`
                    : `Novo Lançamento — ${formatISODateBR(selectedDate)}`}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-5 p-6">
              {/* Identificação + Subtotal */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Identificação da Mesa / Comanda *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-medium text-ink-muted">
                      #
                    </span>
                    <input
                      type="text"
                      required
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value)}
                      placeholder="Ex: Mesa 04 ou Comanda 112"
                      className="w-full rounded-xl border border-line bg-canvas py-2 pl-8 pr-3 text-sm font-medium text-ink focus:border-terracotta focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Subtotal Bruto (Consumo) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-medium text-ink-muted">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={subtotalStr}
                      onChange={(e) => handleSubtotalChange(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-xl border border-line bg-canvas py-2 pl-10 pr-3 text-sm font-semibold text-ink focus:border-terracotta focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 10% Serviço, Desconto, Caixinha */}
              <div className="grid gap-4 rounded-xl border border-line bg-paper/50 p-4 sm:grid-cols-3">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      Serviço (10%)
                    </label>
                    <label className="flex cursor-pointer items-center gap-1 text-[11px] text-ink-muted">
                      <input
                        type="checkbox"
                        checked={manualService}
                        onChange={(e) =>
                          handleToggleManualService(e.target.checked)
                        }
                        className="accent-terracotta"
                      />
                      Editar
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-ink-muted">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      readOnly={!manualService}
                      value={
                        manualService
                          ? serviceStr
                          : modalServiceCents > 0
                          ? centsToInput(modalServiceCents)
                          : ""
                      }
                      onChange={(e) => setServiceStr(e.target.value)}
                      className={`w-full rounded-lg border border-line py-1.5 pl-9 pr-2 text-sm font-semibold outline-none ${
                        manualService
                          ? "bg-card text-ink focus:border-terracotta"
                          : "bg-paper text-ink-soft"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    10% automático.
                  </p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                      Desconto
                    </label>
                    <button
                      type="button"
                      onClick={applyWaiveServiceShortcut}
                      className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-terracotta hover:underline"
                    >
                      <Tag className="h-3 w-3" /> Isentar 10%
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-ink-muted">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discountStr}
                      onChange={(e) => setDiscountStr(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card py-1.5 pl-9 pr-2 text-sm font-semibold text-amber-800 focus:border-terracotta focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Abatimento ou isenção.
                  </p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                      <Coins className="h-3.5 w-3.5" /> Caixinha
                    </label>
                    {showSurplusShortcut && (
                      <button
                        type="button"
                        onClick={applySurplusAsTip}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        Copiar Sobra
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-semibold text-emerald-700">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tipStr}
                      onChange={(e) => setTipStr(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-emerald-300 bg-emerald-50/40 py-1.5 pl-9 pr-2 text-sm font-bold text-emerald-800 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700/80">
                    Sobra voluntária / garçom.
                  </p>
                </div>
              </div>

              {/* Faixa Previews Calculados */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-ink p-4 text-canvas">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-canvas/65">
                    Total Esperado c/ 10% + Caixinha
                  </span>
                  <div className="mt-0.5 text-lg font-bold text-emerald-300">
                    {formatPrice(modalExpectedTotal)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-canvas/65">
                    Total Consumo s/ 10% + Caixinha
                  </span>
                  <div className="mt-0.5 text-lg font-bold text-canvas">
                    {formatPrice(modalWithoutService + modalTipCents)}
                  </div>
                </div>
              </div>

              {/* Modalidades de Pagamento com + Integral */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Valores Pagos por Modalidade
                  </label>
                  <span className="text-[11px] text-ink-muted">
                    Clique em{" "}
                    <strong className="text-ink">&ldquo;+ Integral&rdquo;</strong>{" "}
                    no método desejado
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {(
                    [
                      {
                        key: "credit" as const,
                        label: "Crédito",
                        value: creditStr,
                        setter: setCreditStr,
                        icon: CreditCard,
                        pill: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white",
                        iconColor: "text-indigo-600",
                      },
                      {
                        key: "debit" as const,
                        label: "Débito",
                        value: debitStr,
                        setter: setDebitStr,
                        icon: CreditCard,
                        pill: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-600 hover:text-white",
                        iconColor: "text-sky-600",
                      },
                      {
                        key: "pix" as const,
                        label: "PIX",
                        value: pixStr,
                        setter: setPixStr,
                        icon: QrCode,
                        pill: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-600 hover:text-white",
                        iconColor: "text-teal-600",
                      },
                      {
                        key: "cash" as const,
                        label: "Dinheiro",
                        value: cashStr,
                        setter: setCashStr,
                        icon: Banknote,
                        pill: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white",
                        iconColor: "text-emerald-600",
                      },
                      {
                        key: "others" as const,
                        label: "Outros / Voucher",
                        value: othersStr,
                        setter: setOthersStr,
                        icon: Ticket,
                        pill: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white",
                        iconColor: "text-purple-600",
                      },
                    ] as const
                  ).map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <div
                        key={pm.key}
                        className="rounded-xl border border-line bg-canvas/70 p-2.5"
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                            <Icon className={`h-3.5 w-3.5 ${pm.iconColor}`} />
                            {pm.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => fillMethodWithTotal(pm.key)}
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold transition ${pm.pill}`}
                          >
                            + Integral
                          </button>
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs text-ink-muted">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={pm.value}
                            onChange={(e) => pm.setter(e.target.value)}
                            placeholder="0,00"
                            className="w-full rounded-lg border border-line bg-card py-1.5 pl-8 pr-2 text-xs sm:text-sm focus:border-terracotta focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Atalhos Globais */}
                  <div className="flex flex-col justify-center gap-1.5 rounded-xl border border-dashed border-line bg-card p-2.5">
                    <span className="text-center text-[11px] font-semibold text-ink-muted">
                      Atalhos Globais
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={clearAllPayments}
                        className="rounded-lg bg-paper px-2 py-1.5 text-[11px] font-semibold text-ink-soft hover:text-ink"
                      >
                        Zerar
                      </button>
                      <button
                        type="button"
                        onClick={fillRemainingBalance}
                        className="rounded-lg bg-emerald-100 px-2 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-200"
                      >
                        Restante
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Auditoria / Conciliação */}
              <div
                className={`flex flex-col justify-between gap-2 rounded-xl border p-3 text-xs font-medium sm:flex-row sm:items-center ${
                  modalSubtotalCents === 0 && modalTotalPaid === 0
                    ? "border-line bg-paper/50 text-ink-soft"
                    : Math.abs(modalDiff) < 1
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : modalDiff < 0
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>
                    {modalSubtotalCents === 0 && modalTotalPaid === 0
                      ? "Preencha o consumo e os pagamentos para auditar."
                      : Math.abs(modalDiff) < 1
                      ? modalTipCents > 0
                        ? `Conta e Caixinha de ${formatPrice(
                            modalTipCents
                          )} conciliadas com sucesso!`
                        : "Conta perfeitamente conciliada (Total pago = Total com 10%)."
                      : modalDiff < 0
                      ? `Falta receber ${formatPrice(
                          Math.abs(modalDiff)
                        )} para fechar a conta.`
                      : `Sobra não lançada de ${formatPrice(
                          modalDiff
                        )}. Deseja lançar como Caixinha?`}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {showSurplusShortcut && (
                    <button
                      type="button"
                      onClick={applySurplusAsTip}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Lançar como Caixinha
                    </button>
                  )}
                  <span className="font-bold">
                    {modalSubtotalCents === 0 && modalTotalPaid === 0
                      ? "R$ 0,00"
                      : Math.abs(modalDiff) < 1
                      ? "Bateu 100%"
                      : `${modalDiff > 0 ? "+ " : "- "}${formatPrice(
                          Math.abs(modalDiff)
                        )}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-line px-5 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEntry}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas hover:bg-terracotta disabled:opacity-60"
                >
                  {savingEntry && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR CSV */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink">
                  Importar Fechamento via CSV
                </h3>
                <p className="text-xs text-ink-muted">
                  Compatível com arquivos exportados do seu Google Sites ou
                  planilhas Excel/Sheets (`;` ou `,`).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Área de upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-line bg-canvas p-8 text-center transition-colors hover:border-terracotta"
              >
                <Upload className="mx-auto h-8 w-8 text-terracotta" />
                <p className="mt-2 text-sm font-semibold text-ink">
                  {importFileName || "Clique para escolher um arquivo .csv"}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Se o CSV não tiver coluna <strong>Data</strong>, as mesas serão
                  importadas em <strong>{formatISODateBR(selectedDate)}</strong>.
                </p>
                <input
                  ref={fileInputRef}
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) =>
                    handleCSVFileSelected(e.target.files?.[0] ?? null)
                  }
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={replaceDates}
                    onChange={(e) => setReplaceDates(e.target.checked)}
                    className="h-4 w-4 accent-terracotta"
                  />
                  Substituir lançamentos existentes das datas importadas
                </label>

                <button
                  type="button"
                  onClick={downloadTemplateCSV}
                  className="font-semibold text-terracotta hover:underline"
                >
                  Baixar modelo .csv
                </button>
              </div>

              {importWarnings.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {importWarnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}

              {/* Preview dos dados lidos */}
              {importRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-olive">
                    {importRows.length}{" "}
                    {importRows.length === 1
                      ? "mesa pronta para importar"
                      : "mesas prontas para importar"}{" "}
                    (Subtotal:{" "}
                    {formatPrice(
                      importRows.reduce((s, r) => s + r.subtotalCents, 0)
                    )}
                    )
                  </p>
                  <div className="max-h-56 overflow-auto rounded-xl border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-paper text-[10px] uppercase text-ink-muted">
                        <tr>
                          <th className="px-3 py-2">Data</th>
                          <th className="px-3 py-2">Mesa</th>
                          <th className="px-3 py-2 text-right">Subtotal</th>
                          <th className="px-3 py-2 text-right">10%</th>
                          <th className="px-3 py-2 text-right">Caixinha</th>
                          <th className="px-3 py-2 text-right">Total Pago</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-soft">
                        {importRows.slice(0, 20).map((r, i) => {
                          const paid =
                            r.creditCents +
                            r.debitCents +
                            r.pixCents +
                            r.cashCents +
                            r.othersCents;
                          return (
                            <tr key={i}>
                              <td className="px-3 py-2 text-ink-muted">
                                {formatISODateBR(r.turnDate)}
                              </td>
                              <td className="px-3 py-2 font-medium text-ink">
                                {r.tableId}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatPrice(r.subtotalCents)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatPrice(r.serviceCents)}
                              </td>
                              <td className="px-3 py-2 text-right text-emerald-700">
                                {formatPrice(r.tipCents)}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold">
                                {formatPrice(paid)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  className="rounded-full border border-line px-5 py-2 text-xs font-semibold text-ink-soft"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-csv-import"
                  disabled={importing || importRows.length === 0}
                  onClick={handleConfirmImport}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-canvas hover:bg-terracotta disabled:opacity-50"
                >
                  {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmar Importação ({importRows.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h4 className="font-display text-xl font-semibold text-ink">
              {confirmState.title}
            </h4>
            <p className="mt-1 text-xs text-ink-soft">{confirmState.desc}</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="flex-1 rounded-full border border-line py-2 text-xs font-semibold text-ink-soft"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={runConfirmedAction}
                className="flex-1 rounded-full bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {confirmBusy ? "Aguarde..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-medium text-canvas shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
