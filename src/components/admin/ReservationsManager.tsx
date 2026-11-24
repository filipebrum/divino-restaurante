"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import {
  Check,
  X,
  CheckCheck,
  Trash2,
  Plus,
  Search,
  Phone,
  Users,
  Clock,
  Loader2,
} from "lucide-react";
import {
  RESERVATION_OCCASIONS,
  RESERVATION_SLOTS,
  RESERVATION_STATUS_LABELS,
} from "@/lib/constants";
import { formatDateTimeBR } from "@/lib/format";

export interface ReservationRow {
  id: string;
  confirmationCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  partySize: number;
  dateTime: string;
  occasion: string | null;
  status: string;
  notes: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-olive/15 text-olive",
  COMPLETED: "bg-paper text-ink-soft",
  CANCELLED: "bg-red-100 text-red-800",
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function ReservationsManager({
  initialReservations,
  needsClientFetch = false,
}: {
  initialReservations: ReservationRow[];
  needsClientFetch?: boolean;
}) {
  const [reservations, setReservations] =
    useState<ReservationRow[]>(initialReservations);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Novo agendamento manual pela equipe
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState(todayISO);
  const [time, setTime] = useState("19:30");
  const [occasion, setOccasion] = useState("Refeição casual");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsClientFetch) return;
    adminFetch("/api/reservations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.reservations) setReservations(data.reservations);
      })
      .catch(() => {});
  }, [needsClientFetch]);

  const counts = useMemo(() => {
    const map = { ALL: reservations.length, PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
    for (const r of reservations) {
      if (r.status in map) {
        map[r.status as keyof typeof map] += 1;
      }
    }
    return map;
  }, [reservations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservations.filter((r) => {
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchesQuery =
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.confirmationCode.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [reservations, statusFilter, search]);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: data.reservation.status } : r
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteReservation(id: string) {
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleManualCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);
    try {
      const res = await adminFetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          partySize,
          date,
          time,
          occasion,
          notes,
          status: "CONFIRMED",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Erro ao registrar reserva.");
        return;
      }
      setReservations((prev) =>
        [data.reservation, ...prev].sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        )
      );
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      setShowCreateForm(false);
    } catch {
      setFormError("Erro de conexão.");
    } finally {
      setCreating(false);
    }
  }

  const allSlots = [...RESERVATION_SLOTS.almoco, ...RESERVATION_SLOTS.jantar];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            Recepção & Salão
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">
            Gestão de Reservas
          </h1>
        </div>

        <button
          type="button"
          id="admin-new-reservation-btn"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-terracotta"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? "Fechar Formulário" : "Nova Reserva Manual"}
        </button>
      </div>

      {/* Formulário rápido para reserva por telefone/balcão */}
      {showCreateForm && (
        <form
          onSubmit={handleManualCreate}
          className="rounded-2xl border border-line bg-card p-6 space-y-4"
        >
          <h2 className="font-display text-2xl font-semibold text-ink">
            Registrar Reserva (Telefone / WhatsApp)
          </h2>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Cliente *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome completo"
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">
                WhatsApp / Telefone *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Pessoas
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Horário
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              >
                {allSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted">
                Ocasião
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              >
                {RESERVATION_OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-ink-muted">
                Observações
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mesa preferida, restrições, cadeira infantil..."
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-canvas hover:bg-terracotta-dark disabled:opacity-60"
            >
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salvar como Confirmada
            </button>
          </div>
        </form>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["ALL", "Todas"],
              ["PENDING", "Pendentes"],
              ["CONFIRMED", "Confirmadas"],
              ["COMPLETED", "Concluídas"],
              ["CANCELLED", "Canceladas"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === key
                  ? "bg-ink text-canvas"
                  : "bg-paper text-ink-soft hover:text-ink"
              }`}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, telefone ou código..."
            className="w-full rounded-full border border-line bg-canvas py-2 pl-10 pr-4 text-sm focus:border-terracotta focus:outline-none"
          />
        </div>
      </div>

      {/* Lista de Reservas */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-12 text-center text-sm text-ink-muted">
          Nenhuma reserva encontrada com os filtros atuais.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-terracotta-dark">
                    {res.confirmationCode}
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-ink">
                    {res.customerName}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      STATUS_STYLES[res.status] ?? "bg-paper text-ink"
                    }`}
                  >
                    {RESERVATION_STATUS_LABELS[res.status] ?? res.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-terracotta" />
                    {formatDateTimeBR(res.dateTime)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-terracotta" />
                    {res.partySize}{" "}
                    {res.partySize === 1 ? "pessoa" : "pessoas"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-terracotta" />
                    {res.customerPhone}
                  </span>
                  {res.occasion && (
                    <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px]">
                      {res.occasion}
                    </span>
                  )}
                </div>

                {res.notes && (
                  <p className="text-xs text-ink-muted">Obs.: {res.notes}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {res.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={busyId === res.id}
                    onClick={() => updateStatus(res.id, "CONFIRMED")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-olive px-3.5 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirmar
                  </button>
                )}
                {res.status === "CONFIRMED" && (
                  <button
                    type="button"
                    disabled={busyId === res.id}
                    onClick={() => updateStatus(res.id, "COMPLETED")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-canvas transition-colors hover:bg-terracotta disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Concluir
                  </button>
                )}
                {(res.status === "PENDING" || res.status === "CONFIRMED") && (
                  <button
                    type="button"
                    disabled={busyId === res.id}
                    onClick={() => updateStatus(res.id, "CANCELLED")}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Excluir reserva ${res.confirmationCode}`}
                  disabled={busyId === res.id}
                  onClick={() => deleteReservation(res.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
