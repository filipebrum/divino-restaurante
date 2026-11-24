export const RESERVATION_SLOTS = {
  almoco: ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00"],
  jantar: ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"],
} as const;

export const RESERVATION_OCCASIONS = [
  "Refeição casual",
  "Aniversário",
  "Jantar romântico",
  "Almoço em família",
  "Reunião corporativa",
  "Confraternização",
] as const;

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export const INCOME_CATEGORIES = [
  "Salão / Mesas",
  "Delivery & Retirada",
  "Eventos & Reservas",
  "Bebidas & Bar",
  "Outros Recebimentos",
] as const;

export const EXPENSE_CATEGORIES = [
  "Insumos & Mercado",
  "Bebidas & Estoque",
  "Equipe & Folha",
  "Aluguel & Condomínio",
  "Energia, Água & Gás",
  "Impostos & Taxas",
  "Manutenção & Limpeza",
  "Marketing & Sistema",
  "Outras Despesas",
] as const;

export const PAYMENT_METHODS = [
  { value: "PIX", label: "PIX" },
  { value: "CREDITO", label: "Cartão de Crédito" },
  { value: "DEBITO", label: "Cartão de Débito" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferência" },
] as const;

export const FINANCIAL_STATUS_LABELS: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
};

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateReservationCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `DIV-${digits}`;
}
