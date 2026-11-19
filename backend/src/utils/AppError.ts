// Erro de negócio/HTTP com código e status, tratado pelo errorHandler.
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static validation(message: string, details?: unknown) {
    return new AppError(400, "VALIDATION_ERROR", message, details);
  }
  static unauthenticated(message = "Autenticação necessária.") {
    return new AppError(401, "UNAUTHENTICATED", message);
  }
  static forbidden(message = "Você não tem permissão para acessar este recurso.") {
    return new AppError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Recurso não encontrado.") {
    return new AppError(404, "NOT_FOUND", message);
  }
  static conflict(message: string) {
    return new AppError(409, "CONFLICT", message);
  }
  static insufficientStock(available: number, requested: number) {
    return new AppError(
      422,
      "INSUFFICIENT_STOCK",
      `Estoque insuficiente: disponível ${available}, solicitado ${requested}.`,
    );
  }
}
