import moment from "moment/moment";

import type { LocalTask, WithTime } from "../../../src/task-types";

import { baseTask, unscheduledTask } from "./test-utils";

export const dayKey = "2023-01-01";
export const day = moment(dayKey);
export const nextDayKey = "2023-01-02";
export const nextDay = moment(nextDayKey);

export const emptyTasks = [];
export const baseTasks: Array<WithTime<LocalTask>> = [baseTask];
export const tasksWithUnscheduledTask: Array<LocalTask> = [unscheduledTask];
