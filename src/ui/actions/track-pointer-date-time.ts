import type { Moment } from "moment";
import type { Attachment } from "svelte/attachments";
import { get, type Writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { snap } from "../../global-store/derived-settings";
import type { DayPlannerSettings } from "../../settings";
import type { PointerDateTime, Signal } from "../../types";
import { getPointerOffsetY, offsetYToMinutes } from "../../util/dom";
import { minutesToMomentOfDay } from "../../util/moment";

export function trackPointerDateTime(props: {
  getDay: () => Moment;
  pointerDateTime: Writable<PointerDateTime>;
  settingsSignal: Signal<DayPlannerSettings>;
}) {
  const { getDay, pointerDateTime, settingsSignal } = props;

  let el: HTMLElement | undefined;

  const attachment: Attachment<HTMLElement> = (node) => {
    el = node;

    return () => {
      el = undefined;
    };
  };

  return {
    attachment,

    isOnBackground(event: Event) {
      return event.target === el;
    },

    sync(event: MouseEvent | TouchEvent) {
      isNotVoid(el);

      const settings = settingsSignal.current;
      const offsetY = snap(getPointerOffsetY(el, event), settings);
      const minutesSinceMidnight = offsetYToMinutes(
        offsetY,
        settings.zoomLevel,
        settings.startHour,
      );
      const dateTime = minutesToMomentOfDay(
        minutesSinceMidnight,
        window.moment(getDay()),
      );

      if (!dateTime.isSame(get(pointerDateTime).dateTime, "minute")) {
        pointerDateTime.set({ dateTime, type: "dateTime" });
      }
    },
  };
}
