import type { Request, Response } from "express";
import { movementService } from "../services/movementService.js";

export const movementController = {
  async create(req: Request, res: Response) {
    const result = await movementService.register(res.locals.user, res.locals.params.id, res.locals.body);
    res.status(201).json(result);
  },
  async list(req: Request, res: Response) {
    res.json({ movements: await movementService.list(res.locals.user, res.locals.params.id) });
  },
};
