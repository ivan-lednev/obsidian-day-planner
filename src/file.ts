export default class DPFile {
    normalizePath(path: string) : string {
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