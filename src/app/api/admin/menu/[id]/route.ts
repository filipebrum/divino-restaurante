import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

const updateMenuItemSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().min(4).optional(),
  priceCents: z.coerce.number().int().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  tags: z.string().trim().optional(),
  featured: z.boolean().optional(),
  available: z.boolean().optional(),
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
    const parsed = updateMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Erro ao atualizar item do cardápio:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o item." },
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
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir item do cardápio:", error);
    return NextResponse.json(
      { error: "Não foi possível excluir o item." },
      { status: 500 }
    );
  }
}
