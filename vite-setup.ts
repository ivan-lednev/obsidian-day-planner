import moment, { type Moment } from "moment";
import { vi, expect } from "vitest";
import path from "path";
import { defaultDayFormat } from "./src/constants";

window.moment = moment;

vi.mock("obsidian", () => ({
  TFile: vi.fn(),
  normalizePath: (p: string) => path.normalize(p),
}));

vi.mock("obsidian-dataview", () => ({
  default: vi.fn(),
}));

vi.mock("obsidian-daily-notes-interface", () => ({
  default: vi.fn(),
  getDateFromPath: vi.fn(() => null),
  DEFAULT_DAILY_NOTE_FORMAT: defaultDayFormat,
}));

function areMomentsEqual(a: Moment, b: Moment) {
  const isAMomment = moment.isMoment(a);
  const isBMomment = moment.isMoment(b);

  if (isAMomment && isBMomment) {
    return a.isSame(b);
  } else if (!isAMomment && !isBMomment) {
    return undefined;
  }

  return false;
}

expect.addEqualityTesters([areMomentsEqual]);
