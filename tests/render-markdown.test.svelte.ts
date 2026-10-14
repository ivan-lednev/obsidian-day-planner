import { flushSync } from "svelte";
import { isNotVoid } from "typed-assert";
import { describe, expect, test, vi } from "vitest";

import { createRenderMarkdownAttachmentFactory } from "../src/ui/actions/render-markdown.svelte";

const checkboxSelector = '[data-task] input[type="checkbox"]';

function setUp(props: {
  getMarkdown: () => string;
  getTaskLines?: () => Array<number | undefined>;
  onCheckboxLineClick?: (line: number) => Promise<void>;
}) {
  const destroyMarkdown = vi.fn();

  // Stands in for Obsidian's renderer: wipes the element and lays out one
  // checkbox per markdown line, so every render drops the previous line data
  const renderMarkdown = vi.fn((el: HTMLElement, markdown: string) => {
    const items = markdown
      .split("\n")
      .map(() => `<li data-task=" "><input type="checkbox" /></li>`)
      .join("");

    el.innerHTML = `<ul>${items}</ul>`;

    return destroyMarkdown;
  });

  const getTaskLines = vi.fn(props.getTaskLines ?? (() => []));
  const el = document.createElement("div");

  const attachment = createRenderMarkdownAttachmentFactory({ renderMarkdown })({
    getMarkdown: props.getMarkdown,
    getTaskLines,
    onCheckboxLineClick: props.onCheckboxLineClick,
  });

  return { attachment, renderMarkdown, destroyMarkdown, getTaskLines, el };
}

function getStampedLines(el: HTMLElement) {
  return Array.from(
    el.querySelectorAll<HTMLElement>(checkboxSelector),
    (checkbox) => checkbox.dataset.line,
  );
}

function clickCheckbox(el: HTMLElement, index: number) {
  const checkbox = el.querySelectorAll(checkboxSelector)[index];

  isNotVoid(checkbox, `No checkbox at index ${index}`);

  checkbox.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

describe("rendering markdown into an element", () => {
  test("markdown gets re-rendered when its text changes", () => {
    let markdown = $state("text");

    const { attachment, renderMarkdown, destroyMarkdown, el } = setUp({
      getMarkdown: () => markdown,
    });

    $effect.root(() => {
      attachment(el);
      flushSync();

      expect(renderMarkdown).toHaveBeenCalledOnce();
      expect(renderMarkdown).toHaveBeenCalledWith(el, "text");

      markdown = "changed text";
      flushSync();

      expect(destroyMarkdown).toHaveBeenCalledOnce();
      expect(renderMarkdown).toHaveBeenCalledTimes(2);
      expect(renderMarkdown).toHaveBeenLastCalledWith(el, "changed text");
    });
  });

  test("time blocks rebuilt during an edit do not cause a re-render", () => {
    // Every pointer move during an edit rebuilds the blocks, so everything
    // derived from them changes identity while the text stays the same.
    let timeBlock = $state({ text: "text", children: [{ line: 1 }] });

    // Mirrors `toRenderableMarkdown`: a fresh object on every recomputation
    const { listItem } = $derived({ listItem: timeBlock.text });
    const taskLines = $derived(timeBlock.children.map((child) => child.line));

    const { attachment, renderMarkdown, getTaskLines, el } = setUp({
      getMarkdown: () => listItem,
      getTaskLines: () => taskLines,
    });

    $effect.root(() => {
      attachment(el);
      flushSync();

      expect(renderMarkdown).toHaveBeenCalledOnce();
      expect(getTaskLines).toHaveBeenCalledOnce();

      timeBlock = { text: "text", children: [{ line: 1 }] };
      flushSync();

      expect(renderMarkdown).toHaveBeenCalledOnce();
      // Lines are a fresh array, so only the cheap effect re-runs
      expect(getTaskLines).toHaveBeenCalledTimes(2);
    });
  });

  test("task lines get stamped onto the rendered checkboxes", () => {
    const { attachment, el } = setUp({
      getMarkdown: () => "first\nsecond",
      getTaskLines: () => [3, 9],
    });

    $effect.root(() => {
      attachment(el);
      flushSync();

      expect(getStampedLines(el)).toEqual(["3", "9"]);
    });
  });

  test("task lines get stamped again after a re-render", () => {
    let markdown = $state("first");

    const { attachment, renderMarkdown, el } = setUp({
      getMarkdown: () => markdown,
      getTaskLines: () => [7],
    });

    $effect.root(() => {
      attachment(el);
      flushSync();

      expect(getStampedLines(el)).toEqual(["7"]);

      markdown = "second";
      flushSync();

      // The renderer wiped the element, so the nested effect has to re-stamp
      expect(renderMarkdown).toHaveBeenCalledTimes(2);
      expect(getStampedLines(el)).toEqual(["7"]);
    });
  });

  test("moved task lines get re-stamped without a re-render", () => {
    // A paragraph added to the parent list item shifts its children down
    // without changing any text that gets rendered.
    let lines = $state([4]);

    const { attachment, renderMarkdown, el } = setUp({
      getMarkdown: () => "child",
      getTaskLines: () => lines,
    });

    $effect.root(() => {
      attachment(el);
      flushSync();

      expect(getStampedLines(el)).toEqual(["4"]);

      lines = [5];
      flushSync();

      expect(renderMarkdown).toHaveBeenCalledOnce();
      expect(getStampedLines(el)).toEqual(["5"]);
    });
  });

  test("clicking a checkbox reports the line it carries", () => {
    const onCheckboxLineClick = vi.fn().mockResolvedValue(undefined);

    const { attachment, el } = setUp({
      getMarkdown: () => "first\nsecond",
      getTaskLines: () => [3, 9],
      onCheckboxLineClick,
    });

    $effect.root(() => {
      attachment(el);
      flushSync();

      clickCheckbox(el, 1);

      expect(onCheckboxLineClick).toHaveBeenCalledOnce();
      expect(onCheckboxLineClick).toHaveBeenCalledWith(9);
    });
  });

  test("clicks that carry no line data are ignored", () => {
    const onCheckboxLineClick = vi.fn().mockResolvedValue(undefined);

    const { attachment, el } = setUp({
      getMarkdown: () => "first",
      getTaskLines: () => [],
      onCheckboxLineClick,
    });

    $effect.root(() => {
      attachment(el);
      flushSync();

      clickCheckbox(el, 0);

      expect(onCheckboxLineClick).not.toHaveBeenCalled();
    });
  });

  test("tearing down destroys the markdown and detaches the click handler", () => {
    const onCheckboxLineClick = vi.fn().mockResolvedValue(undefined);

    const { attachment, destroyMarkdown, el } = setUp({
      getMarkdown: () => "first",
      getTaskLines: () => [3],
      onCheckboxLineClick,
    });

    let detachClickHandler: (() => void) | undefined;

    const destroyRoot = $effect.root(() => {
      detachClickHandler = attachment(el);
      flushSync();
    });

    expect(destroyMarkdown).not.toHaveBeenCalled();

    isNotVoid(detachClickHandler);

    detachClickHandler();
    destroyRoot();
    flushSync();

    expect(destroyMarkdown).toHaveBeenCalledOnce();

    clickCheckbox(el, 0);

    expect(onCheckboxLineClick).not.toHaveBeenCalled();
  });
});
