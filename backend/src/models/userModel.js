import { prisma } from "../lib/prisma.js";

// Acesso a dados de usuários (somente Prisma, sem regra de negócio).
export const userModel = {
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  create: (data) => prisma.user.create({ data }),
};
