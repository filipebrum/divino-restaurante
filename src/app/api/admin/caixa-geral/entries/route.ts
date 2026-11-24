import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { monthKeyToLabel } from "@/lib/cash-ledger";

const entryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  hist: z.string().trim().min(1, "Informe o histórico."),
  pixPJCents: z.coerce.number().int().default(0),
  creditCents: z.coerce.number().int().default(0),
  entradasCents: z.coerce.number().int().default(0),
  saidasCents: z.coerce.number().int().default(0),
  proLaboreCents: z.coerce.number().int().default(0),
  pixDepCents: z.coerce.number().int().default(0),
  debitCents: z.coerce.number().int().default(0),
  vendasCents: z.coerce.number().int().default(0),
  dnhEntCents: z.coerce.number().int().default(0),
  dnhSaiCents: z.coerce.number().int().default(0),
});

const postBodySchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  entries: z.array(entryInputSchema).min(1).max(100),
});

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const normalized = Array.isArray(body.entries)
      ? body
      : { monthKey: body.monthKey, entries: [body] };
    const parsed = postBodySchema.safeParse(normalized);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados do lançamento inválidos." },
        { status: 400 }
      );
    }

    const firstDate = parsed.data.entries[0].date;
    const targetMonthKey = parsed.data.monthKey || firstDate.slice(0, 7);

    let month = await prisma.cashLedgerMonth.findUnique({
      where: { monthKey: targetMonthKey },
    });

    if (!month) {
      month = await prisma.cashLedgerMonth.create({
        data: {
          monthKey: targetMonthKey,
          label: monthKeyToLabel(targetMonthKey),
        },
      });
    }

    const maxOrder = await prisma.cashLedgerEntry.aggregate({
      where: { monthId: month.id },
      _max: { sortOrder: true },
    });
    const baseOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    await prisma.cashLedgerEntry.createMany({
      data: parsed.data.entries.map((e, idx) => ({
        monthId: month.id,
        date: e.date,
        hist: e.hist,
        pixPJCents: e.pixPJCents,
        creditCents: e.creditCents,
        entradasCents: e.entradasCents,
        saidasCents: e.saidasCents,
        proLaboreCents: e.proLaboreCents,
        pixDepCents: e.pixDepCents,
        debitCents: e.debitCents,
        vendasCents: e.vendasCents,
        dnhEntCents: e.dnhEntCents,
        dnhSaiCents: e.dnhSaiCents,
        sortOrder: baseOrder + idx,
      })),
    });

    return NextResponse.json(
      { ok: true, count: parsed.data.entries.length, monthKey: month.monthKey },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao inserir lançamentos no Caixa Geral:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o lançamento." },
      { status: 500 }
    );
  }
}
