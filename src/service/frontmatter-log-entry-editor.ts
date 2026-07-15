import { Effect } from "effect";
import { stringifyYaml } from "obsidian";

import { getErrorMessage } from "../util/error";
import {
  addOpenClock,
  cancelOpenClock,
  clockOut,
  editLogEntry,
  propsSchema,
  type Props,
} from "../util/props";

import type { MetadataCacheFacade } from "./metadata-cache-facade";
import type { VaultFacade } from "./vault-facade";

export class FrontmatterLogEntryEditor {
  private editFrontmatterProps = ({
    path,
    editFn,
  }: {
    path: string;
    editFn: (props: Props) => Props;
  }) =>
    Effect.gen(this, function* () {
      const { raw, position } =
        yield* this.metadataCacheFacade.getFrontmatterEffect(path);

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
          new Error(`Could not edit props. Cause: ${getErrorMessage(error)}`, {
            cause: error,
          }),
      });

      yield* Effect.tryPromise({
        try: () =>
          this.vaultFacade.editFile(
            path,
            (contents) =>
              contents.slice(0, position.start.offset) +
              "---\n" +
              updatedYaml +
              "---" +
              contents.slice(position.end.offset),
          ),
        catch: (error) =>
          new Error(`Could not edit file ${path}`, { cause: error }),
      });
    });

  clockInAtPath = (path: string) =>
    this.editFrontmatterProps({ path, editFn: addOpenClock });

  clockOutAtPath = (path: string) =>
    this.editFrontmatterProps({ path, editFn: clockOut });

  cancelClockAtPath = (path: string) =>
    this.editFrontmatterProps({ path, editFn: cancelOpenClock });

  editLastClockAtPath = (
    path: string,
    patch: { start?: string; end?: string },
  ) =>
    this.editFrontmatterProps({
      path,
      editFn: (props) => {
        const log = props.planner?.log;

        if (!log?.length) {
          throw new Error("No log entries");
        }

        const last = log[log.length - 1];

        return editLogEntry(props, { originalStart: last.start, patch });
      },
    });

  constructor(
    private readonly vaultFacade: VaultFacade,
    private readonly metadataCacheFacade: MetadataCacheFacade,
  ) {}
}
