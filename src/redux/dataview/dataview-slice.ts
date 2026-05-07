import { type PayloadAction } from "@reduxjs/toolkit";
import type { Pos } from "obsidian";

import type { Props } from "../../util/props";
import { createAppSlice } from "../create-app-slice";

export type ListPropsParseResult = {
  parsed: Props;
  position: Pos;
};

export type LineToListProps = Record<number, ListPropsParseResult>;

interface DataviewSliceState {
  dataviewLoaded: boolean;
}

const initialState: DataviewSliceState = {
  dataviewLoaded: false,
};

export const dataviewSlice = createAppSlice({
  name: "dataview",
  initialState,
  reducers: (create) => ({
    dataviewChange: create.reducer((state, action: PayloadAction<string>) => {
      state.dataviewLoaded = true;
    }),
  }),
  selectors: {
    selectDataviewLoaded: (state) => state.dataviewLoaded,
  },
});

export const { dataviewChange } = dataviewSlice.actions;

export const { selectDataviewLoaded } = dataviewSlice.selectors;

export type DataviewChangeAction = ReturnType<typeof dataviewChange>;
