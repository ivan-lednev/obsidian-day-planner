import { isNotVoid } from "typed-assert";

export function isTouchEvent(event: PointerEvent) {
  return ["pen", "touch"].includes(event.pointerType);
}

export function isEventRelated(
  event: PointerEvent,
  otherNode: HTMLElement | null,
) {
  if (!otherNode) {
    return false;
  }

  return (
    event.relatedTarget &&
    (event.relatedTarget === otherNode ||
      (event.relatedTarget instanceof Node &&
        otherNode.contains(event.relatedTarget)))
  );
}

export function isTapOutside(
  event: PointerEvent,
  container: HTMLElement | null,
) {
  if (!container) {
    return false;
  }

  return (
    isTouchEvent(event) &&
    event.target !== container &&
    event.target instanceof Node &&
    !container.contains(event.target)
  );
}

export function toggleCheckbox(line: string) {
  if (line.includes("[ ]")) {
    return line.replace("[ ]", "[x]");
  }

  return line.replace("[x]", "[ ]");
}

export function updateLine(
  contents: string,
  lineNumber: number,
  editFn: (line: string) => string,
) {
  const lines = contents.split("\n");
  const originalLine = lines[lineNumber];

  isNotVoid(
    originalLine,
    `No line #${lineNumber} in text with ${lines.length} lines`,
  );

  lines[lineNumber] = editFn(originalLine);

  return lines.join("\n");
}
