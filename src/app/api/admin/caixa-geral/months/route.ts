import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { monthKeyToLabel } from "@/lib/cash-ledger";

const createMonthSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/, "Mês inválido (use YYYY-MM)."),
  initialBankBalanceCents: z.coerce.number().int().default(0),
  initialCashBalanceCents: z.coerce.number().int().default(0),
});

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createMonthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados do mês inválidos." },
        { status: 400 }
      );
    }

    const existing = await prisma.cashLedgerMonth.findUnique({
      where: { monthKey: parsed.data.monthKey },
      include: {
        entries: {
          orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (existing) {
      return NextResponse.json({ month: existing, existed: true });
    }

    const month = await prisma.cashLedgerMonth.create({
      data: {
        monthKey: parsed.data.monthKey,
        label: monthKeyToLabel(parsed.data.monthKey),
        initialBankBalanceCents: parsed.data.initialBankBalanceCents,
        initialCashBalanceCents: parsed.data.initialCashBalanceCents,
      },
      include: { entries: true },
    });

    return NextResponse.json({ month, existed: false }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar mês no Caixa Geral:", error);
    return NextResponse.json(
      { error: "Não foi possível criar a aba do mês." },
      { status: 500 }
    );
  }
}
