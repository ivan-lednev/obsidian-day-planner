// noinspection JSPotentiallyInvalidUsageOfClassThis

import { Effect, Either, pipe } from "effect";
import { Notice } from "obsidian";

import type { ListPropsParseResult } from "../redux/dataview/dataview-slice";
import type { AppStore } from "../redux/store";
import { locToEditorPosition } from "../util/editor";
import {
  addOpenClock,
  cancelOpenClock,
  clockOut,
  createPropsWithOpenClock,
  type Props,
  toIndentedMarkdown,
} from "../util/props";

import type { ListPropsParser } from "./list-props-parser";
import { MetadataCacheFacade } from "./metadata-cache-facade";
import type { VaultFacade } from "./vault-facade";
import { WorkspaceFacade } from "./workspace-facade";

const withNoticeOnError = Effect.catchAll((error) =>
  Effect.sync(() => {
    new Notice(String(error));

    console.error(error);
  }),
);

export class TaskEntryEditor {
  editProps = (props: {
    path: string;
    line: number;
    editFn: (props?: Props) => Props;
  }) => {
    const { path, line, editFn } = props;

    return pipe(
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

        const listPropsForLine = yield* this.findListProps(path, line);

        const updatedProps = yield* Effect.try({
          try: () => editFn(listPropsForLine?.parsed),
          catch: (error) => {
            const cause =
              error instanceof Error ? error.message : String(error);

            return new Error(`Could not edit props. Cause: ${cause}`, {
              cause: error,
            });
          },
        });

        const indented = yield* toIndentedMarkdown(
          updatedProps,
          listItem.position.start.col,
        );

        yield* Effect.tryPromise({
          try: () =>
            this.vaultFacade.editFile(path, (contents) => {
              if (listPropsForLine) {
                return (
                  contents.slice(0, listPropsForLine.position.start.offset) +
                  indented +
                  contents.slice(listPropsForLine.position.end.offset)
                );
              }

              return (
                contents.slice(0, listItem.position.end.offset) +
                "\n" +
                indented +
                contents.slice(listItem.position.end.offset)
              );
            }),
          catch: (error) =>
            new Error(`Could not edit file ${path}`, { cause: error }),
        });
      }),
      withNoticeOnError,
      Effect.runPromise,
    );
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

  clockInUnderCursor = () =>
    this.updateListPropsUnderCursor((props) =>
      // todo: remove duplication
      Either.right(addOpenClock(props ?? createPropsWithOpenClock())),
    );

  clockOutUnderCursor = () =>
    this.updateListPropsUnderCursor((props) =>
      pipe(
        Either.fromNullable(
          props,
          () => new Error("There are no props under cursor"),
        ),
        Either.map(clockOut),
      ),
    );

  cancelClockUnderCursor = () =>
    this.updateListPropsUnderCursor((props) =>
      pipe(
        Either.fromNullable(
          props,
          () => new Error("There are no props under cursor"),
        ),
        Either.map(cancelOpenClock),
      ),
    );

  constructor(
    private readonly getState: AppStore["getState"],
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly metadataCacheFacade: MetadataCacheFacade,
    private readonly listPropsParser: ListPropsParser,
  ) {}

  private getListItemCacheUnderCursorFromLastView = () =>
    Effect.gen(this, function* () {
      const location = yield* Either.try({
        try: () => this.workspaceFacade.getLastCaretLocation(),
        catch: (error) =>
          new Error("Failed to get caret location", { cause: error }),
      });

      const { path, line } = location;

      const listItemCache = yield* this.metadataCacheFacade.getListItemEffect(
        path,
        line,
      );

      return { listItemCache, location };
    });

  private updateListPropsUnderCursor = (
    updateFn: (props?: Props) => Either.Either<Props, Error>,
  ) =>
    pipe(
      Effect.gen(this, function* () {
        const {
          listItemCache,
          location: { path, line },
        } = yield* this.getListItemCacheUnderCursorFromLastView();

        const foundListProps = yield* this.findListProps(path, line);

        const updatedFormattedProps = yield* pipe(
          foundListProps,
          Either.fromNullable(() => new Error("No list props under cursor")),
          Either.flatMap((foundListPropsForLine) =>
            updateFn(foundListPropsForLine.parsed),
          ),
          Either.flatMap((updatedProps) =>
            toIndentedMarkdown(updatedProps, listItemCache.position.start.col),
          ),
        );

        const view = yield* Either.try({
          try: () => this.workspaceFacade.getActiveMarkdownView(),
          catch: (error) =>
            new Error("Could not get active markdown view", { cause: error }),
        });

        if (foundListProps) {
          return view.editor.replaceRange(
            updatedFormattedProps,
            locToEditorPosition(foundListProps.position.start),
            locToEditorPosition(foundListProps.position.end),
          );
        }

        const afterFirstLineEditorPos = {
          line: listItemCache.position.start.line + 1,
          ch: 0,
        };

        let newlyAddedProps = updatedFormattedProps + "\n";

        if (listItemCache.position.start.line === view.editor.lastLine()) {
          newlyAddedProps = "\n" + newlyAddedProps;
        }

        return view.editor.replaceRange(
          newlyAddedProps,
          afterFirstLineEditorPos,
          afterFirstLineEditorPos,
        );
      }),
      withNoticeOnError,
      Effect.runPromise,
    );
}
