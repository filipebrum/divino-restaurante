import { NextResponse } from "next/server";
import { getMenuCategories } from "@/lib/menu";

export async function GET() {
  try {
    const categories = await getMenuCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Erro ao buscar cardápio:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o cardápio no momento." },
      { status: 500 }
    );
  }
}
