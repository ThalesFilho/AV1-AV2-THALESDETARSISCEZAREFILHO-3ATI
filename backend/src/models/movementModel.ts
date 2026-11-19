import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

type Db = Prisma.TransactionClient | typeof prisma;

// Movimentações só têm criar e listar (não existe update nem delete).
export const movementModel = {
  create: (data: { type: "ENTRY" | "EXIT"; quantity: number; note?: string; productId: number; userId: number }, db: Db) =>
    db.stockMovement.create({ data, include: { user: { select: { id: true, name: true } } } }),

  listByProduct: (productId: number) =>
    prisma.stockMovement.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
};
