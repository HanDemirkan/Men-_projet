import { apiFetch } from "@/lib/api-client";
import type { FetchResult } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth";

export interface LoginInput {
  email: string;
  password: string;
}

export function login(input: LoginInput): Promise<FetchResult<AuthUser>> {
  return apiFetch<AuthUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<FetchResult<{ loggedOut: true }>> {
  return apiFetch<{ loggedOut: true }>("/auth/logout", { method: "POST" });
}

export function getCurrentUser(): Promise<FetchResult<AuthUser>> {
  return apiFetch<AuthUser>("/auth/me");
}

export function forgotPassword(email: string): Promise<FetchResult<{ message: string }>> {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
