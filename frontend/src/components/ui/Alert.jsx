const styles = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-teal-200 bg-teal-50 text-teal-800",
};

export default function Alert({ type = "error", children, className = "" }) {
  return (
    <div role={type === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${styles[type]} ${className}`}>
      {children}
    </div>
  );
}
