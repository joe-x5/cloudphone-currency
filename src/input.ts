import { findCurrency, getCountryCode } from "./data/currencies";
import { exchange, USDExchangeRateResponse } from "./exchangeApi";
import { CurrencyCode } from "./data/currency";
import { _ } from "./utils";
import {
  CURRENCIES_REVERSED,
  CurrenciesReversedEvent,
  CURRENCY_CHANGED,
  CURRENCY_SELECTED,
  CurrencyChangedEvent,
  CurrencySelectedEvent,
} from "./events";
import { selectCurrency, showCurrencyList } from "./currencyList";
import { CurrencyInput } from "./currencyInput";

type InputIndex = 1 | 2;

let focusIndex: InputIndex = 1;
let activeIndex: InputIndex = 1;
let currency1: CurrencyCode = "usd";
let currency2: CurrencyCode = "inr";
let quantity1 = 0;
let quantity2 = 0;
let exchangeRates: USDExchangeRateResponse | null = null;

// Create and append custom elements (after registration)
const currencyContainer1 = _("currency-container1");
const currencyContainer2 = _("currency-container2");
const currencyInput1 = new CurrencyInput();
const currencyInput2 = new CurrencyInput();

[currencyInput1, currencyInput2].forEach((el, i) => {
  el.setAttribute("id", `currency${i+1}`);
  el.setAttribute("name", `currency${i+1}`);
  el.currency = (i === 0) ? currency1 : currency2;
});

currencyContainer1?.appendChild(currencyInput1);
currencyContainer2?.appendChild(currencyInput2);

const currencyLabel1 = _("currency1-label") as HTMLLabelElement;
const currencyLabel2 = _("currency2-label") as HTMLLabelElement;
const reverseButton = _("reverse") as HTMLButtonElement;

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
    if (updates.currency) {
      currency1 = updates.currency;
      stateMap[index]().input.currency = currency1;
    }
    if (updates.quantity != null) quantity1 = updates.quantity;
  } else {
    if (updates.currency) {
      currency2 = updates.currency;
      stateMap[index]().input.currency = currency2;
    }
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

  target.input.value = result;
  setCurrencyState(targetIdx as InputIndex, { quantity: result });
}

function handleInputChange(event: KeyboardEvent) {
  const input = event.currentTarget as CurrencyInput;

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

  setCurrencyState(index, { quantity: input.value });
  updateUI();
}

const handleFocus = (e: FocusEvent) =>
  (focusIndex = e.currentTarget === currencyInput1 ? 1 : 2);

const handleBlur = (e: FocusEvent) => {
  const index = e.currentTarget === currencyInput1 ? 1 : 2;
  const { quantity, input } = stateMap[index]();
  input.value = quantity;
};

function updateLabel(label: HTMLLabelElement, code: CurrencyCode) {
  const currency = findCurrency(code);
  if (!currency) return;
  const country = getCountryCode(currency);
  label.innerHTML = `${code.toUpperCase()} <i class="fflag fflag-${country} ff-round ff-md"></i>`;
}

export function reverseCurrencies() {
  // Flip values
  [currency1, currency2] = [currency2, currency1];
  [quantity1, quantity2] = [quantity2, quantity1];

  updateLabel(currencyLabel1, currency1);
  updateLabel(currencyLabel2, currency2);

  // Update input (if user has typed value)
  const hasInput = currencyInput1.value || currencyInput2.value;
  if (hasInput) {
    currencyInput1.value = quantity1;
    currencyInput2.value = quantity2;
    currencyInput1.currency = currency1;
    currencyInput2.currency = currency2;
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
    input.value = 0;
    input.addEventListener("keyup", handleInputChange);
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

  window.dispatchEvent(
    new CustomEvent<CurrencyChangedEvent>(CURRENCY_CHANGED, {
      detail: { index, currency: newCode },
    }),
  );
}

export function setup(rates: USDExchangeRateResponse) {
  exchangeRates = rates;
  bindInputs();
  window.addEventListener(CURRENCY_SELECTED, onCurrencySelected);
}
