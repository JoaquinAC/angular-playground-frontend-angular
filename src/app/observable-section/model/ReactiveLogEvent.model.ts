export interface ReactiveLogEvent {
  operator: 'source' | 'map' | 'filter' | 'debounce' | 'subscriber';
  label: string;
  timestamp: string;
}