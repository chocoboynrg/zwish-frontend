import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserEventView } from '../../../events/services/events.service';
import {
  WishlistItem,
  formatAmount,
  formatFundingStatus,
  formatReservationMode,
  getFundingPercent,
} from './event-ui.utils';


@Component({
  selector: 'app-wishlist-item-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="show" (click)="close.emit()"></div>

    <section class="request-modal item-detail-modal" *ngIf="show && selectedItem">
      <div class="request-modal-card item-detail-modal-card" (click)="$event.stopPropagation()">
        <div class="request-modal-header">
          <div>
            <div class="section-kicker">Détail item</div>
            <h2>{{ selectedItem.name }}</h2>
            <p class="section-description">Vue détaillée de l’item sélectionné.</p>
          </div>

          <button type="button" class="modal-close-btn" (click)="close.emit()" aria-label="Fermer">✕</button>
        </div>

        <div class="item-detail-layout">
          <div class="item-detail-image-wrap">
            <div class="item-detail-image">
              <img *ngIf="selectedItem.imageUrl; else detailNoImage" [src]="selectedItem.imageUrl" [alt]="selectedItem.name" />
              <ng-template #detailNoImage>
                <div class="image-placeholder detail-placeholder">🎁</div>
              </ng-template>
            </div>
          </div>

          <div class="item-detail-content">
            <div class="item-detail-badges">
              <span class="badge badge-indigo">{{ formatFundingStatus(selectedItem.fundingStatus) }}</span>
              <span class="badge badge-slate" *ngIf="selectedItem.isReserved">
                {{ selectedItem.reservedByMe ? 'Réservé par moi' : 'Réservé' }}
              </span>
              <span class="badge badge-warning" *ngIf="selectedItem.hasPendingContribution">
                {{
                  selectedItem.pendingContributionByMe
                    ? 'Paiement en attente (vous)'
                    : 'Paiement en attente'
                }}
              </span>
            </div>

            <div class="detail-info-grid">
              <div class="detail-info-card">
                <span class="detail-info-label">Quantité</span>
                <strong>{{ selectedItem.quantity }}</strong>
              </div>

              <div class="detail-info-card">
                <span class="detail-info-label">Montant cible</span>
                <strong>{{ formatAmount(selectedItem.targetAmount) }}</strong>
              </div>

              <div class="detail-info-card">
                <span class="detail-info-label">Montant financé</span>
                <strong>{{ formatAmount(selectedItem.fundedAmount) }}</strong>
              </div>

              <div class="detail-info-card">
                <span class="detail-info-label">Reste à financer</span>
                <strong>{{ formatAmount(selectedItem.remainingAmount) }}</strong>
              </div>

              <div class="detail-info-card">
                <span class="detail-info-label">Mode réservation</span>
                <strong>{{ formatReservationMode(selectedItem.reservationMode) }}</strong>
              </div>

              <div class="detail-info-card">
                <span class="detail-info-label">Progression</span>
                <strong>{{ getFundingPercent(selectedItem) }}%</strong>
              </div>
            </div>

            <div class="item-reservation premium-note" *ngIf="selectedItem.isReserved && selectedItem.reservedByName">
              Réservé par :
              <strong>{{ selectedItem.reservedByMe ? 'vous' : selectedItem.reservedByName }}</strong>
            </div>

            <div class="progress-block-v2 detail-progress-block">
              <div class="progress-head-v2">
                <span>Progression</span>
                <strong>{{ getFundingPercent(selectedItem) }}%</strong>
              </div>

              <div class="progress-bar-v2 progress-bar-premium">
                <div
                  class="progress-fill-v2 progress-fill-premium"
                  [style.width.%]="getFundingPercent(selectedItem)"
                ></div>
              </div>

              <div class="progress-info-v2">
                <span>{{ formatAmount(selectedItem.fundedAmount) }} collectés</span>
                <span>{{ formatAmount(selectedItem.remainingAmount) }} restants</span>
              </div>
            </div>

            <div class="item-detail-actions">
              <button
                type="button"
                class="btn btn-primary btn-amazon"
                [disabled]="contributionLoading || (!selectedItem.canContribute && !selectedItem.pendingContributionByMe)"
                (click)="contribute.emit(selectedItem)"
              >
                {{ selectedItem.pendingContributionByMe ? 'Reprendre paiement' : 'Contribuer' }}
              </button>

              <button
                type="button"
                class="btn btn-secondary btn-outline-soft"
                [disabled]="reservationLoading || !selectedItem.canReserve"
                (click)="reserve.emit(selectedItem.id)"
              >
                {{ reservationLoading ? 'Réservation...' : 'Réserver' }}
              </button>

              <button
                *ngIf="isManager"
                type="button"
                class="btn btn-danger"
                [disabled]="deleteItemLoading || !canDeleteSelectedItem"
                [title]="!canDeleteSelectedItem ? deleteSelectedItemBlockedReason : 'Supprimer cet item'"
                (click)="delete.emit()"
              >
                {{ deleteItemLoading ? 'Suppression...' : 'Supprimer l’item' }}
              </button>
            </div>

            <p class="error-text" *ngIf="isManager && !canDeleteSelectedItem">
              {{ deleteSelectedItemBlockedReason }}
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.45); z-index: 80; }
    .request-modal { position: fixed; inset: 0; display: grid; place-items: center; padding: 16px; z-index: 90; }
    .request-modal-card {
      width: min(980px, 100%); max-height: min(88vh, 900px); overflow: auto; padding: 22px;
      background: #ffffff; border: 1px solid #f3e8e2; border-radius: 24px; box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }
    .request-modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
    .modal-close-btn { width: 42px; height: 42px; border: none; border-radius: 12px; background: #f3f4f6; cursor: pointer; font-size: 1rem; flex-shrink: 0; }
    .section-kicker { color: #ea580c; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .section-description { margin: 0; color: #4b5563; line-height: 1.7; }
    .item-detail-layout { display: grid; grid-template-columns: minmax(280px, 380px) minmax(0, 1fr); gap: 22px; align-items: start; }
    .item-detail-image { border-radius: 20px; overflow: hidden; border: 1px solid #f3e8e2; background: linear-gradient(180deg, #fff7f3 0%, #f9fafb 100%); min-height: 360px; display: flex; align-items: center; justify-content: center; }
    .item-detail-image img { width: 100%; height: 100%; object-fit: cover; display: block; min-height: 360px; }
    .detail-placeholder { font-size: 4rem; }
    .item-detail-content { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
    .item-detail-badges { display: flex; flex-wrap: wrap; gap: 8px; }
    .badge { display: inline-flex; align-items: center; padding: 7px 11px; border-radius: 999px; font-size: 12px; font-weight: 800; white-space: nowrap; }
    .badge-indigo { background: #eef2ff; color: #4338ca; }
    .badge-slate { background: #f3f4f6; color: #374151; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .detail-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .detail-info-card { border: 1px solid #f3e8e2; background: #fffaf7; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
    .detail-info-label { font-size: 12px; color: #6b7280; }
    .premium-note { padding: 10px 12px; border-radius: 14px; background: #fffaf7; border: 1px solid #f3e8e2; }
    .detail-progress-block { padding: 14px; border: 1px solid #f3e8e2; border-radius: 18px; background: linear-gradient(180deg, #fffaf7 0%, #ffffff 100%); }
    .progress-head-v2, .progress-info-v2 { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .progress-bar-v2 { width: 100%; height: 12px; border-radius: 999px; background: #eceff3; overflow: hidden; margin: 8px 0; }
    .progress-fill-v2 { height: 100%; border-radius: 999px; background: linear-gradient(135deg, #ff7a59, #ffb347); }
    .item-detail-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn { border: 0; border-radius: 14px; padding: 11px 16px; cursor: pointer; font: inherit; font-weight: 700; }
    .btn-primary { background: linear-gradient(135deg, #ff7a59, #ffb347); color: white; }
    .btn-secondary { background: #fff7f3; color: #9a3412; border: 1px solid #f3dfd4; }
    .btn-danger { background: #dc2626; color: #ffffff; }
    .btn-amazon, .btn-outline-soft { min-height: 46px; border-radius: 999px; padding: 12px 18px; }
    .btn-outline-soft { background: #ffffff; color: #7c2d12; border: 1px solid #f3dfd4; }
    .error-text { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; padding: 10px 12px; border-radius: 12px; }

    @media (max-width: 1100px) {
      .item-detail-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class WishlistItemDetailModalComponent {
  @Input() show = false;
  @Input() selectedItem: WishlistItem | null = null;
  @Input() isManager = false;
  @Input() deleteItemLoading = false;
  @Input() canDeleteSelectedItem = false;
  @Input() deleteSelectedItemBlockedReason = '';
  @Input() contributionLoading = false;
  @Input() reservationLoading = false;

  @Output() close = new EventEmitter<void>();
  @Output() contribute = new EventEmitter<WishlistItem>();
  @Output() reserve = new EventEmitter<number>();
  @Output() delete = new EventEmitter<void>();

  readonly formatAmount = formatAmount;
  readonly formatFundingStatus = formatFundingStatus;
  readonly formatReservationMode = formatReservationMode;
  readonly getFundingPercent = getFundingPercent;
}