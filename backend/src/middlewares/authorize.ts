import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

// Restringe a rota a determinados papéis (ex.: authorize("ADMIN")).
export const authorize = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!roles.includes(res.locals.user?.role)) throw AppError.forbidden();
  next();
};
