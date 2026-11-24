import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { ReservationsManager } from "@/components/admin/ReservationsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestão de Reservas",
};

export default async function AdminReservasPage() {
  const session = await getStaffSession();
  const reservations = session
    ? await prisma.reservation.findMany({
        orderBy: [{ dateTime: "asc" }],
      })
    : [];

  const serialized = reservations.map((r) => ({
    ...r,
    dateTime: r.dateTime.toISOString(),
  }));

  return (
    <ReservationsManager
      initialReservations={serialized}
      needsClientFetch={!session}
    />
  );
}
