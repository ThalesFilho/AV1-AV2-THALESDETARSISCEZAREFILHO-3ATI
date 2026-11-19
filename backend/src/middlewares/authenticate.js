import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { userModel } from "../models/userModel.js";

// Lê o "Authorization: Bearer <token>", valida o JWT e carrega o usuário do banco.
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) throw AppError.unauthenticated();
  const token = header.slice(7).trim();

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "TOKEN_EXPIRED", "Token expirado. Faça login novamente.");
    }
    throw AppError.unauthenticated("Token inválido.");
  }

  const user = await userModel.findById(Number(payload.sub));
  if (!user) throw AppError.unauthenticated("Usuário do token não existe mais.");
  res.locals.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
}
