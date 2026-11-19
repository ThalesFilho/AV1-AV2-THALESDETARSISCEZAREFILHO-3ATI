import { movementService } from "../services/movementService.js";

export const movementController = {
  async create(req, res) {
    const result = await movementService.register(res.locals.user, res.locals.params.id, res.locals.body);
    res.status(201).json(result);
  },
  async list(req, res) {
    res.json({ movements: await movementService.list(res.locals.user, res.locals.params.id) });
  },
};
