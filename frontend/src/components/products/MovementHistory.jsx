import Alert from "../ui/Alert.jsx";
import Button from "../ui/Button.jsx";
import Spinner from "../ui/Spinner.jsx";
import { getErrorMessage } from "../../api/client.js";
import { formatDateTime } from "../../utils/format.js";

const typeLabel = (m) => (m.type === "ENTRY" ? `+${m.quantity}` : `−${m.quantity}`);
const typeColor = (m) => (m.type === "ENTRY" ? "text-green-700" : "text-red-700");

// Histórico: tabela no desktop e lista no celular.
export default function MovementHistory({ movements, loading, error, onRetry }) {
  let body;
  if (loading && !movements) {
    body = (
      <div className="flex justify-center py-8 text-teal-700">
        <Spinner label="Carregando histórico..." />
      </div>
    );
  } else if (error) {
    body = (
      <Alert>
        <p>{getErrorMessage(error)}</p>
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Tentar novamente
        </Button>
      </Alert>
    );
  } else if (!movements || movements.length === 0) {
    body = <p className="py-6 text-center text-sm text-gray-500">Nenhuma movimentação registrada ainda.</p>;
  } else {
    body = (
      <>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y-2 divide-gray-200 text-sm">
            <thead className="text-left">
              <tr className="*:font-medium *:text-gray-900">
                <th className="px-3 py-2 whitespace-nowrap">Data</th>
                <th className="px-3 py-2 whitespace-nowrap">Tipo</th>
                <th className="px-3 py-2 whitespace-nowrap">Quantidade</th>
                <th className="px-3 py-2 whitespace-nowrap">Observação</th>
                <th className="px-3 py-2 whitespace-nowrap">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{m.type === "ENTRY" ? "Entrada" : "Saída"}</td>
                  <td className={`px-3 py-2 font-medium whitespace-nowrap ${typeColor(m)}`}>{typeLabel(m)}</td>
                  <td className="px-3 py-2">{m.note || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{m.user?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-gray-100 md:hidden">
          {movements.map((m) => (
            <li key={m.id} className="py-3 text-sm">
              <div className="flex justify-between">
                <span className={`font-medium ${typeColor(m)}`}>
                  {m.type === "ENTRY" ? "Entrada" : "Saída"} {typeLabel(m)}
                </span>
                <span className="text-xs text-gray-500">{formatDateTime(m.createdAt)}</span>
              </div>
              {m.note && <p className="text-gray-700">{m.note}</p>}
              <p className="text-xs text-gray-500">Por {m.user?.name}</p>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <section aria-label="Histórico de movimentações" className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Histórico de movimentações</h2>
      {body}
    </section>
  );
}
