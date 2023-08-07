import { parseTimestamp } from "./timestamp";

it.each([
  ["13:00", { hours: 13, minutes: 0 }],
  ["13.00", { hours: 13, minutes: 0 }],
  ["1300", { hours: 13, minutes: 0 }],
  ["13 00", { hours: 13, minutes: 0 }],
  ["13", { hours: 13, minutes: 0 }],
  ["3", { hours: 3, minutes: 0 }],
  ["0301", { hours: 3, minutes: 1 }],
  ["03", { hours: 3, minutes: 0 }],
  ["3pm", { hours: 15, minutes: 0 }],
  ["11 pm ", { hours: 23, minutes: 0 }],
  ["0301pm", { hours: 15, minutes: 1 }],
])("Parses timestamp %s", (asText, object) => {
  expect(parseTimestamp(asText).toObject()).toMatchObject(object);
});
