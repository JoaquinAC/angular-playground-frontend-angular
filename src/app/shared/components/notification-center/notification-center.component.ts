import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/features/interceptors-lab/data/services/notification.service';
import { NotificationToastModel } from '../notification-toast/notification-toast.component';

@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  toasts: NotificationToastModel[] = [];
  private subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.notificationService.toast$().subscribe((toasts) => {
        this.toasts = [...toasts];
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeToast(id: string): void {
    this.notificationService.removeToast(id);
  }
}
