export interface LogEvent {
  time: string;
  technicalAction: string;
  humanExplanation: string;
  runId: number;
  level: 'info' | 'warning' | 'error';
}