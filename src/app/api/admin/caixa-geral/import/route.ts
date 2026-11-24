import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { monthKeyToLabel } from "@/lib/cash-ledger";

const importedRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hist: z.string().trim().min(1),
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

const importBodySchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  initialBankBalanceCents: z.coerce.number().int().nullable().optional(),
  initialCashBalanceCents: z.coerce.number().int().nullable().optional(),
  replaceMonth: z.boolean().optional().default(true),
  entries: z.array(importedRowSchema).min(1).max(2000),
});

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = importBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Planilha inválida." },
        { status: 400 }
      );
    }

    const {
      monthKey,
      initialBankBalanceCents,
      initialCashBalanceCents,
      replaceMonth,
      entries,
    } = parsed.data;

    await prisma.$transaction(async (tx) => {
      let month = await tx.cashLedgerMonth.findUnique({ where: { monthKey } });
      if (!month) {
        month = await tx.cashLedgerMonth.create({
          data: {
            monthKey,
            label: monthKeyToLabel(monthKey),
            initialBankBalanceCents: initialBankBalanceCents ?? 0,
            initialCashBalanceCents: initialCashBalanceCents ?? 0,
          },
        });
      } else {
        const updateFields: Record<string, number> = {};
        if (initialBankBalanceCents !== null && initialBankBalanceCents !== undefined) {
          updateFields.initialBankBalanceCents = initialBankBalanceCents;
        }
        if (initialCashBalanceCents !== null && initialCashBalanceCents !== undefined) {
          updateFields.initialCashBalanceCents = initialCashBalanceCents;
        }
        if (Object.keys(updateFields).length > 0) {
          await tx.cashLedgerMonth.update({
            where: { id: month.id },
            data: updateFields,
          });
        }
      }

      let baseOrder = 1;
      if (replaceMonth) {
        await tx.cashLedgerEntry.deleteMany({ where: { monthId: month.id } });
      } else {
        const maxOrder = await tx.cashLedgerEntry.aggregate({
          where: { monthId: month.id },
          _max: { sortOrder: true },
        });
        baseOrder = (maxOrder._max.sortOrder ?? 0) + 1;
      }

      await tx.cashLedgerEntry.createMany({
        data: entries.map((e, idx) => ({
          monthId: month.id,
          ...e,
          sortOrder: baseOrder + idx,
        })),
      });
    });

    return NextResponse.json({ importedCount: entries.length }, { status: 201 });
  } catch (error) {
    console.error("Erro ao importar Excel no Caixa Geral:", error);
    return NextResponse.json(
      { error: "Não foi possível importar os lançamentos da planilha." },
      { status: 500 }
    );
  }
}
