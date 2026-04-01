import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { fadeAnimation } from 'src/app/shared/animations/fade.animation';
import {
  HomeModuleCard,
  HomeSystemStateService,
  HomeTimelineEvent,
} from '../../data/services/home-system-state.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [fadeAnimation],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentToken = 'sin-token';
  currentRole = 'SIN ROL';
  lastAction = 'Dashboard inicializado';
  activeModulesCount = 0;
  lastEndpoint = 'Sin consumo reciente';
  systemStatus: 'OK' | 'ERROR' = 'OK';
  modules: HomeModuleCard[] = [];
  timeline: HomeTimelineEvent[] = [];
  navigationPromptOpen = false;

  private readonly subscriptions = new Subscription();
  private navigationPromptResolver: ((value: boolean) => void) | null = null;

  constructor(public readonly homeSystemState: HomeSystemStateService) {}

  ngOnInit(): void {
    const snapshot = this.homeSystemState.snapshot();
    this.applyState(snapshot);

    this.subscriptions.add(
      this.homeSystemState.state$().subscribe((state) => {
        this.applyState(state);
      }),
    );
  }

  ngOnDestroy(): void {
    this.resolveNavigationPrompt(false);
    this.subscriptions.unsubscribe();
  }

  simulateFlow(): void {
    this.homeSystemState.executeFullFlow(() => this.requestNavigationConfirmation());
  }

  respondToNavigationPrompt(allowNavigation: boolean): void {
    this.resolveNavigationPrompt(allowNavigation);
  }

  get roleTone(): string {
    return this.currentRole === 'ADMIN' ? 'value--accent' : 'value--muted';
  }

  get systemTone(): string {
    return this.systemStatus === 'ERROR' ? 'value--error' : 'value--success';
  }

  get lastActionTone(): string {
    return this.resolveSemanticTone(this.lastAction);
  }

  private applyState(state: {
    currentToken: string;
    currentRole: string;
    lastAction: string;
    activeModulesCount: number;
    lastEndpoint: string;
    systemStatus: 'OK' | 'ERROR';
    modules: HomeModuleCard[];
    timeline: HomeTimelineEvent[];
  }): void {
    this.currentToken = state.currentToken;
    this.currentRole = state.currentRole;
    this.lastAction = state.lastAction;
    this.activeModulesCount = state.activeModulesCount;
    this.lastEndpoint = state.lastEndpoint;
    this.systemStatus = state.systemStatus;
    this.modules = state.modules;
    this.timeline = state.timeline;
  }

  private requestNavigationConfirmation(): Promise<boolean> {
    this.navigationPromptOpen = true;

    return new Promise<boolean>((resolve) => {
      this.navigationPromptResolver = resolve;
    });
  }

  private resolveNavigationPrompt(allowNavigation: boolean): void {
    if (this.navigationPromptResolver) {
      this.navigationPromptResolver(allowNavigation);
      this.navigationPromptResolver = null;
    }

    this.navigationPromptOpen = false;
  }

  private resolveSemanticTone(value: string): string {
    const normalized = value.toLowerCase();

    if (
      normalized.includes('ok') ||
      normalized.includes('success') ||
      normalized.includes('permitido') ||
      normalized.includes('generado') ||
      normalized.includes('cargados')
    ) {
      return 'value--success';
    }

    if (
      normalized.includes('error') ||
      normalized.includes('bloqueado') ||
      normalized.includes('denegado') ||
      normalized.includes('fallo')
    ) {
      return 'value--error';
    }

    return 'value--accent';
  }
}
