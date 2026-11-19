import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Configuração do Prisma 7: a URL do banco vem do ambiente (.env).
// `prisma generate` não conecta no banco, então (ex.: no build) ele precisa rodar
// mesmo sem DATABASE_URL. Por isso usamos um valor de preenchimento nesse caso;
// comandos que conectam (migrate, studio) falham com erro de conexão se faltar.
const url = process.env.DATABASE_URL
  ? env("DATABASE_URL")
  : "postgresql://sem-url-configurada:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url },
});
