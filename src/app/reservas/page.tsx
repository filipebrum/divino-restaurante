import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Users, ShieldCheck } from "lucide-react";
import { ReservationForm } from "@/components/ReservationForm";

export const metadata: Metadata = {
  title: "Reservas de Mesas",
  description:
    "Reserve sua mesa no Divino Restaurante online. Escolha a data, horário de almoço ou jantar e receba seu código de acompanhamento na hora.",
};

export default function ReservasPage() {
  return (
    <div className="bg-canvas pb-20 pt-10 text-ink sm:pt-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-terracotta"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Voltar ao início
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
                Reservas Online
              </p>
              <h1 className="mt-2 font-display text-5xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
                Reserve sua mesa no Divino.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                Escolha o melhor horário para almoço ou jantar. Sua solicitação
                entra imediatamente no painel da nossa equipe de recepção.
              </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-line bg-paper/60 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Informações da Casa
              </h2>

              <ul className="space-y-4 text-sm text-ink-soft">
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  <span>
                    <strong className="font-semibold text-ink">
                      Tolerância de 15 minutos
                    </strong>{" "}
                    após o horário agendado. Caso atrase, avise nossa equipe.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  <span>
                    <strong className="font-semibold text-ink">
                      Grupos e celebrações:
                    </strong>{" "}
                    atendemos reservas de até 20 pessoas online; para eventos
                    privativos, deixe uma observação.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                  <span>
                    <strong className="font-semibold text-ink">
                      Sem taxa de reserva:
                    </strong>{" "}
                    solicite em segundos e acompanhe com seu código exclusivo.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ReservationForm />
          </div>
        </div>
      </div>
    </div>
  );
}
