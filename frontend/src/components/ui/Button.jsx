import Spinner from "./Spinner.jsx";

const variants = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 focus-visible:outline-teal-700",
  secondary: "bg-gray-100 text-teal-700 hover:bg-gray-200 focus-visible:outline-teal-700",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  ghost: "text-gray-700 hover:bg-gray-100 focus-visible:outline-teal-700",
};

// Botão com estado de carregamento: fica desabilitado enquanto envia.
export default function Button({ variant = "primary", loading = false, disabled, className = "", children, type = "button", ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
