import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

// Acesso a dados de produtos. O parâmetro `db` permite usar a mesma função dentro de uma transação.
const withOwner = { owner: { select: { id: true, name: true } } };

export const productModel = {
  async list({ ownerId, search, lowStock }) {
    const where = {};
    if (ownerId !== undefined) where.ownerId = ownerId;

    // No MySQL a collation utf8mb4_unicode_ci já ignora maiúsculas/minúsculas em "contains"
    // (por isso não existe `mode: "insensitive"` aqui).
    if (search) {
      where.OR = [{ name: { contains: search } }, { sku: { contains: search } }, { category: { contains: search } }];
    }

    // lowStock = quantity <= minStock. O Prisma não compara duas colunas no `where`,
    // então uma consulta SQL parametrizada busca os ids e depois filtramos por eles.
    if (lowStock) {
      const rows = ownerId !== undefined
        ? await prisma.$queryRaw(Prisma.sql`SELECT id FROM Product WHERE quantity <= minStock AND ownerId = ${ownerId}`)
        : await prisma.$queryRaw(Prisma.sql`SELECT id FROM Product WHERE quantity <= minStock`);
      where.id = { in: rows.map((r) => Number(r.id)) };
    }

    return prisma.product.findMany({ where, include: withOwner, orderBy: { id: "asc" } });
  },

  findById: (id, db = prisma) => db.product.findUnique({ where: { id }, include: withOwner }),

  create: (data) => prisma.product.create({ data, include: withOwner }),

  update: (id, data) => prisma.product.update({ where: { id }, data, include: withOwner }),

  delete: (id) => prisma.product.delete({ where: { id } }),

  // Soma na quantidade (entrada).
  increment: (id, quantity, db) => db.product.update({ where: { id }, data: { quantity: { increment: quantity } } }),

  // Subtrai da quantidade SOMENTE se o saldo for suficiente, em um único UPDATE condicional.
  // Retorna quantas linhas foram alteradas (0 ou 1).
  async decrementIfEnough(id, quantity, db) {
    const result = await db.product.updateMany({
      where: { id, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
    return result.count;
  },
};
