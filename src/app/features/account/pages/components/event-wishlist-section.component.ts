import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserEventView } from '../../../events/services/events.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import {
  WishlistItem,
  formatAmount,
  formatFundingStatus,
  formatReservationMode,
  getFundingPercent,
} from './event-ui.utils';

type WishlistFilter = 'ALL' | 'AVAILABLE' | 'RESERVED' | 'FUNDED' | 'PENDING';
type WishlistSort =
  | 'DEFAULT'
  | 'TARGET_DESC'
  | 'REMAINING_DESC'
  | 'FUNDED_DESC'
  | 'PROGRESS_DESC';

@Component({
  selector: 'app-event-wishlist-section',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  template: `
    <section class="card section-card">
      <div class="section-header section-header-wishlist">
        <div>
          <div class="section-kicker">Liste de souhaits</div>
          <h2>Wishlist</h2>
        </div>

        <div class="wishlist-count-badge" *ngIf="data?.wishlist?.length">
          {{ filteredWishlist.length }} / {{ data?.wishlist?.length }} item(s)
        </div>
      </div>

      <div class="wishlist-toolbar" *ngIf="data?.wishlist?.length">
        <div class="toolbar-search">
          <label for="wishlist-search">Recherche</label>
          <input
            id="wishlist-search"
            type="text"
            [ngModel]="wishlistSearch"
            (ngModelChange)="wishlistSearchChange.emit($event)"
            placeholder="Rechercher un item..."
          />
        </div>

        <div class="toolbar-select">
          <label for="wishlist-filter">Filtre</label>
          <select
            id="wishlist-filter"
            [ngModel]="selectedFilter"
            (ngModelChange)="selectedFilterChange.emit($event)"
          >
            <option value="ALL">Tous</option>
            <option value="AVAILABLE">Disponibles</option>
            <option value="RESERVED">Réservés</option>
            <option value="FUNDED">Financés</option>
            <option value="PENDING">En attente</option>
          </select>
        </div>

        <div class="toolbar-select">
          <label for="wishlist-sort">Tri</label>
          <select
            id="wishlist-sort"
            [ngModel]="selectedSort"
            (ngModelChange)="selectedSortChange.emit($event)"
          >
            <option value="DEFAULT">Ordre par défaut</option>
            <option value="TARGET_DESC">Montant cible décroissant</option>
            <option value="REMAINING_DESC">Reste à financer</option>
            <option value="FUNDED_DESC">Plus financés</option>
            <option value="PROGRESS_DESC">Presque financés</option>
          </select>
        </div>
      </div>

      <div *ngIf="contributionError" class="state-card error compact-state">
        {{ contributionError }}
      </div>

      <div *ngIf="reservationError" class="state-card error compact-state">
        {{ reservationError }}
      </div>

      <app-empty-state
        *ngIf="!data?.wishlist?.length"
        icon="🎁"
        title="Wishlist vide"
        description="Aucun item dans la wishlist pour le moment."
      />

      <app-empty-state
        *ngIf="data?.wishlist?.length && filteredWishlist.length === 0"
        icon="🔎"
        title="Aucun résultat"
        description="Aucun item ne correspond à votre recherche ou au filtre sélectionné."
      />

      <div class="wishlist-grid-v2 wishlist-grid-amazon3" *ngIf="filteredWishlist.length > 0">
        <article
          class="wishlist-card-v2"
          *ngFor="let item of filteredWishlist"
          (click)="openItemDetail.emit(item)"
        >
          <div class="wishlist-image-shell">
            <div class="wishlist-image-v2">
              <img *ngIf="item.imageUrl; else noImage" [src]="item.imageUrl" [alt]="item.name" />
              <ng-template #noImage>
                <div class="image-placeholder">🎁</div>
              </ng-template>
            </div>

            <div class="image-top-badges">
              <span class="mini-badge funding-badge">
                {{ formatFundingStatus(item.fundingStatus) }}
              </span>

              <span class="mini-badge reservation-badge" *ngIf="item.isReserved">
                {{ item.reservedByMe ? 'Réservé par moi' : 'Réservé' }}
              </span>
            </div>
          </div>

          <div class="wishlist-content-v2">
            <div class="wishlist-top-row">
              <div class="wishlist-title-wrap">
                <h3 class="item-title">{{ item.name }}</h3>
                <p class="item-subtitle">
                  Quantité demandée : <strong>{{ item.quantity }}</strong>
                </p>
              </div>
            </div>

            <div class="item-reservation premium-note" *ngIf="item.isReserved && item.reservedByName">
              Réservé par :
              <strong>{{ item.reservedByMe ? 'vous' : (item.reservedByName || 'un participant') }}</strong>
            </div>

            <div class="alert-chip" *ngIf="item.hasPendingContribution">
              {{
                item.pendingContributionByMe
                  ? 'Votre paiement est en attente sur cet item.'
                  : 'Un paiement est en attente sur cet item.'
              }}
            </div>

            <div class="price-strip">
              <div class="price-main">
                <span class="price-label">Reste à financer</span>
                <strong class="price-value">{{ formatAmount(item.remainingAmount) }}</strong>
              </div>

              <div class="price-side">
                <span>{{ formatAmount(item.fundedAmount) }} financés</span>
                <span>sur {{ formatAmount(item.targetAmount) }}</span>
              </div>
            </div>

            <div class="progress-block-v2">
              <div class="progress-head-v2">
                <span>Progression</span>
                <strong>{{ getFundingPercent(item) }}%</strong>
              </div>

              <div class="progress-bar-v2 progress-bar-premium">
                <div
                  class="progress-fill-v2 progress-fill-premium"
                  [style.width.%]="getFundingPercent(item)"
                ></div>
              </div>

              <div class="progress-info-v2">
                <span>{{ formatAmount(item.fundedAmount) }} collectés</span>
                <span>{{ formatAmount(item.remainingAmount) }} restants</span>
              </div>
            </div>

            <div class="metrics-row-v2">
              <div class="metric-chip">
                <span class="metric-label">Montant cible</span>
                <strong>{{ formatAmount(item.targetAmount) }}</strong>
              </div>

              <div class="metric-chip">
                <span class="metric-label">Réservation</span>
                <strong>{{ formatReservationMode(item.reservationMode) }}</strong>
              </div>
            </div>

            <div class="item-actions-v2 item-actions-premium" (click)="$event.stopPropagation()">
              <button type="button" class="btn btn-ghost-detail" (click)="openItemDetail.emit(item)">
                Voir détail
              </button>

              <button
                type="button"
                class="btn btn-primary btn-amazon"
                [disabled]="contributionLoading || (!item.canContribute && !item.pendingContributionByMe)"
                (click)="handleContribution.emit(item)"
              >
                {{ item.pendingContributionByMe ? 'Reprendre paiement' : 'Contribuer' }}
              </button>

              <button
                type="button"
                class="btn btn-secondary btn-outline-soft"
                [disabled]="reservationLoading || !item.canReserve"
                (click)="reserveItem.emit(item.id)"
              >
                {{ reservationLoading ? 'Réservation...' : 'Réserver' }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .card {
      background: #ffffff;
      border: 1px solid #f3e8e2;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
      padding: 22px;
    }
    .compact-state { padding: 14px 16px; margin-bottom: 12px; border-radius: 16px; box-shadow: none; }
    .state-card.error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
    .section-header h2 { margin: 4px 0 0; font-size: 1.3rem; line-height: 1.2; }
    .section-kicker { color: #ea580c; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .section-header-wishlist { margin-bottom: 18px; }
    .wishlist-count-badge {
      display: inline-flex; align-items: center; padding: 9px 12px; border-radius: 999px; background: #fff7f3;
      color: #9a3412; border: 1px solid #f3dfd4; font-size: 0.86rem; font-weight: 700; white-space: nowrap;
    }
    .wishlist-toolbar {
      display: grid; grid-template-columns: minmax(220px, 1.3fr) minmax(180px, 0.8fr) minmax(200px, 0.9fr);
      gap: 12px; margin-bottom: 16px; padding: 14px; border: 1px solid #f3dfd4; border-radius: 18px;
      background: linear-gradient(180deg, #fffaf7 0%, #ffffff 100%);
    }
    .toolbar-search, .toolbar-select { display: flex; flex-direction: column; gap: 6px; }
    .toolbar-search label, .toolbar-select label { font-size: 12px; font-weight: 700; color: #6b7280; }
    .toolbar-search input, .toolbar-select select {
      width: 100%; box-sizing: border-box; border: 1px solid #e5d7cf; border-radius: 14px; padding: 11px 13px;
      font: inherit; background: #ffffff; color: #111827;
    }
    .wishlist-grid-v2 { display: grid; gap: 18px; }
    .wishlist-grid-amazon3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .wishlist-card-v2 {
      position: relative; border: 1px solid #efe5de; border-radius: 22px; overflow: hidden;
      background: linear-gradient(180deg, #fffdfc 0%, #ffffff 100%);
      box-shadow: 0 14px 32px rgba(17, 24, 39, 0.05);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex; flex-direction: column; min-width: 0; cursor: pointer;
    }
    .wishlist-card-v2:hover { transform: translateY(-4px); box-shadow: 0 22px 44px rgba(17, 24, 39, 0.10); }
    .wishlist-image-shell { position: relative; }
    .wishlist-image-v2 {
      height: 240px; background: linear-gradient(180deg, #fff7f3 0%, #f9fafb 100%);
      display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid #f3e8e2;
    }
    .wishlist-image-v2 img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
    .image-placeholder { font-size: 3rem; opacity: 0.85; }
    .image-top-badges {
      position: absolute; top: 12px; left: 12px; right: 12px; display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start;
    }
    .mini-badge {
      display: inline-flex; align-items: center; padding: 7px 10px; border-radius: 999px;
      font-size: 11px; font-weight: 800; line-height: 1;
      backdrop-filter: blur(8px); box-shadow: 0 10px 20px rgba(17, 24, 39, 0.10);
    }
    .funding-badge { background: rgba(255,255,255,0.92); color: #7c2d12; border: 1px solid rgba(255,255,255,0.85); }
    .reservation-badge { background: rgba(17,24,39,0.82); color: #ffffff; border: 1px solid rgba(255,255,255,0.16); }
    .wishlist-content-v2 { display: flex; flex-direction: column; gap: 14px; padding: 18px; min-width: 0; height: 100%; }
    .wishlist-top-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .wishlist-title-wrap { min-width: 0; flex: 1; }
    .item-title { margin: 0 0 6px; color: #111827; font-size: 1.08rem; line-height: 1.35; }
    .item-subtitle { margin: 0; color: #6b7280; font-size: 0.92rem; line-height: 1.5; }
    .item-reservation { font-size: 0.92rem; color: #4b5563; }
    .premium-note { padding: 10px 12px; border-radius: 14px; background: #fffaf7; border: 1px solid #f3e8e2; }
    .alert-chip {
      display: inline-flex; align-items: center; width: fit-content; max-width: 100%; padding: 10px 12px;
      border-radius: 999px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412;
      font-size: 0.84rem; font-weight: 700; line-height: 1.4;
    }
    .price-strip {
      display: flex; justify-content: space-between; align-items: flex-end; gap: 14px; padding: 14px 16px;
      border-radius: 18px; background: linear-gradient(135deg, #fff7f2, #ffffff); border: 1px solid #f3e8e2;
    }
    .price-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .price-label { font-size: 0.8rem; color: #6b7280; }
    .price-value { font-size: 1.35rem; line-height: 1.1; color: #111827; letter-spacing: -0.02em; }
    .price-side { display: flex; flex-direction: column; gap: 4px; text-align: right; font-size: 0.82rem; color: #6b7280; }
    .metrics-row-v2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .metric-chip {
      border: 1px solid #f3e8e2; background: #fffaf7; border-radius: 16px; padding: 12px;
      display: flex; flex-direction: column; gap: 4px; min-width: 0;
    }
    .metric-label { font-size: 12px; color: #6b7280; }
    .metric-chip strong { font-size: 0.95rem; color: #111827; line-height: 1.3; word-break: break-word; }
    .progress-block-v2 { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
    .progress-head-v2 { display: flex; justify-content: space-between; align-items: center; font-size: 0.92rem; color: #4b5563; }
    .progress-bar-v2 { width: 100%; height: 10px; border-radius: 999px; background: #f3f4f6; overflow: hidden; }
    .progress-bar-premium { height: 12px; background: #eceff3; box-shadow: inset 0 1px 2px rgba(17, 24, 39, 0.08); }
    .progress-fill-v2 { height: 100%; border-radius: 999px; background: linear-gradient(135deg, #ff7a59, #ffb347); min-width: 0; }
    .progress-info-v2 { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 0.86rem; color: #6b7280; }
    .item-actions-v2 { display: flex; gap: 10px; flex-wrap: wrap; margin-top: auto; }
    .btn { border: 0; border-radius: 14px; padding: 11px 16px; cursor: pointer; font: inherit; font-weight: 700; }
    .btn-primary { background: linear-gradient(135deg, #ff7a59, #ffb347); color: white; }
    .btn-secondary { background: #fff7f3; color: #9a3412; border: 1px solid #f3dfd4; }
    .btn-ghost-detail { background: #ffffff; color: #374151; border: 1px solid #e5e7eb; }
    .btn-amazon { min-height: 46px; border-radius: 999px; padding: 12px 18px; }
    .btn-outline-soft { min-height: 46px; border-radius: 999px; padding: 12px 18px; background: #ffffff; color: #7c2d12; border: 1px solid #f3dfd4; }

    @media (max-width: 1100px) {
      .wishlist-grid-amazon3 { grid-template-columns: 1fr; }
    }
    @media (max-width: 960px) {
      .wishlist-toolbar, .metrics-row-v2 { grid-template-columns: 1fr; }
      .price-strip, .progress-info-v2 { flex-direction: column; align-items: flex-start; }
      .price-side { text-align: left; }
    }
  `],
})
export class EventWishlistSectionComponent {
  @Input({ required: true }) data!: UserEventView | null;
  @Input({ required: true }) filteredWishlist: WishlistItem[] = [];
  @Input() wishlistSearch = '';
  @Input() selectedFilter: WishlistFilter = 'ALL';
  @Input() selectedSort: WishlistSort = 'DEFAULT';
  @Input() contributionError = '';
  @Input() reservationError = '';
  @Input() contributionLoading = false;
  @Input() reservationLoading = false;

  @Output() wishlistSearchChange = new EventEmitter<string>();
  @Output() selectedFilterChange = new EventEmitter<WishlistFilter>();
  @Output() selectedSortChange = new EventEmitter<WishlistSort>();
  @Output() openItemDetail = new EventEmitter<WishlistItem>();
  @Output() handleContribution = new EventEmitter<WishlistItem>();
  @Output() reserveItem = new EventEmitter<number>();

  readonly formatAmount = formatAmount;
  readonly formatFundingStatus = formatFundingStatus;
  readonly formatReservationMode = formatReservationMode;
  readonly getFundingPercent = getFundingPercent;
}