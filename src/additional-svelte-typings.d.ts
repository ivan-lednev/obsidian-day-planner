declare namespace svelteHTML {
  interface HTMLAttributes {
    "on:tap"?: () => void;
    "on:longpress"?: () => void;
    "task-summary"?: string;
    "task-description"?: string;
  }
}
