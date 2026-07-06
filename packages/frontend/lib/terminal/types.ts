export interface HistoryEntry {
  id: string;
  command: string;
  output: string;
  isError?: boolean;
}

export type CommandAction =
  | { type: "navigate"; path: string }
  | { type: "scroll"; sectionId: string }
  | { type: "clear" }
  | { type: "openGame" };

export interface CommandResult {
  output: string;
  isError?: boolean;
  action?: CommandAction;
}

export type CommandHandler = (args: string) => CommandResult | Promise<CommandResult>;

export interface CommandDefinition {
  name: string;
  args?: string;
  description: string;
  handler: CommandHandler;
  hidden?: boolean;
}
