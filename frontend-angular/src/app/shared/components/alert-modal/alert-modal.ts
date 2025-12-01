import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-alert-modal',
  imports: [CommonModule],
  templateUrl: './alert-modal.html',
  styleUrl: './alert-modal.css',
})
export class AlertModal {
  show = input.required<boolean>();
  type = input.required<AlertType>();
  title = input.required<string>();
  message = input.required<string>();
  confirmText = input<string>('Aceptar');
  onClose = output<void>();

  close(): void {
    this.onClose.emit();
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  getIcon(): string {
    const icons: Record<AlertType, string> = {
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[this.type()];
  }

  getColorClasses(): string {
    const colors: Record<AlertType, string> = {
      success: 'bg-green-100 text-green-600',
      error: 'bg-red-100 text-red-600',
      warning: 'bg-yellow-100 text-yellow-600',
      info: 'bg-blue-100 text-blue-600'
    };
    return colors[this.type()];
  }

  getButtonClasses(): string {
    const colors: Record<AlertType, string> = {
      success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    };
    return colors[this.type()];
  }
}
