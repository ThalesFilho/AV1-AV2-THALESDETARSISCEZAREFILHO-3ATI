const colors = {
  red: "bg-red-100 text-red-700",
  green: "bg-green-100 text-green-700",
  teal: "bg-teal-100 text-teal-800",
  gray: "bg-gray-100 text-gray-700",
};

export default function Badge({ color = "gray", children }) {
  return <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap ${colors[color]}`}>{children}</span>;
}
