import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  MapPin,
  ArrowUpRight,
  Lock,
  Wine,
  Car,
  PawPrint,
} from "lucide-react";

const VINNERO_URL = "https://app.vinnero.com.br";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Avenida+Quinta+Avenida+739+Vale+do+Sol+Nova+Lima+MG";

export function SiteFooter() {
  return (
    <footer className="border-t border-gold/30 bg-forest text-card">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Coluna da Marca */}
          <div className="md:col-span-5">
            <Link
              href="/"
              aria-label="diVino Restaurante — Início"
              className="inline-flex rounded-xl bg-card px-4 py-2.5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
            >
              <Image
                src="/images/divino-logo.png"
                alt="diVino Restaurante"
                width={160}
                height={70}
                className="h-12 w-auto object-contain"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-card/85">
              Gastronomia autoral, fogo lento e hospitalidade entre as montanhas
              do Vale do Sol. Integrante da Associação dos Restaurantes da Boa
              Lembrança desde 2012.
            </p>

            <div className="mt-5 flex items-start gap-2.5 text-sm text-card/85">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                aria-hidden="true"
              />
              <div>
                <p>Av. Quinta Avenida, 739 – Vale do Sol, Nova Lima/MG</p>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gold transition-colors duration-300 hover:text-card"
                >
                  Abrir rota no Google Maps
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Coluna de Horários e Diferenciais */}
          <div className="md:col-span-4">
            <h2 className="font-display text-xl font-medium text-card">
              Horários &amp; Comodidades
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-card/85">
              <li className="flex items-start gap-2.5">
                <Clock
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p>
                    <strong className="font-semibold text-card">
                      Quarta a Sexta:
                    </strong>{" "}
                    18h30 às 23h00
                    <span className="block text-xs text-card/75">
                      Sexta também almoço: 12h00 às 15h30
                    </span>
                  </p>
                  <p>
                    <strong className="font-semibold text-card">Sábados:</strong>{" "}
                    12h00 às 16h00 · 19h00 às 23h00
                  </p>
                  <p>
                    <strong className="font-semibold text-card">
                      Domingos e Feriados:
                    </strong>{" "}
                    12h00 às 16h30
                  </p>
                  <p className="text-xs text-card/70">
                    Segunda e Terça: Fechado
                  </p>
                </div>
              </li>
            </ul>

            <div className="mt-5 flex flex-wrap gap-3 border-t border-card/15 pt-4 text-xs text-card/80">
              <span className="inline-flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Estacionamento no local
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PawPrint className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Pet-friendly na área externa
              </span>
            </div>
          </div>

          {/* Coluna de Navegação */}
          <div className="md:col-span-3">
            <h2 className="font-display text-xl font-medium text-card">
              Navegação
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-card/85">
              <li>
                <Link
                  href="/"
                  className="transition-colors duration-300 hover:text-gold"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/cardapio"
                  className="transition-colors duration-300 hover:text-gold"
                >
                  Cardápio Digital
                </Link>
              </li>
              <li>
                <a
                  href={VINNERO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors duration-300 hover:text-gold"
                >
                  <Wine className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                  Carta de Vinhos (Vinnero)
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
                </a>
              </li>
              <li>
                <Link
                  href="/reservas"
                  className="transition-colors duration-300 hover:text-gold"
                >
                  Reservas Online
                </Link>
              </li>
              <li className="pt-2 border-t border-card/15">
                <Link
                  href="/admin"
                  id="footer-admin-link"
                  className="inline-flex items-center gap-1.5 text-xs text-card/65 transition-colors duration-300 hover:text-gold"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Área Interna
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-card/15 pt-6 text-center text-xs text-card/75 sm:text-left">
          <p>
            © 2027 diVino Restaurante. Todos os direitos reservados. •
            Desenvolvido por Vinnero Web Design
          </p>
        </div>
      </div>
    </footer>
  );
}
