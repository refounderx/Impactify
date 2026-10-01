import "server-only";

import type { PaymentProvider } from "@/lib/payments/provider-catalog";

type TerminalCredential = {
  provider: PaymentProvider;
  terminalId: string;
  username?: string;
  terminalPassword?: string;
  appKey?: string;
  secret?: string;
};

/**
 * Credentials are deployment secrets, never NGO-entered form values or database
 * fields. This permits one deployment to serve several NGO-owned terminals.
 */
export function findTerminalCredential(provider: PaymentProvider, terminalId: string): TerminalCredential | null {
  const raw = process.env.PAYMENT_TERMINAL_CREDENTIALS_JSON;
  if (!raw) return null;
  try {
    const values = JSON.parse(raw) as unknown;
    if (!Array.isArray(values)) return null;
    const match = values.find((value): value is TerminalCredential => (
      typeof value === "object" && value !== null &&
      (value as TerminalCredential).provider === provider &&
      (value as TerminalCredential).terminalId === terminalId &&
      (provider !== "cardcom" || typeof (value as TerminalCredential).username === "string") &&
      (provider !== "tranzila" || (
        typeof (value as TerminalCredential).terminalPassword === "string"
      ))
    ));
    return match ?? null;
  } catch {
    return null;
  }
}
