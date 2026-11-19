import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

// Acesso a dados de produtos. O parâmetro `db` permite usar a mesma função dentro de uma transação.
type Db = Prisma.TransactionClient | typeof prisma;

const withOwner = { owner: { select: { id: true, name: true } } };

export const productModel = {
  list: (filter: { ownerId?: number; search?: string; lowStock?: boolean }) => {
    const where: Prisma.ProductWhereInput = {};
    if (filter.ownerId !== undefined) where.ownerId = filter.ownerId;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { sku: { contains: filter.search, mode: "insensitive" } },
        { category: { contains: filter.search, mode: "insensitive" } },
      ];
    }
    // lowStock: quantidade menor ou igual ao estoque mínimo (compara duas colunas).
    if (filter.lowStock) where.quantity = { lte: prisma.product.fields.minStock };
    return prisma.product.findMany({ where, include: withOwner, orderBy: { id: "asc" } });
  },

  findById: (id: number, db: Db = prisma) => db.product.findUnique({ where: { id }, include: withOwner }),

  create: (data: { name: string; sku: string; category: string; unitPrice: number; minStock: number; ownerId: number }) =>
    prisma.product.create({ data, include: withOwner }),

  update: (id: number, data: Prisma.ProductUpdateInput) => prisma.product.update({ where: { id }, data, include: withOwner }),

  delete: (id: number) => prisma.product.delete({ where: { id } }),

  // Soma na quantidade (entrada).
  increment: (id: number, quantity: number, db: Db) =>
    db.product.update({ where: { id }, data: { quantity: { increment: quantity } } }),

  // Subtrai da quantidade SOMENTE se o saldo for suficiente, em um único UPDATE condicional.
  // Retorna quantas linhas foram alteradas (0 ou 1).
  decrementIfEnough: async (id: number, quantity: number, db: Db) => {
    const result = await db.product.updateMany({
      where: { id, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
    return result.count;
  },
};
