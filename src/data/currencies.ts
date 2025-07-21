import { Currency, CurrencyCode } from "./currency";
import currencies from "./currencies.json";

const USD: Currency = {
  currencyCode: "usd",
  englishCurrencyName: "US Dollar",
  localCurrencyName: "US Dollar",
  currencySymbol: "$",
  countryRegionFlagEmoji: "🇺🇸",
  languageCode: "en-US",
  smallestCommonDenomination: 0.01,
};

type RoundingIncrement =
  | 1
  | 2
  | 5
  | 10
  | 20
  | 25
  | 50
  | 100
  | 200
  | 250
  | 500
  | 1000
  | 2000
  | 2500
  | 5000;
const ROUNDING_INCREMENTS = new Set([
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
]);

export const CURRENCIES = currencies as Currency[];

export function findCurrency(
  currencyCode: string | CurrencyCode,
): Currency | undefined {
  const currencyCodeLower = currencyCode.toLowerCase();
  return CURRENCIES.find(
    (currency) => currency.currencyCode === currencyCodeLower,
  );
}

function getRoundingIncrement(currency: Currency): RoundingIncrement {
  const increment = currency.smallestCommonDenomination;
  if (ROUNDING_INCREMENTS.has(increment)) {
    return increment as RoundingIncrement;
  }

  return 1;
}

function getFractionDigits(currency: Currency): number {
  const decimalParts = currency.smallestCommonDenomination
    .toString()
    .split(".");
  return decimalParts.length >= 2 ? decimalParts[1].length : 0;
}

export function formatNumber(quantity: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currencySign: "standard",
    currency: currency.currencyCode.toUpperCase(),
    roundingIncrement: getRoundingIncrement(currency),
    maximumFractionDigits: getFractionDigits(currency),
  });

  return formatter.format(quantity);
}

export function formatFromCode(
  quantity: number,
  currencyCode: CurrencyCode,
): string {
  const currency = findCurrency(currencyCode);
  // Default to USD
  if (!currency) return formatNumber(quantity, USD);
  return formatNumber(quantity, currency);
}

export function getCountryCode(currency: Currency) {
  return currency.languageCode.split("-")[1];
}
