import { Prec, StateEffect, StateField } from "@codemirror/state";
import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { editorInfoField, getIcon } from "obsidian";
import { isNotVoid } from "typed-assert";

class ClockControlMarker extends GutterMarker {
  toDOM() {
    const icon = getIcon("play");

    isNotVoid(icon);

    return icon;
  }
}

export function createClockControlExtension(props: {
  onpointerup: (event: Event, location: { path: string; line: number }) => void;
  onpointermove: (view: EditorView, line: number) => boolean;
}) {
  const { onpointerup, onpointermove } = props;

  const marker = new ClockControlMarker();

  return Prec.lowest(
    gutter({
      class: "cm-planner-clock-gutter",
      lineMarker(view, line) {
        if (
          view.state.doc.lineAt(line.from).number ===
          view.state.field(markedLine)
        ) {
          return marker;
        }

        return null;
      },
      lineMarkerChange(update) {
        return (
          update.state.field(markedLine) !== update.startState.field(markedLine)
        );
      },
      initialSpacer() {
        return marker;
      },
      domEventHandlers: {
        pointerup: (view, line, event) => {
          const path = view.state.field(editorInfoField).file?.path;

          if (!path) {
            return false;
          }

          onpointerup(event, {
            path,
            line: view.state.doc.lineAt(line.from).number,
          });

          return true;
        },
        pointermove: (view, lineBlockInfo) => {
          const line = view.state.doc.lineAt(lineBlockInfo.from).number;

          return onpointermove(view, line);
        },
      },
    }),
  );
}

const setMarkedLine = StateEffect.define<number | null>({
  map(line) {
    return line;
  },
});

const markedLine = StateField.define<number | null>({
  create() {
    return null;
  },
  update(previous, transaction) {
    const effect = transaction.effects.find((it) => it.is(setMarkedLine));

    if (!effect) {
      return previous;
    }

    return effect.value;
  },
});

export type MarkerPredicateProps = {
  path: string;
  line: number | null;
};

export type MarkerPredicate = (props: MarkerPredicateProps) => boolean;

function createLineNumberPlugin(props: {
  onpointermove: (view: EditorView, line: number | null) => void;
}) {
  const { onpointermove } = props;

  return EditorView.domEventObservers({
    pointermove(event, view) {
      const posAtCoords = view.posAtCoords({
        x: event.clientX,
        y: event.clientY,
      });

      const line = posAtCoords
        ? view.state.doc.lineAt(posAtCoords).number
        : null;

      onpointermove(view, line);
    },
  });
}

export function hoverPlugin(props: {
  onpointerup: (event: Event, location: { path: string; line: number }) => void;
  markerPredicate: MarkerPredicate;
}) {
  const { onpointerup, markerPredicate } = props;

  function handlePointerMove(view: EditorView, line: number | null) {
    if (view.state.field(markedLine) === line) {
      return false;
    }

    const path = view.state.field(editorInfoField).file?.path;

    if (!path) {
      return false;
    }

    view.dispatch({
      effects: setMarkedLine.of(markerPredicate({ path, line }) ? line : null),
    });

    return true;
  }

  return [
    createClockControlExtension({
      onpointerup,
      onpointermove: handlePointerMove,
    }),
    createLineNumberPlugin({ onpointermove: handlePointerMove }),
    markedLine,
  ];
}
