import type { App, Notice } from "obsidian";
import {
  createDailyNote,
  getDateFromPath,
} from "obsidian-daily-notes-interface";
import { isNotVoid } from "typed-assert";

import { sortListsRecursivelyInMarkdown } from "./mdast/mdast";
import {
  applyScopedUpdates,
  createTransaction,
  getTaskDiffFromEditState,
  mapTaskDiffToUpdates,
  TransactionWriter,
} from "./service/diff-writer";
import type { VaultFacade } from "./service/vault-facade";
import type { DayPlannerSettings } from "./settings";
import type { OnUpdateFn } from "./types";
import { askForConfirmation } from "./ui/confirmation-modal";
import { EditMode } from "./ui/hooks/use-edit/types";
import { SingleSuggestModal } from "./ui/SingleSuggestModal";
import { createUndoNotice } from "./ui/undo-notice";

async function getTextFromUser(app: App): Promise<string | undefined> {
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
  app: App;
  settings: () => DayPlannerSettings;
  transactionWriter: TransactionWriter;
  vaultFacade: VaultFacade;
  onEditCanceled: () => void;
}): OnUpdateFn => {
  const { app, settings, transactionWriter, vaultFacade, onEditCanceled } =
    props;

  let currentUndoNotice: Notice | undefined;

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

      const modalOutput = await getTextFromUser(app);

      if (!modalOutput) {
        onEditCanceled();

        return;
      }

      diff.added[0] = { ...created, text: modalOutput };
    }

    const updates = mapTaskDiffToUpdates(diff, mode, settings());

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
      const confirmed = await askForConfirmation({
        app,
        title: "Need to create files",
        text: `The following files need to be created: ${needToCreate.join("; ")}`,
        cta: "Create",
      });

      if (!confirmed) {
        onEditCanceled();

        return;
      }

      await Promise.all(
        needToCreate.map(async (path) => {
          const date = getDateFromPath(path, "day");

          isNotVoid(date);

          await createDailyNote(date);
        }),
      );
    }

    await transactionWriter.writeTransaction(transaction);

    currentUndoNotice?.hide();
    currentUndoNotice = createUndoNotice(transactionWriter.undo);
  };
};
