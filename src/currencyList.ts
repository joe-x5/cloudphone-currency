import { CURRENCIES, getCountryCode } from "./data/currencies";
import { Currency, CurrencyCode } from "./data/currency";
import { CURRENCY_SELECTED, CurrencySelectedEvent } from "./events";
import { getDirection } from "./language";
import { _ } from "./utils";

const dialog = _("choose-currency") as HTMLDialogElement;
const list = _("currency-list") as HTMLOListElement;
const template = _("currency-list-item") as HTMLTemplateElement;

const $ = <T extends Element>(selector: string, root: ParentNode) =>
  root.querySelector(selector) as T;

function queryCurrencyCode(el: HTMLElement): CurrencyCode | undefined {
  while (el && !el.dataset.code && el.parentElement) el = el.parentElement;
  return el.dataset.code as CurrencyCode | undefined;
}

function onCurrencyClick(event: Event) {
  const currencyCode = queryCurrencyCode(event.target as HTMLElement);
  console.log("onCurrencyClick", currencyCode, event);

  if (currencyCode) {
    window.dispatchEvent(
      new CustomEvent<CurrencySelectedEvent>(CURRENCY_SELECTED, {
        detail: { currency: currencyCode },
      }),
    );
  }

  unselectCurrency();
  hideCurrencyList();
}

function createListItem(currency: Currency) {
  const countryCode = getCountryCode(currency);
  const clone = template.content.cloneNode(true) as DocumentFragment;

  const item = $(".currency-item", clone) as HTMLButtonElement;
  item.dataset.code = currency.currencyCode;
  item.lang = currency.languageCode;
  item.dir = getDirection(currency.languageCode);

  $(".fflag", clone)?.classList.add(`fflag-${countryCode}`);
  $(".currency-symbol", clone).textContent = currency.currencySymbol;
  $(".currency-name", clone).textContent = currency.localCurrencyName;
  $(".currency-code", clone).textContent = currency.currencyCode;

  return clone;
}

export function populateList() {
  const fragment = CURRENCIES.map(createListItem).reduce(
    (frag, item) => (frag.appendChild(item), frag),
    document.createDocumentFragment(),
  );

  list.append(fragment);
  list.addEventListener("click", onCurrencyClick);
}

function unselectCurrency() {
  const el = list.querySelector("[disabled]") as HTMLButtonElement | null;
  if (el) {
    el.removeAttribute("disabled");
    el.ariaDisabled = "false";
  }
}

export function selectCurrency(code: CurrencyCode) {
  const el = list.querySelector(
    `[data-code="${code}"]`,
  ) as HTMLButtonElement | null;
  if (el) {
    el.setAttribute("disabled", "");
    el.ariaDisabled = "true";
  }
}

export const hideCurrencyList = () => (dialog.open = false);
export const showCurrencyList = () => (dialog.open = true);
