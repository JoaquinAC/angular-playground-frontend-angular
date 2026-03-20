export type LogCategory = 'http' | 'operator' | 'cancellation' | 'result' | 'error' | 'state';

export interface LogEvent {
  time: string;
  technicalAction: string;
  humanExplanation: string;
  runId: number;
  level: 'info' | 'warning' | 'error';
  category: LogCategory;
  title: string;
  executionLabel?: string;
  isCurrent?: boolean;
}