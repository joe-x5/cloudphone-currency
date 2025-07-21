import { CurrencyCode } from "./data/currency";

export const CURRENCY_SELECTED = "currencySelected";
export const CURRENCY_CHANGED = "currencyChange";
export const CURRENCIES_REVERSED = "currenciesReversed";

export type CurrencySelectedEvent = {
  detail: {
    currency: CurrencyCode;
  };
};

export type CurrencyChangedEvent = CurrencySelectedEvent & {
  detail: {
    index: number;
  };
};

export type CurrenciesReversedEvent = {
  detail: {
    currencies: [CurrencyCode, CurrencyCode];
  };
};
