import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { CaixaGeralManager } from "@/components/admin/CaixaGeralManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Caixa Geral",
};

export default async function AdminCaixaGeralPage() {
  const session = await getStaffSession();

  if (!session) {
    return (
      <CaixaGeralManager
        initialMonths={[]}
        initialActiveMonth={null}
        needsClientFetch={true}
      />
    );
  }

  const months = await prisma.cashLedgerMonth.findMany({
    orderBy: { monthKey: "asc" },
    select: { id: true, monthKey: true, label: true },
  });

  const targetKey = months[months.length - 1]?.monthKey;
  const activeMonth = targetKey
    ? await prisma.cashLedgerMonth.findUnique({
        where: { monthKey: targetKey },
        include: {
          entries: {
            orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      })
    : null;

  return (
    <CaixaGeralManager
      initialMonths={months}
      initialActiveMonth={activeMonth}
      needsClientFetch={false}
    />
  );
}
