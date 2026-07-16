import { TFile, type Vault } from "obsidian";

import type { Match } from "./search-service";

export interface SearchOrderingService {
  order(matches: Match[]): Promise<Match[]>;
}

export class MtimeSearchOrderingService implements SearchOrderingService {
  constructor(private readonly vault: Vault) {}

  async order(matches: Match[]): Promise<Match[]> {
    return [...matches].sort(
      (a, b) => this.getMtime(b.path) - this.getMtime(a.path),
    );
  }

  private getMtime(path: string) {
    const file = this.vault.getAbstractFileByPath(path);

    return file instanceof TFile ? file.stat.mtime : 0;
  }
}
