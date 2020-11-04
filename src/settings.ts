import { DAY_PLANNER_FILENAME } from './constants';
import MomentDateRegex from './moment-date-regex'; 

export class DayPlannerSettings {
  momentDateRegex: MomentDateRegex;
  customFolder: string;
  timeZone: TimeZone = TimeZone.GMT;

  constructor(){
    this.momentDateRegex = new MomentDateRegex();
    this.customFolder = 'Day Planners';
  }

  todayPlannerFileName():string {
    const fileName = this.momentDateRegex.replace(DAY_PLANNER_FILENAME);
    return `${this.customFolder}/${fileName}`;
  }
}
  
export enum TimeZone {
    GMT
}