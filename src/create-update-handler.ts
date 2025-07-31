import type { App } from "obsidian";
import { isNotVoid } from "typed-assert";

import { sortListsRecursivelyInMarkdown } from "./mdast/mdast";
import {
  createTransaction,
  getTaskDiffFromEditState,
  mapTaskDiffToUpdates,
  TransactionWriter,
} from "./service/diff-writer";
import type { PeriodicNotes } from "./service/periodic-notes";
import type { VaultFacade } from "./service/vault-facade";
import type { DayPlannerSettings } from "./settings";
import type { OnUpdateFn } from "./types";
import { type ConfirmationModalProps } from "./ui/confirmation-modal";
import { EditMode } from "./ui/hooks/use-edit/types";
import { SingleSuggestModal } from "./ui/SingleSuggestModal";
import { applyScopedUpdates } from "./util/markdown";

export async function getTextFromUser(app: App): Promise<string | undefined> {
  return new Promise((resolve) => {
    new SingleSuggestModal({
      app,
      getDescriptionText: (value) =>
        value.trim().length === 0
          ? "Start typing to create a task"
          : `Create item "${value}"`,
      onChooseSuggestion: async ({ text }) => {
        resolve(text);
      },
      onClose: () => {
        resolve(undefined);
      },
    }).open();
  });
}

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
        return onEditCanceled();
      }

      diff.added[0] = { ...created, text: modalOutput };
    }

    const updates = mapTaskDiffToUpdates(diff, mode, settings(), periodicNotes);

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
        return onEditCanceled();
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

    return onEditConfirmed();
  };
};
