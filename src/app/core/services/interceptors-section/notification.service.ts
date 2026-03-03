import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 2200 });
  }
}
