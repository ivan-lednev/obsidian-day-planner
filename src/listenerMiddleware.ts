import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  dataviewListenerStarted,
  dataviewListenerStopped,
  dataviewRefreshRequested,
  dataviewTasksUpdated,
  icalEventsUpdated,
  icalListenerStarted,
  icalListenerStopped,
  icalRefreshRequested,
  selectIsOnline,
  selectSettings,
} from "./globalSlice";
import { request } from "obsidian";
import * as ical from "node-ical";
import { isVEvent } from "./util/use-remote-tasks";
import type { WithIcalConfig } from "./types";
import type { IcalConfig } from "./settings";
import { createBackgroundBatchScheduler } from "./util/scheduler";
import type { DataviewApi } from "obsidian-dataview";

export const listenerMiddleware = createListenerMiddleware();

// listenerMiddleware.startListening({
//   actionCreator: icalListenerStarted,
//   effect: async (action, listenerApi) => {
//     listenerApi.unsubscribe();
//     const previousFetches = new Map<
//       string,
//       Array<WithIcalConfig<ical.VEvent>>
//     >();
//
//     // eslint-disable-next-line no-constant-condition
//     while (true) {
//       const [action, currentState] = await listenerApi.take(
//         isAnyOf(icalRefreshRequested, icalListenerStopped),
//       );
//
//       if (action.type === icalListenerStopped.type) {
//         listenerApi.subscribe();
//         break;
//       }
//
//       const { icals } = selectSettings(currentState);
//       const isOnline = selectIsOnline(currentState);
//
//       if (!isOnline) {
//         return;
//       }
//
//       const calendars = await Promise.all(
//         icals
//           .filter((ical) => ical.url.trim().length > 0)
//           .map(async (calendar) => {
//             try {
//               const veventsWithCalendar =
//                 await getVeventsWithCalendar(calendar);
//
//               previousFetches.set(calendar.url, veventsWithCalendar);
//
//               return veventsWithCalendar;
//             } catch {
//               return previousFetches.get(calendar.url) || [];
//             }
//           }),
//       );
//
//       const allEvents = calendars.flat();
//
//       listenerApi.dispatch(icalEventsUpdated(allEvents));
//     }
//   },
// });
//
// async function getVeventsWithCalendar(calendar: IcalConfig) {
//   const response = await request({
//     url: calendar.url,
//   });
//
//   const parsed = ical.parseICS(response);
//
//   return Object.values(parsed)
//     .filter(isVEvent)
//     .map((icalEvent) => ({
//       ...icalEvent,
//       calendar,
//     }));
// }
