import { parseCurrencyToCents } from "@/lib/format";

export interface TableClosingDTO {
  id: string;
  turnDate: string; // YYYY-MM-DD
  tableId: string;
  subtotalCents: number;
  serviceCents: number;
  manualService: boolean;
  discountCents: number;
  tipCents: number;
  creditCents: number;
  debitCents: number;
  pixCents: number;
  cashCents: number;
  othersCents: number;
  notes: string | null;
}

export interface ComputedTableClosing extends TableClosingDTO {
  totalWithServiceCents: number;
  totalWithoutServiceCents: number;
  expectedTotalCents: number;
  totalPaidCents: number;
  balanceCents: number;
}

export interface TableClosingTotals {
  count: number;
  subtotalCents: number;
  serviceCents: number;
  discountCents: number;
  tipCents: number;
  totalWithServiceCents: number;
  totalWithoutServiceCents: number;
  creditCents: number;
  debitCents: number;
  pixCents: number;
  cashCents: number;
  othersCents: number;
  totalPaidCents: number;
  balanceCents: number;
}

export function computeTableClosingMetrics(
  row: TableClosingDTO
): ComputedTableClosing {
  const totalWithServiceCents = Math.max(
    0,
    row.subtotalCents + row.serviceCents - row.discountCents
  );
  const totalWithoutServiceCents = Math.max(
    0,
    row.subtotalCents - row.discountCents
  );
  const expectedTotalCents = totalWithServiceCents + row.tipCents;
  const totalPaidCents =
    row.creditCents +
    row.debitCents +
    row.pixCents +
    row.cashCents +
    row.othersCents;
  const balanceCents = totalPaidCents - expectedTotalCents;

  return {
    ...row,
    totalWithServiceCents,
    totalWithoutServiceCents,
    expectedTotalCents,
    totalPaidCents,
    balanceCents,
  };
}

export function aggregateTableClosings(
  rows: ComputedTableClosing[]
): TableClosingTotals {
  return rows.reduce<TableClosingTotals>(
    (acc, curr) => {
      acc.count += 1;
      acc.subtotalCents += curr.subtotalCents;
      acc.serviceCents += curr.serviceCents;
      acc.discountCents += curr.discountCents;
      acc.tipCents += curr.tipCents;
      acc.totalWithServiceCents += curr.totalWithServiceCents;
      acc.totalWithoutServiceCents += curr.totalWithoutServiceCents;
      acc.creditCents += curr.creditCents;
      acc.debitCents += curr.debitCents;
      acc.pixCents += curr.pixCents;
      acc.cashCents += curr.cashCents;
      acc.othersCents += curr.othersCents;
      acc.totalPaidCents += curr.totalPaidCents;
      acc.balanceCents += curr.balanceCents;
      return acc;
    },
    {
      count: 0,
      subtotalCents: 0,
      serviceCents: 0,
      discountCents: 0,
      tipCents: 0,
      totalWithServiceCents: 0,
      totalWithoutServiceCents: 0,
      creditCents: 0,
      debitCents: 0,
      pixCents: 0,
      cashCents: 0,
      othersCents: 0,
      totalPaidCents: 0,
      balanceCents: 0,
    }
  );
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftISODate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

// Retorna os 7 dias (Segunda a Domingo) da semana que contém isoDate
export function getWeekDates(isoDate: string): string[] {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
  const dayOfWeek = dt.getDay(); // 0 = Dom, 1 = Seg ... 6 = Sáb
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(dt);
  monday.setDate(dt.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    return toISODate(current);
  });
}

export function formatWeekdayShortBR(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(dt);
}

export function formatISODateBR(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export interface ParsedCSVClosingRow {
  turnDate: string;
  tableId: string;
  subtotalCents: number;
  serviceCents: number;
  manualService: boolean;
  discountCents: number;
  tipCents: number;
  creditCents: number;
  debitCents: number;
  pixCents: number;
  cashCents: number;
  othersCents: number;
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseFlexibleDate(raw: string, fallbackDate: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  return fallbackDate;
}

export function parseTableClosingCSV(
  text: string,
  defaultTurnDate: string
): { rows: ParsedCSVClosingRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rawLines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length < 2) {
    return {
      rows: [],
      warnings: ["O arquivo CSV precisa conter o cabeçalho e ao menos uma linha de dados."],
    };
  }

  // Detecta delimitador dominante no cabeçalho (';' no padrão BR ou ',')
  const headerLine = rawLines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = semicolonCount >= commaCount ? ";" : ",";

  const headers = parseCSVLine(headerLine, delimiter).map(normalizeHeader);

  const findCol = (patterns: RegExp[]): number =>
    headers.findIndex((h) => patterns.some((re) => re.test(h)));

  const colDate = findCol([/^data\b/, /\bturno\b/]);
  const colTable = findCol([/mesa/, /comanda/, /identific/, /^nome$/]);
  const colSubtotal = findCol([/subtotal/, /consumo/, /bruto/, /^valor$/]);
  const colService = findCol([/servico/, /^10\b/, /taxa/]);
  const colDiscount = findCol([/desconto/, /isencao/, /abatimento/]);
  const colTip = findCol([/caixinha/, /gorjeta/, /tip/]);
  const colCredit = findCol([/credito/, /credit/]);
  const colDebit = findCol([/debito/, /debit/]);
  const colPix = findCol([/\bpix\b/]);
  const colCash = findCol([/dinheiro/, /especie/, /cash/]);
  const colOthers = findCol([/outros/, /voucher/, /vale/]);

  if (colTable === -1 && colSubtotal === -1) {
    return {
      rows: [],
      warnings: [
        "Não foi possível reconhecer as colunas do CSV. Use colunas como 'Mesa/Comanda' e 'Subtotal (R$)'.",
      ],
    };
  }

  const rows: ParsedCSVClosingRow[] = [];

  for (let i = 1; i < rawLines.length; i += 1) {
    const cols = parseCSVLine(rawLines[i], delimiter);
    const tableRaw = colTable >= 0 ? cols[colTable] ?? "" : `Mesa ${i}`;

    // Ignora linha de rodapé "Totais" caso usuário importe planilha com totalizador
    if (/^totais\b|^total\b/i.test(tableRaw.trim())) {
      continue;
    }

    const subtotalCents =
      colSubtotal >= 0 ? parseCurrencyToCents(cols[colSubtotal] ?? "") : 0;

    if (!tableRaw.trim() && subtotalCents === 0) {
      continue;
    }

    const hasServiceCol = colService >= 0 && (cols[colService] ?? "").trim() !== "";
    const autoService = Math.round(subtotalCents * 0.1);
    const serviceCents = hasServiceCol
      ? parseCurrencyToCents(cols[colService] ?? "")
      : autoService;

    const discountCents =
      colDiscount >= 0 ? parseCurrencyToCents(cols[colDiscount] ?? "") : 0;
    const tipCents = colTip >= 0 ? parseCurrencyToCents(cols[colTip] ?? "") : 0;
    const creditCents =
      colCredit >= 0 ? parseCurrencyToCents(cols[colCredit] ?? "") : 0;
    const debitCents =
      colDebit >= 0 ? parseCurrencyToCents(cols[colDebit] ?? "") : 0;
    const pixCents = colPix >= 0 ? parseCurrencyToCents(cols[colPix] ?? "") : 0;
    const cashCents =
      colCash >= 0 ? parseCurrencyToCents(cols[colCash] ?? "") : 0;
    const othersCents =
      colOthers >= 0 ? parseCurrencyToCents(cols[colOthers] ?? "") : 0;

    const turnDate =
      colDate >= 0 && cols[colDate]
        ? parseFlexibleDate(cols[colDate], defaultTurnDate)
        : defaultTurnDate;

    rows.push({
      turnDate,
      tableId: tableRaw.trim() || `Mesa ${i}`,
      subtotalCents,
      serviceCents,
      manualService: hasServiceCol && Math.abs(serviceCents - autoService) > 1,
      discountCents,
      tipCents,
      creditCents,
      debitCents,
      pixCents,
      cashCents,
      othersCents,
    });
  }

  if (rows.length === 0) {
    warnings.push("Nenhuma linha válida de mesa foi encontrada no arquivo CSV.");
  }

  return { rows, warnings };
}

export function buildTableClosingCSV(
  rows: ComputedTableClosing[],
  includeDateColumn = false
): string {
  const headers = [
    ...(includeDateColumn ? ["Data"] : []),
    "Mesa/Comanda",
    "Subtotal (R$)",
    "Serviço 10% (R$)",
    "Desconto (R$)",
    "Caixinha (R$)",
    "Total c/ 10% (R$)",
    "Total s/ 10% (R$)",
    "Crédito (R$)",
    "Débito (R$)",
    "PIX (R$)",
    "Dinheiro (R$)",
    "Outros (R$)",
    "Total Pago (R$)",
    "Diferença (R$)",
  ];

  const fmt = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

  const csvRows = [headers.join(";")];
  for (const item of rows) {
    const line = [
      ...(includeDateColumn ? [formatISODateBR(item.turnDate)] : []),
      `"${item.tableId.replace(/"/g, '""')}"`,
      fmt(item.subtotalCents),
      fmt(item.serviceCents),
      fmt(item.discountCents),
      fmt(item.tipCents),
      fmt(item.totalWithServiceCents),
      fmt(item.totalWithoutServiceCents),
      fmt(item.creditCents),
      fmt(item.debitCents),
      fmt(item.pixCents),
      fmt(item.cashCents),
      fmt(item.othersCents),
      fmt(item.totalPaidCents),
      fmt(item.balanceCents),
    ];
    csvRows.push(line.join(";"));
  }

  return "\uFEFF" + csvRows.join("\n");
}
