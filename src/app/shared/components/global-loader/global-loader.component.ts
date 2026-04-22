import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="global-loader-backdrop" *ngIf="loadingService.isLoading()">
      <div class="global-loader-box">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    </div>
  `,
  styles: [`
    .global-loader-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.25);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .global-loader-box {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px 24px;
      min-width: 160px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      text-align: center;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 4px solid #e5e7eb;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class GlobalLoaderComponent {
  readonly loadingService = inject(LoadingService);
}