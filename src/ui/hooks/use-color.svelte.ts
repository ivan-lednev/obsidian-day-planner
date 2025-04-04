import chroma from "chroma-js";

import { getObsidianContext } from "../../context/obsidian-context";
import { currentTimeSignal } from "../../global-store/current-time";
import type { Task } from "../../task-types";
import { getTextColorWithEnoughContrast } from "../../util/color";
import { getRelationToNow } from "../../util/moment";
import * as t from "../../util/task-utils";
import { getOneLineSummary } from "../../util/task-utils";

interface UseColorProps {
  task: Task;
}

const defaultBorderColor = "var(--color-base-50)";

export function useColor({ task }: UseColorProps) {
  const { settingsSignal, isDarkMode } = getObsidianContext();

  const relationToNow = $derived.by(() => {
    if (task.isAllDayEvent) {
      return getRelationToNow(
        currentTimeSignal.current,
        task.startTime.clone().startOf("day"),
        task.startTime.clone().endOf("day"),
      );
    }

    if (t.isWithTime(task)) {
      return getRelationToNow(
        currentTimeSignal.current,
        task.startTime,
        t.getEndTime(task),
      );
    }

    return "present";
  });

  const colorScale = $derived.by(() => {
    const { timelineStartColor, timelineEndColor } = settingsSignal.current;

    return chroma.scale([timelineStartColor, timelineEndColor]).mode("lab");
  });

  const colorOverride = $derived.by(() => {
    const { colorOverrides } = settingsSignal.current;

    return colorOverrides.find((override) =>
      getOneLineSummary(task).includes(override.text),
    );
  });

  const backgroundColor = $derived.by(() => {
    const { timelineColored, startHour } = settingsSignal.current;

    if (colorOverride) {
      return isDarkMode.current
        ? colorOverride?.darkModeColor
        : colorOverride?.color;
    }

    if (timelineColored) {
      const scaleKey = (task.startTime.hour() - startHour) / (24 - startHour);

      return colorScale(scaleKey).hex();
    }

    if (relationToNow === "past") {
      return "var(--background-secondary)";
    }

    return "var(--background-primary)";
  });

  const borderColor = $derived(
    relationToNow === "present" && !task.isAllDayEvent
      ? "var(--color-accent)"
      : defaultBorderColor,
  );

  const properContrastColors = $derived.by(() => {
    const { timelineColored } = settingsSignal.current;

    return timelineColored || colorOverride
      ? getTextColorWithEnoughContrast(backgroundColor)
      : {
          normal: "inherit",
          muted: "inherit",
          faint: "inherit",
        };
  });

  return {
    get properContrastColors() {
      return properContrastColors;
    },
    get backgroundColor() {
      return backgroundColor;
    },
    get borderColor() {
      return borderColor;
    },
  };
}
