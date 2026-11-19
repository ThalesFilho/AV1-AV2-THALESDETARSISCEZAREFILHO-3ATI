import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().regex(/^\d{1,9}$/, "O id deve ser um número inteiro positivo.").transform(Number),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(200),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Senha é obrigatória."),
});

const name = z.string().trim().min(1, "Nome é obrigatório.").max(150);
const sku = z.string().trim().min(1, "SKU é obrigatório.").max(60).transform((s) => s.toUpperCase());
const category = z.string().trim().min(1, "Categoria é obrigatória.").max(80);
const unitPrice = z
  .number({ error: "Preço deve ser um número." })
  .min(0, "Preço não pode ser negativo.")
  .max(99999999.99, "Preço muito alto.")
  .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, "Preço deve ter no máximo 2 casas decimais.");
const minStock = z
  .number({ error: "Estoque mínimo deve ser um número." })
  .int("Estoque mínimo deve ser inteiro.")
  .min(0, "Estoque mínimo não pode ser negativo.")
  .max(1000000000, "Estoque mínimo muito alto.");

export const createProductSchema = z.object({ name, sku, category, unitPrice, minStock: minStock.default(0) });

// "quantity" nunca é editado direto: .strict() rejeita campos desconhecidos (inclusive quantity).
export const updateProductSchema = z
  .strictObject(
    {
      name: name.optional(),
      sku: sku.optional(),
      category: category.optional(),
      unitPrice: unitPrice.optional(),
      minStock: minStock.optional(),
    },
    {
      error: (issue) =>
        issue.code === "unrecognized_keys"
          ? "Campo não permitido. O estoque (quantity) só pode ser alterado por movimentações."
          : undefined,
    },
  )
  .refine((o) => Object.keys(o).length > 0, "Envie pelo menos um campo para atualizar.");

export const listProductsQuerySchema = z.object({
  search: z.string().trim().optional(),
  lowStock: z.enum(["true", "false"]).optional(),
});

export const createMovementSchema = z.object({
  type: z.enum(["ENTRY", "EXIT"], { error: "Tipo deve ser ENTRY ou EXIT." }),
  quantity: z
    .number({ error: "Quantidade deve ser um número." })
    .int("Quantidade deve ser inteira.")
    .min(1, "Quantidade mínima é 1.")
    .max(1000000, "Quantidade máxima é 1000000."),
  note: z.string().trim().max(300).optional(),
});
