import "server-only";

import type { PaymentProvider } from "@/lib/payments/provider-catalog";
import { findTerminalCredential } from "@/lib/payments/server-config";

type CheckoutInput = { provider: PaymentProvider; terminalId: string; amount: number; reference: string; returnUrl: string; cancelUrl: string };
export type HostedCheckout = { url: string; method: "GET" | "POST"; fields?: Record<string, string>; providerReference: string };

function asFormResponse(text: string) {
  return Object.fromEntries(new URLSearchParams(text));
}

async function createTranzilaHandshake(terminalName: string, amount: number, terminalPassword: string) {
  const query = new URLSearchParams({
    supplier: terminalName,
    sum: amount.toFixed(2),
    TranzilaPW: terminalPassword,
  });
  const response = await fetch(`https://api.tranzila.com/v1/handshake/create?${query}`, { cache: "no-store" });
  const body = await response.text();
  const formResponse = asFormResponse(body);
  const jsonResponse = (() => {
    try { return JSON.parse(body) as { thtk?: unknown }; } catch { return null; }
  })();
  const thtk = typeof formResponse.thtk === "string" ? formResponse.thtk : jsonResponse?.thtk;
  if (!response.ok || typeof thtk !== "string" || !thtk) {
    throw new Error("Tranzila could not create a payment handshake");
  }
  return thtk;
}

export async function createHostedCheckout(input: CheckoutInput): Promise<HostedCheckout> {
  const credential = findTerminalCredential(input.provider, input.terminalId);
  if (!credential) throw new Error("Payment terminal credentials are not configured");
  if (input.provider === "tranzila") {
    if (!credential.terminalPassword) throw new Error("Tranzila terminal password is not configured");
    const thtk = await createTranzilaHandshake(input.terminalId, input.amount, credential.terminalPassword);
    return {
      url: `https://directng.tranzila.com/${encodeURIComponent(input.terminalId)}/iframenew.php`,
      method: "POST",
      providerReference: input.reference,
      fields: {
        sum: input.amount.toFixed(2), currency: "1", tranmode: "A", cred_type: "1", lang: "il",
        pdesc: `Donation ${input.reference}`, DCdisable: input.reference,
        new_process: "1", thtk,
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
