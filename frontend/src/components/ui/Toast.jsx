import { useEffect } from "react";

const styles = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-teal-200 bg-teal-50 text-teal-800",
};

// Aviso que some sozinho. Erros usam role="alert"; os demais role="status".
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${styles[toast.type]}`}
    >
      <p className="flex-1">{toast.message}</p>
      <button type="button" onClick={() => onClose(toast.id)} className="rounded-sm px-1 font-bold focus-visible:outline-2" aria-label="Fechar aviso">
        ×
      </button>
    </div>
  );
}
