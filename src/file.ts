import { Vault } from 'obsidian';
import { DAY_PLANNER_DEFAULT_CONTENT, DAY_PLANNER_FILENAME } from './constants';
import MomentDateRegex from './moment-date-regex';
import DayPlannerSettings from './settings';

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
        await this.createFolderIfNotExists(this.settings.customFolder);
        await this.createFileIfNotExists(this.todayPlannerFilePath());
    }

    async createFolderIfNotExists(path: string){
        const normalizedPath = this.normalizePath(path);
        const folderExists = await this.vault.adapter.exists(normalizedPath, false)
        if(!folderExists) {
          await this.vault.createFolder(normalizedPath);
        }
    }

    async createFileIfNotExists(fileName: string) {
        const normalizedFileName = this.normalizePath(fileName);
        if (!await this.vault.adapter.exists(normalizedFileName, false)) {
            await this.vault.create(normalizedFileName, DAY_PLANNER_DEFAULT_CONTENT);
        }
    }

    async getFileContents(fileName: string){
        this.prepareFile();
        return await this.vault.adapter.read(fileName);
    }
    
    async updateFile(fileName: string, fileContents: string){
        this.prepareFile();
        return await this.vault.adapter.write(this.normalizePath(fileName), fileContents);
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