import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tailwind 4 funciona só com este plugin (sem tailwind.config.js nem postcss).
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
