import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { generateReservationCode } from "@/lib/constants";

const createReservationSchema = z.object({
  customerName: z.string().trim().min(2, "Informe seu nome completo."),
  customerPhone: z.string().trim().min(8, "Informe um WhatsApp ou telefone válido."),
  customerEmail: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),
  partySize: z.coerce.number().int().min(1, "Mínimo de 1 pessoa.").max(30, "Para mais de 30 pessoas, entre em contato direto."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecione uma data válida."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Selecione um horário válido."),
  occasion: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(["PENDING", "CONFIRMED"]).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    // Consulta pública restrita pelo código de confirmação
    if (code) {
      const reservation = await prisma.reservation.findUnique({
        where: { confirmationCode: code },
        select: {
          confirmationCode: true,
          customerName: true,
          partySize: true,
          dateTime: true,
          occasion: true,
          status: true,
          notes: true,
        },
      });

      if (!reservation) {
        return NextResponse.json(
          { error: "Nenhuma reserva encontrada com este código." },
          { status: 404 }
        );
      }

      return NextResponse.json({ reservation });
    }

    // Listagem completa apenas para equipe autenticada
    const session = await getStaffSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const status = searchParams.get("status");
    const reservations = await prisma.reservation.findMany({
      where: status && status !== "ALL" ? { status } : undefined,
      orderBy: [{ dateTime: "asc" }],
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Erro ao consultar reservas:", error);
    return NextResponse.json(
      { error: "Erro ao consultar reservas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados da reserva inválidos." },
        { status: 400 }
      );
    }

    const { date, time, customerEmail, occasion, notes, status, ...rest } =
      parsed.data;
    const dateTime = new Date(`${date}T${time}:00`);

    if (Number.isNaN(dateTime.getTime())) {
      return NextResponse.json(
        { error: "Data ou horário inválido." },
        { status: 400 }
      );
    }

    // Apenas equipe logada pode criar já como CONFIRMED
    const session = await getStaffSession();
    const initialStatus = session && status === "CONFIRMED" ? "CONFIRMED" : "PENDING";

    let confirmationCode = generateReservationCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exists = await prisma.reservation.findUnique({
        where: { confirmationCode },
        select: { id: true },
      });
      if (!exists) break;
      confirmationCode = generateReservationCode();
    }

    const reservation = await prisma.reservation.create({
      data: {
        confirmationCode,
        customerName: rest.customerName,
        customerPhone: rest.customerPhone,
        customerEmail: customerEmail || null,
        partySize: rest.partySize,
        dateTime,
        occasion: occasion || null,
        notes: notes || null,
        status: initialStatus,
      },
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    return NextResponse.json(
      { error: "Não foi possível registrar sua reserva no momento." },
      { status: 500 }
    );
  }
}
