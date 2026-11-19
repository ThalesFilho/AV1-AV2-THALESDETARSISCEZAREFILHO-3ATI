import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

// Cria (ou promove) o usuário ADMIN usando ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD do ambiente.
// Pode rodar várias vezes: se já existir, não duplica. Nunca imprime a senha.
const name = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password) {
  console.error("Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no ambiente.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("ADMIN_PASSWORD deve ter pelo menos 8 caracteres.");
  process.exit(1);
}

try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
      console.log(`Usuário ${email} promovido a ADMIN.`);
    } else {
      console.log(`ADMIN ${email} já existe. Nada a fazer.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, email, passwordHash, role: "ADMIN" } });
    console.log(`ADMIN ${email} criado com sucesso.`);
  }
} finally {
  await prisma.$disconnect();
}
