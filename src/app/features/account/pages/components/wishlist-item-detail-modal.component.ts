import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
    <!-- Overlay -->
    <div class="overlay" *ngIf="show" (click)="close.emit()"></div>

    <!-- Drawer -->
    <div class="drawer" [class.open]="show" *ngIf="show">
      <div class="drawer-inner" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="drawer-header">
          <div class="drawer-eyebrow">Détail de l'item</div>
          <button class="btn-close" (click)="close.emit()" aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="drawer-content" *ngIf="selectedItem">

          <!-- Image -->
          <div class="item-img-wrap">
            <img *ngIf="selectedItem.imageUrl" [src]="selectedItem.imageUrl" [alt]="selectedItem.name" class="item-img" />
            <div class="item-img-placeholder" *ngIf="!selectedItem.imageUrl">🎁</div>

            <!-- Badges overlay -->
            <div class="img-badges">
              <span class="ibadge ibadge-funded" *ngIf="selectedItem.fundingStatus === 'FUNDED'">
                <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M4 10l4.5 4.5 7.5-7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
                Financé à 100%
              </span>
              <span class="ibadge ibadge-partial" *ngIf="selectedItem.fundingStatus === 'PARTIALLY_FUNDED'">En cours</span>
              <span class="ibadge ibadge-reserved" *ngIf="selectedItem.isReserved">
                {{ selectedItem.reservedByMe ? '🔒 Réservé par vous' : '🔒 Réservé' }}
              </span>
            </div>
          </div>

          <!-- Titre & meta -->
          <div class="item-title-block">
            <h2 class="item-name">{{ selectedItem.name }}</h2>
            <div class="item-meta">
              <span class="meta-pill">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 10h6M7 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Qté : {{ selectedItem.quantity }}
              </span>
              <span class="meta-pill">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.5 4.5H16l-3.7 2.7 1.4 4.3L10 11l-3.7 2.5 1.4-4.3L4 6.5h4.5L10 2z" stroke="currentColor" stroke-width="1.3"/></svg>
                {{ formatReservationMode(selectedItem.reservationMode) }}
              </span>
              <span class="meta-pill meta-pill-status" [ngClass]="getStatusClass(selectedItem.fundingStatus)">
                {{ formatFundingStatus(selectedItem.fundingStatus) }}
              </span>
            </div>
          </div>

          <!-- Réservé par -->
          <div class="reserved-by-block" *ngIf="selectedItem.isReserved && selectedItem.reservedByName">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 11a4 4 0 100-8 4 4 0 000 8zM2 19a8 8 0 0116 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ selectedItem.reservedByMe ? 'Réservé par vous' : 'Réservé par ' + selectedItem.reservedByName }}
          </div>

          <!-- Financement -->
          <div class="funding-block">
            <div class="funding-header">
              <div class="funding-amounts">
                <span class="funded-val">{{ formatAmount(selectedItem.fundedAmount) }}</span>
                <span class="funded-sep">collectés</span>
              </div>
              <span class="funded-pct" [class.pct-green]="selectedItem.fundingStatus === 'FUNDED'">
                {{ getPercent(selectedItem) }}%
              </span>
            </div>

            <div class="progress-track">
              <div class="progress-fill"
                [style.width]="getPercent(selectedItem) + '%'"
                [class.fill-green]="selectedItem.fundingStatus === 'FUNDED'"
                [class.fill-yellow]="selectedItem.fundingStatus === 'PARTIALLY_FUNDED'"
              ></div>
            </div>

            <div class="funding-footer">
              <div class="funding-row">
                <span class="funding-label">Cible</span>
                <span class="funding-val">{{ formatAmount(selectedItem.targetAmount) }}</span>
              </div>
              <div class="funding-row">
                <span class="funding-label">Reste</span>
                <span class="funding-val" [class.val-green]="selectedItem.fundingStatus === 'FUNDED'">
                  {{ selectedItem.fundingStatus === 'FUNDED' ? '—' : formatAmount(selectedItem.remainingAmount) }}
                </span>
              </div>
              <div class="funding-row">
                <span class="funding-label">Contributions</span>
                <span class="funding-val">—</span>
              </div>
            </div>
          </div>

          <!-- Actions principales -->
          <div class="actions-block">

            <!-- Contribuer -->
            <button
              class="btn-contribute"
              *ngIf="selectedItem.canContribute || selectedItem.pendingContributionByMe"
              [class.btn-pending]="selectedItem.pendingContributionByMe"
              [disabled]="contributionLoading"
              (click)="contribute.emit(selectedItem)"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path *ngIf="!selectedItem.pendingContributionByMe" d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path *ngIf="selectedItem.pendingContributionByMe" d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              {{ contributionLoading ? 'Chargement...' : (selectedItem.pendingContributionByMe ? 'Voir mon paiement en attente' : 'Contribuer à cet item') }}
            </button>

            <!-- Réserver -->
            <button
              class="btn-reserve"
              *ngIf="selectedItem.canReserve && !selectedItem.isReserved"
              [disabled]="reservationLoading"
              (click)="reserve.emit(selectedItem.id)"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 10h6M7 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ reservationLoading ? 'Réservation...' : 'Réserver cet item' }}
            </button>

            <!-- État si déjà financé -->
            <div class="funded-notice" *ngIf="selectedItem.fundingStatus === 'FUNDED'">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#22c55e" stroke-width="1.5"/><path d="M6.5 10l3 3 4-5" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round"/></svg>
              Cet item est entièrement financé. Merci à tous les contributeurs !
            </div>

            <!-- Pas d'action disponible -->
            <div class="no-action-notice"
              *ngIf="!selectedItem.canContribute && !selectedItem.pendingContributionByMe && !selectedItem.canReserve && selectedItem.fundingStatus !== 'FUNDED'">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              Aucune action disponible pour cet item actuellement.
            </div>

          </div>

          <!-- Zone suppression (manager uniquement) -->
          <div class="delete-zone" *ngIf="isManager">
            <div class="delete-zone-sep"></div>
            <div class="delete-zone-title">Gestion de l'item</div>

            <button
              class="btn-delete"
              [disabled]="deleteItemLoading || !canDeleteSelectedItem"
              [title]="!canDeleteSelectedItem ? deleteSelectedItemBlockedReason : ''"
              (click)="delete.emit()"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M4 6h12M8 6V4h4v2M7 6v9a1 1 0 001 1h4a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              {{ deleteItemLoading ? 'Suppression...' : 'Supprimer cet item' }}
            </button>

            <div class="delete-blocked" *ngIf="!canDeleteSelectedItem">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              {{ deleteSelectedItemBlockedReason }}
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 299; }

    /* Drawer */
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 300;
      width: min(480px, 100vw); background: white;
      display: flex; flex-direction: column;
      box-shadow: -8px 0 40px rgba(0,0,0,0.15);
      transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .drawer.open { transform: translateX(0); }
    .drawer-inner { display: flex; flex-direction: column; height: 100%; }

    /* Header */
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; flex-shrink: 0;
    }
    .drawer-eyebrow { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; }
    .btn-close { width: 36px; height: 36px; border: 0; background: #f3f4f6; border-radius: 8px; cursor: pointer; color: #6b7280; display: flex; align-items: center; justify-content: center; }
    .btn-close:hover { background: #e5e7eb; color: #111; }

    /* Contenu scrollable */
    .drawer-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0; }

    /* Image */
    .item-img-wrap { position: relative; aspect-ratio: 16/9; background: #f9fafb; overflow: hidden; flex-shrink: 0; }
    .item-img { width: 100%; height: 100%; object-fit: cover; }
    .item-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; background: #f3f4f6; }
    .img-badges { position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column; gap: 6px; }
    .ibadge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; backdrop-filter: blur(8px); }
    .ibadge-funded { background: rgba(220,252,231,0.95); color: #166534; }
    .ibadge-partial { background: rgba(254,243,199,0.95); color: #92400e; }
    .ibadge-reserved { background: rgba(255,255,255,0.92); color: #374151; }

    /* Titre */
    .item-title-block { padding: 20px 20px 0; }
    .item-name { font-size: 1.2rem; font-weight: 900; color: #111; margin: 0 0 10px; line-height: 1.2; }
    .item-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .meta-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; background: #f3f4f6; color: #6b7280; font-size: 0.75rem; font-weight: 600; }
    .meta-pill-status { }
    .status-funded { background: #dcfce7; color: #166534; }
    .status-partial { background: #fef3c7; color: #92400e; }
    .status-none { background: #f3f4f6; color: #9ca3af; }

    /* Réservé par */
    .reserved-by-block { margin: 12px 20px 0; display: flex; align-items: center; gap: 7px; padding: 9px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; font-size: 0.82rem; font-weight: 600; color: #92400e; }

    /* Financement */
    .funding-block { margin: 16px 20px 0; padding: 18px; background: #f9fafb; border: 1.5px solid #f3f4f6; border-radius: 16px; display: flex; flex-direction: column; gap: 12px; }
    .funding-header { display: flex; align-items: center; justify-content: space-between; }
    .funding-amounts { display: flex; align-items: baseline; gap: 6px; }
    .funded-val { font-size: 1.3rem; font-weight: 900; color: #111; }
    .funded-sep { font-size: 0.8rem; color: #9ca3af; }
    .funded-pct { font-size: 1rem; font-weight: 800; color: #9ca3af; }
    .pct-green { color: #22c55e; }

    .progress-track { height: 6px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 999px; background: #e5e7eb; transition: width 0.4s; }
    .fill-green { background: #22c55e; }
    .fill-yellow { background: #FFD700; }

    .funding-footer { display: flex; flex-direction: column; gap: 6px; }
    .funding-row { display: flex; align-items: center; justify-content: space-between; }
    .funding-label { font-size: 0.78rem; color: #9ca3af; }
    .funding-val { font-size: 0.88rem; font-weight: 700; color: #374151; }
    .val-green { color: #22c55e; }

    /* Actions */
    .actions-block { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }

    .btn-contribute {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 13px 20px; border: 0; border-radius: 12px;
      background: #111; color: white; font: inherit; font-size: 0.9rem; font-weight: 800;
      cursor: pointer; transition: 0.2s;
    }
    .btn-contribute:hover:not(:disabled) { background: #000; }
    .btn-contribute:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-contribute.btn-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .btn-contribute.btn-pending:hover:not(:disabled) { background: #fde68a; }

    .btn-reserve {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 13px 20px; border: 1.5px solid #e5e7eb; border-radius: 12px;
      background: white; color: #374151; font: inherit; font-size: 0.9rem; font-weight: 700;
      cursor: pointer; transition: 0.2s;
    }
    .btn-reserve:hover:not(:disabled) { border-color: #111; color: #111; }
    .btn-reserve:disabled { opacity: 0.5; cursor: not-allowed; }

    .funded-notice {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;
      color: #166534; font-size: 0.85rem; font-weight: 600; line-height: 1.5;
    }
    .no-action-notice {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px;
      color: #9ca3af; font-size: 0.85rem;
    }

    /* Zone suppression */
    .delete-zone { padding: 0 20px 24px; display: flex; flex-direction: column; gap: 10px; }
    .delete-zone-sep { height: 1px; background: #f3f4f6; }
    .delete-zone-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; }
    .btn-delete {
      display: flex; align-items: center; gap: 7px;
      padding: 11px 16px; border: 1.5px solid #fecaca; border-radius: 10px;
      background: white; color: #ef4444; font: inherit; font-size: 0.85rem; font-weight: 700;
      cursor: pointer; transition: 0.2s; align-self: flex-start;
    }
    .btn-delete:hover:not(:disabled) { background: #fef2f2; }
    .btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }
    .delete-blocked { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #9ca3af; }
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

  getPercent(item: WishlistItem): number { return this.getFundingPercent(item); }

  getStatusClass(status: string): string {
    if (status === 'FUNDED') return 'meta-pill-status status-funded';
    if (status === 'PARTIALLY_FUNDED') return 'meta-pill-status status-partial';
    return 'meta-pill-status status-none';
  }
}