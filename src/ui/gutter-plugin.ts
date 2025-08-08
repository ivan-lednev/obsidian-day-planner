import { Prec, StateEffect, StateField } from "@codemirror/state";
import { EditorView, gutter, GutterMarker, ViewPlugin } from "@codemirror/view";
import { getIcon } from "obsidian";
import { isNotVoid } from "typed-assert";

class ClockControlMarker extends GutterMarker {
  toDOM() {
    const icon = getIcon("play");

    isNotVoid(icon);

    return icon;
  }
}

export function createClockControlExtension(props: {
  onpointerup: (event: Event, line: number) => void;
}) {
  const { onpointerup } = props;

  const marker = new ClockControlMarker();

  return Prec.lowest(
    gutter({
      class: "cm-planner-clock-gutter",
      lineMarker(view, line) {
        if (
          view.state.doc.lineAt(line.from).number ===
          view.state.field(hoveredLineNumber)
        ) {
          return marker;
        }

        return null;
      },
      lineMarkerChange(update) {
        return (
          update.state.field(hoveredLineNumber) !==
          update.startState.field(hoveredLineNumber)
        );
      },
      initialSpacer() {
        return marker;
      },
      domEventHandlers: {
        pointerup: (view, line, event) => {
          onpointerup(event, view.state.doc.lineAt(line.from).number);

          return true;
        },
      },
    }),
  );
}

const setHoveredLineNumber = StateEffect.define<number | null>({
  map(line) {
    return line;
  },
});

const hoveredLineNumber = StateField.define<number | null>({
  create() {
    return null;
  },
  update(previous, transaction) {
    return (
      transaction.effects.find((it) => it.is(setHoveredLineNumber))?.value ??
      previous
    );
  },
});

function createLineNumberPlugin(props: {
  markerPredicate: (line: number | null) => boolean;
}) {
  const { markerPredicate } = props;

  return ViewPlugin.fromClass(
    class {
      private readonly markerPredicate = markerPredicate;

      constructor(readonly view: EditorView) {}

      setHoveredLineNumber(lineNumber: number | null) {
        if (
          this.view.state.field(hoveredLineNumber) !== lineNumber &&
          this.markerPredicate(lineNumber)
        ) {
          this.view.dispatch({
            effects: setHoveredLineNumber.of(lineNumber),
          });
        }
      }
    },
    {
      eventObservers: {
        mouseover(event, view) {
          const posAtCoords = view.posAtCoords({
            x: event.clientX,
            y: event.clientY,
          });

          const lineAtCursor = posAtCoords
            ? view.state.doc.lineAt(posAtCoords).number
            : null;

          this.setHoveredLineNumber(lineAtCursor);
        },
      },
    },
  );
}

export function hoverPlugin(props: {
  onpointerup: (event: Event, line: number) => void;
  markerPredicate: (line: number | null) => boolean;
}) {
  const { onpointerup, markerPredicate } = props;

  return [
    createClockControlExtension({ onpointerup }),
    createLineNumberPlugin({ markerPredicate }),
    hoveredLineNumber,
  ];
}
