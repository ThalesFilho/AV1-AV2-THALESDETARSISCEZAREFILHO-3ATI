import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";
import { buildDbConfig } from "./dbConfig.js";

// Prisma 7 usa um "adapter" para falar com o PostgreSQL (driver "pg").
// DATABASE_SSL=true liga o SSL (o Supabase exige).
const adapter = new PrismaPg(buildDbConfig(env.DATABASE_URL, env.DATABASE_SSL, env.DATABASE_SSL_CA));

// Um único cliente, reutilizado em todo o app.
export const prisma = new PrismaClient({ adapter });
