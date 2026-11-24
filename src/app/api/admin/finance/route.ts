import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

const createFinancialEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().trim().min(2, "Selecione uma categoria."),
  description: z.string().trim().min(2, "Informe uma descrição."),
  amountCents: z.coerce.number().int().min(1, "Informe um valor maior que zero."),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  status: z.enum(["PAID", "PENDING", "OVERDUE"]).default("PAID"),
  paymentMethod: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function GET(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM

    let dateFilter: { gte: Date; lt: Date } | undefined;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 1, 0, 0, 0, 0);
      dateFilter = { gte: start, lt: end };
    }

    const entries = await prisma.financialEntry.findMany({
      where: dateFilter ? { occurredAt: dateFilter } : undefined,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Erro ao consultar lançamentos financeiros:", error);
    return NextResponse.json(
      { error: "Erro ao consultar lançamentos financeiros." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createFinancialEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados do lançamento inválidos." },
        { status: 400 }
      );
    }

    const entry = await prisma.financialEntry.create({
      data: {
        type: parsed.data.type,
        category: parsed.data.category,
        description: parsed.data.description,
        amountCents: parsed.data.amountCents,
        occurredAt: new Date(`${parsed.data.occurredAt}T12:00:00`),
        dueDate: parsed.data.dueDate
          ? new Date(`${parsed.data.dueDate}T12:00:00`)
          : null,
        status: parsed.data.status,
        paymentMethod: parsed.data.paymentMethod || null,
        notes: parsed.data.notes || null,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lançamento financeiro:", error);
    return NextResponse.json(
      { error: "Não foi possível registrar o lançamento." },
      { status: 500 }
    );
  }
}
