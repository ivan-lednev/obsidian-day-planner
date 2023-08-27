import { render, screen } from "@testing-library/svelte";

import Ruler from "./ruler.svelte";

test("shows hours", () => {
  render(Ruler, { visibleHours: [0, 1, 2, 3] });

  expect(screen.getByText("1")).toBeVisible();
});
