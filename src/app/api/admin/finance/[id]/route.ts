import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

const updateFinancialEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category: z.string().trim().min(2).optional(),
  description: z.string().trim().min(2).optional(),
  amountCents: z.coerce.number().int().min(1).optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional()
    .or(z.literal("")),
  status: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
  paymentMethod: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateFinancialEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const { occurredAt, dueDate, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };

    if (occurredAt) {
      updateData.occurredAt = new Date(`${occurredAt}T12:00:00`);
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(`${dueDate}T12:00:00`) : null;
    }

    const entry = await prisma.financialEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Erro ao atualizar lançamento financeiro:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o lançamento." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await prisma.financialEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir lançamento financeiro:", error);
    return NextResponse.json(
      { error: "Não foi possível excluir o lançamento." },
      { status: 500 }
    );
  }
}
