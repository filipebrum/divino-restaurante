import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setStaffSessionCookie, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(4, "Informe a senha."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      console.log("[auth] login 400");
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Credenciais inválidas." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.staffUser.findUnique({ where: { email } });

    if (
      !user ||
      !user.active ||
      !verifyPassword(parsed.data.password, user.passwordHash)
    ) {
      console.log("[auth] login 401");
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    const token = await setStaffSessionCookie({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    console.log(`[auth] login ok for ${user.role}`);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Não foi possível realizar o login." },
      { status: 500 }
    );
  }
}
