import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { monthKeyToLabel } from "@/lib/cash-ledger";

export async function GET(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const requestedMonth = searchParams.get("month");

    let months = await prisma.cashLedgerMonth.findMany({
      orderBy: { monthKey: "asc" },
      select: { id: true, monthKey: true, label: true },
    });

    // Garante pelo menos um mês caso o banco esteja vazio
    if (months.length === 0) {
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const created = await prisma.cashLedgerMonth.create({
        data: { monthKey: key, label: monthKeyToLabel(key) },
        select: { id: true, monthKey: true, label: true },
      });
      months = [created];
    }

    const targetKey =
      requestedMonth && months.some((m) => m.monthKey === requestedMonth)
        ? requestedMonth
        : months[months.length - 1].monthKey;

    const activeMonth = await prisma.cashLedgerMonth.findUnique({
      where: { monthKey: targetKey },
      include: {
        entries: {
          orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json({ months, activeMonth });
  } catch (error) {
    console.error("Erro ao carregar Caixa Geral:", error);
    return NextResponse.json(
      { error: "Erro ao carregar Caixa Geral." },
      { status: 500 }
    );
  }
}
