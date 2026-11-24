"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Search,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  RESERVATION_OCCASIONS,
  RESERVATION_SLOTS,
  RESERVATION_STATUS_LABELS,
} from "@/lib/constants";
import { formatDateTimeBR } from "@/lib/format";

interface CreatedReservation {
  id: string;
  confirmationCode: string;
  customerName: string;
  partySize: number;
  dateTime: string;
  occasion: string | null;
  status: string;
  notes: string | null;
}

function getDefaultDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ReservationForm() {
  const [mode, setMode] = useState<"create" | "lookup">("create");

  // Formulário de nova reserva
  const [date, setDate] = useState<string>(getDefaultDate);
  const [time, setTime] = useState<string>("19:30");
  const [partySize, setPartySize] = useState<number>(2);
  const [occasion, setOccasion] = useState<string>("Refeição casual");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<CreatedReservation | null>(null);

  // Consulta por código
  const [lookupCode, setLookupCode] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<CreatedReservation | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          partySize,
          date,
          time,
          occasion,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar sua reserva.");
        return;
      }

      setConfirmed(data.reservation);
    } catch {
      setError("Erro de conexão ao registrar a reserva. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);
    if (!lookupCode.trim()) return;

    setLookupLoading(true);
    try {
      const res = await fetch(
        `/api/reservations?code=${encodeURIComponent(lookupCode.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "Reserva não encontrada.");
        return;
      }
      setLookupResult(data.reservation);
    } catch {
      setLookupError("Erro ao consultar reserva.");
    } finally {
      setLookupLoading(false);
    }
  }

  function resetForm() {
    setConfirmed(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    setError(null);
  }

  return (
    <div className="rounded-3xl border border-line bg-card p-6 shadow-[0_14px_38px_-24px_rgba(31,25,20,0.18)] sm:p-9">
      {/* Alternador Nova Reserva / Consultar */}
      <div className="flex flex-wrap gap-2 border-b border-line-soft pb-5">
        <button
          type="button"
          id="reservation-mode-create"
          onClick={() => setMode("create")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
            mode === "create"
              ? "bg-ink text-canvas"
              : "bg-paper text-ink-soft hover:text-ink"
          }`}
        >
          Solicitar Reserva
        </button>
        <button
          type="button"
          id="reservation-mode-lookup"
          onClick={() => setMode("lookup")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
            mode === "lookup"
              ? "bg-ink text-canvas"
              : "bg-paper text-ink-soft hover:text-ink"
          }`}
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          Consultar Código
        </button>
      </div>

      {mode === "lookup" ? (
        <div className="mt-7 space-y-6">
          <p className="text-sm leading-relaxed text-ink-soft">
            Já realizou uma reserva? Digite o código recebido (ex:{" "}
            <strong className="font-semibold text-ink">DIV-1024</strong>) para
            acompanhar o status.
          </p>

          <form onSubmit={handleLookup} className="flex flex-col gap-3 sm:flex-row">
            <input
              id="lookup-code-input"
              type="text"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
              placeholder="Ex.: DIV-1024"
              className="flex-1 rounded-xl border border-line bg-canvas px-4 py-3 text-sm uppercase tracking-wider text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-muted focus:border-terracotta focus:outline-none"
            />
            <button
              type="submit"
              id="lookup-submit-btn"
              disabled={lookupLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-terracotta disabled:opacity-60"
            >
              {lookupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Consultar
            </button>
          </form>

          {lookupError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div className="rounded-2xl border border-line bg-paper/50 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-terracotta-dark">
                  {lookupResult.confirmationCode}
                </span>
                <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-ink border border-line">
                  {RESERVATION_STATUS_LABELS[lookupResult.status] ??
                    lookupResult.status}
                </span>
              </div>
              <p className="font-display text-2xl font-semibold text-ink">
                {lookupResult.customerName}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
                <span>{formatDateTimeBR(lookupResult.dateTime)}</span>
                <span>•</span>
                <span>
                  {lookupResult.partySize}{" "}
                  {lookupResult.partySize === 1 ? "pessoa" : "pessoas"}
                </span>
                {lookupResult.occasion && (
                  <>
                    <span>•</span>
                    <span>{lookupResult.occasion}</span>
                  </>
                )}
              </div>
              {lookupResult.notes && (
                <p className="text-xs text-ink-muted">
                  Observações: {lookupResult.notes}
                </p>
              )}
            </div>
          )}
        </div>
      ) : confirmed ? (
        <div className="mt-7 space-y-6">
          <div className="flex items-start gap-4 rounded-2xl border border-olive/30 bg-olive/10 p-5">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-olive" />
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Solicitação de reserva registrada!
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Guarde o seu código abaixo. Nossa equipe confirma a mesa em
                instantes pelo WhatsApp informado.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-canvas p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  Código da Reserva
                </p>
                <p
                  id="reservation-confirmation-code"
                  className="mt-1 font-mono text-2xl font-bold tracking-wider text-terracotta-dark"
                >
                  {confirmed.confirmationCode}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3.5 py-1 text-xs font-semibold text-amber-900">
                {RESERVATION_STATUS_LABELS[confirmed.status] ?? confirmed.status}
              </span>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink-muted">Nome</dt>
                <dd className="font-medium text-ink">{confirmed.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Data e Horário</dt>
                <dd className="font-medium text-ink">
                  {formatDateTimeBR(confirmed.dateTime)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Lugares</dt>
                <dd className="font-medium text-ink">
                  {confirmed.partySize}{" "}
                  {confirmed.partySize === 1 ? "pessoa" : "pessoas"}
                </dd>
              </div>
              {confirmed.occasion && (
                <div>
                  <dt className="text-xs text-ink-muted">Ocasião</dt>
                  <dd className="font-medium text-ink">{confirmed.occasion}</dd>
                </div>
              )}
            </dl>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center rounded-full border border-line px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            Fazer outra reserva
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Data e Pessoas */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="res-date"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
              >
                <Calendar className="h-3.5 w-3.5 text-terracotta" />
                Data
              </label>
              <input
                id="res-date"
                type="date"
                required
                min={getDefaultDate()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="res-party-size"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
              >
                <Users className="h-3.5 w-3.5 text-terracotta" />
                Número de pessoas
              </label>
              <select
                id="res-party-size"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink focus:border-terracotta focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((size) => (
                  <option key={size} value={size}>
                    {size} {size === 1 ? "pessoa" : "pessoas"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Horários Almoço & Jantar */}
          <div className="space-y-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
              <Clock className="h-3.5 w-3.5 text-terracotta" />
              Horário desejado
            </span>

            <div className="space-y-3 rounded-2xl border border-line-soft bg-canvas/70 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                  Almoço
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RESERVATION_SLOTS.almoco.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                        time === slot
                          ? "border-terracotta bg-terracotta text-canvas"
                          : "border-line bg-card text-ink-soft hover:border-terracotta/50 hover:text-ink"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                  Jantar
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RESERVATION_SLOTS.jantar.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                        time === slot
                          ? "border-terracotta bg-terracotta text-canvas"
                          : "border-line bg-card text-ink-soft hover:border-terracotta/50 hover:text-ink"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ocasião */}
          <div>
            <label
              htmlFor="res-occasion"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
            >
              <Sparkles className="h-3.5 w-3.5 text-terracotta" />
              Ocasião (opcional)
            </label>
            <select
              id="res-occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink focus:border-terracotta focus:outline-none"
            >
              {RESERVATION_OCCASIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Dados do Cliente */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="res-name"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
              >
                Nome completo *
              </label>
              <input
                id="res-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Como devemos chamar você?"
                className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="res-phone"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
              >
                WhatsApp / Telefone *
              </label>
              <input
                id="res-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="res-email"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
              >
                E-mail (opcional)
              </label>
              <input
                id="res-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="voce@email.com"
                className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="res-notes"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted"
            >
              Preferências ou restrições alimentares (opcional)
            </label>
            <textarea
              id="res-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: cadeira infantil, alergia alimentar, mesa próxima à janela..."
              className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-terracotta focus:outline-none"
            />
          </div>

          <button
            type="submit"
            id="res-submit-btn"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-canvas transition-all hover:bg-terracotta disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando reserva...
              </>
            ) : (
              "Confirmar Solicitação de Reserva"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
