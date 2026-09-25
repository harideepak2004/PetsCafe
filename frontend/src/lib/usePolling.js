import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data with `fetcher` whenever `deps` change and refreshes it every
 * `interval` ms while the tab is visible.
 * Returns { data, error, loading, reload, setData }.
 */
export function usePolling(fetcher, deps = [], interval = 0) {
  const key = JSON.stringify(deps);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const load = useCallback(async (forKey) => {
    try {
      const data = await fetcherRef.current();
      setState({ key: forKey, data, error: null });
    } catch (error) {
      if (error.name !== "AbortError") setState((s) => ({ ...s, key: forKey, error }));
    }
  }, []);

  useEffect(() => {
    load(key);
    if (!interval) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load(key);
    }, interval);
    return () => clearInterval(id);
  }, [load, key, interval]);

  const reload = useCallback(() => load(key), [load, key]);
  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);

  return {
    data: state.data,
    error: state.error,
    loading: state.key !== key,
    reload,
    setData,
  };
}

/** Re-renders every `ms` so running timers/costs stay current. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
