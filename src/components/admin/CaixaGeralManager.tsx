"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Calculator,
  Plus,
  Upload,
  Download,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatPrice } from "@/lib/format";
import { formatISODateBR } from "@/lib/table-closing";
import {
  computeCashLedger,
  formatCellCents,
  formatInputCents,
  HISTORICO_PRESETS,
  MONTH_NAMES_PT,
  parseSignedBRLToCents,
  type CashLedgerEntryDTO,
  type CashLedgerMonthDTO,
  type CashLedgerMonthSummary,
} from "@/lib/cash-ledger";

interface CaixaGeralManagerProps {
  initialMonths: CashLedgerMonthSummary[];
  initialActiveMonth: CashLedgerMonthDTO | null;
  needsClientFetch?: boolean;
}

export function CaixaGeralManager({
  initialMonths,
  initialActiveMonth,
  needsClientFetch = false,
}: CaixaGeralManagerProps) {
  const [months, setMonths] = useState<CashLedgerMonthSummary[]>(initialMonths);
  const [activeMonth, setActiveMonth] = useState<CashLedgerMonthDTO | null>(
    initialActiveMonth
  );
  const [loadingMonth, setLoadingMonth] = useState<boolean>(needsClientFetch);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(
    null
  );

  // Filtros
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  // Lançamento inline rápido
  const [quickDate, setQuickDate] = useState(() => {
    if (!initialActiveMonth) return "";
    if (initialActiveMonth.entries.length > 0) {
      return [...initialActiveMonth.entries].sort((a, b) =>
        b.date.localeCompare(a.date)
      )[0].date;
    }
    return `${initialActiveMonth.monthKey}-01`;
  });
  const [quickHist, setQuickHist] = useState("");
  const [quickCategory, setQuickCategory] = useState("SAIDA_BCO");
  const [quickAmount, setQuickAmount] = useState("");
  const [savingQuick, setSavingQuick] = useState(false);

  // Conciliação bancária (CEF + Itaú)
  const [cefInput, setCefInput] = useState(
    initialActiveMonth ? formatInputCents(initialActiveMonth.reconcileCefCents) : "0,00"
  );
  const [itauInput, setItauInput] = useState(
    initialActiveMonth ? formatInputCents(initialActiveMonth.reconcileItauCents) : "0,00"
  );

  // Modal 1: Fechamento de Vendas do Dia (5 linhas padrão)
  const [dailySalesOpen, setDailySalesOpen] = useState(false);
  const [dsDate, setDsDate] = useState("");
  const [dsCredit, setDsCredit] = useState("");
  const [dsDebit, setDsDebit] = useState("");
  const [dsCash, setDsCash] = useState("");
  const [dsPix, setDsPix] = useState("");
  const [savingDS, setSavingDS] = useState(false);

  // Modal 2: Novo / Editar Lançamento Completo
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [eDate, setEDate] = useState("");
  const [eHist, setEHist] = useState("");
  const [ePixPJ, setEPixPJ] = useState("");
  const [eEntradas, setEEntradas] = useState("");
  const [eSaidas, setESaidas] = useState("");
  const [eDnhEnt, setEDnhEnt] = useState("");
  const [eDnhSai, setEDnhSai] = useState("");
  const [eProLabore, setEProLabore] = useState("");
  const [eCredit, setECredit] = useState("");
  const [ePixDep, setEPixDep] = useState("");
  const [eDebit, setEDebit] = useState("");
  const [eVendas, setEVendas] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);

  // Modal 3: Editar Saldos Iniciais (H2 / O2)
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [initBcoStr, setInitBcoStr] = useState("");
  const [initDnhStr, setInitDnhStr] = useState("");
  const [savingInit, setSavingInit] = useState(false);

  // Modal 4: Novo Mês
  const [newMonthOpen, setNewMonthOpen] = useState(false);
  const [nmMonth, setNmMonth] = useState("10");
  const [nmYear, setNmYear] = useState("2026");
  const [creatingMonth, setCreatingMonth] = useState(false);

  // Modal 5: Confirmar Exclusão
  const [deleteTarget, setDeleteTarget] = useState<CashLedgerEntryDTO | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // Importação Excel/CSV
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importingExcel, setImportingExcel] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }

  function syncMonthDerivedInputs(month: CashLedgerMonthDTO | null) {
    if (!month) return;
    setCefInput(formatInputCents(month.reconcileCefCents));
    setItauInput(formatInputCents(month.reconcileItauCents));
    if (month.entries.length > 0) {
      const latest = [...month.entries].sort((a, b) =>
        b.date.localeCompare(a.date)
      )[0].date;
      setQuickDate(latest);
    } else {
      setQuickDate(`${month.monthKey}-01`);
    }
  }

  async function loadLedger(targetMonthKey?: string) {
    setLoadingMonth(true);
    try {
      const url = targetMonthKey
        ? `/api/admin/caixa-geral?month=${encodeURIComponent(targetMonthKey)}`
        : "/api/admin/caixa-geral";
      const res = await adminFetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setMonths(data.months ?? []);
      setActiveMonth(data.activeMonth ?? null);
      syncMonthDerivedInputs(data.activeMonth ?? null);
    } finally {
      setLoadingMonth(false);
    }
  }

  useEffect(() => {
    if (initialActiveMonth || !needsClientFetch) return;
    let active = true;
    adminFetch("/api/admin/caixa-geral")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setMonths(data.months ?? []);
        setActiveMonth(data.activeMonth ?? null);
        syncMonthDerivedInputs(data.activeMonth ?? null);
      })
      .finally(() => {
        if (active) setLoadingMonth(false);
      });
    return () => {
      active = false;
    };
  }, [initialActiveMonth, needsClientFetch]);

  const computed = useMemo(() => {
    if (!activeMonth) return null;
    return computeCashLedger(activeMonth);
  }, [activeMonth]);

  const filteredRows = useMemo(() => {
    if (!computed) return [];
    const q = search.trim().toLowerCase();
    return computed.rows.filter((r) => {
      if (q && !r.hist.toLowerCase().includes(q)) return false;
      if (filterDate && r.date !== filterDate) return false;
      if (
        filterType === "BANK" &&
        !(r.pixPJCents || r.entradasCents || r.saidasCents)
      ) {
        return false;
      }
      if (filterType === "CASH" && !(r.dnhEntCents || r.dnhSaiCents)) {
        return false;
      }
      if (
        filterType === "SALES" &&
        !(
          r.creditCents ||
          r.pixDepCents ||
          r.debitCents ||
          r.vendasCents ||
          r.hist.toLowerCase().includes("vendas")
        )
      ) {
        return false;
      }
      if (filterType === "PROLABORE" && !r.proLaboreCents) return false;
      return true;
    });
  }, [computed, search, filterDate, filterType]);

  function getDefaultDate(): string {
    if (!activeMonth) return new Date().toISOString().slice(0, 10);
    if (activeMonth.entries.length > 0) {
      return [...activeMonth.entries].sort((a, b) =>
        b.date.localeCompare(a.date)
      )[0].date;
    }
    return `${activeMonth.monthKey}-01`;
  }

  // --- Lançamento Inline Ultra-Rápido ---
  async function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMonth) return;
    const amountCents = Math.abs(parseSignedBRLToCents(quickAmount));
    if (!quickDate || !quickHist.trim() || amountCents <= 0) {
      showToast("Preencha data, histórico e um valor maior que zero.", "err");
      return;
    }

    setSavingQuick(true);
    try {
      const payload = {
        monthKey: activeMonth.monthKey,
        entries: [
          {
            date: quickDate,
            hist: quickHist.trim(),
            pixPJCents: quickCategory === "PIX_PJ" ? amountCents : 0,
            creditCents: 0,
            entradasCents: quickCategory === "ENTRADA_BCO" ? amountCents : 0,
            saidasCents:
              quickCategory === "SAIDA_BCO" || quickCategory === "PROLABORE_BCO"
                ? amountCents
                : 0,
            proLaboreCents:
              quickCategory === "PROLABORE_BCO" ||
              quickCategory === "PROLABORE_DNH"
                ? amountCents
                : 0,
            pixDepCents: 0,
            debitCents: 0,
            vendasCents: 0,
            dnhEntCents: quickCategory === "ENTRADA_DNH" ? amountCents : 0,
            dnhSaiCents:
              quickCategory === "SAIDA_DNH" || quickCategory === "PROLABORE_DNH"
                ? amountCents
                : 0,
          },
        ],
      };

      const res = await adminFetch("/api/admin/caixa-geral/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        showToast("Erro ao salvar lançamento rápido.", "err");
        return;
      }

      setQuickHist("");
      setQuickAmount("");
      await loadLedger(activeMonth.monthKey);
      showToast("Lançamento inserido e saldos recalculados!");
    } finally {
      setSavingQuick(false);
    }
  }

  // --- Modal Fechamento de Vendas do Dia (5 linhas) ---
  function openDailySalesModal() {
    setDsDate(getDefaultDate());
    setDsCredit("");
    setDsDebit("");
    setDsCash("");
    setDsPix("");
    setDailySalesOpen(true);
  }

  const dsTotalPreviewCents =
    Math.abs(parseSignedBRLToCents(dsCredit)) +
    Math.abs(parseSignedBRLToCents(dsDebit)) +
    Math.abs(parseSignedBRLToCents(dsCash)) +
    Math.abs(parseSignedBRLToCents(dsPix));

  async function handleDailySalesSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMonth) return;
    const creditCents = Math.abs(parseSignedBRLToCents(dsCredit));
    const debitCents = Math.abs(parseSignedBRLToCents(dsDebit));
    const cashCents = Math.abs(parseSignedBRLToCents(dsCash));
    const pixCents = Math.abs(parseSignedBRLToCents(dsPix));
    const totalCents = creditCents + debitCents + cashCents + pixCents;

    if (totalCents <= 0) {
      showToast("Informe pelo menos um valor de venda.", "err");
      return;
    }

    setSavingDS(true);
    try {
      const res = await adminFetch("/api/admin/caixa-geral/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey: activeMonth.monthKey,
          entries: [
            { date: dsDate, hist: "Vendas Crédito", creditCents },
            { date: dsDate, hist: "Vendas Débito", debitCents },
            { date: dsDate, hist: "Vendas Dinheiro", dnhEntCents: cashCents },
            { date: dsDate, hist: "PIX/Depósito", pixDepCents: pixCents },
            { date: dsDate, hist: "Vendas Totais", vendasCents: totalCents },
          ],
        }),
      });
      if (!res.ok) {
        showToast("Erro ao lançar fechamento de vendas.", "err");
        return;
      }

      setDailySalesOpen(false);
      await loadLedger(activeMonth.monthKey);
      showToast(
        `Fechamento do dia ${formatISODateBR(dsDate)} lançado (${formatPrice(
          totalCents
        )})!`
      );
    } finally {
      setSavingDS(false);
    }
  }

  // --- Modal Novo / Editar Lançamento Completo ---
  function openNewEntryModal(preset?: string) {
    setEditingEntryId(null);
    setEDate(getDefaultDate());
    setEHist(
      preset === "LIBERACAO_CARTAO"
        ? "Liberação Cartões Rede Itaú"
        : preset === "PROLABORE"
        ? "Pro Labore TATA"
        : preset === "SAIDA_DNH"
        ? "Caixinha"
        : ""
    );
    setEPixPJ("");
    setEEntradas("");
    setESaidas("");
    setEDnhEnt("");
    setEDnhSai("");
    setEProLabore("");
    setECredit("");
    setEPixDep("");
    setEDebit("");
    setEVendas("");
    setEntryModalOpen(true);
  }

  function openEditEntryModal(entry: CashLedgerEntryDTO) {
    setEditingEntryId(entry.id);
    setEDate(entry.date);
    setEHist(entry.hist);
    setEPixPJ(formatCellCents(entry.pixPJCents));
    setEEntradas(formatCellCents(entry.entradasCents));
    setESaidas(formatCellCents(entry.saidasCents));
    setEDnhEnt(formatCellCents(entry.dnhEntCents));
    setEDnhSai(formatCellCents(entry.dnhSaiCents));
    setEProLabore(formatCellCents(entry.proLaboreCents));
    setECredit(formatCellCents(entry.creditCents));
    setEPixDep(formatCellCents(entry.pixDepCents));
    setEDebit(formatCellCents(entry.debitCents));
    setEVendas(formatCellCents(entry.vendasCents));
    setEntryModalOpen(true);
  }

  async function handleEntrySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMonth) return;
    setSavingEntry(true);

    try {
      const rowData = {
        date: eDate,
        hist: eHist.trim(),
        pixPJCents: Math.abs(parseSignedBRLToCents(ePixPJ)),
        entradasCents: Math.abs(parseSignedBRLToCents(eEntradas)),
        saidasCents: Math.abs(parseSignedBRLToCents(eSaidas)),
        dnhEntCents: Math.abs(parseSignedBRLToCents(eDnhEnt)),
        dnhSaiCents: Math.abs(parseSignedBRLToCents(eDnhSai)),
        proLaboreCents: Math.abs(parseSignedBRLToCents(eProLabore)),
        creditCents: Math.abs(parseSignedBRLToCents(eCredit)),
        pixDepCents: Math.abs(parseSignedBRLToCents(ePixDep)),
        debitCents: Math.abs(parseSignedBRLToCents(eDebit)),
        vendasCents: Math.abs(parseSignedBRLToCents(eVendas)),
      };

      const res = editingEntryId
        ? await adminFetch(`/api/admin/caixa-geral/entries/${editingEntryId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rowData),
          })
        : await adminFetch("/api/admin/caixa-geral/entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              monthKey: activeMonth.monthKey,
              entries: [rowData],
            }),
          });

      if (!res.ok) {
        showToast("Erro ao salvar lançamento.", "err");
        return;
      }

      setEntryModalOpen(false);
      await loadLedger(activeMonth.monthKey);
      showToast(
        editingEntryId
          ? "Lançamento atualizado com sucesso!"
          : "Novo lançamento adicionado!"
      );
    } finally {
      setSavingEntry(false);
    }
  }

  // --- Excluir Lançamento ---
  async function handleConfirmDelete() {
    if (!deleteTarget || !activeMonth) return;
    setDeleting(true);
    try {
      const res = await adminFetch(
        `/api/admin/caixa-geral/entries/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDeleteTarget(null);
        await loadLedger(activeMonth.monthKey);
        showToast("Lançamento excluído e saldos recalculados.");
      }
    } finally {
      setDeleting(false);
    }
  }

  // --- Saldos Iniciais (H2 / O2) ---
  function openInitBalanceModal() {
    if (!activeMonth) return;
    setInitBcoStr(formatInputCents(activeMonth.initialBankBalanceCents));
    setInitDnhStr(formatInputCents(activeMonth.initialCashBalanceCents));
    setInitModalOpen(true);
  }

  async function handleInitBalanceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMonth) return;
    setSavingInit(true);
    try {
      const initialBankBalanceCents = parseSignedBRLToCents(initBcoStr);
      const initialCashBalanceCents = parseSignedBRLToCents(initDnhStr);
      const res = await adminFetch(
        `/api/admin/caixa-geral/months/${activeMonth.monthKey}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initialBankBalanceCents,
            initialCashBalanceCents,
          }),
        }
      );
      if (res.ok) {
        setInitModalOpen(false);
        await loadLedger(activeMonth.monthKey);
        showToast("Saldos iniciais (H2 / O2) atualizados!");
      }
    } finally {
      setSavingInit(false);
    }
  }

  // --- Conciliação Bancária (CEF + Itaú) ---
  async function saveReconciliation() {
    if (!activeMonth) return;
    const reconcileCefCents = parseSignedBRLToCents(cefInput);
    const reconcileItauCents = parseSignedBRLToCents(itauInput);

    setActiveMonth((prev) =>
      prev ? { ...prev, reconcileCefCents, reconcileItauCents } : prev
    );

    const res = await adminFetch(
      `/api/admin/caixa-geral/months/${activeMonth.monthKey}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reconcileCefCents, reconcileItauCents }),
      }
    );
    if (res.ok) {
      setCefInput(formatInputCents(reconcileCefCents));
      setItauInput(formatInputCents(reconcileItauCents));
      showToast("Conciliação bancária salva.");
    }
  }

  // --- Abrir Novo Mês ---
  function openNewMonthModal() {
    if (!activeMonth) return;
    const [y, m] = activeMonth.monthKey.split("-").map(Number);
    let nextM = (m || 1) + 1;
    let nextY = y || new Date().getFullYear();
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setNmMonth(String(nextM).padStart(2, "0"));
    setNmYear(String(nextY));
    setNewMonthOpen(true);
  }

  async function handleCreateNewMonth(e: React.FormEvent) {
    e.preventDefault();
    if (!computed) return;
    const monthKey = `${nmYear}-${nmMonth}`;
    setCreatingMonth(true);
    try {
      const res = await adminFetch("/api/admin/caixa-geral/months", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey,
          initialBankBalanceCents: computed.finalBankBalanceCents,
          initialCashBalanceCents: computed.finalCashBalanceCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao criar novo mês.", "err");
        return;
      }
      setNewMonthOpen(false);
      await loadLedger(monthKey);
      showToast(
        data.existed
          ? `Aba ${data.month.label} já existia e foi aberta.`
          : `Aba ${data.month.label} criada com saldos transportados!`
      );
    } finally {
      setCreatingMonth(false);
    }
  }

  // --- Exportar .XLSX (fiel à planilha Caixa_Geral_2026) ---
  function handleExportExcel() {
    if (!activeMonth || !computed) return;
    const toVal = (cents: number) => (cents ? Number((cents / 100).toFixed(2)) : "");

    const aoa: Array<Array<string | number>> = [
      ["CAIXA GERAL - diVino Restaurante", activeMonth.label],
      [
        "DATAS",
        "HISTORICO",
        "",
        "PIX Entrada PJ",
        "Entradas Cartão Crédito",
        "ENTRADAS",
        "SAÍDAS",
        "SALDO BCO",
        "Pró-Lab Tata",
        "PIX/Depósito",
        "C. Débito",
        "Vendas",
        "Dinh. Entrada",
        "Dinh. Saída",
        "Dinh. Saldo",
      ],
      [
        "",
        "SALDO ANTERIOR",
        "",
        "",
        "",
        "",
        "",
        Number((activeMonth.initialBankBalanceCents / 100).toFixed(2)),
        "",
        "",
        "",
        "",
        "",
        "",
        Number((activeMonth.initialCashBalanceCents / 100).toFixed(2)),
      ],
    ];

    computed.rows.forEach((r) => {
      aoa.push([
        formatISODateBR(r.date),
        r.hist,
        "",
        toVal(r.pixPJCents),
        toVal(r.creditCents),
        toVal(r.entradasCents),
        toVal(r.saidasCents),
        Number((r.saldoBcoCents / 100).toFixed(2)),
        toVal(r.proLaboreCents),
        toVal(r.pixDepCents),
        toVal(r.debitCents),
        toVal(r.vendasCents),
        toVal(r.dnhEntCents),
        toVal(r.dnhSaiCents),
        Number((r.saldoDnhCents / 100).toFixed(2)),
      ]);
    });

    aoa.push([]);
    aoa.push([
      "TOTAIS",
      "FECHAMENTO DO MÊS",
      "",
      Number((computed.totals.pixPJCents / 100).toFixed(2)),
      Number((computed.totals.creditCents / 100).toFixed(2)),
      Number((computed.totals.entradasCents / 100).toFixed(2)),
      Number((computed.totals.saidasCents / 100).toFixed(2)),
      Number((computed.finalBankBalanceCents / 100).toFixed(2)),
      Number((computed.totals.proLaboreCents / 100).toFixed(2)),
      Number((computed.totals.pixDepCents / 100).toFixed(2)),
      Number((computed.totals.debitCents / 100).toFixed(2)),
      Number((computed.totals.vendasCents / 100).toFixed(2)),
      Number((computed.totals.dnhEntCents / 100).toFixed(2)),
      Number((computed.totals.dnhSaiCents / 100).toFixed(2)),
      Number((computed.finalCashBalanceCents / 100).toFixed(2)),
    ]);

    aoa.push([]);
    aoa.push([
      "",
      "Saldo Caixa Econômica Federal",
      "",
      Number((activeMonth.reconcileCefCents / 100).toFixed(2)),
    ]);
    aoa.push([
      "",
      "Saldo Banco Itaú",
      "",
      Number((activeMonth.reconcileItauCents / 100).toFixed(2)),
    ]);
    aoa.push([
      "",
      "Saldo Real Bancos",
      "",
      Number(
        (
          (activeMonth.reconcileCefCents + activeMonth.reconcileItauCents) /
          100
        ).toFixed(2)
      ),
    ]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeMonth.label.slice(0, 31));
    XLSX.writeFile(
      wb,
      `Caixa_Geral_diVino_${activeMonth.label.replace(/\s+/g, "_")}.xlsx`
    );
    showToast("Planilha .XLSX exportada com sucesso!");
  }

  // --- Importar Excel (.xlsx, .xls, .csv) ---
  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeMonth) return;

    setImportingExcel(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
        header: 1,
        defval: "",
      });

      const importedEntries: Array<Record<string, unknown>> = [];
      let initBco: number | null = null;
      let initDnh: number | null = null;

      for (const row of rows) {
        if (!Array.isArray(row) || row.length < 2) continue;
        const colA = row[0];
        const colB = String(row[1] ?? "").trim();

        if (colB.toUpperCase().includes("SALDO ANTERIOR")) {
          const hVal = parseSignedBRLToCents(row[7] as string | number);
          const oVal = parseSignedBRLToCents(row[14] as string | number);
          if (hVal !== 0) initBco = hVal;
          if (oVal !== 0) initDnh = oVal;
          continue;
        }

        if (
          !colB ||
          colB.toUpperCase() === "HISTORICO" ||
          colB.toUpperCase() === "HISTÓRICO" ||
          String(colA ?? "").toUpperCase() === "TOTAIS"
        ) {
          continue;
        }

        let isoDate = "";
        if (colA instanceof Date && !Number.isNaN(colA.getTime())) {
          isoDate = colA.toISOString().slice(0, 10);
        } else if (typeof colA === "string") {
          const t = colA.trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
            isoDate = t;
          } else if (t.includes("/")) {
            const parts = t.split("/");
            if (parts.length === 3) {
              const yr = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              isoDate = `${yr}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
                2,
                "0"
              )}`;
            }
          }
        }

        if (!isoDate) continue;

        importedEntries.push({
          date: isoDate,
          hist: colB,
          pixPJCents: Math.abs(parseSignedBRLToCents(row[3] as string | number)),
          creditCents: Math.abs(parseSignedBRLToCents(row[4] as string | number)),
          entradasCents: Math.abs(parseSignedBRLToCents(row[5] as string | number)),
          saidasCents: Math.abs(parseSignedBRLToCents(row[6] as string | number)),
          proLaboreCents: Math.abs(parseSignedBRLToCents(row[8] as string | number)),
          pixDepCents: Math.abs(parseSignedBRLToCents(row[9] as string | number)),
          debitCents: Math.abs(parseSignedBRLToCents(row[10] as string | number)),
          vendasCents: Math.abs(parseSignedBRLToCents(row[11] as string | number)),
          dnhEntCents: Math.abs(parseSignedBRLToCents(row[12] as string | number)),
          dnhSaiCents: Math.abs(parseSignedBRLToCents(row[13] as string | number)),
        });
      }

      if (importedEntries.length === 0) {
        showToast(
          "Nenhuma linha válida de lançamento encontrada na planilha.",
          "err"
        );
        return;
      }

      const res = await adminFetch("/api/admin/caixa-geral/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthKey: activeMonth.monthKey,
          initialBankBalanceCents: initBco,
          initialCashBalanceCents: initDnh,
          replaceMonth: true,
          entries: importedEntries,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao importar planilha.", "err");
        return;
      }

      await loadLedger(activeMonth.monthKey);
      showToast(`${data.importedCount} lançamentos importados da planilha!`);
    } catch {
      showToast("Erro ao ler o arquivo Excel/CSV.", "err");
    } finally {
      setImportingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loadingMonth && !activeMonth) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-ink-soft">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-terracotta" />
        Carregando Caixa Geral...
      </div>
    );
  }

  if (!activeMonth || !computed) {
    return (
      <div className="rounded-2xl border border-line bg-card p-10 text-center text-sm text-ink-muted">
        Nenhum mês carregado no Caixa Geral.
      </div>
    );
  }

  const vistaSumCents =
    computed.totals.debitCents +
    computed.totals.pixDepCents +
    computed.totals.salesCashOnlyCents;
  const realBanksCents =
    activeMonth.reconcileCefCents + activeMonth.reconcileItauCents;
  const reconcileDiffCents = realBanksCents - computed.finalBankBalanceCents;
  const subtotalCardsCents =
    computed.totals.creditCents + computed.totals.debitCents;
  const sumSalesCheckCents =
    subtotalCardsCents +
    computed.totals.salesCashOnlyCents +
    computed.totals.pixDepCents;
  const hasFilters = Boolean(search || filterDate || filterType !== "ALL");

  return (
    <div className="space-y-5">
      {/* Cabeçalho + Seletor de Mês + Excel */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-[#2b301f] p-5 text-[#f7f5f0] shadow-sm lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
              Caixa Geral
            </h1>
            <span className="rounded-full border border-[#c5a059]/40 bg-[#c5a059]/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#e3c785]">
              Contabilidade
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#f7f5f0]/75">
            Controle Financeiro Diário em Cascata (Colunas A–O) &bull; Salvo em
            banco SQL
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-white/15 bg-black/25 p-1">
            <select
              id="caixa-month-selector"
              value={activeMonth.monthKey}
              onChange={(e) => loadLedger(e.target.value)}
              className="cursor-pointer rounded-lg bg-transparent px-3 py-1.5 text-xs font-semibold text-white outline-none"
            >
              {months.map((m) => (
                <option
                  key={m.monthKey}
                  value={m.monthKey}
                  className="bg-white text-ink"
                >
                  {m.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              id="btn-new-month"
              onClick={openNewMonthModal}
              className="ml-1 rounded-lg bg-[#c5a059] px-2.5 py-1.5 text-xs font-bold text-[#252a19] transition hover:bg-[#d9b875]"
            >
              + Novo Mês
            </button>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-[#f7f5f0] transition hover:bg-white/20">
            {importingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#e3c785]" />
            ) : (
              <Upload className="h-3.5 w-3.5 text-[#e3c785]" />
            )}
            <span>Importar Excel/CSV</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelImport}
            />
          </label>

          <button
            type="button"
            id="btn-export-xlsx"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5a059] px-3.5 py-2 text-xs font-bold text-[#252a19] transition hover:bg-[#d9b875]"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar .XLSX
          </button>
        </div>
      </div>

      {/* 5 KPI Cards Superiores */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Saldo Banco (BCO)
            </span>
            <span className="rounded bg-[#353b25]/10 px-2 py-0.5 text-[10px] font-semibold text-[#353b25]">
              Col. H
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-2xl font-bold tabular-nums text-[#353b25]">
              {formatPrice(computed.finalBankBalanceCents)}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-xs">
              <span className="text-ink-muted">Saldo Ant. (H2):</span>
              <button
                type="button"
                onClick={openInitBalanceModal}
                className="inline-flex items-center gap-1 font-semibold tabular-nums text-[#353b25] underline decoration-dotted hover:text-terracotta"
              >
                {formatPrice(activeMonth.initialBankBalanceCents)}
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Saldo Dinheiro (DNH)
            </span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              Col. O
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-2xl font-bold tabular-nums text-emerald-800">
              {formatPrice(computed.finalCashBalanceCents)}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-xs">
              <span className="text-ink-muted">Saldo Ant. (O2):</span>
              <button
                type="button"
                onClick={openInitBalanceModal}
                className="inline-flex items-center gap-1 font-semibold tabular-nums text-emerald-800 underline decoration-dotted hover:text-terracotta"
              >
                {formatPrice(activeMonth.initialCashBalanceCents)}
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#474f33] bg-[#353b25] p-4 text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e3c785]">
              Disponível Total
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-[#f7f5f0]">
              BCO + DNH
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-2xl font-bold tabular-nums text-white">
              {formatPrice(
                computed.finalBankBalanceCents + computed.finalCashBalanceCents
              )}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-[#f7f5f0]/80">
              <span>
                Ent.:{" "}
                <strong className="text-emerald-300">
                  {formatPrice(
                    computed.totals.pixPJCents + computed.totals.entradasCents
                  )}
                </strong>
              </span>
              <span>
                Saí.:{" "}
                <strong className="text-rose-300">
                  {formatPrice(computed.totals.saidasCents)}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Vendas Totais (Mês)
            </span>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Col. L
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-2xl font-bold tabular-nums text-ink">
              {formatPrice(computed.totals.vendasCents)}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-[11px] text-ink-muted">
              <span>Créd.: {formatPrice(computed.totals.creditCents)}</span>
              <span>Vista: {formatPrice(vistaSumCents)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Pró-Labore Tatá
            </span>
            <span className="rounded bg-[#6b2d38]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6b2d38]">
              Col. I
            </span>
          </div>
          <div className="mt-2">
            <div className="font-display text-2xl font-bold tabular-nums text-[#6b2d38]">
              {formatPrice(computed.totals.proLaboreCents)}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-2 text-xs text-ink-muted">
              <span>Acumulado</span>
              <span className="font-medium text-ink">
                {activeMonth.entries.length} linhas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Atalhos Ágeis, Filtros e Barra de Lançamento Inline */}
      <section className="space-y-3.5 rounded-2xl border border-line bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-daily-sales"
              onClick={openDailySalesModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#353b25] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#474f33]"
            >
              <Calculator className="h-4 w-4 text-[#e3c785]" />
              Fechamento de Vendas do Dia
            </button>

            <button
              type="button"
              id="btn-new-ledger-entry"
              onClick={() => openNewEntryModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-terracotta px-4 py-2 text-xs font-semibold text-white transition hover:bg-terracotta-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Lançamento
            </button>

            <div className="hidden items-center gap-1.5 border-l border-line pl-2 xl:flex">
              <button
                type="button"
                onClick={() => openNewEntryModal("SAIDA_BCO")}
                className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-100"
              >
                - Saída Banco
              </button>
              <button
                type="button"
                onClick={() => openNewEntryModal("LIBERACAO_CARTAO")}
                className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
              >
                + Liberação Cartão
              </button>
              <button
                type="button"
                onClick={() => openNewEntryModal("SAIDA_DNH")}
                className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                - Saída Dinheiro
              </button>
              <button
                type="button"
                onClick={() => openNewEntryModal("PROLABORE")}
                className="rounded-lg bg-[#6b2d38]/10 px-2.5 py-1.5 text-xs font-medium text-[#6b2d38] hover:bg-[#6b2d38]/20"
              >
                Pró-Labore Tatá
              </button>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar histórico, fornecedor..."
                className="w-full rounded-xl border border-line bg-canvas py-1.5 pl-8 pr-3 text-xs focus:border-terracotta focus:outline-none"
              />
            </div>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-terracotta focus:outline-none"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink focus:border-terracotta focus:outline-none"
            >
              <option value="ALL">Todas as Linhas</option>
              <option value="BANK">Apenas Mov. Banco</option>
              <option value="CASH">Apenas Mov. Dinheiro</option>
              <option value="SALES">Apenas Fechamento Vendas</option>
              <option value="PROLABORE">Apenas Pró-Labore Tatá</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterDate("");
                  setFilterType("ALL");
                }}
                className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta/10"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Lançamento Inline Ultra-Rápido */}
        <form
          onSubmit={handleQuickSubmit}
          className="grid grid-cols-1 items-center gap-2 border-t border-line-soft pt-3 sm:grid-cols-12"
        >
          <div className="sm:col-span-2">
            <input
              type="date"
              required
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              className="w-full rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs focus:border-terracotta focus:outline-none"
            />
          </div>
          <div className="sm:col-span-4">
            <input
              type="text"
              list="caixa-historico-presets"
              required
              value={quickHist}
              onChange={(e) => setQuickHist(e.target.value)}
              placeholder="Lançamento rápido: digite o histórico..."
              className="w-full rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs focus:border-terracotta focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="w-full rounded-lg border border-line bg-canvas px-2 py-1.5 text-xs font-medium focus:border-terracotta focus:outline-none"
            >
              <option value="SAIDA_BCO">Saída Banco (Col. G)</option>
              <option value="PIX_PJ">PIX Entrada PJ (Col. D)</option>
              <option value="ENTRADA_BCO">Entrada/Liberação (Col. F)</option>
              <option value="SAIDA_DNH">Saída Dinheiro (Col. N)</option>
              <option value="ENTRADA_DNH">Entrada Dinheiro (Col. M)</option>
              <option value="PROLABORE_BCO">Pró-Labore Tatá (BCO)</option>
              <option value="PROLABORE_DNH">Pró-Labore Tatá (DNH)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              required
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              placeholder="Valor (ex: 450,00)"
              className="w-full rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-right text-xs font-semibold tabular-nums focus:border-terracotta focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingQuick}
              className="w-full rounded-lg bg-[#353b25] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#474f33] disabled:opacity-60"
            >
              {savingQuick ? "Salvando..." : "+ Inserir Linha"}
            </button>
          </div>
        </form>
      </section>

      {/* Tabela Principal (15 colunas fiéis à planilha) */}
      <section className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#353b25]">
              Lançamentos — {activeMonth.label}
            </h2>
            <span className="text-xs text-ink-muted">
              (Cálculo automático em cascata linha a linha)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#353b25]" /> Banco
              (D–H)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />{" "}
              Vendas/Controle (I–L)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-800" />{" "}
              Dinheiro (M–O)
            </span>
          </div>
        </div>

        <div className="max-h-[580px] overflow-auto">
          <table className="w-full border-collapse whitespace-nowrap text-left text-xs">
            <thead className="sticky top-0 z-20 shadow-xs">
              <tr className="bg-[#353b25] text-[11px] uppercase tracking-wider text-white">
                <th className="sticky left-0 z-30 w-24 border-r border-white/10 bg-[#353b25] px-2.5 py-3 font-semibold">
                  Datas
                </th>
                <th className="sticky left-24 z-30 min-w-[210px] border-r border-white/10 bg-[#353b25] px-3 py-3 font-semibold">
                  Histórico
                </th>
                <th className="border-r border-white/10 bg-[#474f33] px-2.5 py-3 text-right font-semibold">
                  PIX Ent. PJ
                </th>
                <th className="border-r border-white/10 bg-stone-700 px-2.5 py-3 text-right font-semibold">
                  Ent. C. Crédito
                </th>
                <th className="border-r border-white/10 bg-[#474f33] px-2.5 py-3 text-right font-semibold">
                  Entradas
                </th>
                <th className="border-r border-white/10 bg-[#96482b] px-2.5 py-3 text-right font-semibold">
                  Saídas
                </th>
                <th className="border-r border-white/20 bg-[#252a19] px-3 py-3 text-right font-bold text-[#e3c785]">
                  Saldo BCO
                </th>
                <th className="border-r border-white/10 bg-[#6b2d38] px-2.5 py-3 text-right font-semibold">
                  Pró-Lab Tata
                </th>
                <th className="border-r border-white/10 bg-stone-700 px-2.5 py-3 text-right font-semibold">
                  PIX/Depósito
                </th>
                <th className="border-r border-white/10 bg-stone-700 px-2.5 py-3 text-right font-semibold">
                  C. Débito
                </th>
                <th className="border-r border-white/10 bg-amber-800 px-2.5 py-3 text-right font-semibold">
                  Vendas
                </th>
                <th className="border-r border-white/10 bg-emerald-900 px-2.5 py-3 text-right font-semibold">
                  Dinh. Entrada
                </th>
                <th className="border-r border-white/10 bg-rose-900 px-2.5 py-3 text-right font-semibold">
                  Dinh. Saída
                </th>
                <th className="border-r border-white/10 bg-emerald-950 px-3 py-3 text-right font-bold text-emerald-300">
                  Dinh. Saldo
                </th>
                <th className="bg-[#353b25] px-2.5 py-3 text-center font-semibold">
                  Ações
                </th>
              </tr>

              {/* Linha Fixa Saldo Anterior (H2 / O2) */}
              <tr className="border-b-2 border-line bg-paper text-xs font-semibold text-ink">
                <td className="sticky left-0 z-20 border-r border-line bg-paper px-2.5 py-2 text-ink-muted">
                  INÍCIO
                </td>
                <td className="sticky left-24 z-20 border-r border-line bg-paper px-3 py-2 text-[11px] uppercase tracking-wide text-[#353b25]">
                  Saldo Anterior Transportado (H2 / O2)
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line bg-[#353b25]/10 px-3 py-2 text-right font-bold tabular-nums text-[#353b25]">
                  {formatPrice(activeMonth.initialBankBalanceCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line-soft px-2.5 py-2 text-right text-ink-muted">
                  —
                </td>
                <td className="border-r border-line bg-emerald-50 px-3 py-2 text-right font-bold tabular-nums text-emerald-900">
                  {formatPrice(activeMonth.initialCashBalanceCents)}
                </td>
                <td className="px-2.5 py-2 text-center">
                  <button
                    type="button"
                    onClick={openInitBalanceModal}
                    className="text-[11px] font-semibold text-[#353b25] underline hover:text-terracotta"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-line-soft bg-card">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={15}
                    className="py-10 text-center text-sm text-ink-muted"
                  >
                    Nenhum lançamento encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const isVendasTotais =
                    r.hist.toLowerCase() === "vendas totais";
                  const isProLabore = r.proLaboreCents > 0;
                  const rowBg = isVendasTotais
                    ? "bg-amber-50/75 font-semibold"
                    : isProLabore
                    ? "bg-[#6b2d38]/[0.04]"
                    : "hover:bg-paper/50";
                  const stickyBg = isVendasTotais ? "bg-amber-50" : "bg-card";

                  return (
                    <tr key={r.id} className={`${rowBg} transition-colors`}>
                      <td
                        className={`sticky left-0 z-10 border-r border-line px-2.5 py-2 tabular-nums text-ink-soft ${stickyBg}`}
                      >
                        {formatISODateBR(r.date)}
                      </td>
                      <td
                        title={r.hist}
                        className={`sticky left-24 z-10 max-w-[240px] truncate border-r border-line px-3 py-2 font-medium text-ink ${stickyBg}`}
                      >
                        {r.hist}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right font-medium tabular-nums text-emerald-700">
                        {formatCellCents(r.pixPJCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right tabular-nums text-ink-soft">
                        {formatCellCents(r.creditCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right font-medium tabular-nums text-emerald-700">
                        {formatCellCents(r.entradasCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right font-medium tabular-nums text-rose-700">
                        {formatCellCents(r.saidasCents)}
                      </td>
                      <td className="border-r border-line bg-[#353b25]/[0.04] px-3 py-2 text-right font-bold tabular-nums text-[#353b25]">
                        {formatPrice(r.saldoBcoCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right font-semibold tabular-nums text-[#6b2d38]">
                        {formatCellCents(r.proLaboreCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right tabular-nums text-ink-soft">
                        {formatCellCents(r.pixDepCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right tabular-nums text-ink-soft">
                        {formatCellCents(r.debitCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right font-bold tabular-nums text-amber-900">
                        {formatCellCents(r.vendasCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right font-medium tabular-nums text-emerald-700">
                        {formatCellCents(r.dnhEntCents)}
                      </td>
                      <td className="border-r border-line-soft px-2.5 py-2 text-right font-medium tabular-nums text-rose-700">
                        {formatCellCents(r.dnhSaiCents)}
                      </td>
                      <td className="border-r border-line bg-emerald-50/60 px-3 py-2 text-right font-bold tabular-nums text-emerald-900">
                        {formatPrice(r.saldoDnhCents)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            title="Editar lançamento"
                            onClick={() => openEditEntryModal(r)}
                            className="rounded p-1 text-ink-soft hover:bg-paper hover:text-[#353b25]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Excluir lançamento"
                            onClick={() => setDeleteTarget(r)}
                            className="rounded p-1 text-ink-muted hover:bg-rose-50 hover:text-rose-700"
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

            <tfoot className="sticky bottom-0 z-10 border-t-2 border-line bg-paper font-bold text-ink">
              <tr>
                <td className="sticky left-0 z-20 border-r border-line bg-paper px-2.5 py-2.5">
                  TOTAIS
                </td>
                <td className="sticky left-24 z-20 border-r border-line bg-paper px-3 py-2.5 text-ink-soft">
                  SOMA DO PERÍODO
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums text-emerald-700">
                  {formatPrice(computed.totals.pixPJCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums">
                  {formatPrice(computed.totals.creditCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums text-emerald-700">
                  {formatPrice(computed.totals.entradasCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums text-rose-700">
                  {formatPrice(computed.totals.saidasCents)}
                </td>
                <td className="border-r border-line bg-[#353b25]/10 px-3 py-2.5 text-right tabular-nums text-[#353b25]">
                  {formatPrice(computed.finalBankBalanceCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums text-[#6b2d38]">
                  {formatPrice(computed.totals.proLaboreCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums">
                  {formatPrice(computed.totals.pixDepCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums">
                  {formatPrice(computed.totals.debitCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums text-amber-900">
                  {formatPrice(computed.totals.vendasCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums text-emerald-700">
                  {formatPrice(computed.totals.dnhEntCents)}
                </td>
                <td className="border-r border-line-soft px-2.5 py-2.5 text-right tabular-nums text-rose-700">
                  {formatPrice(computed.totals.dnhSaiCents)}
                </td>
                <td className="border-r border-line bg-emerald-50 px-3 py-2.5 text-right tabular-nums text-emerald-900">
                  {formatPrice(computed.finalCashBalanceCents)}
                </td>
                <td className="px-2.5 py-2.5 text-center text-ink-muted">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Bloco Inferior: Resumo Contábil & Fechamento do Mês */}
      <section className="space-y-3 pt-1">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#353b25]">
            <span className="inline-block h-5 w-1.5 rounded-full bg-[#c5a059]" />
            Resumo Contábil &amp; Fechamento do Mês
          </h2>
          <p className="text-xs text-ink-muted">
            Conferência de caixa, conciliação bancária (Itaú + Caixa Econômica)
            e consolidação de faturamento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* 1. Resumo Bancário & Conciliação */}
          <div className="space-y-3 rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
              <h3 className="text-xs font-bold uppercase text-[#353b25]">
                1. Resumo Bancário &amp; Conciliação
              </h3>
              <span className="rounded bg-[#353b25]/10 px-2 py-0.5 text-[10px] font-semibold text-[#353b25]">
                H530
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">Saldo Anterior Banco (H2):</span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(activeMonth.initialBankBalanceCents)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">(+) Total PIX Entrada PJ:</span>
                <span className="font-semibold tabular-nums text-emerald-700">
                  {formatPrice(computed.totals.pixPJCents)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">(+) Total Entradas:</span>
                <span className="font-semibold tabular-nums text-emerald-700">
                  {formatPrice(computed.totals.entradasCents)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">(-) Total Saídas Bancárias:</span>
                <span className="font-semibold tabular-nums text-rose-700">
                  {formatPrice(computed.totals.saidasCents)}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-[#353b25]/10 px-3 py-2 text-sm font-bold text-[#353b25]">
                <span>Saldo Calculado Banco:</span>
                <span className="tabular-nums">
                  {formatPrice(computed.finalBankBalanceCents)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-line pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Conferência Extratos Bancários
              </p>

              <div className="flex items-center justify-between gap-2 text-xs">
                <label className="font-medium text-ink-soft">
                  Saldo Caixa Econômica Federal:
                </label>
                <input
                  type="text"
                  value={cefInput}
                  onChange={(e) => setCefInput(e.target.value)}
                  onBlur={saveReconciliation}
                  className="w-32 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-right font-semibold tabular-nums focus:border-terracotta focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <label className="font-medium text-ink-soft">
                  Saldo Banco Itaú:
                </label>
                <input
                  type="text"
                  value={itauInput}
                  onChange={(e) => setItauInput(e.target.value)}
                  onBlur={saveReconciliation}
                  className="w-32 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-right font-semibold tabular-nums focus:border-terracotta focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-semibold text-ink-soft">
                  Saldo Real Bancos (CEF + Itaú):
                </span>
                <span className="font-bold tabular-nums text-ink">
                  {formatPrice(realBanksCents)}
                </span>
              </div>

              <div
                className={`flex items-center justify-between rounded-xl p-2.5 text-xs font-bold ${
                  Math.abs(reconcileDiffCents) < 1
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                <span>Diferença de Conciliação:</span>
                <span className="tabular-nums">
                  {formatPrice(reconcileDiffCents)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Resumo Dinheiro Físico & Pró-Labore */}
          <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-line bg-card p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
                <h3 className="text-xs font-bold uppercase text-emerald-900">
                  2. Resumo Dinheiro Físico
                </h3>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  O530
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">
                    Saldo Anterior Dinheiro (O2):
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(activeMonth.initialCashBalanceCents)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">
                    (+) Total Entradas Dinheiro:
                  </span>
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {formatPrice(computed.totals.dnhEntCents)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted">
                    (-) Total Saídas Dinheiro:
                  </span>
                  <span className="font-semibold tabular-nums text-rose-700">
                    {formatPrice(computed.totals.dnhSaiCents)}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
                  <span>Saldo Atual Dinheiro:</span>
                  <span className="tabular-nums">
                    {formatPrice(computed.finalCashBalanceCents)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-line pt-3">
              <div className="flex items-center justify-between rounded-xl bg-[#6b2d38]/10 p-2.5 text-xs font-bold text-[#6b2d38]">
                <span>Total Pró-Labore Tatá (Col. I):</span>
                <span className="text-sm tabular-nums">
                  {formatPrice(computed.totals.proLaboreCents)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#353b25] p-3 text-xs font-bold text-white">
                <span className="uppercase tracking-wide text-[#e3c785]">
                  Saldo Total Geral (BCO + DNH):
                </span>
                <span className="text-base tabular-nums">
                  {formatPrice(
                    computed.finalBankBalanceCents +
                      computed.finalCashBalanceCents
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Consolidado de Vendas */}
          <div className="space-y-3 rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between border-b border-line-soft pb-2.5">
              <h3 className="text-xs font-bold uppercase text-amber-900">
                3. Consolidado de Vendas do Mês
              </h3>
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                Faturamento
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-ink-soft">
                  Vendas Cartão de Crédito (Col. E):
                </span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(computed.totals.creditCents)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-soft">
                  Vendas à Vista Débito (Col. K):
                </span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(computed.totals.debitCents)}
                </span>
              </div>
              <div className="flex justify-between rounded-lg bg-paper px-2.5 py-1.5 font-semibold text-ink">
                <span>Subtotal Cartões (Créd. + Déb.):</span>
                <span className="tabular-nums">
                  {formatPrice(subtotalCardsCents)}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-2">
                <span className="text-ink-soft">
                  Vendas à Vista Dinheiro (Vendas DNH):
                </span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(computed.totals.salesCashOnlyCents)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-soft">
                  Vendas PIX / Depósito (Col. J):
                </span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(computed.totals.pixDepCents)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-soft">
                  PIX PJ Recebidos (Col. D):
                </span>
                <span className="font-semibold tabular-nums">
                  {formatPrice(computed.totals.pixPJCents)}
                </span>
              </div>

              <div className="space-y-1.5 border-t border-line pt-2">
                <div className="flex justify-between rounded-xl border border-amber-300/60 bg-amber-100/80 px-3 py-2 text-sm font-bold text-amber-950">
                  <span>Vendas Totais (Col. L):</span>
                  <span className="tabular-nums">
                    {formatPrice(computed.totals.vendasCents)}
                  </span>
                </div>
                <div className="flex justify-between px-2 text-[11px] text-ink-muted">
                  <span>Soma Modalidades (Créd+Déb+DNH+PIX):</span>
                  <span className="font-semibold tabular-nums">
                    {formatPrice(sumSalesCheckCents)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Datalist dos históricos frequentes do diVino */}
      <datalist id="caixa-historico-presets">
        {HISTORICO_PRESETS.map((preset) => (
          <option key={preset} value={preset} />
        ))}
      </datalist>

      {/* MODAL 1: FECHAMENTO DE VENDAS DO DIA */}
      {dailySalesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
            <div className="flex items-center justify-between bg-[#353b25] px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">
                  Fechamento de Vendas do Dia
                </h3>
                <p className="text-xs text-white/75">
                  Insere automaticamente as 5 linhas padrão da planilha
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDailySalesOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDailySalesSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-soft">
                  Data do Fechamento
                </label>
                <input
                  type="date"
                  required
                  value={dsDate}
                  onChange={(e) => setDsDate(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-soft">
                    Vendas Crédito (Col. E)
                  </label>
                  <input
                    type="text"
                    value={dsCredit}
                    onChange={(e) => setDsCredit(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-right text-sm font-semibold tabular-nums focus:border-terracotta focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-soft">
                    Vendas Débito (Col. K)
                  </label>
                  <input
                    type="text"
                    value={dsDebit}
                    onChange={(e) => setDsDebit(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-right text-sm font-semibold tabular-nums focus:border-terracotta focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-soft">
                    Vendas Dinheiro (Col. M)
                  </label>
                  <input
                    type="text"
                    value={dsCash}
                    onChange={(e) => setDsCash(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-right text-sm font-semibold tabular-nums focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-soft">
                    PIX / Depósito (Col. J)
                  </label>
                  <input
                    type="text"
                    value={dsPix}
                    onChange={(e) => setDsPix(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-right text-sm font-semibold tabular-nums focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <div>
                  <span className="block text-xs font-bold uppercase text-amber-900">
                    Vendas Totais (Col. L)
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Soma automática das 4 modalidades
                  </span>
                </div>
                <span className="text-lg font-bold tabular-nums text-amber-950">
                  {formatPrice(dsTotalPreviewCents)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDailySalesOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDS}
                  className="rounded-xl bg-[#353b25] px-5 py-2 text-xs font-semibold text-white hover:bg-[#474f33] disabled:opacity-60"
                >
                  {savingDS ? "Salvando..." : "Lançar Fechamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NOVO / EDITAR LANÇAMENTO COMPLETO */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
            <div className="flex items-center justify-between bg-[#353b25] px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">
                  {editingEntryId
                    ? "Editar Lançamento"
                    : "Novo Lançamento no Caixa"}
                </h3>
                <p className="text-xs text-white/75">
                  Preencha os campos correspondentes às colunas da planilha
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEntryModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleEntrySubmit}
              className="space-y-4 overflow-y-auto p-5"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-soft">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={eDate}
                    onChange={(e) => setEDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-ink-soft">
                    Histórico / Descrição
                  </label>
                  <input
                    type="text"
                    list="caixa-historico-presets"
                    required
                    value={eHist}
                    onChange={(e) => setEHist(e.target.value)}
                    placeholder="Ex: Verdemar PIX QrCode Itaú"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5 rounded-xl border border-[#353b25]/20 bg-[#353b25]/5 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#353b25]">
                  Movimentação Bancária (Afeta Saldo BCO — Col. H)
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">
                      PIX Entrada PJ (Col. D)
                    </label>
                    <input
                      type="text"
                      value={ePixPJ}
                      onChange={(e) => setEPixPJ(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">
                      Entradas / Liberações (Col. F)
                    </label>
                    <input
                      type="text"
                      value={eEntradas}
                      onChange={(e) => setEEntradas(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-rose-700">
                      Saídas Banco (Col. G)
                    </label>
                    <input
                      type="text"
                      value={eSaidas}
                      onChange={(e) => setESaidas(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Dinheiro Físico (Afeta Saldo DNH — Col. O)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-emerald-800">
                      Dinh. Entrada (Col. M)
                    </label>
                    <input
                      type="text"
                      value={eDnhEnt}
                      onChange={(e) => setEDnhEnt(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-rose-700">
                      Dinh. Saída (Col. N)
                    </label>
                    <input
                      type="text"
                      value={eDnhSai}
                      onChange={(e) => setEDnhSai(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 rounded-xl border border-line bg-paper/40 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Colunas de Controle &amp; Pró-Labore
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#6b2d38]">
                      Pró-Lab Tata (I)
                    </label>
                    <input
                      type="text"
                      value={eProLabore}
                      onChange={(e) => setEProLabore(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">
                      C. Crédito (E)
                    </label>
                    <input
                      type="text"
                      value={eCredit}
                      onChange={(e) => setECredit(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">
                      PIX/Depós. (J)
                    </label>
                    <input
                      type="text"
                      value={ePixDep}
                      onChange={(e) => setEPixDep(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">
                      C. Débito (K)
                    </label>
                    <input
                      type="text"
                      value={eDebit}
                      onChange={(e) => setEDebit(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-amber-900">
                      Vendas Tot. (L)
                    </label>
                    <input
                      type="text"
                      value={eVendas}
                      onChange={(e) => setEVendas(e.target.value)}
                      placeholder="0,00"
                      className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-right text-sm tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEntry}
                  className="rounded-xl bg-terracotta px-5 py-2 text-xs font-semibold text-white hover:bg-terracotta-dark disabled:opacity-60"
                >
                  {savingEntry ? "Salvando..." : "Salvar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR SALDOS INICIAIS (H2 / O2) */}
      {initModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
            <div className="flex items-center justify-between bg-[#353b25] px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">Saldos Iniciais do Mês</h3>
                <p className="text-xs text-white/75">
                  Define o ponto de partida (H2 e O2) para todas as fórmulas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInitModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleInitBalanceSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-soft">
                  Saldo Anterior Banco — Coluna H (H2)
                </label>
                <input
                  type="text"
                  required
                  value={initBcoStr}
                  onChange={(e) => setInitBcoStr(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-right text-sm font-bold tabular-nums text-[#353b25]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-soft">
                  Saldo Anterior Dinheiro — Coluna O (O2)
                </label>
                <input
                  type="text"
                  required
                  value={initDnhStr}
                  onChange={(e) => setInitDnhStr(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-right text-sm font-bold tabular-nums text-emerald-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInitModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingInit}
                  className="rounded-xl bg-[#353b25] px-5 py-2 text-xs font-semibold text-white hover:bg-[#474f33]"
                >
                  {savingInit ? "Atualizando..." : "Atualizar Saldos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NOVO MÊS */}
      {newMonthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
            <div className="flex items-center justify-between bg-[#353b25] px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">Abrir Novo Mês de Caixa</h3>
                <p className="text-xs text-white/75">
                  Transporta automaticamente o fechamento do mês atual
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewMonthOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewMonth} className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-soft">
                    Mês
                  </label>
                  <select
                    value={nmMonth}
                    onChange={(e) => setNmMonth(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                  >
                    {Object.entries(MONTH_NAMES_PT).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-soft">
                    Ano
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2045}
                    required
                    value={nmYear}
                    onChange={(e) => setNmYear(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-paper/60 p-3.5 text-xs">
                <p className="font-bold uppercase tracking-wide text-[#353b25]">
                  Saldos Transportados de {activeMonth.label}:
                </p>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Novo Saldo Ant. Banco (H2):</span>
                  <span className="font-bold tabular-nums text-[#353b25]">
                    {formatPrice(computed.finalBankBalanceCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Novo Saldo Ant. Dinheiro (O2):</span>
                  <span className="font-bold tabular-nums text-emerald-800">
                    {formatPrice(computed.finalCashBalanceCents)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewMonthOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingMonth}
                  className="rounded-xl bg-[#c5a059] px-5 py-2 text-xs font-bold text-[#252a19] hover:bg-[#d9b875]"
                >
                  {creatingMonth ? "Criando..." : "Criar Aba do Mês"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRMAR EXCLUSÃO */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-card p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">
                  Excluir Lançamento?
                </h4>
                <p className="mt-1 text-xs text-ink-soft">
                  {formatISODateBR(deleteTarget.date)} — &ldquo;
                  {deleteTarget.hist}&rdquo;. Os saldos seguintes serão
                  recalculados automaticamente.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-ink-soft hover:bg-paper"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg ${
            toast.type === "err" ? "bg-rose-700" : "bg-[#353b25]"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-[#e3c785]" />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
