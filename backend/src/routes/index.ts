import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { productController } from "../controllers/productController.js";
import { movementController } from "../controllers/movementController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import {
  createMovementSchema,
  createProductSchema,
  idParamsSchema,
  listProductsQuerySchema,
  loginSchema,
  registerSchema,
  updateProductSchema,
} from "../validators/schemas.js";

export const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Autenticação
router.post("/auth/register", validate("body", registerSchema), authController.register);
router.post("/auth/login", validate("body", loginSchema), authController.login);
router.get("/auth/me", authenticate, authController.me);

// Produtos (todas as rotas abaixo exigem login)
router.use("/products", authenticate);
router.get("/products", validate("query", listProductsQuerySchema), productController.list);
router.post("/products", validate("body", createProductSchema), productController.create);
router.get("/products/:id", validate("params", idParamsSchema), productController.get);
router.put("/products/:id", validate("params", idParamsSchema), validate("body", updateProductSchema), productController.update);
router.delete("/products/:id", validate("params", idParamsSchema), productController.remove);

// Movimentações de estoque
router.post("/products/:id/movements", validate("params", idParamsSchema), validate("body", createMovementSchema), movementController.create);
router.get("/products/:id/movements", validate("params", idParamsSchema), movementController.list);
