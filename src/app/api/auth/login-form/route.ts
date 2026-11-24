import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setStaffSessionCookie, verifyPassword } from "@/lib/auth";

function relativeRedirect(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: location },
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");

    const user = email
      ? await prisma.staffUser.findUnique({ where: { email } })
      : null;

    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      console.log("[auth] login-form 401");
      return relativeRedirect("/admin?err=credenciais");
    }

    await setStaffSessionCookie({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    console.log(`[auth] login-form ok for ${user.role}`);
    return relativeRedirect("/admin");
  } catch (error) {
    console.error("[auth] login-form 500:", error);
    return relativeRedirect("/admin?err=erro");
  }
}
