export interface Script {
  identifier: string;
  url: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  executionContextId: number;
  hash: string;
  isContentScript: boolean;
  isInternalScript: boolean;
  sourceMapURL: string;
  hasSourceURL: boolean;
}
