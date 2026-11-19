import { prisma } from "../lib/prisma.js";

// Movimentações só têm criar e listar (não existe update nem delete).
export const movementModel = {
  create: (data, db) => db.stockMovement.create({ data, include: { user: { select: { id: true, name: true } } } }),

  listByProduct: (productId) =>
    prisma.stockMovement.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
};
