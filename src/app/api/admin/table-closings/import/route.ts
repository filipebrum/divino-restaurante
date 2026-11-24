import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

const rowSchema = z.object({
  turnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tableId: z.string().trim().min(1),
  subtotalCents: z.coerce.number().int().min(0),
  serviceCents: z.coerce.number().int().min(0).default(0),
  manualService: z.boolean().optional().default(false),
  discountCents: z.coerce.number().int().min(0).default(0),
  tipCents: z.coerce.number().int().min(0).default(0),
  creditCents: z.coerce.number().int().min(0).default(0),
  debitCents: z.coerce.number().int().min(0).default(0),
  pixCents: z.coerce.number().int().min(0).default(0),
  cashCents: z.coerce.number().int().min(0).default(0),
  othersCents: z.coerce.number().int().min(0).default(0),
});

const importSchema = z.object({
  rows: z.array(rowSchema).min(1, "Nenhuma linha válida para importar.").max(500),
  replaceDates: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados do CSV inválidos." },
        { status: 400 }
      );
    }

    const { rows, replaceDates } = parsed.data;

    await prisma.$transaction(async (tx) => {
      if (replaceDates) {
        const distinctDates = Array.from(new Set(rows.map((r) => r.turnDate)));
        await tx.tableClosing.deleteMany({
          where: { turnDate: { in: distinctDates } },
        });
      }
      await tx.tableClosing.createMany({
        data: rows,
      });
    });

    return NextResponse.json({ importedCount: rows.length }, { status: 201 });
  } catch (error) {
    console.error("Erro ao importar CSV de fechamento:", error);
    return NextResponse.json(
      { error: "Não foi possível importar o arquivo CSV." },
      { status: 500 }
    );
  }
}
