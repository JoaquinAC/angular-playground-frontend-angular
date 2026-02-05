export interface LogEvent {
  time: string;                 // HH:mm:ss.SSS
  message?:any;                  // payload mostrado (opcional)
}