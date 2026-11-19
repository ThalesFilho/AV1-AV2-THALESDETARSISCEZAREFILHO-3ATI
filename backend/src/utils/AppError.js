// Erro de negócio/HTTP com código e status, tratado pelo errorHandler.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static validation(message, details) {
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
  static conflict(message) {
    return new AppError(409, "CONFLICT", message);
  }
  static insufficientStock(available, requested) {
    return new AppError(422, "INSUFFICIENT_STOCK", `Estoque insuficiente: disponível ${available}, solicitado ${requested}.`);
  }
}
