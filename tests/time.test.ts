import moment from "moment";
import { it, expect } from "vitest";

import { parseTime } from "../src/parser/time";

it.each([
  ["13:00", { hours: 13, minutes: 0 }],
  ["13.00", { hours: 13, minutes: 0 }],
  ["3:00", { hours: 3, minutes: 0 }],
  ["3.00", { hours: 3, minutes: 0 }],
  ["3.00am", { hours: 3, minutes: 0 }],
  ["12:30am", { hours: 0, minutes: 30 }],
  ["2:30am", { hours: 2, minutes: 30 }],
  ["2:30 am", { hours: 2, minutes: 30 }],
  ["02:30 am", { hours: 2, minutes: 30 }],
  ["0301pm", { hours: 15, minutes: 1 }],
  ["0301PM", { hours: 15, minutes: 1 }],
])("Parses timestamp %s", (asText, object) => {
  expect(parseTime(asText, moment()).toObject()).toMatchObject(object);
});

it.each([
  ["1:71"],
  ["0301  pm"],
  ["0301"],
  ["1300"],
  ["13 00"],
  ["13"],
  ["3"],
  ["03"],
  ["3pm"],
  ["11 pm"],
  ["3PM"],
  ["11 PM"],
])("Does not parse %s", (asText) => {
  expect(() => parseTime(asText, moment())).toThrow();
});
