export class DayPlannerSettings {
  customFolder = 'Day Planners';
  noteTemplate = '';
  mode: DayPlannerMode = DayPlannerMode.File;
  mermaid = false;
  notesToDates: NoteForDate[] = [];
  completePastItems = true;
  circularProgress = false;
  nowAndNextInStatusBar = false;
  showTaskNotification = false
  timelineZoomLevel = 4;
  timelineIcon = 'calendar-with-checkmark'
  breakLabel = "BREAK";
  endLabel = "END";
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
  Command
}