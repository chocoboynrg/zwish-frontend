import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts(); trackBy: trackByToastId"
        class="toast"
        [ngClass]="getToastClass(toast.type)"
      >
        <div class="toast-content">
          <div class="toast-header">
            <strong>{{ getToastTitle(toast.type) }}</strong>
            <button type="button" class="toast-close" (click)="toastService.remove(toast.id)">
              ×
            </button>
          </div>

          <div class="toast-message">
            {{ toast.message }}
          </div>
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
      width: min(360px, calc(100vw - 24px));
    }

    .toast {
      border-radius: 14px;
      padding: 14px 16px;
      color: #fff;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
      animation: toast-in 0.2s ease-out;
    }

    .toast-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .toast-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .toast-header strong {
      font-size: 14px;
      line-height: 1.2;
    }

    .toast-message {
      font-size: 13px;
      line-height: 1.4;
      word-break: break-word;
    }

    .toast-close {
      border: none;
      background: transparent;
      color: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      opacity: 0.9;
    }

    .toast-close:hover {
      opacity: 1;
    }

    .toast-success {
      background: #16a34a;
    }

    .toast-error {
      background: #dc2626;
    }

    .toast-info {
      background: #2563eb;
    }

    .toast-warning {
      background: #d97706;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(-6px) translateX(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0) translateX(0);
      }
    }

    @media (max-width: 640px) {
      .toast-container {
        top: 12px;
        right: 12px;
        left: 12px;
        width: auto;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  trackByToastId(_: number, toast: { id: number }): number {
    return toast.id;
  }

  getToastClass(type: ToastType): string {
    return `toast-${type}`;
  }

  getToastTitle(type: ToastType): string {
    switch (type) {
        case 'success': return 'Succès';
        case 'error': return 'Erreur';
        case 'warning': return 'Attention';
        default: return 'Information';
    }
  }
}