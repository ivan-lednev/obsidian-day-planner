import type { Vault } from "obsidian";

import { selectLatestClosedLogEndByParentId } from "../redux/index/index-selectors";
import {
  createFileEntryId,
  createTaskEntryId,
} from "../redux/index/index-slice";
import type { RootState } from "../redux/store";

import type { Match } from "./search-service";

export interface SearchOrderingService {
  order(matches: Match[]): Promise<Match[]>;
}

export class DefaultSearchOrderingService implements SearchOrderingService {
  constructor(
    private readonly vault: Vault,
    private readonly getState: () => RootState,
  ) {}

  async order(matches: Match[]): Promise<Match[]> {
    const latestClosedLogEndByParentId = selectLatestClosedLogEndByParentId(
      this.getState(),
    );

    function getLatestClosedLogEndTimestamp(match: Match) {
      const id =
        match.type === "task"
          ? createTaskEntryId(match.path, match.position.start.line)
          : createFileEntryId(match.path);

      return latestClosedLogEndByParentId.get(id) ?? 0;
    }

    return matches.toSorted((a, b) => {
      const recencyDiff =
        getLatestClosedLogEndTimestamp(b) - getLatestClosedLogEndTimestamp(a);

      if (recencyDiff !== 0) {
        return recencyDiff;
      }

      const typeDiff = rankByFileFirst(b) - rankByFileFirst(a);

      if (typeDiff !== 0) {
        return typeDiff;
      }

      return this.getMtime(b.path) - this.getMtime(a.path);
    });
  }

  private getMtime(path: string) {
    return this.vault.getFileByPath(path)?.stat.mtime ?? 0;
  }
}

function rankByFileFirst(match: Match) {
  return match.type === "file" ? 1 : 0;
}
