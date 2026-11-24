import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { FinanceManager } from "@/components/admin/FinanceManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Financeiro Interno",
};

export default async function AdminFinanceiroPage() {
  const session = await getStaffSession();
  const entries = session
    ? await prisma.financialEntry.findMany({
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const serialized = entries.map((e) => ({
    ...e,
    occurredAt: e.occurredAt.toISOString(),
    dueDate: e.dueDate ? e.dueDate.toISOString() : null,
  }));

  return (
    <FinanceManager
      initialEntries={serialized}
      needsClientFetch={!session}
    />
  );
}
