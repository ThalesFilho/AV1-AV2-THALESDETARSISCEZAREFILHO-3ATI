import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./toastContext.js";
import Toast from "../components/ui/Toast.jsx";

// Provedor de avisos rápidos (toasts). Uso: const toast = useToast(); toast.success("...").
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const api = useMemo(() => {
    // Não repete um aviso idêntico que ainda está na tela (ex.: duas chamadas com 403 ao mesmo tempo).
    const add = (type, message) =>
      setToasts((list) => (list.some((t) => t.message === message) ? list : [...list, { id: crypto.randomUUID(), type, message }]));
    return {
      success: (message) => add("success", message),
      error: (message) => add("error", message),
      info: (message) => add("info", message),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
