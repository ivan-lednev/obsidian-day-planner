import { Effect, Either } from "effect";
import { stringifyYaml } from "obsidian";
import { isNotVoid } from "typed-assert";

import { locToEditorPosition } from "../util/editor";
import { getErrorMessage } from "../util/error";
import { propsSchema, toIndentedMarkdown, type Props } from "../util/props";

import type { ListPropsParser } from "./list-props-parser";
import type { MetadataCacheFacade } from "./metadata-cache-facade";
import type { VaultFacade } from "./vault-facade";
import type { WorkspaceFacade } from "./workspace-facade";

export type PropsEditFn = (props: Props | undefined) => Props;

export type YamlEditTarget = (
  editFn: PropsEditFn,
) => Effect.Effect<void, Error>;

export function editYaml(target: YamlEditTarget, editFn: PropsEditFn) {
  return target(editFn);
}

export function requireProps(
  editFn: (props: Props) => Props,
  message = "No props found",
): PropsEditFn {
  return (props) => {
    isNotVoid(props, message);

    return editFn(props);
  };
}

export function createYamlEditTargets(deps: {
  vaultFacade: VaultFacade;
  metadataCacheFacade: MetadataCacheFacade;
  listPropsParser: ListPropsParser;
  workspaceFacade: WorkspaceFacade;
}) {
  const { vaultFacade, metadataCacheFacade, listPropsParser, workspaceFacade } =
    deps;

  function findListProps(path: string, line: number) {
    return Effect.tryPromise({
      try: async () => {
        const parseResult = await listPropsParser.parse(path);

        return parseResult?.[line];
      },
      catch: (error) =>
        new Error(`Failed to parse list props at ${path}:${line}`, {
          cause: error,
        }),
    });
  }

  function prepareEdit(path: string, line: number, editFn: PropsEditFn) {
    return Effect.gen(function* () {
      const listItem = yield* metadataCacheFacade.getListItemEffect(path, line);

      if (!listItem.task) {
        return yield* Effect.fail(
          new Error(
            `Cannot add props to an item that's not a task at ${path}:${line}`,
          ),
        );
      }

      const baseProps = yield* findListProps(path, line);

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
  }

  function inListItemProps(path: string, line: number): YamlEditTarget {
    return (editFn) =>
      Effect.gen(function* () {
        const { listItem, baseProps, updatedProps } = yield* prepareEdit(
          path,
          line,
          editFn,
        );

        yield* Effect.tryPromise({
          try: () =>
            vaultFacade.editFile(path, (contents) => {
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
  }

  function underCursor(): YamlEditTarget {
    return (editFn) =>
      Effect.gen(function* () {
        const { path, line } = yield* Either.try({
          try: () => workspaceFacade.getLastCaretLocation(),
          catch: (error) =>
            new Error("Failed to get caret location", { cause: error }),
        });

        const { listItem, baseProps, updatedProps } = yield* prepareEdit(
          path,
          line,
          editFn,
        );

        const view = yield* Either.try({
          try: () => workspaceFacade.getActiveMarkdownView(),
          catch: (error) =>
            new Error("Could not get active markdown view", { cause: error }),
        });

        if (baseProps) {
          view.editor.replaceRange(
            updatedProps,
            locToEditorPosition(baseProps.position.start),
            locToEditorPosition(baseProps.position.end),
          );

          return;
        }

        const afterFirstLineEditorPos = {
          line: listItem.position.start.line + 1,
          ch: 0,
        };

        let newlyAddedProps = updatedProps + "\n";

        if (listItem.position.start.line === view.editor.lastLine()) {
          newlyAddedProps = "\n" + newlyAddedProps;
        }

        view.editor.replaceRange(
          newlyAddedProps,
          afterFirstLineEditorPos,
          afterFirstLineEditorPos,
        );
      });
  }

  function inFrontmatter(path: string): YamlEditTarget {
    return (editFn) =>
      Effect.gen(function* () {
        const existingFrontmatter = yield* Effect.either(
          metadataCacheFacade.getFrontmatterEffect(path),
        );

        const raw = Either.isRight(existingFrontmatter)
          ? existingFrontmatter.right.raw
          : undefined;

        const currentProps = yield* Effect.try({
          try: () => propsSchema.parse(raw ?? {}),
          catch: (error) =>
            new Error(`Could not parse frontmatter at ${path}`, {
              cause: error,
            }),
        });

        const updatedYaml = yield* Effect.try({
          try: () => stringifyYaml(editFn(currentProps)),
          catch: (error) =>
            new Error(
              `Could not edit props. Cause: ${getErrorMessage(error)}`,
              { cause: error },
            ),
        });

        yield* Effect.tryPromise({
          try: () =>
            vaultFacade.editFile(path, (contents) => {
              if (Either.isRight(existingFrontmatter)) {
                const { position } = existingFrontmatter.right;

                // todo: use a small util for constructing frontmatter fence (can live in markdown utils.
                return (
                  contents.slice(0, position.start.offset) +
                  "---\n" +
                  updatedYaml +
                  "---" +
                  contents.slice(position.end.offset)
                );
              }

              return `---\n${updatedYaml}---\n${contents}`;
            }),
          catch: (error) =>
            new Error(`Could not edit file ${path}`, { cause: error }),
        });
      });
  }

  return { inListItemProps, underCursor, inFrontmatter };
}

export type YamlEditTargets = ReturnType<typeof createYamlEditTargets>;
