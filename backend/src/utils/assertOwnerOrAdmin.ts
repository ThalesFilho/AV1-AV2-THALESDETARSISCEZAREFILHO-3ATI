import { AppError } from "./AppError.js";

export type AuthUser = { id: number; name: string; email: string; role: "USER" | "ADMIN" };

// Só o dono do recurso (ou um ADMIN) pode continuar; senão 403.
export function assertOwnerOrAdmin(user: AuthUser, ownerId: number) {
  if (user.role !== "ADMIN" && user.id !== ownerId) {
    throw AppError.forbidden();
  }
}
