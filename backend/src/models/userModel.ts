import { prisma } from "../lib/prisma.js";

// Acesso a dados de usuários (somente Prisma, sem regra de negócio).
export const userModel = {
  findById: (id: number) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  create: (data: { name: string; email: string; passwordHash: string; role?: "USER" | "ADMIN" }) =>
    prisma.user.create({ data }),
};
