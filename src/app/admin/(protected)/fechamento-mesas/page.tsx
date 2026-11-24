import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { getWeekDates, toISODate } from "@/lib/table-closing";
import { TableClosingManager } from "@/components/admin/TableClosingManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fechamento de Mesas",
};

export default async function AdminFechamentoMesasPage() {
  const session = await getStaffSession();
  const today = toISODate(new Date());
  const weekDates = getWeekDates(today);

  const entries = session
    ? await prisma.tableClosing.findMany({
        where: {
          turnDate: {
            gte: weekDates[0],
            lte: weekDates[6],
          },
        },
        orderBy: [{ turnDate: "asc" }, { createdAt: "asc" }],
      })
    : [];

  return (
    <TableClosingManager
      initialDate={today}
      initialWeekEntries={entries}
      needsClientFetch={!session}
    />
  );
}
