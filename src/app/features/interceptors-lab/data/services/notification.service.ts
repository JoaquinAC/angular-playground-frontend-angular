import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3200,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['app-toast', 'app-toast--error'],
    })
  }

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2200,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['app-toast', 'app-toast--success'],
    });
  }
}
