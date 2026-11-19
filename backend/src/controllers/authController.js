import { authService } from "../services/authService.js";

// Controllers só recebem a requisição, chamam o service e devolvem o JSON.
export const authController = {
  async register(req, res) {
    const user = await authService.register(res.locals.body);
    res.status(201).json({ user });
  },
  async login(req, res) {
    res.json(await authService.login(res.locals.body));
  },
  async me(req, res) {
    res.json({ user: res.locals.user });
  },
};
