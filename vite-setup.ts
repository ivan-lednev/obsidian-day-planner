import moment, { type Moment } from "moment";
import { vi, expect } from "vitest";
import path from "path";
import yaml from "js-yaml";

window.moment = moment;

vi.mock("obsidian", () => ({
  TFile: vi.fn(),
  normalizePath: (p: string) => path.normalize(p),
  parseYaml: (source: string) => {
    return yaml.load(source);
  },
  Modal: class Modal {
    constructor() {
      throw new Error("Modal is not implemented in tests");
    }
  },
  SuggestModal: class SuggestModal {
    constructor() {
      throw new Error("SuggestModal is not implemented in tests");
    }
  },
  Notice: class Notice {
    constructor() {}
  },
}));

vi.mock("obsidian-dataview", () => ({
  default: vi.fn(),
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
