import { Vault } from 'obsidian';
import { DAY_PLANNER_DEFAULT_CONTENT, DAY_PLANNER_FILENAME } from './constants';
import MomentDateRegex from './moment-date-regex';
import DayPlannerSettings, { DayPlannerMode } from './settings';

export default class DayPlannerFile {
    vault: Vault;
    settings: DayPlannerSettings;
    momentDateRegex: MomentDateRegex;

    constructor(vault: Vault, settings: DayPlannerSettings){
        this.vault = vault;
        this.settings = settings;
        this.momentDateRegex = new MomentDateRegex();
    }

    todayPlannerFilePath(): string {
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
            const normalizedPath = this.normalizePath(path);
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
            const normalizedFileName = this.normalizePath(fileName);
            if (!await this.vault.adapter.exists(normalizedFileName, false)) {
                await this.vault.create(normalizedFileName, DAY_PLANNER_DEFAULT_CONTENT);
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
            return await this.vault.adapter.write(this.normalizePath(fileName), fileContents);
        } catch (error) {
            console.log(error)
        }
    }

    private normalizePath(path: string) : string {
        // Always use forward slash
        path = path.replace(/\\/g, '/');
  
        // Strip start/end slash
        while (path.startsWith('/') && path !== '/') {
            path = path.substr(1);
        }
        while (path.endsWith('/') && path !== '/') {
            path = path.substr(0, path.length - 1);
        }
        
        // Use / for root
        if (path === '') {
            path = '/';
        }
    
        path = path
            // Replace non-breaking spaces with regular spaces
            .replace('\u00A0', ' ')
            // Normalize unicode to NFC form
            .normalize('NFC');
        
        return path;
    }
}