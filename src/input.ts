import {
  findCurrency,
  formatFromCode,
  getCountryCode,
} from "./data/currencies";
import { exchange, USDExchangeRateResponse } from "./exchangeApi";
import { CurrencyCode } from "./data/currency";
import { _, getRandomInteger } from "./utils";
import {
  CURRENCIES_REVERSED,
  CurrenciesReversedEvent,
  CURRENCY_CHANGED,
  CURRENCY_SELECTED,
  CurrencyChangedEvent,
  CurrencySelectedEvent,
} from "./events";
import { selectCurrency, showCurrencyList } from "./currencyList";

const NON_DIGITS = new RegExp("[^0-9.]");

const currencyInput1 = _("currency1") as HTMLInputElement;
const currencyInput2 = _("currency2") as HTMLInputElement;
const currencyLabel1 = _("currency1-label") as HTMLLabelElement;
const currencyLabel2 = _("currency2-label") as HTMLLabelElement;
const reverseButton = _("reverse") as HTMLButtonElement;

type InputIndex = 1 | 2;

let focusIndex: InputIndex = 1;
let activeIndex: InputIndex = 1;

// TODO: pick smarter defaults, remember previous settings
let currency1: CurrencyCode = "usd";
let currency2: CurrencyCode = "inr";

let quantity1 = 0;
let quantity2 = 0;

let exchangeRates: USDExchangeRateResponse | null = null;

type CurrencyState = {
  input: HTMLInputElement;
  label: HTMLLabelElement;
  currency: CurrencyCode;
  quantity: number;
};

function getCurrencyState(index: InputIndex): CurrencyState {
  return {
    input: index === 1 ? currencyInput1 : currencyInput2,
    label: index === 1 ? currencyLabel1 : currencyLabel2,
    currency: index === 1 ? currency1 : currency2,
    quantity: index === 1 ? quantity1 : quantity2,
  };
}

function setCurrencyState(index: 1 | 2, updates: Partial<CurrencyState>) {
  if (index === 1) {
    if (updates.currency !== undefined) currency1 = updates.currency;
    if (updates.quantity !== undefined) quantity1 = updates.quantity;
  } else {
    if (updates.currency !== undefined) currency2 = updates.currency;
    if (updates.quantity !== undefined) quantity2 = updates.quantity;
  }
}

function updateUI() {
  if (!exchangeRates) return;

  const sourceIndex = focusIndex;
  const targetIndex = sourceIndex === 1 ? 2 : 1;

  const source = getCurrencyState(sourceIndex);
  const target = getCurrencyState(targetIndex);

  const result = exchange(
    source.quantity,
    source.currency,
    target.currency,
    exchangeRates,
  );

  console.log("updateUI", sourceIndex, result);

  target.input.value = formatFromCode(result, target.currency);

  //source.input.value = formatFromCode(source.quantity, source.currency);

  setCurrencyState(targetIndex, { quantity: result });
}

function handleInputChange(event: KeyboardEvent) {
  console.log("input", event);

  // Arrow key navigation
  const input = event.currentTarget as HTMLInputElement;
  switch (event.key) {
    case "ArrowDown":
      if (input === currencyInput1) {
        currencyInput2.focus();
        event.preventDefault();
      }
      return;
    case "ArrowUp":
      if (input === currencyInput2) {
        currencyInput1.focus();
        event.preventDefault();
      }
      return;
    case "Enter":
      activeIndex = focusIndex;
      openCurrencyDialog();
      break;
  }

  const index = input === currencyInput1 ? 1 : 2;
  focusIndex = index as InputIndex;

  const state = getCurrencyState(index);
  const rawValue = state.input.value.replace(NON_DIGITS, "");
  const numericValue = Number.parseFloat(rawValue);
  console.log("input", numericValue);

  if (!Number.isNaN(numericValue)) {
    setCurrencyState(index, { quantity: numericValue });
    updateUI();
  }
}

function handleFocus(event: FocusEvent) {
  focusIndex = event.currentTarget === currencyInput1 ? 1 : 2;
}

function handleBlur(event: FocusEvent) {
  console.log("blur", event);
  const index = event.currentTarget === currencyInput1 ? 1 : 2;
  const state = getCurrencyState(index);

  console.log("blur", state.quantity, state.currency);
  state.input.value = formatFromCode(state.quantity, state.currency);
}

const CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Home",
  "End",
]);

function handleKeyDown(event: KeyboardEvent) {
  const input = event.currentTarget as HTMLInputElement;
  const value = input.value;

  const isDigit = event.key >= "0" && event.key <= "9";
  const isSeparator = event.key === "." || event.key === ",";
  const isAllowedControlKey = CONTROL_KEYS.has(event.key);

  if (isDigit || isAllowedControlKey) {
    return;
  }

  if (isSeparator) {
    // Only allow a single decimal separator
    if (value.includes(".") || value.includes(",")) {
      event.preventDefault();
    }
    return;
  }

  event.preventDefault();
}

function updatePlaceholders() {
  if (!exchangeRates) return;

  // Calculate a random number to set as the placeholder
  const startingCurrency = findCurrency(currency1);
  const min = Math.max(1, startingCurrency?.smallestCommonDenomination || 0);
  const startingQuantity = getRandomInteger(min * 5, min * 500);

  const exchangedQuantity = exchange(
    startingQuantity,
    currency1,
    currency2,
    exchangeRates,
  );

  currencyInput1.placeholder = formatFromCode(startingQuantity, currency1);
  currencyInput2.placeholder = formatFromCode(exchangedQuantity, currency2);
}

function updateLabel(label: HTMLLabelElement, currencyCode: CurrencyCode) {
  const currency = findCurrency(currencyCode);
  if (currency) {
    const countryCode = getCountryCode(currency);
    label.innerHTML = `${currencyCode.toUpperCase()} <i class="fflag fflag-${countryCode} ff-round ff-md"></i>`;
  }
}

function swapCurrencies() {
  const tempCurrency = currency1;
  currency1 = currency2;
  currency2 = tempCurrency;
}

function swapQuantities() {
  const tempQuantity = quantity1;
  quantity1 = quantity2;
  quantity2 = tempQuantity;
}

function swapPlaceholders() {
  const tempPlaceholder = currencyInput1.placeholder;
  currencyInput1.placeholder = currencyInput2.placeholder;
  currencyInput2.placeholder = tempPlaceholder;
}

export function reverseCurrencies() {
  swapCurrencies();
  swapQuantities();
  swapPlaceholders();

  // Update labels
  updateLabel(currencyLabel1, currency1);
  updateLabel(currencyLabel2, currency2);

  // Update input values (formatted)
  const hasInteracted =
    currencyInput1.value.length || currencyInput2.value.length;

  if (hasInteracted) {
    currencyInput1.value = formatFromCode(quantity1, currency1);
    currencyInput2.value = formatFromCode(quantity2, currency2);
  }

  const eventData: CurrenciesReversedEvent = {
    detail: {
      currencies: [currency1, currency2],
    },
  };

  const event = new CustomEvent(CURRENCIES_REVERSED, eventData);
  window.dispatchEvent(event);
}

function openCurrencyDialog() {
  selectCurrency((activeIndex === 1) ? currency1 : currency2);
  showCurrencyList();
}

function onCurrencyLabelClick(event: Event) {
  activeIndex = event.currentTarget === currencyLabel1 ? 1 : 2;

  openCurrencyDialog();
}

function bindInputs() {
  [currencyInput1, currencyInput2].forEach((input) => {
    input.addEventListener("keyup", handleInputChange);
    input.addEventListener("focus", handleFocus);
    input.addEventListener("blur", handleBlur);
    input.addEventListener("keydown", handleKeyDown);

    // Clear previous values
    input.value = "";
  });

  [currencyLabel1, currencyLabel2].forEach((label) => {
    label.addEventListener("click", onCurrencyLabelClick);
  });

  reverseButton.addEventListener("click", reverseCurrencies);
}

function onCurrencySelected(event: Event) {
  console.log('onCurrencySelected', event)
  if (event instanceof CustomEvent) {
    const selectedEvent = event as CurrencySelectedEvent;
    setCurrency(activeIndex, selectedEvent.detail.currency);
  }
}

export function setup(rates: USDExchangeRateResponse) {
  exchangeRates = rates;
  bindInputs();
  updatePlaceholders();
  window.addEventListener(CURRENCY_SELECTED, onCurrencySelected);
}

/**
 * Change currency code for a given index (1 or 2)
 * @param index - Which currency to change
 * @param newCode - New CurrencyCode
 */
export function setCurrency(index: InputIndex, newCode: CurrencyCode) {
  setCurrencyState(index, { currency: newCode });

  const state = getCurrencyState(index);
  updateLabel(state.label, newCode);

  updateUI();
  updatePlaceholders();

  const eventData: CurrencyChangedEvent = {
    detail: {
      index,
      currency: newCode,
    },
  };

  const event = new CustomEvent(CURRENCY_CHANGED, eventData);
  window.dispatchEvent(event);
}
