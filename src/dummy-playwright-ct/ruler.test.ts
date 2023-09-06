import Ruler from "./ruler.svelte";
import { test, expect } from "@playwright/experimental-ct-svelte";

test.use({ viewport: { width: 500, height: 500 } });

test("should work", async ({ mount }) => {
  const component = await mount(Ruler, {
    props: { visibleHours: [0, 1, 2, 3] },
  });

  await expect(component).toContainText("3");
  await expect(component).toHaveScreenshot("dummy-screenshot.png");
});
