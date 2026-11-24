import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { getWeekDates, toISODate } from "@/lib/table-closing";

const tableClosingSchema = z.object({
  turnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  tableId: z.string().trim().min(1, "Informe a mesa ou comanda."),
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
  notes: z.string().trim().max(300).optional().nullable(),
});

export async function GET(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const weekOfParam = searchParams.get("weekOf");

    if (weekOfParam && /^\d{4}-\d{2}-\d{2}$/.test(weekOfParam)) {
      const weekDates = getWeekDates(weekOfParam);
      const entries = await prisma.tableClosing.findMany({
        where: {
          turnDate: {
            gte: weekDates[0],
            lte: weekDates[6],
          },
        },
        orderBy: [{ turnDate: "asc" }, { createdAt: "asc" }],
      });
      return NextResponse.json({ entries, weekDates });
    }

    const turnDate =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? dateParam
        : toISODate(new Date());

    const entries = await prisma.tableClosing.findMany({
      where: { turnDate },
      orderBy: [{ createdAt: "asc" }],
    });

    return NextResponse.json({ entries, turnDate });
  } catch (error) {
    console.error("Erro ao consultar fechamento de mesas:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o fechamento de mesas." },
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
    const parsed = tableClosingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const entry = await prisma.tableClosing.create({
      data: {
        ...parsed.data,
        notes: parsed.data.notes || null,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar fechamento de mesa:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o lançamento da mesa." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "Informe a data do turno para limpar." },
        { status: 400 }
      );
    }

    const result = await prisma.tableClosing.deleteMany({
      where: { turnDate: dateParam },
    });

    return NextResponse.json({ deletedCount: result.count });
  } catch (error) {
    console.error("Erro ao limpar turno:", error);
    return NextResponse.json(
      { error: "Não foi possível limpar os lançamentos do dia." },
      { status: 500 }
    );
  }
}
