import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError.js";

type Source = "body" | "params" | "query";

// Valida req.body / req.params / req.query com zod e guarda o resultado em res.locals[source].
export const validate = (source: Source, schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(source === "body" ? (req.body ?? {}) : req[source]);
  if (!result.success) {
    const details: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join(".") || "_";
      (details[field] ??= []).push(issue.message);
    }
    throw AppError.validation(result.error.issues[0]?.message ?? "Dados inválidos.", details);
  }
  res.locals[source] = result.data;
  next();
};
