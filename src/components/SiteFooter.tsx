import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Phone, Lock } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper/70 text-ink">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="inline-block">
              <Image
                src="/images/divino-logo.png"
                alt="diVino Restaurante"
                width={170}
                height={75}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              Cozinha brasileira contemporânea, hospitalidade acolhedora e
              ingredientes frescos selecionados todos os dias.
            </p>
          </div>

          <div className="md:col-span-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Funcionamento & Endereço
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>
                  Terça a Domingo: 11h30 às 15h30 e 18h30 às 23h00
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>Endereço a personalizar com os dados oficiais da casa</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>WhatsApp & Telefone de atendimento</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Navegação
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
              <li>
                <Link href="/" className="transition-colors hover:text-terracotta">
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/cardapio"
                  className="transition-colors hover:text-terracotta"
                >
                  Cardápio Digital
                </Link>
              </li>
              <li>
                <Link
                  href="/reservas"
                  className="transition-colors hover:text-terracotta"
                >
                  Reservas de Mesas
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  id="footer-admin-link"
                  className="inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-terracotta"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Área Interna (Equipe)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-xs text-ink-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Divino Restaurante. Todos os direitos reservados.</p>
          <p>Sistema integrado de site, cardápio digital, reservas e gestão.</p>
        </div>
      </div>
    </footer>
  );
}
