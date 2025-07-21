import {
  findCurrency,
  formatFromCode,
  getCountryCode,
} from "./data/currencies";
import { exchange, USDExchangeRateResponse } from "./exchangeApi";
import { CurrencyCode } from "./data/currency";
import { _, CONTROL_KEYS, getRandomInteger, NON_DIGITS } from "./utils";
import {
  CURRENCIES_REVERSED,
  CurrenciesReversedEvent,
  CURRENCY_CHANGED,
  CURRENCY_SELECTED,
  CurrencyChangedEvent,
  CurrencySelectedEvent,
} from "./events";
import { selectCurrency, showCurrencyList } from "./currencyList";

const currencyInput1 = _("currency1") as HTMLInputElement;
const currencyInput2 = _("currency2") as HTMLInputElement;
const currencyLabel1 = _("currency1-label") as HTMLLabelElement;
const currencyLabel2 = _("currency2-label") as HTMLLabelElement;
const reverseButton = _("reverse") as HTMLButtonElement;

type InputIndex = 1 | 2;

let focusIndex: InputIndex = 1;
let activeIndex: InputIndex = 1;
let currency1: CurrencyCode = "usd";
let currency2: CurrencyCode = "inr";
let quantity1 = 0;
let quantity2 = 0;
let exchangeRates: USDExchangeRateResponse | null = null;

const stateMap = {
  1: () => ({
    input: currencyInput1,
    label: currencyLabel1,
    currency: currency1,
    quantity: quantity1,
  }),
  2: () => ({
    input: currencyInput2,
    label: currencyLabel2,
    currency: currency2,
    quantity: quantity2,
  }),
};

const setCurrencyState = (
  index: InputIndex,
  updates: Partial<{ currency: CurrencyCode; quantity: number }>,
) => {
  if (index === 1) {
    if (updates.currency) currency1 = updates.currency;
    if (updates.quantity != null) quantity1 = updates.quantity;
  } else {
    if (updates.currency) currency2 = updates.currency;
    if (updates.quantity != null) quantity2 = updates.quantity;
  }
};

function updateUI() {
  if (!exchangeRates) return;
  const [sourceIdx, targetIdx] = [focusIndex, focusIndex === 1 ? 2 : 1];
  const source = stateMap[sourceIdx]();
  const target = stateMap[targetIdx as InputIndex]();
  const result = exchange(
    source.quantity,
    source.currency,
    target.currency,
    exchangeRates,
  );

  target.input.value = formatFromCode(result, target.currency);
  setCurrencyState(targetIdx as InputIndex, { quantity: result });
}

function handleInputChange(event: KeyboardEvent) {
  const input = event.currentTarget as HTMLInputElement;

  switch (event.key) {
    case "ArrowDown":
      if (input === currencyInput1) currencyInput2.focus();
      return event.preventDefault();
    case "ArrowUp":
      if (input === currencyInput2) currencyInput1.focus();
      return event.preventDefault();
    case "Enter":
      activeIndex = focusIndex;
      return openCurrencyDialog();
  }

  const index = input === currencyInput1 ? 1 : 2;
  focusIndex = index;
  const value = input.value.replace(NON_DIGITS, "").replace(",", ".");
  const numeric = parseFloat(value);

  if (!isNaN(numeric)) {
    setCurrencyState(index, { quantity: numeric });
    updateUI();
  }
}

const handleFocus = (e: FocusEvent) =>
  (focusIndex = e.currentTarget === currencyInput1 ? 1 : 2);

const handleBlur = (e: FocusEvent) => {
  const index = e.currentTarget === currencyInput1 ? 1 : 2;
  const { quantity, currency, input } = stateMap[index]();
  input.value = formatFromCode(quantity, currency);
};

function handleKeyDown(event: KeyboardEvent) {
  const input = event.currentTarget as HTMLInputElement;
  const value = input.value;

  if (CONTROL_KEYS.has(event.key) || (event.key >= "0" && event.key <= "9"))
    return;

  if (
    (event.key === "." || event.key === ",") &&
    !value.includes(".") &&
    !value.includes(",")
  )
    return;

  event.preventDefault();
}

function updateLabel(label: HTMLLabelElement, code: CurrencyCode) {
  const currency = findCurrency(code);
  if (!currency) return;
  const country = getCountryCode(currency);
  label.innerHTML = `${code.toUpperCase()} <i class="fflag fflag-${country} ff-round ff-md"></i>`;
}

function updatePlaceholders() {
  if (!exchangeRates) return;
  const min = Math.max(
    1,
    findCurrency(currency1)?.smallestCommonDenomination ?? 0,
  );
  const inputQty = getRandomInteger(min * 5, min * 500);
  const outputQty = exchange(inputQty, currency1, currency2, exchangeRates);

  currencyInput1.placeholder = formatFromCode(inputQty, currency1);
  currencyInput2.placeholder = formatFromCode(outputQty, currency2);
}

export function reverseCurrencies() {
  [currency1, currency2] = [currency2, currency1];
  [quantity1, quantity2] = [quantity2, quantity1];
  [currencyInput1.placeholder, currencyInput2.placeholder] = [
    currencyInput2.placeholder,
    currencyInput1.placeholder,
  ];

  updateLabel(currencyLabel1, currency1);
  updateLabel(currencyLabel2, currency2);

  const hasInput = currencyInput1.value || currencyInput2.value;
  if (hasInput) {
    currencyInput1.value = formatFromCode(quantity1, currency1);
    currencyInput2.value = formatFromCode(quantity2, currency2);
  }

  window.dispatchEvent(
    new CustomEvent<CurrenciesReversedEvent>(CURRENCIES_REVERSED, {
      detail: { currencies: [currency1, currency2] },
    }),
  );
}

function openCurrencyDialog() {
  selectCurrency(activeIndex === 1 ? currency1 : currency2);
  showCurrencyList();
}

function onCurrencyLabelClick(e: Event) {
  activeIndex = e.currentTarget === currencyLabel1 ? 1 : 2;
  openCurrencyDialog();
}

function bindInputs() {
  [currencyInput1, currencyInput2].forEach((input) => {
    input.value = "";
    input.addEventListener("keyup", handleInputChange);
    input.addEventListener("keydown", handleKeyDown);
    input.addEventListener("focus", handleFocus);
    input.addEventListener("blur", handleBlur);
  });

  [currencyLabel1, currencyLabel2].forEach((label) =>
    label.addEventListener("click", onCurrencyLabelClick),
  );

  reverseButton.addEventListener("click", reverseCurrencies);
}

function onCurrencySelected(event: Event) {
  if (!(event instanceof CustomEvent)) return;
  const selected = event as CustomEventInit<CurrencySelectedEvent>;
  if (selected.detail) setCurrency(activeIndex, selected.detail.currency);
}

export function setCurrency(index: InputIndex, newCode: CurrencyCode) {
  setCurrencyState(index, { currency: newCode });
  updateLabel(stateMap[index]().label, newCode);
  updateUI();
  updatePlaceholders();

  window.dispatchEvent(
    new CustomEvent<CurrencyChangedEvent>(CURRENCY_CHANGED, {
      detail: { index, currency: newCode },
    }),
  );
}

export function setup(rates: USDExchangeRateResponse) {
  exchangeRates = rates;
  bindInputs();
  updatePlaceholders();
  window.addEventListener(CURRENCY_SELECTED, onCurrencySelected);
}
