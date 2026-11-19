import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { productController } from "../controllers/productController.js";
import { movementController } from "../controllers/movementController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import {
  validateCreateProduct,
  validateId,
  validateListQuery,
  validateLogin,
  validateMovement,
  validateRegister,
  validateUpdateProduct,
} from "../validators/index.js";

export const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Autenticação
router.post("/auth/register", validate("body", validateRegister), authController.register);
router.post("/auth/login", validate("body", validateLogin), authController.login);
router.get("/auth/me", authenticate, authController.me);

// Produtos (todas as rotas abaixo exigem login)
router.use("/products", authenticate);
router.get("/products", validate("query", validateListQuery), productController.list);
router.post("/products", validate("body", validateCreateProduct), productController.create);
router.get("/products/:id", validate("params", validateId), productController.get);
router.put("/products/:id", validate("params", validateId), validate("body", validateUpdateProduct), productController.update);
router.delete("/products/:id", validate("params", validateId), productController.remove);

// Movimentações de estoque
router.post("/products/:id/movements", validate("params", validateId), validate("body", validateMovement), movementController.create);
router.get("/products/:id/movements", validate("params", validateId), movementController.list);
