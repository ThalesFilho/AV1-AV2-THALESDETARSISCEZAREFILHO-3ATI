import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userModel } from "../models/userModel.js";
import { AppError } from "../utils/AppError.js";
import { serializeUser } from "../utils/serializers.js";

// Hash falso usado para gastar o mesmo tempo quando o e-mail não existe.
const DUMMY_HASH = bcrypt.hashSync("senha-falsa", 10);

export const authService = {
  async register({ name, email, password }) {
    if (await userModel.findByEmail(email)) throw AppError.conflict("Já existe um usuário com este e-mail.");
    const passwordHash = await bcrypt.hash(password, 10);
    // O papel NUNCA vem do cliente: todo cadastro público é USER.
    const user = await userModel.create({ name, email, passwordHash, role: "USER" });
    return serializeUser(user);
  },

  async login({ email, password }) {
    const user = await userModel.findByEmail(email);
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    // Mensagem genérica: não revela se o e-mail existe.
    if (!user || !ok) throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    const token = jwt.sign({ sub: String(user.id), role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: "HS256",
    });
    return { token, user: serializeUser(user) };
  },
};
