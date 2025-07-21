import { formatFromCode } from "./data/currencies";
import { CurrencyCode } from "./data/currency";
import { IsoDateString } from "./date";

// API Version
const V1 = "v1";

export type ApiVersion = typeof V1;

// Alias for the most recent exchange rate
const LATEST = "latest";

export type ExchangeRateDate = typeof LATEST | IsoDateString;

function fetchWithFallback(
  endpoint: string,
  date: ExchangeRateDate = LATEST,
  apiVersion: ApiVersion = V1,
) {
  // Default and fallback CDN URLs
  const JSDELIVR_URL = new URL(
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/${apiVersion}/${endpoint}`,
  );
  const CLOUDFLARE_URL = new URL(
    `https://${date}.currency-api.pages.dev/${apiVersion}/${endpoint}`,
  );

  return fetch(JSDELIVR_URL)
    .catch(() => fetch(CLOUDFLARE_URL))
    .then((response) => response.json());
}

export type ExchangeRateResponse = {
  date: ExchangeRateDate;
} & {
  [base in CurrencyCode]?: {
    [target in Exclude<CurrencyCode, base>]?: number;
  };
};

const exchangeRateCache: Map<CurrencyCode, ExchangeRateResponse> = new Map();

export function fetchExchangeRates(
  baseCurrency: CurrencyCode,
): Promise<ExchangeRateResponse | undefined> {
  // Cache exchange rates in memory
  if (exchangeRateCache.has(baseCurrency)) {
    return Promise.resolve(exchangeRateCache.get(baseCurrency));
  }

  // Fetch and cache exchange rates
  return fetchWithFallback(`currencies/${baseCurrency}.min.json`).then(
    (responseJson) => {
      const exchageResponse = responseJson as ExchangeRateResponse;
      exchangeRateCache.set(baseCurrency, exchageResponse);
      return exchageResponse;
    },
  );
}

export type USDExchangeRateResponse = {
  date: ExchangeRateDate;
  usd: {
    [target in Exclude<CurrencyCode, "usd">]: number;
  };
};

export function fetchUSDExchangeRates(): Promise<
  USDExchangeRateResponse | undefined
> {
  return fetchExchangeRates("usd").then(
    (rates) => rates as USDExchangeRateResponse,
  );
}

// Assumes the base currency is USD, else applies two-step conversion
export function exchange(
  quantity: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates: USDExchangeRateResponse,
): number {
  const usdRates = exchangeRates.usd;
  const from = fromCurrency as keyof typeof usdRates;
  const to = toCurrency as keyof typeof usdRates;

  // Invert conversions when ending currency is USD
  if (toCurrency === "usd") {
    return quantity / usdRates[from];
  }

  // Used conversion as-is when starting currency is USD
  if (fromCurrency === "usd") {
    return quantity * usdRates[to];
  }

  // Two-step conversions when currencies do not include USD
  return (quantity / usdRates[from]) * usdRates[to];
}

export function exchangeFormatted<From extends CurrencyCode>(
  quantity: number,
  fromCurrency: From,
  toCurrency: Exclude<CurrencyCode, From>,
  exchangeRates: USDExchangeRateResponse,
): string {
  return formatFromCode(
    exchange(quantity, fromCurrency, toCurrency, exchangeRates),
    toCurrency,
  );
}
