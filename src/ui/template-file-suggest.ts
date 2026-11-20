import { AbstractInputSuggest, type App, type TFile } from "obsidian";

/**
 * Reads the template folders configured in core Templates and Templater.
 * Both are internal settings, so every step is guarded.
 */
function getTemplateFolders(app: App) {
  const anyApp = app as unknown as {
    internalPlugins?: {
      getPluginById?: (id: string) => {
        enabled?: boolean;
        instance?: { options?: { folder?: string } };
      } | null;
    };
    plugins?: {
      plugins?: Record<string, { settings?: { templates_folder?: string } }>;
    };
  };

  const folders = [
    anyApp.internalPlugins?.getPluginById?.("templates")?.instance?.options
      ?.folder,
    anyApp.plugins?.plugins?.["templater-obsidian"]?.settings?.templates_folder,
  ];

  return folders
    .filter((it): it is string => typeof it === "string" && it.trim() !== "")
    .map((it) => it.replace(/^\/+|\/+$/g, ""));
}

function isInTemplateFolder(file: TFile, folders: string[]) {
  if (folders.some((folder) => file.path.startsWith(`${folder}/`))) {
    return true;
  }

  // No configured folder: treat any folder called "Templates" as one
  return /(^|\/)templates?\//i.test(file.path);
}

/**
 * Suggests markdown files for a text input. Files from template folders come
 * first.
 */
export class TemplateFileSuggest extends AbstractInputSuggest<TFile> {
  constructor(
    app: App,
    private readonly inputEl: HTMLInputElement,
    private readonly onPick: (path: string) => void,
  ) {
    super(app, inputEl);
  }

  protected getSuggestions(query: string): TFile[] {
    const folders = getTemplateFolders(this.app);
    const lowerQuery = query.toLowerCase().trim();

    return this.app.vault
      .getMarkdownFiles()
      .filter((file) => file.path.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        const aIsTemplate = isInTemplateFolder(a, folders);
        const bIsTemplate = isInTemplateFolder(b, folders);

        if (aIsTemplate !== bIsTemplate) {
          return aIsTemplate ? -1 : 1;
        }

        return a.path.localeCompare(b.path);
      })
      .slice(0, 50);
  }

  renderSuggestion(file: TFile, el: HTMLElement) {
    el.createDiv({ text: file.basename });
    el.createEl("small", {
      text: file.path,
      cls: "planner-template-suggestion-path",
    });
  }

  selectSuggestion(file: TFile) {
    this.inputEl.value = file.path;
    this.onPick(file.path);
    this.close();
  }
}
