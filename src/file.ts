import { now } from 'moment';
import { Vault, normalizePath } from 'obsidian';
import { DAY_PLANNER_FILENAME } from './constants';
import MomentDateRegex from './moment-date-regex';
import { DayPlannerSettings, DayPlannerMode, NoteForDateQuery } from './settings';

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


    hasTodayNote(): boolean {
        return this.settings.mode === DayPlannerMode.File || this.noteForDateQuery.exists(this.settings.notesToDates);
    }

    todayPlannerFilePath(): string {
        if(this.settings.mode === DayPlannerMode.Command){
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
                await this.vault.create(normalizedFileName, DayPlannerSettings.defaultContent);
            }
        } catch (error) {
            console.log(error)
        }
    }

    async getFileContents(fileName: string){
        this.prepareFile();
        try {
            return await this.vault.adapter.read(fileName);
        } catch (error) {
            console.log(error)
        }
    }
    
    async updateFile(fileName: string, fileContents: string){
        this.prepareFile();
        try {
            return await this.vault.adapter.write(normalizePath(fileName), fileContents);
        } catch (error) {
            console.log(error)
        }
    }
}