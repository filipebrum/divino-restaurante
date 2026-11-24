import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import {
  AdminOverviewClient,
  type OverviewData,
} from "@/components/admin/AdminOverviewClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel Interno",
};

export default async function AdminOverviewPage() {
  const session = await getStaffSession();
  let initialData: OverviewData | null = null;

  if (session) {
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

    initialData = {
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
    };
  }

  return <AdminOverviewClient initialData={initialData} />;
}
