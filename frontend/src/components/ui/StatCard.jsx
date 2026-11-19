// Adaptado do componente "Stats" do HyperUI (licença MIT):
// https://www.hyperui.dev/components/application/stats
// Mantido: <article> com borda e cantos arredondados, título pequeno e valor grande, selo no canto superior.
// Adaptado: textos em português, valores reais do estoque, selo colorido (alerta) em vez de variação percentual.
export default function StatCard({ title, value, hint, tone = "default", icon }) {
  const badge = tone === "alert" ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700";
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-gray-100 bg-white p-6 shadow-xs">
      <div className={`inline-flex gap-2 self-end rounded-sm p-1 ${badge}`}>{icon}</div>
      <div>
        <strong className="block text-sm font-medium text-gray-500">{title}</strong>
        <p>
          <span className="text-2xl font-medium text-gray-900">{value}</span>
          {hint && <span className="ml-2 text-xs text-gray-500">{hint}</span>}
        </p>
      </div>
    </article>
  );
}
