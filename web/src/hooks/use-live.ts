"use client";

import { useCallback, useEffect, useState } from "react";
import { data } from "@/lib/data";

/** Charge une donnée et la recharge à chaque changement (temps réel simulé ou Supabase Realtime plus tard). */
export function useLive<T>(load: () => Promise<T>, deps: unknown[], channel = "*") {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      run().then(
        (v) => alive && (setValue(v), setError(null)),
        (e: unknown) => alive && setError(e instanceof Error ? e : new Error(String(e))),
      );
    refresh();
    const off = data.subscribe(channel, refresh);
    return () => {
      alive = false;
      off();
    };
  }, [run, channel]);

  return { value, error, loading: value === undefined && !error };
}
