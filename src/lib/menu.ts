import { prisma } from "@/lib/prisma";

export interface MenuItemDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  tags: string;
  featured: boolean;
  available: boolean;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export interface MenuCategoryDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  items: MenuItemDTO[];
}

export async function getMenuCategories(): Promise<MenuCategoryDTO[]> {
  const categories = await prisma.menuCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { available: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    sortOrder: cat.sortOrder,
    items: cat.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      imageUrl: item.imageUrl,
      tags: item.tags,
      featured: item.featured,
      available: item.available,
      categoryId: cat.id,
      categoryName: cat.name,
      categorySlug: cat.slug,
    })),
  }));
}

export async function getFeaturedItems(): Promise<MenuItemDTO[]> {
  const items = await prisma.menuItem.findMany({
    where: { available: true, featured: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { category: true },
    take: 4,
  });

  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    imageUrl: item.imageUrl,
    tags: item.tags,
    featured: item.featured,
    available: item.available,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    categorySlug: item.category.slug,
  }));
}
