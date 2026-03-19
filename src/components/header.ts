import "./header.css";
import { _ } from "../helpers/utils";

const header = _("cp-header") as HTMLHeadElement;

let currentText = "";

export function setHeaderText(text: string) {
  currentText = header.innerText = text;
}

export function getHeaderText() {
  return currentText;
}
