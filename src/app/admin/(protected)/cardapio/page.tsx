import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { MenuManager } from "@/components/admin/MenuManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestão do Cardápio",
};

export default async function AdminCardapioPage() {
  const session = await getStaffSession();
  const categories = session
    ? await prisma.menuCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      })
    : [];

  return (
    <MenuManager
      initialCategories={categories}
      needsClientFetch={!session}
    />
  );
}
