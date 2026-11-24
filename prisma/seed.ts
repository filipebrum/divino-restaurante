import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashSeedPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

const categoriesData = [
  {
    slug: "entradas",
    name: "Entradas",
    description: "Porções pensadas para abrir o apetite e compartilhar à mesa.",
    sortOrder: 1,
    items: [
      {
        slug: "bruschetta-tomate-confit",
        name: "Bruschetta de Tomate Confit & Burrata",
        description:
          "Pão artesanal de fermentação natural tostado na brasa, tomates confitados no azeite de ervas, burrata fresca e pesto de manjericão.",
        priceCents: 4400,
        tags: "Vegetariano,Favorito da Casa",
        featured: true,
        sortOrder: 1,
      },
      {
        slug: "bolinho-costela-requeijao",
        name: "Bolinho de Costela Defumada",
        description:
          "Massa leve de mandioca recheada com costela assada lentamente por 12 horas, servido com aioli de páprica defumada (6 unidades).",
        priceCents: 4800,
        tags: "Favorito da Casa",
        featured: false,
        sortOrder: 2,
      },
      {
        slug: "carpaccio-mignon-trufado",
        name: "Carpaccio de Filé Mignon",
        description:
          "Lâminas finas de filé mignon, emulsão cítrica de mostarda dijon, lascas de parmesão curado, rúcula selvagem e alcaparras.",
        priceCents: 5200,
        tags: "Sem Glúten",
        featured: false,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "pratos-principais",
    name: "Pratos Principais",
    description: "Cortes selecionados, fogo lento e ingredientes frescos da estação.",
    sortOrder: 2,
    items: [
      {
        slug: "medalhao-divino-mandioquinha",
        name: "Medalhão Divino ao Molho de Vinho Tinto",
        description:
          "Filé mignon alto selado na manteiga de ervas, redução de vinho tinto, purê cremoso de mandioquinha e legumes tostados na brasa.",
        priceCents: 8900,
        tags: "Sem Glúten,Favorito da Casa",
        featured: true,
        sortOrder: 1,
      },
      {
        slug: "salmao-crosta-ervas",
        name: "Salmão em Crosta Cítrica de Ervas",
        description:
          "Lombo de salmão grelhado com crosta aromática de limão-siciliano, servido sobre risoto leve de alho-poró e aspargos.",
        priceCents: 8600,
        tags: "Sem Glúten",
        featured: true,
        sortOrder: 2,
      },
      {
        slug: "picanha-na-brasa-baiao",
        name: "Picanha na Brasa com Baião Cremoso",
        description:
          "Corte nobre fatiado ao ponto do chef, baião de dois cremoso com queijo coalho dourado, farofa crocante de manteiga de garrafa e vinagrete da casa.",
        priceCents: 9400,
        tags: "Favorito da Casa",
        featured: false,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "massas-e-risotos",
    name: "Massas & Risotos",
    description: "Receitas artesanais preparadas na hora com caldos naturais.",
    sortOrder: 3,
    items: [
      {
        slug: "risoto-cogumelos-trufado",
        name: "Risoto de Cogumelos Frescos",
        description:
          "Arroz arbóreo cremoso com mix de shimeji, shiitake e portobello salteados no vinho branco, finalizado com azeite trufado e parmesão.",
        priceCents: 7200,
        tags: "Vegetariano,Sem Glúten",
        featured: true,
        sortOrder: 1,
      },
      {
        slug: "fettuccine-ragu-ossobuco",
        name: "Fettuccine Artesanal ao Ragu de Ossobuco",
        description:
          "Massa fresca envolvida em ragu de ossobuco cozido lentamente com especiarias e gremolata de limão-siciliano.",
        priceCents: 7600,
        tags: "",
        featured: false,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "sobremesas",
    name: "Sobremesas",
    description: "Clássicos afetivos executados com delicadeza para encerrar a refeição.",
    sortOrder: 4,
    items: [
      {
        slug: "pudim-leite-caramelo-ambar",
        name: "Pudim de Leite com Fava de Baunilha",
        description:
          "Textura aveludada sem furinhos, infusionado com baunilha natural e calda de caramelo âmbar.",
        priceCents: 2800,
        tags: "Vegetariano,Sem Glúten,Favorito da Casa",
        featured: true,
        sortOrder: 1,
      },
      {
        slug: "torta-chocolate-belga",
        name: "Torta Morna de Chocolate 70%",
        description:
          "Bolo de centro cremoso de chocolate meio amargo acompanhado de sorvete artesanal de creme e praliné de castanha-do-pará.",
        priceCents: 3400,
        tags: "Vegetariano",
        featured: false,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "bebidas-e-drinques",
    name: "Bebidas & Drinques",
    description: "Coquetelaria autoral, vinhos selecionados e opções sem álcool.",
    sortOrder: 5,
    items: [
      {
        slug: "divino-spritz-maracuja",
        name: "Divino Spritz de Maracujá & Alecrim",
        description:
          "Espumante brut, redução artesanal de maracujá, toque cítrico de laranja-bahia e ramo fresco de alecrim.",
        priceCents: 3600,
        tags: "Sem Glúten,Favorito da Casa",
        featured: false,
        sortOrder: 1,
      },
      {
        slug: "soda-italiana-frutas-vermelhas",
        name: "Soda Artesanal de Frutas Vermelhas",
        description:
          "Xarope natural de morango, amora e hibisco preparado na casa com água com gás e folhas de hortelã (sem álcool).",
        priceCents: 1900,
        tags: "Vegetariano,Sem Glúten",
        featured: false,
        sortOrder: 2,
      },
      {
        slug: "suco-abacaxi-hortela-gengibre",
        name: "Suco Natural de Abacaxi, Hortelã & Gengibre",
        description: "Preparado na hora com fruta fresca selecionada (350ml).",
        priceCents: 1600,
        tags: "Vegetariano,Sem Glúten",
        featured: false,
        sortOrder: 3,
      },
    ],
  },
];

function offsetDate(daysOffset: number, hours: number, minutes = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function main() {
  // 1. Usuário administrador inicial do painel interno
  const adminEmail = (
    process.env.ADMIN_INITIAL_EMAIL || "admin@divinorestaurante.com.br"
  )
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "divino123";

  const existingAdmin = await prisma.staffUser.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.staffUser.create({
      data: {
        name: "Gestão diVino",
        email: adminEmail,
        passwordHash: hashSeedPassword(adminPassword),
        role: "ADMIN",
      },
    });
  }

  // 2. Categorias e itens do cardápio
  for (const cat of categoriesData) {
    const { items, ...categoryFields } = cat;
    const category = await prisma.menuCategory.upsert({
      where: { slug: categoryFields.slug },
      update: {
        name: categoryFields.name,
        description: categoryFields.description,
        sortOrder: categoryFields.sortOrder,
      },
      create: categoryFields,
    });

    for (const item of items) {
      await prisma.menuItem.upsert({
        where: { slug: item.slug },
        update: {
          name: item.name,
          description: item.description,
          priceCents: item.priceCents,
          tags: item.tags,
          featured: item.featured,
          sortOrder: item.sortOrder,
          categoryId: category.id,
        },
        create: {
          ...item,
          categoryId: category.id,
        },
      });
    }
  }

  // 3. Reservas iniciais de demonstração (somente se o banco ainda não tiver reservas)
  const reservationCount = await prisma.reservation.count();
  if (reservationCount === 0) {
    await prisma.reservation.createMany({
      data: [
        {
          confirmationCode: "DIV-1024",
          customerName: "Mariana Oliveira",
          customerPhone: "(11) 98421-3310",
          customerEmail: "mariana.oliveira@exemplo.com",
          partySize: 4,
          dateTime: offsetDate(0, 19, 30),
          occasion: "Aniversário",
          status: "CONFIRMED",
          notes: "Mesa próxima à janela; levar vela na sobremesa.",
        },
        {
          confirmationCode: "DIV-1025",
          customerName: "Carlos Eduardo Santos",
          customerPhone: "(11) 99102-8845",
          customerEmail: "carlos.santos@exemplo.com",
          partySize: 2,
          dateTime: offsetDate(0, 20, 0),
          occasion: "Jantar romântico",
          status: "PENDING",
          notes: "Preferência por mesa mais reservada.",
        },
        {
          confirmationCode: "DIV-1026",
          customerName: "Fernanda Costa",
          customerPhone: "(11) 97330-1922",
          partySize: 6,
          dateTime: offsetDate(1, 12, 30),
          occasion: "Almoço em família",
          status: "PENDING",
          notes: "1 cadeira infantil e opção sem glúten.",
        },
        {
          confirmationCode: "DIV-1027",
          customerName: "Roberto Almeida",
          customerPhone: "(11) 98874-6011",
          partySize: 8,
          dateTime: offsetDate(2, 20, 30),
          occasion: "Reunião corporativa",
          status: "CONFIRMED",
          notes: "Nota fiscal no CNPJ da empresa.",
        },
      ],
    });
  }

  // 4. Lançamentos financeiros iniciais de demonstração (somente se vazio)
  const financeCount = await prisma.financialEntry.count();
  if (financeCount === 0) {
    await prisma.financialEntry.createMany({
      data: [
        {
          type: "INCOME",
          category: "Salão / Mesas",
          description: "Fechamento de salão — Almoço e Jantar (Sexta)",
          amountCents: 642000,
          occurredAt: offsetDate(-3, 23, 0),
          status: "PAID",
          paymentMethod: "CREDITO",
          notes: "Movimento acima da média semanal.",
        },
        {
          type: "INCOME",
          category: "Salão / Mesas",
          description: "Fechamento de salão — Sábado",
          amountCents: 895000,
          occurredAt: offsetDate(-2, 23, 0),
          status: "PAID",
          paymentMethod: "PIX",
        },
        {
          type: "INCOME",
          category: "Delivery & Retirada",
          description: "Repasse semanal pedidos delivery",
          amountCents: 218000,
          occurredAt: offsetDate(-1, 15, 0),
          status: "PAID",
          paymentMethod: "TRANSFERENCIA",
        },
        {
          type: "INCOME",
          category: "Eventos & Reservas",
          description: "Sinal reserva confraternização grupo 20 pessoas",
          amountCents: 180000,
          occurredAt: offsetDate(0, 10, 0),
          dueDate: offsetDate(3, 18, 0),
          status: "PENDING",
          paymentMethod: "PIX",
          notes: "Restante de 50% no dia do evento.",
        },
        {
          type: "EXPENSE",
          category: "Insumos & Mercado",
          description: "Compra semanal hortifrúti e proteínas frescas",
          amountCents: 284000,
          occurredAt: offsetDate(-4, 9, 0),
          status: "PAID",
          paymentMethod: "PIX",
        },
        {
          type: "EXPENSE",
          category: "Bebidas & Estoque",
          description: "Reposição adega, vinhos e destilados",
          amountCents: 146000,
          occurredAt: offsetDate(-2, 11, 30),
          status: "PAID",
          paymentMethod: "BOLETO",
        },
        {
          type: "EXPENSE",
          category: "Aluguel & Condomínio",
          description: "Aluguel comercial do imóvel",
          amountCents: 450000,
          occurredAt: offsetDate(0, 8, 0),
          dueDate: offsetDate(5, 18, 0),
          status: "PENDING",
          paymentMethod: "BOLETO",
        },
        {
          type: "EXPENSE",
          category: "Energia, Água & Gás",
          description: "Conta de energia elétrica + recarga gás cozinha",
          amountCents: 112500,
          occurredAt: offsetDate(-1, 14, 0),
          dueDate: offsetDate(2, 18, 0),
          status: "PENDING",
          paymentMethod: "BOLETO",
        },
        {
          type: "EXPENSE",
          category: "Equipe & Folha",
          description: "Adiantamento salarial equipe cozinha e salão",
          amountCents: 380000,
          occurredAt: offsetDate(-5, 16, 0),
          status: "PAID",
          paymentMethod: "TRANSFERENCIA",
        },
      ],
    });
  }

  // 5. Fechamentos de mesas iniciais de demonstração (somente se vazio)
  const closingCount = await prisma.tableClosing.count();
  if (closingCount === 0) {
    const isoDay = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    };

    await prisma.tableClosing.createMany({
      data: [
        {
          turnDate: isoDay(0),
          tableId: "Mesa 02",
          subtotalCents: 18000,
          serviceCents: 1800,
          discountCents: 0,
          tipCents: 1200,
          creditCents: 10000,
          debitCents: 0,
          pixCents: 11000,
          cashCents: 0,
          othersCents: 0,
        },
        {
          turnDate: isoDay(0),
          tableId: "Mesa 07",
          subtotalCents: 25000,
          serviceCents: 2500,
          discountCents: 2500,
          tipCents: 1000,
          creditCents: 26000,
          debitCents: 0,
          pixCents: 0,
          cashCents: 0,
          othersCents: 0,
        },
        {
          turnDate: isoDay(0),
          tableId: "Mesa 11",
          subtotalCents: 34000,
          serviceCents: 3400,
          discountCents: 0,
          tipCents: 1600,
          creditCents: 20000,
          debitCents: 9000,
          pixCents: 10000,
          cashCents: 0,
          othersCents: 0,
        },
        {
          turnDate: isoDay(-1),
          tableId: "Mesa 01",
          subtotalCents: 21500,
          serviceCents: 2150,
          discountCents: 0,
          tipCents: 850,
          creditCents: 0,
          debitCents: 14500,
          pixCents: 10000,
          cashCents: 0,
          othersCents: 0,
        },
        {
          turnDate: isoDay(-1),
          tableId: "Mesa 05",
          subtotalCents: 42000,
          serviceCents: 4200,
          discountCents: 0,
          tipCents: 2000,
          creditCents: 38200,
          debitCents: 0,
          pixCents: 0,
          cashCents: 10000,
          othersCents: 0,
        },
      ],
    });
  }

  // 6. Caixa Geral inicial (Setembro 2026 — somente se vazio)
  const ledgerMonthCount = await prisma.cashLedgerMonth.count();
  if (ledgerMonthCount === 0) {
    const sept = await prisma.cashLedgerMonth.create({
      data: {
        monthKey: "2026-09",
        label: "Setembro 2026",
        initialBankBalanceCents: 8845654,
        initialCashBalanceCents: 254250,
        reconcileCefCents: 1425000,
        reconcileItauCents: 8652244,
      },
    });

    const seedRows = [
      { date: "2026-09-01", hist: "Liberação Cartões Rede Itaú", entradasCents: 384025 },
      { date: "2026-09-01", hist: "Verdemar PIX QrCode Itaú", saidasCents: 64280 },
      { date: "2026-09-01", hist: "Hortisul PIX QrCode Itaú", saidasCents: 48530 },
      { date: "2026-09-01", hist: "Caixinha", dnhSaiCents: 12000 },
      { date: "2026-09-01", hist: "Vendas Crédito", creditCents: 421050 },
      { date: "2026-09-01", hist: "Vendas Débito", debitCents: 189000 },
      { date: "2026-09-01", hist: "Vendas Dinheiro", dnhEntCents: 64000 },
      { date: "2026-09-01", hist: "PIX/Depósito", pixDepCents: 95000 },
      { date: "2026-09-01", hist: "Vendas Totais", vendasCents: 769050 },

      { date: "2026-09-02", hist: "PIX Cliente", pixPJCents: 95000 },
      { date: "2026-09-02", hist: "Liberação Cartões Rede Itaú", entradasCents: 591240 },
      { date: "2026-09-02", hist: "Plena Alimentos", saidasCents: 218045 },
      { date: "2026-09-02", hist: "HMF Representação de Alimento", saidasCents: 134000 },
      { date: "2026-09-02", hist: "Pro Labore TATA", saidasCents: 150000, proLaboreCents: 150000 },
      { date: "2026-09-02", hist: "Vendas Crédito", creditCents: 512000 },
      { date: "2026-09-02", hist: "Vendas Débito", debitCents: 214550 },
      { date: "2026-09-02", hist: "Vendas Dinheiro", dnhEntCents: 81000 },
      { date: "2026-09-02", hist: "PIX/Depósito", pixDepCents: 112000 },
      { date: "2026-09-02", hist: "Vendas Totais", vendasCents: 919550 },

      { date: "2026-09-03", hist: "PIX Cliente", pixPJCents: 112000 },
      { date: "2026-09-03", hist: "Liberação Cartões Rede Itaú", entradasCents: 709580 },
      { date: "2026-09-03", hist: "Compras DNH", dnhSaiCents: 24550 },
    ];

    await prisma.cashLedgerEntry.createMany({
      data: seedRows.map((row, index) => ({
        monthId: sept.id,
        date: row.date,
        hist: row.hist,
        pixPJCents: row.pixPJCents ?? 0,
        creditCents: row.creditCents ?? 0,
        entradasCents: row.entradasCents ?? 0,
        saidasCents: row.saidasCents ?? 0,
        proLaboreCents: row.proLaboreCents ?? 0,
        pixDepCents: row.pixDepCents ?? 0,
        debitCents: row.debitCents ?? 0,
        vendasCents: row.vendasCents ?? 0,
        dnhEntCents: row.dnhEntCents ?? 0,
        dnhSaiCents: row.dnhSaiCents ?? 0,
        sortOrder: index + 1,
      })),
    });
  }

  console.log("Seed do Divino Restaurante concluído com sucesso.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
