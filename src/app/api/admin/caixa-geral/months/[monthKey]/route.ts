import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

const updateMonthSchema = z.object({
  initialBankBalanceCents: z.coerce.number().int().optional(),
  initialCashBalanceCents: z.coerce.number().int().optional(),
  reconcileCefCents: z.coerce.number().int().optional(),
  reconcileItauCents: z.coerce.number().int().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ monthKey: string }> }
) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { monthKey } = await context.params;
    const body = await request.json();
    const parsed = updateMonthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Valores inválidos." },
        { status: 400 }
      );
    }

    const month = await prisma.cashLedgerMonth.update({
      where: { monthKey },
      data: parsed.data,
    });

    return NextResponse.json({ month });
  } catch (error) {
    console.error("Erro ao atualizar saldos do mês:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar os saldos do mês." },
      { status: 500 }
    );
  }
}
