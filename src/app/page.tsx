import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  MapPin,
  UtensilsCrossed,
  CalendarClock,
  Trees,
  Award,
  Wine,
  Car,
  PawPrint,
} from "lucide-react";
import { getFeaturedItems, getMenuCategories } from "@/lib/menu";
import { formatPrice, parseTags } from "@/lib/format";
import { DigitalMenuExplorer } from "@/components/DigitalMenuExplorer";

const VINNERO_URL = "https://app.vinnero.com.br";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Avenida+Quinta+Avenida+739+Vale+do+Sol+Nova+Lima+MG";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredItems, categories] = await Promise.all([
    getFeaturedItems(),
    getMenuCategories(),
  ]);

  return (
    <div className="bg-canvas text-ink">
      {/* Hero Editorial — Vale do Sol */}
      <section className="editorial-texture border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-12 lg:gap-14 lg:py-24">
          <div className="lg:col-span-6">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              <span
                aria-hidden="true"
                className="h-px w-6 bg-gold"
              />
              Vale do Sol • Nova Lima, MG
            </p>

            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.015em] text-forest sm:text-5xl lg:text-[3.5rem]">
              Gastronomia autoral, fogo lento e hospitalidade entre as
              montanhas.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              No diVino Restaurante, ingredientes frescos da estação e receitas
              afetivas ganham vida em um refúgio cercado pela natureza, com mais
              de uma década de tradição na Associação dos Restaurantes da Boa
              Lembrança.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/reservas"
                id="hero-cta-reservas"
                className="inline-flex items-center gap-2.5 rounded-xl bg-forest px-7 py-3.5 text-sm font-semibold text-card shadow-[0_12px_28px_-12px_rgba(43,58,44,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-terracotta"
              >
                <CalendarClock className="h-4 w-4 text-gold" aria-hidden="true" />
                Reservar Mesa
              </Link>

              <Link
                href="/cardapio"
                id="hero-cta-cardapio"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-6 py-3.5 text-sm font-semibold text-forest transition-all duration-300 hover:-translate-y-0.5 hover:border-terracotta hover:text-terracotta"
              >
                <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                Explorar Cardápio
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 text-xs font-medium text-ink-muted">
              <span className="inline-flex items-center gap-2">
                <Award className="h-4 w-4 text-terracotta" aria-hidden="true" />
                Boa Lembrança desde 2012
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-terracotta" aria-hidden="true" />
                Quarta a Domingo · Almoço &amp; Jantar
              </span>
            </div>
          </div>

          {/* Composição Fotográfica Editorial */}
          <div className="lg:col-span-6">
            <figure className="overflow-hidden rounded-xl border border-line bg-card p-2.5 shadow-[0_24px_56px_-28px_rgba(43,58,44,0.3)] sm:p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src="/images/hero-table.jpg"
                  alt="Mesa artesanal em madeira de demolição no diVino Restaurante com prato em cerâmica artesanal e vista para as montanhas do Vale do Sol"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
              <figcaption className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-3.5 text-xs text-ink-soft">
                <span className="font-display text-base font-medium text-forest">
                  Cozinha de Estação &amp; Cerâmica Artesanal
                </span>
                <a
                  href={VINNERO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-terracotta transition-colors duration-300 hover:text-forest"
                >
                  <Wine className="h-3.5 w-3.5" aria-hidden="true" />
                  Carta de Vinhos Vinnero
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Destaques da Cozinha */}
      <section
        aria-labelledby="destaques-heading"
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-22"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              Seleção da Casa
            </p>
            <h2
              id="destaques-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight text-forest sm:text-5xl"
            >
              Destaques da Cozinha
            </h2>
          </div>

          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 text-sm font-semibold text-terracotta transition-colors duration-300 hover:text-forest"
          >
            Ver página exclusiva do cardápio
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredItems.map((item) => {
            const tags = parseTags(item.tags);
            return (
              <article
                key={item.id}
                className="group flex flex-col justify-between rounded-xl border border-line bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/80 hover:shadow-[0_16px_36px_-18px_rgba(43,58,44,0.18)]"
              >
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    {item.categoryName}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-semibold leading-snug text-ink transition-colors duration-300 group-hover:text-terracotta">
                    {item.name}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-2 border-t border-line-soft pt-4">
                  <span className="font-sans text-base font-semibold tabular-nums text-terracotta">
                    {formatPrice(item.priceCents)}
                  </span>
                  {tags[0] && (
                    <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                      {tags[0]}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Cardápio Digital Completo na Home */}
      <section
        id="cardapio"
        aria-labelledby="cardapio-home-heading"
        className="border-y border-line bg-paper/65 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              Cardápio da Casa
            </p>
            <h2
              id="cardapio-home-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight text-forest sm:text-5xl"
            >
              Sabores para Cada Momento à Mesa
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
              Navegue pelos pratos autorais da nossa cozinha, filtre por
              categoria ou restrições alimentares e descubra a harmonização
              ideal em nossa Carta de Vinhos Digital.
            </p>
          </div>

          <div className="mt-10">
            <DigitalMenuExplorer categories={categories} />
          </div>
        </div>
      </section>

      {/* A Casa — 3 Pilares */}
      <section
        id="a-casa"
        aria-labelledby="a-casa-heading"
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            A Casa
          </p>
          <h2
            id="a-casa-heading"
            className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-forest sm:text-5xl"
          >
            Tradição, Natureza e Hospitalidade no Vale do Sol
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
            Cada detalhe do diVino Restaurante foi concebido para transformar o
            almoço ou jantar em uma pausa serena entre as montanhas de Nova
            Lima.
          </p>
        </div>

        {/* Fotografia Editorial do Salão */}
        <figure className="mt-10 overflow-hidden rounded-xl border border-line bg-card p-2.5 shadow-[0_20px_48px_-28px_rgba(43,58,44,0.26)] sm:p-3">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg sm:aspect-[21/9]">
            <Image
              src="/images/casa-ambience.jpg"
              alt="Salão intimista em madeira de demolição do diVino Restaurante com cerâmicas pintadas à mão e vista para a área verde do Vale do Sol"
              fill
              sizes="(max-width: 1280px) 100vw, 1152px"
              className="object-cover"
            />
          </div>
        </figure>

        {/* 3 Pilares */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <article className="flex flex-col justify-between rounded-xl border border-line bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/80 hover:shadow-[0_14px_34px_-16px_rgba(43,58,44,0.16)]">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-forest/10 text-forest">
                <Trees className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-forest">
                O Refúgio no Vale do Sol
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Salão intimista em madeira de demolição, iluminação acolhedora e
                clima bucólico na Avenida Quinta Avenida, 739 — ideal tanto para
                almoços ensolarados em família quanto para jantares especiais.
              </p>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-xl border border-line bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/80 hover:shadow-[0_14px_34px_-16px_rgba(43,58,44,0.16)]">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
                <Award className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-forest">
                Tradição Boa Lembrança
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Integrante orgulhoso da Associação dos Restaurantes da Boa
                Lembrança desde 2012, celebrando a alta gastronomia brasileira
                com pratos exclusivos e cerâmicas pintadas à mão.
              </p>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-xl border border-line bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/80 hover:shadow-[0_14px_34px_-16px_rgba(43,58,44,0.16)]">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-forest/10 text-forest">
                <Wine className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-forest">
                Adega &amp; Harmonização
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Uma curadoria de vinhos pensada para acompanhar cada estação do
                cardápio, com consulta interativa pela plataforma Vinnero.
              </p>
            </div>

            <a
              href={VINNERO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta transition-colors duration-300 hover:text-forest"
            >
              Consultar Carta no Vinnero
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </article>
        </div>
      </section>

      {/* Horários & Localização */}
      <section
        id="horarios"
        aria-labelledby="horarios-heading"
        className="border-t border-line bg-card py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              Visite-nos
            </p>
            <h2
              id="horarios-heading"
              className="mt-2 font-display text-3xl font-semibold tracking-tight text-forest sm:text-5xl"
            >
              Horários &amp; Localização
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {/* Endereço Oficial */}
            <div className="flex flex-col justify-between rounded-xl border border-line bg-canvas p-6 sm:p-7">
              <div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-forest">
                  <MapPin
                    className="h-4 w-4 shrink-0 text-terracotta"
                    aria-hidden="true"
                  />
                  Endereço Oficial
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  Avenida Quinta Avenida, 739 – Vale do Sol, Nova Lima – MG, CEP
                  34000-000
                </p>
              </div>

              <a
                id="home-google-maps-cta"
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-card transition-all duration-300 hover:bg-terracotta"
              >
                Traçar Rota no Google Maps
                <ArrowUpRight className="h-4 w-4 text-gold" aria-hidden="true" />
              </a>
            </div>

            {/* Horários de Funcionamento */}
            <div className="rounded-xl border border-line bg-canvas p-6 sm:p-7">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-forest">
                <Clock
                  className="h-4 w-4 shrink-0 text-terracotta"
                  aria-hidden="true"
                />
                Horários de Funcionamento
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
                <li>
                  <strong className="font-semibold text-ink">
                    Quarta a Sexta:
                  </strong>{" "}
                  18h30 às 23h00 (Sexta também almoço: 12h00 às 15h30)
                </li>
                <li>
                  <strong className="font-semibold text-ink">Sábados:</strong>{" "}
                  12h00 às 16h00 · 19h00 às 23h00
                </li>
                <li>
                  <strong className="font-semibold text-ink">
                    Domingos e Feriados:
                  </strong>{" "}
                  12h00 às 16h30
                </li>
                <li className="border-t border-line-soft pt-2.5 text-xs font-medium text-ink-muted">
                  Segunda e Terça: Fechado
                </li>
              </ul>
            </div>

            {/* Diferenciais */}
            <div className="flex flex-col justify-between rounded-xl border border-line bg-canvas p-6 sm:p-7">
              <div>
                <div className="flex items-center gap-2.5 text-sm font-semibold text-forest">
                  <Trees
                    className="h-4 w-4 shrink-0 text-terracotta"
                    aria-hidden="true"
                  />
                  Diferenciais da Casa
                </div>
                <ul className="mt-4 space-y-3.5 text-sm text-ink-soft">
                  <li className="flex items-start gap-2.5">
                    <Car
                      className="mt-0.5 h-4 w-4 shrink-0 text-terracotta"
                      aria-hidden="true"
                    />
                    <span>Estacionamento fácil no local</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <PawPrint
                      className="mt-0.5 h-4 w-4 shrink-0 text-terracotta"
                      aria-hidden="true"
                    />
                    <span>Ambiente pet-friendly na área externa</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/reservas"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-forest/25 bg-card px-5 py-3 text-sm font-semibold text-forest transition-all duration-300 hover:border-terracotta hover:text-terracotta"
              >
                Reservar Mesa Online
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
