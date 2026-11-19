import { productModel } from "../models/productModel.js";
import { AppError } from "../utils/AppError.js";
import { assertOwnerOrAdmin } from "../utils/assertOwnerOrAdmin.js";
import { serializeProduct } from "../utils/serializers.js";

// Busca o produto: 404 se não existe; 403 se é de outro usuário (nessa ordem).
export async function getAuthorizedProduct(user, id) {
  const product = await productModel.findById(id);
  if (!product) throw AppError.notFound("Produto não encontrado.");
  assertOwnerOrAdmin(user, product.ownerId);
  return product;
}

export const productService = {
  async list(user, { search, lowStock }) {
    const products = await productModel.list({
      ownerId: user.role === "ADMIN" ? undefined : user.id, // USER só vê os próprios
      search: search || undefined,
      lowStock,
    });
    return products.map((p) => serializeProduct(p, user.role === "ADMIN"));
  },

  async get(user, id) {
    return serializeProduct(await getAuthorizedProduct(user, id), user.role === "ADMIN");
  },

  async create(user, data) {
    // Quantidade inicial é sempre 0; o saldo só muda por movimentações.
    const product = await productModel.create({ ...data, ownerId: user.id });
    return serializeProduct(product, user.role === "ADMIN");
  },

  async update(user, id, data) {
    await getAuthorizedProduct(user, id);
    const product = await productModel.update(id, data);
    return serializeProduct(product, user.role === "ADMIN");
  },

  async remove(user, id) {
    await getAuthorizedProduct(user, id);
    await productModel.delete(id); // movimentações caem em cascata
  },
};
