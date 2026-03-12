import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface NotificationToastData {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
})
export class NotificationToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationToastData,
    private snackBarRef: MatSnackBarRef<NotificationToastComponent>,
  ) {}

  get title(): string {
    return this.data.type === 'success' ? 'Operación exitosa' : 'Ocurrió un error';
  }

  get icon(): string {
    return this.data.type === 'success' ? '✔' : '⚠';
  }

  close(): void {
    this.snackBarRef.dismiss();
  }
}