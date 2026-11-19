import { prisma } from "../lib/prisma.js";

// Executa várias operações do banco como uma unidade: ou todas valem, ou nenhuma.
export const runInTransaction = (fn) => prisma.$transaction(fn);
