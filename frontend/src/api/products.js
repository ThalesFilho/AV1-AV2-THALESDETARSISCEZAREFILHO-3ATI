import { request } from "./client.js";

export const productsApi = {
  list: ({ search, lowStock } = {}, signal) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (lowStock) params.set("lowStock", "true");
    const qs = params.toString();
    return request(`/products${qs ? `?${qs}` : ""}`, { signal });
  },
  get: (id, signal) => request(`/products/${id}`, { signal }),
  create: (data) => request("/products", { method: "POST", body: data }),
  update: (id, data) => request(`/products/${id}`, { method: "PUT", body: data }),
  remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
  movements: (id, signal) => request(`/products/${id}/movements`, { signal }),
  addMovement: (id, data) => request(`/products/${id}/movements`, { method: "POST", body: data }),
};
