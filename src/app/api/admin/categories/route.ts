import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { slugify } from "@/lib/constants";

const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria."),
  description: z.string().trim().max(240).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Categoria inválida." },
        { status: 400 }
      );
    }

    const baseSlug = slugify(parsed.data.name) || `cat-${Date.now()}`;
    const existing = await prisma.menuCategory.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });
    const slug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const count = await prisma.menuCategory.count();
    const category = await prisma.menuCategory.create({
      data: {
        slug,
        name: parsed.data.name,
        description: parsed.data.description || null,
        sortOrder: count + 1,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Não foi possível criar a categoria." },
      { status: 500 }
    );
  }
}
