import { useId } from "react";

// Campo de texto com label e mensagem de erro ligados por aria (acessível).
export default function Input({ label, error, hint, className = "", ...props }) {
  const id = useId();
  const errorId = `${id}-erro`;
  const hintId = `${id}-dica`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined}
        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-xs focus:outline-2 focus:outline-offset-0 focus:outline-teal-600 ${error ? "border-red-500" : "border-gray-300"}`}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
