import { getStaffSession } from "@/lib/auth";
import { AdminSessionGate } from "@/components/admin/AdminSessionGate";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getStaffSession();
  console.log(`[admin-layout] render hasSession=${Boolean(session)}`);

  return (
    <AdminSessionGate
      initialUser={
        session ? { name: session.name, role: session.role } : null
      }
    >
      {children}
    </AdminSessionGate>
  );
}
