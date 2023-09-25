import { DataArray, DataviewApi, STask } from "obsidian-dataview";

export class DataviewFacade {
  constructor(private readonly dataview: DataviewApi) {}

  main() {
    return this.dataview.pages()["file"]["tasks"] as DataArray<STask>;
  }
}
