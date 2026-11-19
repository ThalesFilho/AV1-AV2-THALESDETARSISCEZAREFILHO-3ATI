import { AppError } from "../utils/AppError.js";

// Restringe a rota a determinados papéis (ex.: authorize("ADMIN")).
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(res.locals.user?.role)) throw AppError.forbidden();
  next();
};
