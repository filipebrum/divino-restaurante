import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

const updateSchema = z.object({
  turnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tableId: z.string().trim().min(1).optional(),
  subtotalCents: z.coerce.number().int().min(0).optional(),
  serviceCents: z.coerce.number().int().min(0).optional(),
  manualService: z.boolean().optional(),
  discountCents: z.coerce.number().int().min(0).optional(),
  tipCents: z.coerce.number().int().min(0).optional(),
  creditCents: z.coerce.number().int().min(0).optional(),
  debitCents: z.coerce.number().int().min(0).optional(),
  pixCents: z.coerce.number().int().min(0).optional(),
  cashCents: z.coerce.number().int().min(0).optional(),
  othersCents: z.coerce.number().int().min(0).optional(),
  notes: z.string().trim().max(300).optional().nullable(),
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
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const entry = await prisma.tableClosing.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Erro ao atualizar mesa:", error);
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
    await prisma.tableClosing.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir mesa:", error);
    return NextResponse.json(
      { error: "Não foi possível excluir o lançamento." },
      { status: 500 }
    );
  }
}
