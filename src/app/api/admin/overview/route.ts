import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const [
    upcomingReservations,
    pendingReservationsCount,
    activeItemsCount,
    totalItemsCount,
    monthEntries,
    recentEntries,
  ] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        dateTime: { gte: startOfToday },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { dateTime: "asc" },
      take: 5,
    }),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.menuItem.count({ where: { available: true } }),
    prisma.menuItem.count(),
    prisma.financialEntry.findMany({
      where: { occurredAt: { gte: startOfMonth } },
    }),
    prisma.financialEntry.findMany({
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
  ]);

  let paidIncome = 0;
  let paidExpense = 0;
  let pendingPayable = 0;
  let pendingReceivable = 0;

  for (const entry of monthEntries) {
    if (entry.type === "INCOME") {
      if (entry.status === "PAID") paidIncome += entry.amountCents;
      else pendingReceivable += entry.amountCents;
    } else {
      if (entry.status === "PAID") paidExpense += entry.amountCents;
      else pendingPayable += entry.amountCents;
    }
  }

  return NextResponse.json({
    paidIncome,
    paidExpense,
    netBalance: paidIncome - paidExpense,
    pendingPayable,
    pendingReceivable,
    pendingReservationsCount,
    activeItemsCount,
    totalItemsCount,
    upcomingReservations: upcomingReservations.map((r) => ({
      id: r.id,
      confirmationCode: r.confirmationCode,
      customerName: r.customerName,
      partySize: r.partySize,
      dateTime: r.dateTime.toISOString(),
      status: r.status,
    })),
    recentEntries: recentEntries.map((e) => ({
      id: e.id,
      type: e.type,
      category: e.category,
      description: e.description,
      amountCents: e.amountCents,
      occurredAt: e.occurredAt.toISOString(),
      status: e.status,
    })),
  });
}
