import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "../config/env.js";
import { buildDbConfig } from "./dbConfig.js";

// Prisma 7 usa um "adapter" para falar com o MySQL.
// DATABASE_SSL=true liga o SSL/TLS (bancos na nuvem normalmente exigem).
const adapter = new PrismaMariaDb(buildDbConfig(env.DATABASE_URL, env.DATABASE_SSL, env.DATABASE_SSL_CA));

// Um único cliente, reutilizado em todo o app.
export const prisma = new PrismaClient({ adapter });
