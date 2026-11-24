import Link from "next/link";
import { ArrowRight, Clock, MapPin, UtensilsCrossed, CalendarClock, Sparkles } from "lucide-react";
import { getFeaturedItems, getMenuCategories } from "@/lib/menu";
import { formatPrice, parseTags } from "@/lib/format";
import { DigitalMenuExplorer } from "@/components/DigitalMenuExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredItems, categories] = await Promise.all([
    getFeaturedItems(),
    getMenuCategories(),
  ]);

  return (
    <div className="bg-canvas text-ink">
      {/* Hero Editorial */}
      <section className="editorial-texture border-b border-line/80">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
              Cozinha Brasileira Contemporânea
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.06] tracking-[-0.02em] text-ink sm:text-6xl lg:text-[4.25rem]">
              Sabores artesanais preparados para celebrar à mesa.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              No Divino Restaurante, ingredientes frescos da estação encontram o
              tempo certo do fogo lento. Explore nosso cardápio digital atualizado
              e descubra entradas, cortes na brasa, risotos e sobremesas da casa.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/reservas"
                id="hero-cta-reservas"
                className="inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-canvas transition-all hover:bg-terracotta"
              >
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Reservar Mesa
              </Link>
              <Link
                href="/cardapio"
                id="hero-cta-cardapio"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-terracotta hover:text-terracotta"
              >
                <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
                Explorar Cardápio
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Quadro Editorial de Destaque */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-line bg-card p-7 shadow-[0_18px_45px_-28px_rgba(31,25,20,0.22)] sm:p-9">
              <div className="flex items-center justify-between border-b border-line-soft pb-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  Sugestão do Chef
                </span>
                <span className="font-display text-sm italic text-terracotta">
                  Temporada Atual
                </span>
              </div>

              <div className="mt-6 space-y-5">
                {featuredItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-line-soft pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-display text-xl font-semibold text-ink">
                        {item.name}
                      </h2>
                      <span className="shrink-0 font-display text-lg font-semibold text-terracotta-dark">
                        {formatPrice(item.priceCents)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center justify-between rounded-2xl bg-paper/80 px-4 py-3.5 text-xs text-ink-soft">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <Clock className="h-4 w-4 text-terracotta" aria-hidden="true" />
                  Aberto de Terça a Domingo
                </span>
                <span>Almoço & Jantar</span>
              </div>
            </div>
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
              className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
            >
              Destaques da Cozinha
            </h2>
          </div>
          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
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
                className="flex flex-col justify-between rounded-2xl border border-line bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-terracotta/40"
              >
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    {item.categoryName}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-semibold leading-snug text-ink">
                    {item.name}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-4">
                  <span className="font-display text-xl font-semibold text-terracotta-dark">
                    {formatPrice(item.priceCents)}
                  </span>
                  {tags[0] && (
                    <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
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
        className="border-y border-line/80 bg-paper/40 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              Cardápio Digital
            </p>
            <h2
              id="cardapio-home-heading"
              className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
            >
              Sabores para cada momento do dia
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
              Filtre por categoria, restrições alimentares ou busque seu prato
              favorito. Os itens abaixo são servidos diretamente do banco de
              dados do sistema e prontos para receber o cardápio real da casa.
            </p>
          </div>

          <div className="mt-10">
            <DigitalMenuExplorer categories={categories} />
          </div>
        </div>
      </section>

      {/* A Casa & Serviços */}
      <section
        id="a-casa"
        aria-labelledby="a-casa-heading"
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              A Casa
            </p>
            <h2
              id="a-casa-heading"
              className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl"
            >
              Hospitalidade pensada nos detalhes.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Do almoço tranquilo em família ao jantar comemorativo, o Divino
              Restaurante une ingredientes selecionados, serviço atencioso e
              ambiente acolhedor.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
            <div className="rounded-2xl border border-line bg-card p-6">
              <Sparkles
                className="h-5 w-5 text-terracotta"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
                Ingredientes da Estação
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Produção diária com caldos naturais, cortes selecionados e
                opções vegetarianas e sem glúten bem sinalizadas no cardápio.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <CalendarClock
                className="h-5 w-5 text-terracotta"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
                Reservas & Eventos
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Estrutura preparada para receber grupos, jantares corporativos e
                celebrações com reserva online imediata e código de
                acompanhamento.
              </p>
              <Link
                href="/reservas"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-terracotta transition-colors hover:text-terracotta-dark"
              >
                Solicitar reserva
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Horários & Localização */}
      <section
        id="horarios"
        aria-labelledby="horarios-heading"
        className="border-t border-line/80 bg-card py-16 sm:py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              Visite-nos
            </p>
            <h2
              id="horarios-heading"
              className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl"
            >
              Horários & Localização
            </h2>
          </div>

          <div className="space-y-2 text-sm text-ink-soft">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Clock className="h-4 w-4 text-terracotta" aria-hidden="true" />
              Horário de Funcionamento
            </div>
            <p>Terça a Sexta: 11h30 – 15h00 · 18h30 – 23h00</p>
            <p>Sábados e Domingos: 11h30 – 23h00</p>
            <p className="text-xs text-ink-muted">Segunda-feira: Fechado</p>
          </div>

          <div className="space-y-2 text-sm text-ink-soft">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <MapPin className="h-4 w-4 text-terracotta" aria-hidden="true" />
              Endereço & Atendimento
            </div>
            <p>
              Atualize aqui com o endereço, link do Google Maps e WhatsApp
              oficiais do Divino Restaurante.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
