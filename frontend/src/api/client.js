// Cliente HTTP simples baseado no fetch nativo.
const BASE_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "estoque.token";
const TIMEOUT_MS = 15000;

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearSession = () => localStorage.removeItem(TOKEN_KEY);

// Erro padronizado: status (0 = sem resposta), code, message e details (por campo).
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Rotas em que um 401 significa "senha errada", e não "sessão expirada".
const PUBLIC_PATHS = ["/auth/login", "/auth/register"];

export async function request(path, { method = "GET", body, signal } = {}) {
  // Cancela por tempo (timeout) ou pelo signal de quem chamou (ex.: busca nova).
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combined,
    });
  } catch (err) {
    if (signal?.aborted) throw err; // cancelado de propósito: quem chamou ignora
    if (timeout.signal.aborted) throw new ApiError(0, "TIMEOUT", "A requisição demorou demais.");
    throw new ApiError(0, "NETWORK", "Não foi possível conectar ao servidor.");
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const e = data?.error;
    const error = new ApiError(response.status, e?.code ?? "UNKNOWN", e?.message ?? "Erro inesperado.", e?.details);
    if (response.status === 401 && !PUBLIC_PATHS.includes(path)) {
      clearSession();
      window.dispatchEvent(new Event("auth:expired"));
    }
    if (response.status === 403) window.dispatchEvent(new Event("api:forbidden"));
    throw error;
  }
  return data;
}

// Mensagem amigável em português para mostrar ao usuário.
export function getErrorMessage(error) {
  if (!(error instanceof ApiError)) return "Ocorreu um erro inesperado. Tente novamente.";
  if (error.code === "NETWORK") return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  if (error.code === "TIMEOUT") return "O servidor demorou demais para responder. Tente novamente.";
  if (error.status === 403) return "Você não tem permissão para acessar este recurso.";
  if (error.status >= 500) return "Erro interno do servidor. Tente novamente em instantes.";
  return error.message;
}

// Erros por campo vindos do backend: { campo: "mensagem" }.
export function getFieldErrors(error) {
  const fields = {};
  if (error instanceof ApiError && error.status === 400 && error.details && typeof error.details === "object") {
    for (const [field, messages] of Object.entries(error.details)) {
      fields[field] = Array.isArray(messages) ? messages[0] : String(messages);
    }
  }
  return fields;
}
