import type { Request, Response } from "express";
import { productService } from "../services/productService.js";

export const productController = {
  async list(req: Request, res: Response) {
    res.json({ products: await productService.list(res.locals.user, res.locals.query) });
  },
  async get(req: Request, res: Response) {
    res.json({ product: await productService.get(res.locals.user, res.locals.params.id) });
  },
  async create(req: Request, res: Response) {
    res.status(201).json({ product: await productService.create(res.locals.user, res.locals.body) });
  },
  async update(req: Request, res: Response) {
    res.json({ product: await productService.update(res.locals.user, res.locals.params.id, res.locals.body) });
  },
  async remove(req: Request, res: Response) {
    await productService.remove(res.locals.user, res.locals.params.id);
    res.status(204).send();
  },
};
