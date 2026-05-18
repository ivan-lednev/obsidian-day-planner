// noinspection JSPotentiallyInvalidUsageOfClassThis

import { Effect, Either, pipe } from "effect";
import { Notice } from "obsidian";
import { isNotVoid } from "typed-assert";

import type { TaskLocation } from "../task-types";
import { locToEditorPosition } from "../util/editor";
import { getErrorMessage } from "../util/error";
import {
  addOpenClock,
  cancelOpenClock,
  clockOut,
  createPropsWithOpenClock,
  type Props,
  toIndentedMarkdown,
} from "../util/props";

import type { ListPropsParseResult } from "./list-props-parser";
import type { ListPropsParser } from "./list-props-parser";
import { MetadataCacheFacade } from "./metadata-cache-facade";
import type { VaultFacade } from "./vault-facade";
import { WorkspaceFacade } from "./workspace-facade";

export const runWithNoticeOnError = <A, E>(
  program: Effect.Effect<A, E>,
): Promise<void> =>
  pipe(
    program,
    Effect.asVoid,
    Effect.catchAll((error) =>
      Effect.sync(() => {
        new Notice(String(error));

        console.error(error);
      }),
    ),
    Effect.runPromise,
  );

export class ListItemEntryEditor {
  private prepareEdit = (
    path: string,
    line: number,
    editFn: (props?: Props) => Props,
  ) =>
    Effect.gen(this, function* () {
      const listItem = yield* this.metadataCacheFacade.getListItemEffect(
        path,
        line,
      );

      if (!listItem.task) {
        return yield* Effect.fail(
          new Error(
            `Cannot add props to an item that's not a task at ${path}:${line}`,
          ),
        );
      }

      const baseProps = yield* this.findListProps(path, line);

      const editedProps = yield* Effect.try({
        try: () => editFn(baseProps?.parsed),
        catch: (error) =>
          new Error(`Could not edit props. Cause: ${getErrorMessage(error)}`, {
            cause: error,
          }),
      });

      const updatedProps = yield* toIndentedMarkdown(
        editedProps,
        listItem.position.start.col,
      );

      return { listItem, baseProps, updatedProps };
    });

  editProps = (props: {
    path: string;
    line: number;
    editFn: (props?: Props) => Props;
  }) => {
    const { path, line, editFn } = props;

    return Effect.gen(this, function* () {
      const { listItem, baseProps, updatedProps } = yield* this.prepareEdit(
        path,
        line,
        editFn,
      );

      yield* Effect.tryPromise({
        try: () =>
          this.vaultFacade.editFile(path, (contents) => {
            if (baseProps) {
              return (
                contents.slice(0, baseProps.position.start.offset) +
                updatedProps +
                contents.slice(baseProps.position.end.offset)
              );
            }

            return (
              contents.slice(0, listItem.position.end.offset) +
              "\n" +
              updatedProps +
              contents.slice(listItem.position.end.offset)
            );
          }),
        catch: (error) =>
          new Error(`Could not edit file ${path}`, { cause: error }),
      });
    });
  };

  private findListProps = (
    path: string,
    line: number,
  ): Effect.Effect<ListPropsParseResult | undefined, Error> =>
    Effect.tryPromise({
      try: async () => {
        const parseResult = await this.listPropsParser.parse(path);

        return parseResult?.[line];
      },
      catch: (error) =>
        new Error(`Failed to parse list props at ${path}:${line}`, {
          cause: error,
        }),
    });

  editPropsAtLocation = (
    location: TaskLocation,
    editFn: (props: Props) => Props,
  ) => {
    const {
      path,
      position: {
        start: { line },
      },
    } = location;

    return this.editProps({
      path,
      line,
      editFn: (props) => {
        isNotVoid(props, `No list props at ${path}:${line}`);

        return editFn(props);
      },
    });
  };

  clockInAtLocation = (location: TaskLocation) =>
    this.editPropsAtLocation(location, addOpenClock);

  clockOutAtLocation = (location: TaskLocation) =>
    this.editPropsAtLocation(location, clockOut);

  cancelClockAtLocation = (location: TaskLocation) =>
    this.editPropsAtLocation(location, cancelOpenClock);

  clockInUnderCursor = () =>
    this.updateListPropsUnderCursor((props) =>
      props ? addOpenClock(props) : createPropsWithOpenClock(),
    );

  clockOutUnderCursor = () =>
    this.updateListPropsUnderCursor((props) => {
      isNotVoid(props, "There are no props under cursor");

      return clockOut(props);
    });

  cancelClockUnderCursor = () =>
    this.updateListPropsUnderCursor((props) => {
      isNotVoid(props, "There are no props under cursor");

      return cancelOpenClock(props);
    });

  constructor(
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly metadataCacheFacade: MetadataCacheFacade,
    private readonly listPropsParser: ListPropsParser,
  ) {}

  private updateListPropsUnderCursor = (updateFn: (props?: Props) => Props) =>
    pipe(
      Effect.gen(this, function* () {
        const { path, line } = yield* Either.try({
          try: () => this.workspaceFacade.getLastCaretLocation(),
          catch: (error) =>
            new Error("Failed to get caret location", { cause: error }),
        });

        const { listItem, baseProps, updatedProps } = yield* this.prepareEdit(
          path,
          line,
          updateFn,
        );

        const view = yield* Either.try({
          try: () => this.workspaceFacade.getActiveMarkdownView(),
          catch: (error) =>
            new Error("Could not get active markdown view", { cause: error }),
        });

        if (baseProps) {
          return view.editor.replaceRange(
            updatedProps,
            locToEditorPosition(baseProps.position.start),
            locToEditorPosition(baseProps.position.end),
          );
        }

        const afterFirstLineEditorPos = {
          line: listItem.position.start.line + 1,
          ch: 0,
        };

        let newlyAddedProps = updatedProps + "\n";

        if (listItem.position.start.line === view.editor.lastLine()) {
          newlyAddedProps = "\n" + newlyAddedProps;
        }

        return view.editor.replaceRange(
          newlyAddedProps,
          afterFirstLineEditorPos,
          afterFirstLineEditorPos,
        );
      }),
      runWithNoticeOnError,
    );
}
