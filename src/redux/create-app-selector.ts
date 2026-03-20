import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export const createAppSelector = createSelector.withTypes<RootState>();
