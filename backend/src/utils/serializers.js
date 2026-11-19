// Converte registros do banco para o JSON devolvido pela API (a "view" do MVC).
export function serializeUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

export function serializeProduct(p, isAdmin = false) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    unitPrice: Number(p.unitPrice), // Decimal do Prisma -> number
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

export function serializeMovement(m) {
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
