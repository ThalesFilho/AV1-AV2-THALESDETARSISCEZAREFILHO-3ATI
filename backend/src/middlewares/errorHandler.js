import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

// Último middleware: transforma qualquer erro no formato {"error":{code,message,details?}}.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }
  // JSON malformado ou corpo grande demais.
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    const message = err.type === "entity.parse.failed" ? "JSON malformado." : "Corpo da requisição muito grande.";
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message } });
  }
  // Violação de unicidade do Prisma (e-mail ou SKU duplicado).
  if (err?.code === "P2002") {
    return res.status(409).json({ error: { code: "CONFLICT", message: "Registro duplicado." } });
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor.",
      ...(env.NODE_ENV !== "production" ? { details: String(err?.stack ?? err) } : {}),
    },
  });
}
