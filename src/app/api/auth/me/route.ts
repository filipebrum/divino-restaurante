import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}
