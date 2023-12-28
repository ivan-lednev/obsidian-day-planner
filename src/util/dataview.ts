import { DataArray } from "obsidian-dataview";

export function unwrap<T>(group: ReturnType<DataArray<T>["groupBy"]>) {
  return group.map(({ key, rows }) => [key, rows.array()]).array();
}
