import { createClient } from "@/lib/supabase/client";
import type { PaymentProvider } from "@/lib/payments/provider-catalog";

export type { PaymentProvider } from "@/lib/payments/provider-catalog";
export type PaymentConnectionStatus = "setup_required" | "pending_verification" | "active" | "disabled" | "failed";
export type PaymentConnectionKind = "regular" | "token";

export type PaymentConnection = {
  id: string;
  provider: PaymentProvider;
  connectionKind: PaymentConnectionKind;
  terminalId: string;
  status: PaymentConnectionStatus;
  lastVerifiedAt: string | null;
  createdAt: string;
};

type ConnectionRow = {
  id: string;
  provider: PaymentProvider;
  connection_kind: PaymentConnectionKind;
  terminal_id: string;
  status: PaymentConnectionStatus;
  last_verified_at: string | null;
  created_at: string;
};

function mapConnection(row: ConnectionRow): PaymentConnection {
  return {
    id: row.id,
    provider: row.provider,
    connectionKind: row.connection_kind,
    terminalId: row.terminal_id,
    status: row.status,
    lastVerifiedAt: row.last_verified_at,
    createdAt: row.created_at,
  };
}

export async function getNgoPaymentConnections(): Promise<PaymentConnection[]> {
  const { data, error } = await createClient().rpc("get_ngo_payment_connections");
  if (error) throw error;
  return ((data ?? []) as ConnectionRow[]).map(mapConnection);
}

export async function startNgoPaymentConnection(
  provider: PaymentProvider,
  terminalId: string,
  connectionKind: PaymentConnectionKind = "regular",
): Promise<void> {
  const { error } = await createClient().rpc("start_ngo_payment_connection", {
    p_provider: provider,
    p_terminal_id: terminalId,
    p_connection_kind: connectionKind,
  });
  if (error) throw error;
}
