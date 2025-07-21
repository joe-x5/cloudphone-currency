import { CURRENCIES, getCountryCode } from "./data/currencies";
import { Currency, CurrencyCode } from "./data/currency";
import { CURRENCY_SELECTED, CurrencySelectedEvent } from "./events";
import { getDirection } from "./language";
import { _ } from "./utils";

const dialog = _("choose-currency") as HTMLDialogElement;
const list = _("currency-list") as HTMLOListElement;
const template = _("currency-list-item") as HTMLTemplateElement;

function queryCurrencyCode(root: HTMLElement): CurrencyCode | undefined {
  let element = root;
  while (element.dataset.code === undefined && element.parentElement) {
    element = element.parentElement;
  }

  if (element.dataset.code) {
    return element.dataset.code as CurrencyCode;
  }
}

function onCurrencyClick(event: Event) {
  const currencyCode = queryCurrencyCode(event.target as HTMLElement);
  console.log('onCurrencyClick', currencyCode, event)

  if (currencyCode) {
    const eventData: CurrencySelectedEvent = {
      detail: {
        currency: currencyCode as CurrencyCode,
      }
    };
    const event = new CustomEvent(CURRENCY_SELECTED, eventData);
    window.dispatchEvent(event);
  }

  unselectCurrency();
  hideCurrencyList();
}

function createListItem(currency: Currency) {
  const countryCode = getCountryCode(currency);
  const clone = template.content.cloneNode(true) as HTMLTemplateElement;

  const currencyItem = clone.querySelector(".currency-item") as HTMLButtonElement;
  currencyItem.dataset.code = currency.currencyCode;
  currencyItem.setAttribute("lang", currency.languageCode);
  currencyItem.setAttribute("dir", getDirection(currency.languageCode));

  clone.querySelector(".fflag")?.classList.add(`fflag-${countryCode}`);
  (clone.querySelector(".currency-symbol") as HTMLSpanElement).textContent =
    currency.currencySymbol;
  (clone.querySelector(".currency-name") as HTMLSpanElement).textContent =
    currency.localCurrencyName;
  (clone.querySelector(".currency-code") as HTMLSpanElement).textContent =
    currency.currencyCode;

  return clone;
}

function appendToFragment<Root extends Node>(
  fragment: Root,
  listItem: HTMLTemplateElement,
): Root {
  fragment.appendChild(listItem);
  return fragment;
}

export function populateList() {
  const listFragment = CURRENCIES.map(createListItem).reduce(
    appendToFragment,
    document.createDocumentFragment(),
  );
  list.append(listFragment);
  list.addEventListener("click", onCurrencyClick);
}

function unselectCurrency() {
  const disabledCurrency = list.querySelector('[disabled]');
  if (disabledCurrency) {
    disabledCurrency.removeAttribute('disabled');
    disabledCurrency.ariaDisabled = 'false';
  }
}

export function selectCurrency(currency: CurrencyCode) {
  const currencyItem = list.querySelector(`[data-code="${currency}"]`);
  if (currencyItem) {
    currencyItem.setAttribute('disabled', '');
    currencyItem.ariaDisabled = 'true';
  }
}

export function hideCurrencyList() {
  dialog.open = false;
}

export function showCurrencyList() {
  dialog.open = true;
}
