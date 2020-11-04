import { Vault } from 'obsidian';
import { DAY_PLANNER_DEFAULT_CONTENT } from './constants';
import { DayPlannerSettings, Location } from './settings';

export default class DayPlannerFile {
    vault: Vault;
    settings: DayPlannerSettings;

    constructor(vault: Vault, settings: DayPlannerSettings){
        this.vault = vault;
        this.settings = settings;
    }

    async createFolderIfNotExists(path: string){
        const folderExists = await this.vault.adapter.exists(path, false)
        if(!folderExists) {
          await this.vault.createFolder(path);
        }
    }

    async createFileIfNotExists(fileName: string) {
        const normalizedFileName = this.normalizePath(fileName);
        if (!await this.vault.adapter.exists(normalizedFileName, false)) {
            await this.vault.create(normalizedFileName, DAY_PLANNER_DEFAULT_CONTENT);
        }
    }

    async getFileContents(fileName: string){
        return await this.vault.adapter.read(fileName);
    }

    async updateFile(fileName: string, fileContents: string){
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