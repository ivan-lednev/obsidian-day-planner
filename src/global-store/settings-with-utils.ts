import { settings } from "./settings";
import {
  durationToSize,
  getTimeFromYOffset,
  hiddenHoursSize,
  hourSize,
  sizeToDuration,
  visibleHours,
} from "./settings-utils";

// todo: remove this
export const settingsWithUtils = {
  settings,
  hourSize,
  hiddenHoursSize,
  visibleHours,
  sizeToDuration,
  durationToSize,
  getTimeFromYOffset,
};
