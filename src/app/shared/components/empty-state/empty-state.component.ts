import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-state-icon" *ngIf="icon">{{ icon }}</div>

      <h3 class="empty-state-title">{{ title }}</h3>

      <p class="empty-state-description" *ngIf="description">
        {{ description }}
      </p>

      <button
        *ngIf="actionLabel"
        type="button"
        class="empty-state-action"
        (click)="actionClick.emit()"
      >
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state {
      padding: 32px 20px;
      border: 1px dashed #cbd5e1;
      border-radius: 18px;
      background: #ffffff;
      text-align: center;
    }

    .empty-state-icon {
      font-size: 36px;
      line-height: 1;
      margin-bottom: 14px;
    }

    .empty-state-title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }

    .empty-state-description {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: #64748b;
    }

    .empty-state-action {
      margin-top: 16px;
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      background: #2563eb;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .empty-state-action:hover {
      background: #1d4ed8;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input() icon = '📦';
  @Input() title = 'Aucune donnée';
  @Input() description = 'Aucune information disponible pour le moment.';
  @Input() actionLabel?: string;

  @Output() actionClick = new EventEmitter<void>();
}