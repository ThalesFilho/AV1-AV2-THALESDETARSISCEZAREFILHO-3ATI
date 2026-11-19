import { request } from "./client.js";

export const authApi = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  register: (name, email, password) => request("/auth/register", { method: "POST", body: { name, email, password } }),
  me: (signal) => request("/auth/me", { signal }),
};
