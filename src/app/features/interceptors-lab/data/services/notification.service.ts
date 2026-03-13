import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationToastComponent } from 'src/app/shared/components/notification-toast/notification-toast.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  error(message: string): void {
    this.snackBar.openFromComponent(NotificationToastComponent, {
      data: { type: 'success', message },
      duration: 2600,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['app-toast', 'app-toast--error'],
    });
  }

  success(message: string): void {
    this.snackBar.openFromComponent(NotificationToastComponent, {
      data: { type: 'success', message },
      duration: 2600,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['app-toast', 'app-toast--success'],
    });
  }
}
