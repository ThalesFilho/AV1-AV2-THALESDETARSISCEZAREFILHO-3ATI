import { productModel } from "../models/productModel.js";
import { AppError } from "../utils/AppError.js";
import { assertOwnerOrAdmin, type AuthUser } from "../utils/assertOwnerOrAdmin.js";
import { serializeProduct } from "../utils/serializers.js";

// Busca o produto: 404 se não existe; 403 se é de outro usuário (nessa ordem).
export async function getAuthorizedProduct(user: AuthUser, id: number) {
  const product = await productModel.findById(id);
  if (!product) throw AppError.notFound("Produto não encontrado.");
  assertOwnerOrAdmin(user, product.ownerId);
  return product;
}

export const productService = {
  async list(user: AuthUser, query: { search?: string; lowStock?: "true" | "false" }) {
    const products = await productModel.list({
      ownerId: user.role === "ADMIN" ? undefined : user.id, // USER só vê os próprios
      search: query.search || undefined,
      lowStock: query.lowStock === "true",
    });
    return products.map((p) => serializeProduct(p, user.role === "ADMIN"));
  },

  async get(user: AuthUser, id: number) {
    return serializeProduct(await getAuthorizedProduct(user, id), user.role === "ADMIN");
  },

  async create(user: AuthUser, data: { name: string; sku: string; category: string; unitPrice: number; minStock: number }) {
    // Quantidade inicial é sempre 0; o saldo só muda por movimentações.
    const product = await productModel.create({ ...data, ownerId: user.id });
    return serializeProduct(product, user.role === "ADMIN");
  },

  async update(user: AuthUser, id: number, data: Record<string, unknown>) {
    await getAuthorizedProduct(user, id);
    const product = await productModel.update(id, data);
    return serializeProduct(product, user.role === "ADMIN");
  },

  async remove(user: AuthUser, id: number) {
    await getAuthorizedProduct(user, id);
    await productModel.delete(id); // movimentações caem em cascata
  },
};
