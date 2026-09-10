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
  gamma: {
    name: "Gamma",
    setupUrl: "https://www.gamaf.co.il/products/Payment-facilitator.html",
    setupLabel: { en: "Gamma payment setup", he: "פרטי הצטרפות לסליקה של גמא" },
    requirements: {
      en: "Prepare the Gamma internet-terminal ID and ask Gamma for production and sandbox API documentation, callback/webhook authentication, and token or recurring-payment approval if needed.",
      he: "הכינו מזהה מסוף אינטרנט של גמא ובקשו מגמא תיעוד API לייצור ולבדיקות, אימות callback/webhook ואישור ל־token או חיובים חוזרים לפי הצורך.",
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
