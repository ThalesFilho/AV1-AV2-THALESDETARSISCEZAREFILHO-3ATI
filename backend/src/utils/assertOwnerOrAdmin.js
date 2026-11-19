import { AppError } from "./AppError.js";

// Só o dono do recurso (ou um ADMIN) pode continuar; senão 403.
export function assertOwnerOrAdmin(user, ownerId) {
  if (user.role !== "ADMIN" && user.id !== ownerId) {
    throw AppError.forbidden();
  }
}
