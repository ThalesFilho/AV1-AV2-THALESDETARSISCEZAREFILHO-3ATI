import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "../config/env.js";

// Prisma 7 usa um "adapter" para falar com o MySQL. Montamos as opções a partir da DATABASE_URL.
const url = new URL(env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  connectionLimit: 10,
  // Bancos na nuvem normalmente exigem SSL (DATABASE_SSL=true).
  ...(env.DATABASE_SSL ? { ssl: true } : {}),
});

// Um único cliente, reutilizado em todo o app.
export const prisma = new PrismaClient({ adapter });
