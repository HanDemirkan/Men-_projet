"use client";

import type { HealthStatus } from "@qr-platform/shared";
import { useEffect, useState } from "react";

import { fetchHealth } from "../lib/api-client";

export type HealthQueryState =
  | { state: "loading" }
  | { state: "success"; data: HealthStatus }
  | { state: "error"; message: string };

export function useHealthStatus(): HealthQueryState {
  const [state, setState] = useState<HealthQueryState>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchHealth()
      .then((result) => {
        if (cancelled) {
          return;
        }
        setState(
          result.status === "success"
            ? { state: "success", data: result.data }
            : { state: "error", message: result.message },
        );
      })
      .catch(() => {
        if (!cancelled) {
          setState({ state: "error", message: "Beklenmeyen bir hata oluştu." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
