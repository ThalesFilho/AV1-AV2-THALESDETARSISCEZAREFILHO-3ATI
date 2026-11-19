import { useId } from "react";

export default function Select({ label, error, className = "", children, ...props }) {
  const id = useId();
  const errorId = `${id}-erro`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-xs focus:outline-2 focus:outline-teal-600 ${error ? "border-red-500" : "border-gray-300"}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
