import "dotenv/config";

// Lê e valida as variáveis de ambiente uma única vez, ao iniciar o app.
const erros = [];

function obrigatoria(nome) {
  const valor = process.env[nome];
  if (!valor) erros.push(`${nome} é obrigatória`);
  return valor ?? "";
}

const NODE_ENV = process.env.NODE_ENV || "development";
if (!["development", "production", "test"].includes(NODE_ENV)) erros.push("NODE_ENV deve ser development, production ou test");

const PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT <= 0) erros.push("PORT deve ser um número inteiro positivo");

const DATABASE_URL = obrigatoria("DATABASE_URL");
const JWT_SECRET = obrigatoria("JWT_SECRET");

// Em produção o segredo do JWT precisa ser forte.
if (NODE_ENV === "production" && JWT_SECRET.length < 32) {
  erros.push("Em produção, JWT_SECRET deve ter pelo menos 32 caracteres");
}

if (erros.length > 0) {
  console.error("Variáveis de ambiente inválidas:\n - " + erros.join("\n - "));
  process.exit(1);
}

export const env = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  DATABASE_SSL: process.env.DATABASE_SSL === "true",
  DATABASE_SSL_CA: process.env.DATABASE_SSL_CA || "", // opcional: certificado da CA do provedor
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "2h",
};

// Origens permitidas no CORS. Em desenvolvimento libera o Vite (5173).
export const corsOrigins = [
  ...(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, "")) // tira a barra final: o navegador envia a origem sem ela
    .filter(Boolean),
  ...(NODE_ENV !== "production" ? ["http://localhost:5173"] : []),
];
