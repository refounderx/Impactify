import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import type { PaymentProvider } from "@/lib/payments/provider-catalog";
import { findTerminalCredential } from "@/lib/payments/server-config";

type CheckoutInput = { provider: PaymentProvider; terminalId: string; amount: number; reference: string; returnUrl: string; cancelUrl: string };
export type HostedCheckout = { url: string; method: "GET" | "POST"; fields?: Record<string, string>; providerReference: string };

function asFormResponse(text: string) {
  return Object.fromEntries(new URLSearchParams(text));
}

async function createTranzilaHandshake(terminalName: string, amount: number, reference: string, appKey: string, secret: string) {
  const requestTime = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(40).toString("hex");
  const accessToken = createHmac("sha256", `${secret}${requestTime}${nonce}`).update(appKey).digest("hex");
  const response = await fetch("https://api.tranzila.com/v2/handshake/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-tranzila-api-app-key": appKey,
      "X-tranzila-api-request-time": requestTime,
      "X-tranzila-api-nonce": nonce,
      "X-tranzila-api-access-token": accessToken,
    },
    body: JSON.stringify({ terminal_name: terminalName, sum: amount, request_params: { reference } }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const body = await response.json().catch(() => null) as { error_code?: unknown; thtk?: unknown } | null;
  if (!response.ok || body?.error_code !== 0 || typeof body.thtk !== "string" || !body.thtk) {
    throw new Error("Tranzila could not create a payment handshake");
  }
  return body.thtk;
}

export async function createHostedCheckout(input: CheckoutInput): Promise<HostedCheckout> {
  const credential = findTerminalCredential(input.provider, input.terminalId);
  if (!credential) throw new Error("Payment terminal credentials are not configured");
  if (input.provider === "tranzila") {
    if (!credential.appKey || !credential.secret) throw new Error("Tranzila API credentials are not configured");
    const thtk = await createTranzilaHandshake(input.terminalId, input.amount, input.reference, credential.appKey, credential.secret);
    return {
      url: `https://directng.tranzila.com/${encodeURIComponent(input.terminalId)}/iframenew.php`,
      method: "POST",
      providerReference: input.reference,
      fields: {
        sum: input.amount.toFixed(2), currency: "1", tranmode: "A", cred_type: "1", lang: "il",
        pdesc: `Donation ${input.reference}`, DCdisable: input.reference,
        thtk,
        success_url_address: input.returnUrl, fail_url_address: input.cancelUrl,
      },
    };
  }
  if (input.provider !== "cardcom" || !credential.username) throw new Error("Unsupported payment provider");
  const form = new URLSearchParams({
    Operation: "1", TerminalNumber: input.terminalId, UserName: credential.username,
    SumToBill: input.amount.toFixed(2), CoinId: "1", Language: "he", ProductName: `Donation ${input.reference}`,
    APILevel: "10", Codepage: "65001",
  });
  const response = await fetch("https://secure.cardcom.solutions/Interface/LowProfile.aspx", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, cache: "no-store",
  });
  if (!response.ok) throw new Error("Cardcom could not initialize checkout");
  const result = asFormResponse(await response.text());
  if (result.ResponseCode !== "0" || !result.url || !result.LowProfileCode) throw new Error("Cardcom rejected checkout initialization");
  return { url: result.url, method: "GET", providerReference: result.LowProfileCode };
}
