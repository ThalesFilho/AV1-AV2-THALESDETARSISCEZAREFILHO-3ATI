import { app } from "./app.js";
import { env } from "./config/env.js";

// Escuta em 0.0.0.0 para funcionar também em hospedagens/containers.
app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`EstoqueFácil API rodando na porta ${env.PORT} (${env.NODE_ENV})`);
});
