import { productModel } from "../models/productModel.js";
import { movementModel } from "../models/movementModel.js";
import { runInTransaction } from "../models/transaction.js";
import { AppError } from "../utils/AppError.js";
import type { AuthUser } from "../utils/assertOwnerOrAdmin.js";
import { serializeMovement, serializeProduct } from "../utils/serializers.js";
import { getAuthorizedProduct } from "./productService.js";

export const movementService = {
  async register(user: AuthUser, productId: number, input: { type: "ENTRY" | "EXIT"; quantity: number; note?: string }) {
    await getAuthorizedProduct(user, productId); // 404 antes de 403

    const { movement, product } = await runInTransaction(async (tx) => {
      if (input.type === "ENTRY") {
        await productModel.increment(productId, input.quantity, tx);
      } else {
        // REGRA DE NEGÓCIO: a saída não pode passar do saldo.
        // Em vez de "ler o saldo, comparar e depois gravar" (duas requisições simultâneas
        // leriam o mesmo saldo e ambas passariam, deixando o estoque negativo), fazemos
        // um UPDATE condicional (saldo >= quantidade). O banco trava a linha, então
        // cada saída é conferida e aplicada de forma atômica. Só criamos a movimentação
        // se exatamente 1 linha foi alterada.
        const count = await productModel.decrementIfEnough(productId, input.quantity, tx);
        if (count !== 1) {
          const current = await productModel.findById(productId, tx);
          if (!current) throw AppError.notFound("Produto não encontrado.");
          throw AppError.insufficientStock(current.quantity, input.quantity);
        }
      }
      const movement = await movementModel.create({ ...input, productId, userId: user.id }, tx);
      const product = await productModel.findById(productId, tx);
      return { movement, product: product! };
    });

    return { movement: serializeMovement(movement), product: serializeProduct(product, user.role === "ADMIN") };
  },

  async list(user: AuthUser, productId: number) {
    await getAuthorizedProduct(user, productId);
    const movements = await movementModel.listByProduct(productId);
    return movements.map(serializeMovement);
  },
};
