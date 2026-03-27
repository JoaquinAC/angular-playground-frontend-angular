export type StepState = 'idle' | 'active' | 'done' | 'error' | 'blocked';

export type StepId = 'request' | 'auth' | 'loader' | 'backend' | 'response';

export type LogType = 'http' | 'auth' | 'loader' | 'error' | 'transform' | 'finalize';

export type LabOperation =
  | 'GET_USERS'
  | 'DELETE_USER'
  | 'SIMULATE_401'
  | 'SIMULATE_403'
  | 'SIMULATE_500';

export type ResultState =
  | 'idle'
  | 'success'
  | 'unauthorized'
  | 'forbidden'
  | 'server-error'
  | 'blocked';

export interface PipelineStep {
  id: StepId;
  label: string;
  detail: string;
  state: StepState;
}

export interface LogEntry {
  type: LogType;
  message: string;
  elapsedMs: number;
}

export interface LabUserViewModel {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'GUEST';
  roleLabel: string;
  createdAt: string;
  createdAtLabel: string;
}

export interface InterceptorsLabRequestContext {
  enabled: boolean;
  operation: LabOperation | null;
  label: string;
  requiresAdmin: boolean;
  transformResponse: boolean;
}

export interface InterceptorsLabViewState {
  tokenPreview: string;
  role: string;
  authActive: boolean;
  loaderActive: boolean;
  errorActive: boolean;
  lastStatus: string;
  statusTone: 'idle' | 'running' | 'success' | 'error' | 'blocked';
  requestOriginal: string;
  requestIntercepted: string;
  responseOriginal: string;
  responseTransformed: string;
  currentFlow: string;
  resultState: ResultState;
  resultMessage: string;
  activeOperationLabel: string;
  pipelineSteps: PipelineStep[];
  logEntries: LogEntry[];
}
