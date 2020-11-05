export default class DayPlannerSettings {
  customFolder: string = 'Day Planners';
  mode: DayPlannerMode = DayPlannerMode.File;
  todayPlannerNote: NoteForDate;
}

export class NoteForDate {
  notePath: string;
  date: Date;

  constructor(notePath: string, date:Date){
    this.notePath = notePath;
    this.date = date;
  }
}
  
export enum DayPlannerMode {
  File,
  Command
}