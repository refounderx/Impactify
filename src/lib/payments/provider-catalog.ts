export const PAYMENT_PROVIDERS = {
  cardcom: {
    name: "Cardcom",
    setupUrl: "https://www.cardcom.solutions/developers/",
    setupLabel: { en: "Cardcom developer documentation", he: "תיעוד מפתחים של Cardcom" },
    requirements: {
      en: "Prepare the terminal number, API name/password, a production callback URL, and confirm token charges are enabled.",
      he: "הכינו מספר מסוף, שם/סיסמת API, כתובת callback לייצור ואישור לחיובי token.",
    },
  },
  grow: {
    name: "Grow",
    setupUrl: "https://developers.grow.business/docs/webhooks",
    setupLabel: { en: "Grow developer documentation", he: "תיעוד מפתחים של Grow" },
    requirements: {
      en: "Prepare the Grow user ID/API key, payment-page configuration, and ask Grow support to enable transaction and recurring-payment webhooks.",
      he: "הכינו מזהה משתמש/מפתח API, הגדרת עמוד תשלום ובקשו מ־Grow להפעיל webhooks לעסקאות ולחיובים חוזרים.",
    },
  },
  tranzila: {
    name: "Tranzila",
    setupUrl: "https://docs.tranzila.com/docs/payments-and-billing/iframe-integration-directng",
    setupLabel: { en: "Tranzila DirectNG documentation", he: "תיעוד Tranzila DirectNG" },
    requirements: {
      en: "Prepare the Tranzila terminal name, configure the production success, failure, and notify URLs, and obtain the response-hash secret before activating charges or recurring payments.",
      he: "הכינו את שם מסוף Tranzila, הגדירו כתובות הצלחה, כישלון ו־notify לייצור, וקבלו את סוד אימות ה־response hash לפני הפעלת חיובים או הוראות קבע.",
    },
  },
} as const;

export type PaymentProvider = keyof typeof PAYMENT_PROVIDERS;

export type PaymentProviderCheckoutRequest = {
  amount: number;
  currency: "ILS";
  reference: string;
  successUrl: string;
  cancelUrl: string;
};

/**
 * Provider-neutral contract for the future server-only hosted-checkout adapters.
 * No provider credentials or card data are accepted from the browser.
 */
export type HostedCheckoutGateway = {
  createHostedCheckout(request: PaymentProviderCheckoutRequest): Promise<{ redirectUrl: string; providerReference: string }>;
  verifyWebhook(payload: string, signature: string | null): Promise<{ providerReference: string; status: "completed" | "failed" | "cancelled" }>;
};

export function isPaymentProvider(value: string): value is PaymentProvider {
  return value in PAYMENT_PROVIDERS;
}
