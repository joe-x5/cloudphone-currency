// Right-to-left (RTL) languages
const RTL = new Set([
  "ar",
  "ur",
  "arc",
  "az",
  "dv",
  "ff",
  "he",
  "ku",
  "fa",
  "nqo",
  "syc",
  "rhg",
]);

export const getLanguageCode = (langCode: string): string => {
  if (langCode.includes("-")) {
    return langCode.split("-")[0].toLowerCase();
  }

  return langCode.toLowerCase();
};

export const isRTL = (langCode: string): boolean =>
  RTL.has(getLanguageCode(langCode));

export type WritingDirection = "ltr" | "rtl";

export const getDirection = (langCode: string): WritingDirection =>
  isRTL(langCode) ? "rtl" : "ltr";
