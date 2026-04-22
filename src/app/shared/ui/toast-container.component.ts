import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { ToastService, ToastType } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast"
        [ngClass]="getToastClass(toast.type)"
      >
        <div class="toast-content">
          <span>{{ toast.message }}</span>
          <button type="button" (click)="toastService.remove(toast.id)">×</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 2100;
      max-width: 360px;
    }

    .toast {
      border-radius: 12px;
      padding: 14px 16px;
      color: #fff;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .toast-content button {
      border: none;
      background: transparent;
      color: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }

    .toast-success { background: #16a34a; }
    .toast-error { background: #dc2626; }
    .toast-info { background: #2563eb; }
    .toast-warning { background: #d97706; }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getToastClass(type: ToastType): string {
    return `toast-${type}`;
  }
}