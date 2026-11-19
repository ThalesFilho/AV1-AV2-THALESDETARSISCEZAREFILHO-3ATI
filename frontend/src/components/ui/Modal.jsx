// Adaptado do componente "Modal - Base" do HyperUI (licença MIT):
// https://www.hyperui.dev/components/application/modals
// Mantido: elemento <dialog> nativo, classes do cartão (rounded-lg, p-6, shadow-lg, backdrop:bg-black/50),
// aria-labelledby/aria-describedby. Adaptado: virou componente React (abre com showModal() ao montar),
// fecha com Esc e clique fora, devolve o foco ao botão que abriu, título/rodapé em português.
import { useEffect, useId, useRef } from "react";

export default function Modal({ open, onClose, title, description, children, footer }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement; // para devolver o foco ao fechar
    if (ref.current && !ref.current.open) ref.current.showModal(); // showModal prende o foco dentro do diálogo
    return () => opener?.focus?.();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault(); // Esc
        onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose(); // clique no fundo escuro
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg bg-white p-0 shadow-lg backdrop:bg-black/50"
    >
      <div className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-gray-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-sm px-2 text-2xl leading-none text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        {description && (
          <p id={descId} className="text-pretty text-gray-700">
            {description}
          </p>
        )}
        {children}
        {footer && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  );
}
