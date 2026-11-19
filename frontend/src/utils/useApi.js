import { useCallback, useEffect, useRef, useState } from "react";

// Busca dados e controla carregando/erro. Cancela a requisição anterior quando a
// chave muda (evita condição de corrida na busca). "reload" refaz a busca.
export function useApi(fetcher, key) {
  const [result, setResult] = useState({ key: null });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  const fullKey = `${key}#${tick}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    const controller = new AbortController();
    fetcherRef.current(controller.signal).then(
      (data) => setResult({ key: fullKey, data }),
      (error) => {
        if (!controller.signal.aborted) setResult({ key: fullKey, error });
      },
    );
    return () => controller.abort();
  }, [fullKey]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const loading = result.key !== fullKey;
  // Mantém os dados antigos enquanto recarrega (a tela não "pisca").
  return { data: result.data, error: loading ? undefined : result.error, loading, reload };
}
