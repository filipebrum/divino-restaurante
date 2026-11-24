"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  UtensilsCrossed,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  ReceiptText,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatDateBR, formatDateTimeBR, formatPrice } from "@/lib/format";
import { RESERVATION_STATUS_LABELS } from "@/lib/constants";

export interface OverviewData {
  paidIncome: number;
  paidExpense: number;
  netBalance: number;
  pendingPayable: number;
  pendingReceivable: number;
  pendingReservationsCount: number;
  activeItemsCount: number;
  totalItemsCount: number;
  upcomingReservations: Array<{
    id: string;
    confirmationCode: string;
    customerName: string;
    partySize: number;
    dateTime: string;
    status: string;
  }>;
  recentEntries: Array<{
    id: string;
    type: string;
    category: string;
    description: string;
    amountCents: number;
    occurredAt: string;
    status: string;
  }>;
}

const EMPTY_OVERVIEW: OverviewData = {
  paidIncome: 0,
  paidExpense: 0,
  netBalance: 0,
  pendingPayable: 0,
  pendingReceivable: 0,
  pendingReservationsCount: 0,
  activeItemsCount: 0,
  totalItemsCount: 0,
  upcomingReservations: [],
  recentEntries: [],
};

export function AdminOverviewClient({
  initialData,
}: {
  initialData: OverviewData | null;
}) {
  const [data, setData] = useState<OverviewData>(initialData ?? EMPTY_OVERVIEW);

  useEffect(() => {
    if (initialData) return;
    let active = true;
    adminFetch("/api/admin/overview")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) setData(json);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            Sistema Interno · diVino Restaurante
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">
            Visão Geral
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/fechamento-mesas"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-terracotta"
          >
            <ReceiptText className="h-3.5 w-3.5" />
            Fechamento de Mesas
          </Link>
          <Link
            href="/admin/caixa-geral"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            <Wallet className="h-3.5 w-3.5" />
            Caixa Geral
          </Link>
          <Link
            href="/admin/reservas"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Reservas
          </Link>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Saldo Realizado (Mês)</span>
            <Wallet className="h-4 w-4 text-terracotta" />
          </div>
          <p
            className={`mt-3 font-display text-3xl font-semibold ${
              data.netBalance >= 0 ? "text-olive" : "text-red-700"
            }`}
          >
            {formatPrice(data.netBalance)}
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            Entradas: {formatPrice(data.paidIncome)} · Saídas:{" "}
            {formatPrice(data.paidExpense)}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Contas a Pagar</span>
            <TrendingDown className="h-4 w-4 text-amber-700" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {formatPrice(data.pendingPayable)}
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            A receber no mês: {formatPrice(data.pendingReceivable)}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Reservas Pendentes</span>
            <Clock className="h-4 w-4 text-terracotta" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {data.pendingReservationsCount}
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            {data.upcomingReservations.length} próximas reservas ativas
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Cardápio Digital</span>
            <UtensilsCrossed className="h-4 w-4 text-olive" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {data.activeItemsCount}{" "}
            <span className="text-base font-normal text-ink-muted">
              / {data.totalItemsCount}
            </span>
          </p>
          <p className="mt-1.5 text-xs text-ink-muted">
            Itens disponíveis aos clientes
          </p>
        </div>
      </div>

      {/* Dois blocos principais */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center justify-between border-b border-line-soft pb-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Próximas Reservas
            </h2>
            <Link
              href="/admin/reservas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {data.upcomingReservations.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Nenhuma reserva futura registrada.
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {data.upcomingReservations.map((res) => (
                <li
                  key={res.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">
                        {res.customerName}
                      </span>
                      <span className="font-mono text-[11px] text-ink-muted">
                        {res.confirmationCode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {formatDateTimeBR(res.dateTime)} · {res.partySize}{" "}
                      {res.partySize === 1 ? "pessoa" : "pessoas"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      res.status === "CONFIRMED"
                        ? "bg-olive/15 text-olive"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {RESERVATION_STATUS_LABELS[res.status] ?? res.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center justify-between border-b border-line-soft pb-4">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Últimos Lançamentos
            </h2>
            <Link
              href="/admin/financeiro"
              className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
            >
              Abrir financeiro
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {data.recentEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Nenhum lançamento financeiro registrado.
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {data.recentEntries.map((entry) => {
                const isIncome = entry.type === "INCOME";
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {entry.description}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {entry.category} · {formatDateBR(entry.occurredAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`flex items-center justify-end gap-1 text-sm font-semibold ${
                          isIncome ? "text-olive" : "text-terracotta-dark"
                        }`}
                      >
                        {isIncome ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {isIncome ? "+" : "-"}
                        {formatPrice(entry.amountCents)}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {entry.status === "PAID" ? "Pago" : "Pendente"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
