export function notFound(req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `Rota não encontrada: ${req.method} ${req.path}` } });
}
