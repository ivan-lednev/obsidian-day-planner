export class DayPlannerSettings {
  customFolder: string = 'Day Planners';
  mode: DayPlannerMode = DayPlannerMode.File;
  mermaid: boolean = false;
  notesToDates: NoteForDate[] = [];
  completePastItems: boolean = true;
  circularProgress: boolean = false;
  nowAndNextInStatusBar: boolean = false;
  showTaskNotification: boolean = false
  timelineZoomLevel: number = 4;
  timelineIcon: string = 'calendar-with-checkmark'
  breakLabel: string = "BREAK";
  endLabel: string = "END";
}

export class NoteForDate {
  notePath: string;
  date: string;

  constructor(notePath: string, date:string){
    this.notePath = notePath;
    this.date = date;
  }
}

export class NoteForDateQuery {
  exists(source: NoteForDate[]): boolean {
    return this.active(source) !== undefined;
  }

  active(source: NoteForDate[]): NoteForDate{
    const now = new Date().toDateString();
    return source && source.filter(ntd => ntd.date === now)[0];
  }
}
  
export enum DayPlannerMode {
  File,
  Command,
  Daily
}