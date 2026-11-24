import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

const updateEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hist: z.string().trim().min(1).optional(),
  pixPJCents: z.coerce.number().int().optional(),
  creditCents: z.coerce.number().int().optional(),
  entradasCents: z.coerce.number().int().optional(),
  saidasCents: z.coerce.number().int().optional(),
  proLaboreCents: z.coerce.number().int().optional(),
  pixDepCents: z.coerce.number().int().optional(),
  debitCents: z.coerce.number().int().optional(),
  vendasCents: z.coerce.number().int().optional(),
  dnhEntCents: z.coerce.number().int().optional(),
  dnhSaiCents: z.coerce.number().int().optional(),
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
    const parsed = updateEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const entry = await prisma.cashLedgerEntry.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
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
    await prisma.cashLedgerEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir lançamento:", error);
    return NextResponse.json(
      { error: "Não foi possível excluir o lançamento." },
      { status: 500 }
    );
  }
}
