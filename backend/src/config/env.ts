import "dotenv/config";
import { z } from "zod";

// Valida as variáveis de ambiente uma única vez, ao iniciar o app.
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET é obrigatória"),
  JWT_EXPIRES_IN: z.string().default("2h"),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Em produção o segredo do JWT precisa ser forte.
if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET.length < 32) {
  console.error("Em produção, JWT_SECRET deve ter pelo menos 32 caracteres.");
  process.exit(1);
}

export const env = parsed.data;

// Lista de origens permitidas no CORS. Em desenvolvimento libera o Vite (5173).
export const corsOrigins: string[] = [
  ...env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
  ...(env.NODE_ENV !== "production" ? ["http://localhost:5173"] : []),
];
