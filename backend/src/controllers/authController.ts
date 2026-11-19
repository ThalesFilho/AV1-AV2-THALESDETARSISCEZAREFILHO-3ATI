import type { Request, Response } from "express";
import { authService } from "../services/authService.js";

// Controllers só recebem a requisição, chamam o service e devolvem o JSON.
export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(res.locals.body);
    res.status(201).json({ user });
  },
  async login(req: Request, res: Response) {
    res.json(await authService.login(res.locals.body));
  },
  async me(req: Request, res: Response) {
    res.json({ user: res.locals.user });
  },
};
