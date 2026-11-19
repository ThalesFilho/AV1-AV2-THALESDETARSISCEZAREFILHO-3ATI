import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

// Executa várias operações do banco como uma unidade: ou todas valem, ou nenhuma.
export const runInTransaction = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(fn);
