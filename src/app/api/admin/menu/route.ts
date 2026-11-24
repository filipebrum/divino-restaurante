import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/auth";
import { slugify } from "@/lib/constants";

const createMenuItemSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do item."),
  description: z.string().trim().min(4, "Informe uma descrição para o item."),
  priceCents: z.coerce.number().int().min(1, "Informe um preço maior que zero."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  tags: z.string().trim().optional().default(""),
  featured: z.boolean().optional().default(false),
  available: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Erro ao listar cardápio interno:", error);
    return NextResponse.json(
      { error: "Erro ao carregar cardápio." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados do item inválidos." },
        { status: 400 }
      );
    }

    const baseSlug = slugify(parsed.data.name) || `item-${Date.now()}`;
    const existing = await prisma.menuItem.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });
    const slug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const item = await prisma.menuItem.create({
      data: {
        slug,
        name: parsed.data.name,
        description: parsed.data.description,
        priceCents: parsed.data.priceCents,
        categoryId: parsed.data.categoryId,
        tags: parsed.data.tags,
        featured: parsed.data.featured,
        available: parsed.data.available,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar item do cardápio:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o item." },
      { status: 500 }
    );
  }
}
