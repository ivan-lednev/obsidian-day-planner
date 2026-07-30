import type { App } from "obsidian";
import { isNotVoid } from "typed-assert";

import { sortListsRecursivelyInMarkdown } from "./mdast/mdast";
import {
  createTransaction,
  getTimeBlockDiffFromEditState,
  mapTimeBlockDiffToUpdates,
  TransactionWriter,
  type Update,
} from "./service/diff-writer";
import type { PeriodicNotes } from "./service/periodic-notes";
import type { VaultFacade } from "./service/vault-facade";
import type { DayPlannerSettings } from "./settings";
import type { PlanTimeBlock } from "./time-block-types";
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
    getSettings: () => DayPlannerSettings;
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
      settings: props.getSettings(),
    });

    await props.transactionWriter.writeTransaction(transaction);

    props.onConfirmed();
  };

// todo: merge with the other
export const createDeleteTimeBlockHandler =
  (props: {
    getSettings: () => DayPlannerSettings;
    periodicNotes: PeriodicNotes;
    transactionWriter: TransactionWriter;
    onConfirmed: () => void;
  }) =>
  async (timeBlock: PlanTimeBlock) => {
    const updates = mapTimeBlockDiffToUpdates(
      { deleted: [timeBlock] },
      props.getSettings(),
      props.periodicNotes,
    );

    const transaction = createTransaction({
      updates,
      settings: props.getSettings(),
    });

    await props.transactionWriter.writeTransaction(transaction);

    props.onConfirmed();
  };

export const createUpdateHandler = (props: {
  getSettings: () => DayPlannerSettings;
  transactionWriter: TransactionWriter;
  vaultFacade: VaultFacade;
  periodicNotes: PeriodicNotes;
  onEditCanceled: () => void;
  onEditConfirmed: () => void;
  getTextInput: () => Promise<string | undefined>;
  getConfirmationInput: (input: ConfirmationModalProps) => Promise<boolean>;
}): OnUpdateFn => {
  const {
    getSettings,
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
    const diff = getTimeBlockDiffFromEditState(base, next);

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

    const updates = mapTimeBlockDiffToUpdates(
      diff,
      getSettings(),
      periodicNotes,
    );

    const afterEach = getSettings().sortTasksInPlanAfterEdit
      ? (contents: string) =>
          applyScopedUpdates(
            contents,
            getSettings().plannerHeading,
            sortListsRecursivelyInMarkdown,
          )
      : undefined;

    const transaction = createTransaction({
      updates,
      // todo: delete
      afterEach,
      settings: getSettings(),
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
