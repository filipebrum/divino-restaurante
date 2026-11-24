export interface CashLedgerEntryDTO {
  id: string;
  monthId: string;
  date: string; // YYYY-MM-DD
  hist: string;
  pixPJCents: number;
  creditCents: number;
  entradasCents: number;
  saidasCents: number;
  proLaboreCents: number;
  pixDepCents: number;
  debitCents: number;
  vendasCents: number;
  dnhEntCents: number;
  dnhSaiCents: number;
  sortOrder: number;
}

export interface CashLedgerMonthDTO {
  id: string;
  monthKey: string; // YYYY-MM
  label: string;
  initialBankBalanceCents: number;
  initialCashBalanceCents: number;
  reconcileCefCents: number;
  reconcileItauCents: number;
  entries: CashLedgerEntryDTO[];
}

export interface CashLedgerMonthSummary {
  id: string;
  monthKey: string;
  label: string;
}

export interface ComputedCashLedgerRow extends CashLedgerEntryDTO {
  saldoBcoCents: number;
  saldoDnhCents: number;
}

export interface ComputedCashLedger {
  rows: ComputedCashLedgerRow[];
  totals: {
    pixPJCents: number;
    creditCents: number;
    entradasCents: number;
    saidasCents: number;
    proLaboreCents: number;
    pixDepCents: number;
    debitCents: number;
    vendasCents: number;
    dnhEntCents: number;
    dnhSaiCents: number;
    salesCashOnlyCents: number;
  };
  finalBankBalanceCents: number;
  finalCashBalanceCents: number;
}

export const MONTH_NAMES_PT: Record<string, string> = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Março",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro",
};

export const HISTORICO_PRESETS = [
  "Vendas Crédito",
  "Vendas Débito",
  "Vendas Dinheiro",
  "PIX/Depósito",
  "Vendas Totais",
  "Liberação Cartões Rede Itaú",
  "PIX Cliente",
  "Verdemar PIX QrCode Itaú",
  "Hortisul PIX QrCode Itaú",
  "Plena Alimentos",
  "HMF Representação de Alimento",
  "Pro Labore TATA",
  "Caixinha",
  "Aporte DNH",
  "Compras DNH",
  "CEMIG Energia Itaú",
  "COPASA Água Itaú",
  "Tarifa Bancária Itaú",
  "DAS Simples Nacional",
  "FGTS / Folha Pagamento",
] as const;

export function monthKeyToLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const name = MONTH_NAMES_PT[m] ?? m;
  return `${name} ${y}`;
}

export function formatCellCents(cents: number): string {
  if (Math.abs(cents) < 1) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInputCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Aceita valores negativos (ex.: saldo bancário negativo) e formato PT-BR
export function parseSignedBRLToCents(raw: string | number | null | undefined): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? Math.round(raw * 100) : 0;
  }
  if (!raw) return 0;
  let cleaned = String(raw).replace(/[R$\s]/g, "").trim();
  if (!cleaned) return 0;
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? Math.round(num * 100) : 0;
}

export function computeCashLedger(month: CashLedgerMonthDTO): ComputedCashLedger {
  let runningBank = month.initialBankBalanceCents;
  let runningCash = month.initialCashBalanceCents;

  const totals = {
    pixPJCents: 0,
    creditCents: 0,
    entradasCents: 0,
    saidasCents: 0,
    proLaboreCents: 0,
    pixDepCents: 0,
    debitCents: 0,
    vendasCents: 0,
    dnhEntCents: 0,
    dnhSaiCents: 0,
    salesCashOnlyCents: 0,
  };

  const sorted = [...month.entries].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.sortOrder - b.sortOrder;
  });

  const rows: ComputedCashLedgerRow[] = sorted.map((entry) => {
    // FÓRMULA COLUNA H: Saldo_BCO_Anterior + PIX_Entrada_PJ + ENTRADAS - SAÍDAS
    runningBank =
      runningBank + entry.pixPJCents + entry.entradasCents - entry.saidasCents;

    // FÓRMULA COLUNA O: Dinh_Saldo_Anterior + Dinh_Entrada - Dinh_Saída
    runningCash = runningCash + entry.dnhEntCents - entry.dnhSaiCents;

    totals.pixPJCents += entry.pixPJCents;
    totals.creditCents += entry.creditCents;
    totals.entradasCents += entry.entradasCents;
    totals.saidasCents += entry.saidasCents;
    totals.proLaboreCents += entry.proLaboreCents;
    totals.pixDepCents += entry.pixDepCents;
    totals.debitCents += entry.debitCents;
    totals.vendasCents += entry.vendasCents;
    totals.dnhEntCents += entry.dnhEntCents;
    totals.dnhSaiCents += entry.dnhSaiCents;

    if (entry.hist.toLowerCase().includes("vendas dinheiro")) {
      totals.salesCashOnlyCents += entry.dnhEntCents;
    }

    return {
      ...entry,
      saldoBcoCents: runningBank,
      saldoDnhCents: runningCash,
    };
  });

  return {
    rows,
    totals,
    finalBankBalanceCents: runningBank,
    finalCashBalanceCents: runningCash,
  };
}
