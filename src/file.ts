import { Vault, normalizePath } from 'obsidian';
import { DAY_PLANNER_DEFAULT_CONTENT, DAY_PLANNER_FILENAME } from './constants';
import MomentDateRegex from './moment-date-regex';
import { DayPlannerSettings, DayPlannerMode, NoteForDateQuery, NoteForDate } from './settings';
import { appHasDailyNotesPluginLoaded, getDailyNoteSettings } from 'obsidian-daily-notes-interface';

export default class DayPlannerFile {
    vault: Vault;
    settings: DayPlannerSettings;
    momentDateRegex: MomentDateRegex;
    noteForDateQuery: NoteForDateQuery;

    constructor(vault: Vault, settings: DayPlannerSettings){
        this.vault = vault;
        this.settings = settings;
        this.momentDateRegex = new MomentDateRegex();
        this.noteForDateQuery = new NoteForDateQuery();
    }


    async hasTodayNote(): Promise<boolean> {
        if (this.settings.mode == DayPlannerMode.Daily && appHasDailyNotesPluginLoaded()) {
            const date = new Date();
            const { folder, format } = getDailyNoteSettings(); 
            const filename = this.momentDateRegex.getMoment(date, format) + '.md';
            const path = normalizePath(folder + '/' + filename);
            if (await this.vault.adapter.exists(path)) {
                const noteForDate = new NoteForDate(path,  date.toDateString());
                this.settings.notesToDates = [noteForDate];
                return true;
            }
            return false;
        }

        return this.settings.mode === DayPlannerMode.File || this.noteForDateQuery.exists(this.settings.notesToDates);
    }

    todayPlannerFilePath(): string {
        if(this.settings.mode === DayPlannerMode.Command || this.settings.mode === DayPlannerMode.Daily){
            return this.noteForDateQuery.active(this.settings.notesToDates).notePath;
        }
        const fileName = this.todayPlannerFileName();
        return `${this.settings.customFolder ?? 'Day Planners'}/${fileName}`;
    }

    todayPlannerFileName(): string {
        return this.momentDateRegex.replace(DAY_PLANNER_FILENAME);
    }

    async prepareFile() {
        try {      
            if(this.settings.mode === DayPlannerMode.File){      
                await this.createFolderIfNotExists(this.settings.customFolder);
                await this.createFileIfNotExists(this.todayPlannerFilePath());
            }
        } catch (error) {
            console.log(error)
        }
    }

    async createFolderIfNotExists(path: string){
        try {
            const normalizedPath = normalizePath(path);
            const folderExists = await this.vault.adapter.exists(normalizedPath, false)
            if(!folderExists) {
              await this.vault.createFolder(normalizedPath);
            }
        } catch (error) {
            console.log(error)
        }
    }

    async createFileIfNotExists(fileName: string) {
        try {
            const normalizedFileName = normalizePath(fileName);
            if (!await this.vault.adapter.exists(normalizedFileName, false)) {
                await this.vault.create(normalizedFileName, DAY_PLANNER_DEFAULT_CONTENT);
            }
        } catch (error) {
            console.log(error)
        }
    }

    async getFileContents(fileName: string){
        await this.prepareFile();
        try {
            return await this.vault.adapter.read(fileName);
        } catch (error) {
            console.log(error)
        }
    }
    
    async updateFile(fileName: string, fileContents: string){
        await this.prepareFile();
        try {
            return await this.vault.adapter.write(normalizePath(fileName), fileContents);
        } catch (error) {
            console.log(error)
        }
    }
}