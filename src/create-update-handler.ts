import type { App } from "obsidian";
import { isNotVoid } from "typed-assert";

import { sortListsRecursivelyInMarkdown } from "./mdast/mdast";
import {
  createTransaction,
  getTaskDiffFromEditState,
  mapTaskDiffToUpdates,
  TransactionWriter,
  type Update,
} from "./service/diff-writer";
import type { PeriodicNotes } from "./service/periodic-notes";
import type { VaultFacade } from "./service/vault-facade";
import type { DayPlannerSettings } from "./settings";
import type { OnUpdateFn } from "./types";
import { type ConfirmationModalProps } from "./ui/confirmation-modal";
import { EditMode } from "./ui/hooks/use-edit/types";
import { SingleSuggestModal } from "./ui/SingleSuggestModal";
import { applyScopedUpdates } from "./util/markdown";

export async function getTextFromUser(props: {
  app: App;
  initialText?: string;
  getDescriptionText: (value: string) => string;
}): Promise<string | undefined> {
  return new Promise((resolve) => {
    new SingleSuggestModal({
      app: props.app,
      initialValue: props.initialText,
      getDescriptionText: props.getDescriptionText,
      onChooseSuggestion: async ({ text }) => {
        resolve(text);
      },
      onClose: () => {
        resolve(undefined);
      },
    }).open();
  });
}

export const createEditLineHandler =
  (props: {
    settings: () => DayPlannerSettings;
    transactionWriter: TransactionWriter;
    onConfirmed: () => void;
  }) =>
  async (target: {
    path: string;
    position: { line: number; col: number };
    contents: string;
  }) => {
    const update: Update = {
      type: "updated",
      path: target.path,
      range: { start: target.position, end: target.position },
      contents: target.contents,
    };

    const transaction = createTransaction({
      updates: [update],
      settings: props.settings(),
    });

    await props.transactionWriter.writeTransaction(transaction);

    props.onConfirmed();
  };

export const createUpdateHandler = (props: {
  settings: () => DayPlannerSettings;
  transactionWriter: TransactionWriter;
  vaultFacade: VaultFacade;
  periodicNotes: PeriodicNotes;
  onEditCanceled: () => void;
  onEditConfirmed: () => void;
  getTextInput: () => Promise<string | undefined>;
  getConfirmationInput: (input: ConfirmationModalProps) => Promise<boolean>;
}): OnUpdateFn => {
  const {
    settings,
    transactionWriter,
    vaultFacade,
    onEditCanceled,
    onEditConfirmed,
    periodicNotes,
    getTextInput,
    getConfirmationInput,
  } = props;

  function getPathsToCreate(paths: string[]) {
    return paths.reduce<string[]>(
      (result, path) =>
        vaultFacade.checkFileExists(path) ? result : result.concat(path),
      [],
    );
  }

  return async (base, next, mode) => {
    const diff = getTaskDiffFromEditState(base, next);

    if (mode === EditMode.CREATE) {
      const created = diff.added[0];

      isNotVoid(created);

      const modalOutput = await getTextInput();

      if (!modalOutput) {
        onEditCanceled();

        return false;
      }

      diff.added[0] = { ...created, text: modalOutput };
    }

    const updates = mapTaskDiffToUpdates(diff, settings(), periodicNotes);

    const afterEach = settings().sortTasksInPlanAfterEdit
      ? (contents: string) =>
          applyScopedUpdates(
            contents,
            settings().plannerHeading,
            sortListsRecursivelyInMarkdown,
          )
      : undefined;

    const transaction = createTransaction({
      updates,
      // todo: delete
      afterEach,
      settings: settings(),
    });

    const updatePaths = [...new Set([...transaction.map(({ path }) => path)])];

    const needToCreate = getPathsToCreate(updatePaths);

    if (needToCreate.length > 0) {
      const confirmed = await getConfirmationInput({
        title: "Need to create files",
        text: `The following files need to be created: ${needToCreate.join("; ")}`,
        cta: "Create",
      });

      if (!confirmed) {
        onEditCanceled();

        return false;
      }

      await Promise.all(
        needToCreate.map(async (path) => {
          const date = periodicNotes.getDateFromPath(path, "day");

          isNotVoid(date);

          await periodicNotes.createDailyNote(date);
        }),
      );
    }

    await transactionWriter.writeTransaction(transaction);

    onEditConfirmed();

    return true;
  };
};
