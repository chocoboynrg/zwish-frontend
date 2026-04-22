import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-event-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="show" (click)="close.emit()"></div>

    <section class="request-modal" *ngIf="show">
      <div class="request-modal-card delete-modal-card" (click)="$event.stopPropagation()">
        <div class="request-modal-header">
          <div>
            <div class="section-kicker danger-kicker">Confirmation</div>
            <h2>{{ mode === 'item' ? 'Supprimer l’item' : 'Supprimer l’événement' }}</h2>
            <p class="section-description">
              Cette action est irréversible.
              {{ mode === 'item'
                ? 'L’item sera retiré de la wishlist.'
                : 'L’événement et ses données associées seront supprimés.' }}
            </p>
          </div>

          <button type="button" class="modal-close-btn" (click)="close.emit()" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div class="delete-warning-box">
          <strong>{{ title }}</strong>
          <p>
            {{ mode === 'item'
              ? 'Voulez-vous vraiment supprimer cet item de la wishlist ?'
              : 'Voulez-vous vraiment supprimer cet événement ?' }}
          </p>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            [disabled]="deleteLoading"
            (click)="close.emit()"
          >
            Annuler
          </button>

          <button
            type="button"
            class="btn btn-danger"
            [disabled]="deleteLoading"
            (click)="confirm.emit()"
          >
            {{ deleteLoading ? 'Suppression...' : 'Oui, supprimer' }}
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.45); z-index: 80; }
    .request-modal { position: fixed; inset: 0; display: grid; place-items: center; padding: 16px; z-index: 90; }
    .request-modal-card {
      width: min(640px, 100%); max-height: min(88vh, 900px); overflow: auto; padding: 22px;
      background: #ffffff; border: 1px solid #fecaca; border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }
    .delete-modal-card { background: linear-gradient(180deg, #fff7f7 0%, #ffffff 100%); }
    .request-modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
    .modal-close-btn { width: 42px; height: 42px; border: none; border-radius: 12px; background: #f3f4f6; cursor: pointer; font-size: 1rem; flex-shrink: 0; }
    .section-kicker { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .danger-kicker { color: #b91c1c; }
    .section-description { margin: 0; color: #4b5563; line-height: 1.7; }
    .delete-warning-box {
      margin-top: 8px; margin-bottom: 18px; padding: 16px; border: 1px solid #fecaca; border-radius: 16px;
      background: #fef2f2; color: #7f1d1d;
    }
    .delete-warning-box strong { display: block; margin-bottom: 8px; font-size: 1rem; }
    .delete-warning-box p { margin: 0; line-height: 1.6; }
    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .btn { border: 0; border-radius: 14px; padding: 11px 16px; cursor: pointer; font: inherit; font-weight: 700; }
    .btn-secondary { background: #fff7f3; color: #9a3412; border: 1px solid #f3dfd4; }
    .btn-danger { background: #dc2626; color: #ffffff; }
  `],
})
export class EventDeleteModalComponent {
  @Input() show = false;
  @Input() deleteLoading = false;
  @Input() title = '';
  @Input() mode: 'event' | 'item' = 'event';

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}