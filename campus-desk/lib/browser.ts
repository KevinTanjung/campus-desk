"use client";
import { useCallback, useEffect, useState } from "react";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient();
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
export async function api<T>(
  url: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && method === "GET")
      window.location.assign("/login");
    throw new ApiError(
      response.status === 401
        ? "Your session has expired. Log in in another tab, then retry. Your changes are still here."
        : data.error?.message || "The request failed. Please try again.",
      response.status,
      data.error?.fields,
    );
  }
  return data;
}
export function useResource<T>(url: string) {
  const [state, setState] = useState<{
    data?: T;
    error?: Error;
    loading: boolean;
  }>({ loading: true });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    api<T>(url, "GET", undefined, controller.signal)
      .then((data) => setState({ data, loading: false }))
      .catch((error) => {
        if (!controller.signal.aborted) setState({ error, loading: false });
      });
    return () => controller.abort();
  }, [url, version]);
  return { ...state, reload };
}

export function authErrorMessage(status: number, register: boolean) {
  if (status === 429)
    return "Too many attempts. Please wait a minute and try again.";
  if (status >= 500) return "The service is unavailable. Please try again.";
  return register
    ? "Could not create your account. Check your details or log in if you already have an account."
    : "Email or password is incorrect. Please try again.";
}
