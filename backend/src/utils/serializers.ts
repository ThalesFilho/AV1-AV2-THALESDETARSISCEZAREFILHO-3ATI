// Converte registros do banco para o JSON devolvido pela API (a "view").
export function serializeUser(u: { id: number; name: string; email: string; role: string; createdAt: Date }) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

type ProductRow = {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: { toNumber(): number } | number;
  minStock: number;
  quantity: number;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  owner?: { id: number; name: string };
};

export function serializeProduct(p: ProductRow, isAdmin = false) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    unitPrice: typeof p.unitPrice === "number" ? p.unitPrice : p.unitPrice.toNumber(),
    minStock: p.minStock,
    quantity: p.quantity,
    lowStock: p.quantity <= p.minStock,
    ownerId: p.ownerId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    // O dono só é exibido para ADMIN.
    ...(isAdmin && p.owner ? { owner: { id: p.owner.id, name: p.owner.name } } : {}),
  };
}

export function serializeMovement(m: {
  id: number;
  type: string;
  quantity: number;
  note: string | null;
  productId: number;
  userId: number;
  createdAt: Date;
  user?: { id: number; name: string };
}) {
  return {
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    note: m.note,
    productId: m.productId,
    userId: m.userId,
    createdAt: m.createdAt,
    ...(m.user ? { user: { id: m.user.id, name: m.user.name } } : {}),
  };
}
