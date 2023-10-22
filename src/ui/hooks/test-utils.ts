import moment from "moment/moment";

import type { PlacedPlanItem } from "../../types";

export const basePlanItem: PlacedPlanItem = {
  listTokens: "- ",
  startTime: moment("2023-01-01"),
  startMinutes: 0,
  durationMinutes: 60,
  text: "",
  firstLineText: "",
  placing: {
    xOffsetPercent: 0,
    widthPercent: 100,
  },
  location: {
    path: "path",
    line: 0,
    position: {
      start: {
        line: 0,
        col: 0,
        offset: 0,
      },
      end: {
        line: 0,
        col: 0,
        offset: 0,
      },
    },
  },
  id: "id",
};
