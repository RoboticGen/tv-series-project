// Mirrors the textarea's text (up to the caret) into a hidden, identically
// styled <div> to measure where the caret actually renders. There's no DOM
// API for "pixel position of caret in a textarea", so this is the standard
// workaround (same technique as the `textarea-caret-position` package).
const MIRRORED_PROPERTIES = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
) {
  const div = document.createElement("div");
  document.body.appendChild(div);

  const computed = window.getComputedStyle(textarea);
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.overflowWrap = "break-word";

  for (const prop of MIRRORED_PROPERTIES) {
    div.style[prop] = computed[prop];
  }

  div.textContent = textarea.value.substring(0, position);

  const span = document.createElement("span");
  span.textContent = textarea.value.substring(position) || ".";
  div.appendChild(span);

  const top =
    span.offsetTop + parseInt(computed.borderTopWidth || "0", 10);
  const left =
    span.offsetLeft + parseInt(computed.borderLeftWidth || "0", 10);
  const height = span.offsetHeight;

  document.body.removeChild(div);

  return { top, left, height };
}
