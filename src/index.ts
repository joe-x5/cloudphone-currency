import { populateList } from "./currencyList";
import {
  fetchUSDExchangeRates,
  USDExchangeRateResponse,
  exchangeFormatted,
} from "./exchangeApi";
import { setup } from "./input";

let exchangeRates: USDExchangeRateResponse | undefined = undefined;

async function fetchLatestRates() {
  if (exchangeRates !== undefined) return exchangeRates;

  try {
    exchangeRates = await fetchUSDExchangeRates();
    return exchangeRates;
  } catch (e) {
    console.warn(e);
    // TODO: display error
  }
}

populateList();

fetchUSDExchangeRates()
  .then((rates) => {
    console.log(rates);
    if (!rates) return;

    setup(rates);
  })
  .catch((e) => console.warn(e));

document.documentElement.classList.remove("no-js");
