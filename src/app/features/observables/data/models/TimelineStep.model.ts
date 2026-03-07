import { ReactiveLogEvent } from "./ReactiveLogEvent.model";

export interface TimelineStep {
  operator: ReactiveLogEvent['operator'];
  label: string;
  active: boolean;
}