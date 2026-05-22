import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { UserEventView } from '../../../events/services/events.service';
import {
  WishlistItem,
  formatAmount,
  formatFundingStatus,
  getFundingPercent,
} from './event-ui.utils';

type WishlistFilter = 'ALL' | 'AVAILABLE' | 'RESERVED' | 'FUNDED' | 'PENDING';
type WishlistSort = 'DEFAULT' | 'TARGET_DESC' | 'REMAINING_DESC' | 'FUNDED_DESC' | 'PROGRESS_DESC';

@Component({
  selector: 'app-event-wishlist-section',
  standalone: true,
  imports: [FormsModule, DecimalPipe, LucideAngularModule],
  template: `
    <div class="wishlist-wrap">
      <!-- Header + toolbar -->
      <div class="wishlist-header">
        <div class="wishlist-header-left">
          <h2>Wishlist</h2>
          @if (data?.wishlist?.length) {
            <span class="item-count-badge">
              {{ filteredWishlist.length }}
              @if (filteredWishlist.length !== data?.wishlist?.length) {
                <span> / {{ data?.wishlist?.length }}</span>
              }
              item{{ filteredWishlist.length > 1 ? 's' : '' }}
            </span>
          }
        </div>

        <!-- Toolbar -->
        @if (data?.wishlist?.length) {
          <div class="toolbar">
            <!-- Recherche -->
            <div class="search-wrap">
              <lucide-icon name="search" [size]="16" color="currentColor" [strokeWidth]="1.8" class="search-icon" />
              <input
                type="text"
                class="search-input"
                [ngModel]="wishlistSearch"
                (ngModelChange)="wishlistSearchChange.emit($event)"
                placeholder="Rechercher..."
              />
            </div>
            <!-- Filtres pills -->
            <div class="filter-pills">
              @for (f of filters; track f.value) {
                <button
                  class="filter-pill"
                  [class.active]="selectedFilter === f.value"
                  (click)="selectedFilterChange.emit(f.value)"
                >
                  {{ f.label }}
                </button>
              }
            </div>
            <!-- Tri -->
            <select
              class="sort-select"
              [ngModel]="selectedSort"
              (ngModelChange)="selectedSortChange.emit($event)"
            >
              <option value="DEFAULT">Défaut</option>
              <option value="TARGET_DESC">Prix décroissant</option>
              <option value="REMAINING_DESC">Reste à financer</option>
              <option value="FUNDED_DESC">Plus financés</option>
              <option value="PROGRESS_DESC">Presque financés</option>
            </select>
          </div>
        }
      </div>

      <!-- Erreurs -->
      @if (contributionError) {
        <div class="alert-error">
          <lucide-icon name="alert-circle" [size]="16" color="currentColor" [strokeWidth]="1.8" />
          {{ contributionError }}
        </div>
      }
      @if (reservationError) {
        <div class="alert-error">
          <lucide-icon name="alert-circle" [size]="16" color="currentColor" [strokeWidth]="1.8" />
          {{ reservationError }}
        </div>
      }

      <!-- Vide total -->
      @if (!data?.wishlist?.length) {
        <div class="empty-state">
          <div class="empty-icon">🎁</div>
          <div class="empty-title">Wishlist vide</div>
          <div class="empty-desc">Aucun item dans la wishlist pour le moment.</div>
        </div>
      }

      <!-- Aucun résultat filtre -->
      @if (data?.wishlist?.length && filteredWishlist.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🔎</div>
          <div class="empty-title">Aucun résultat</div>
          <div class="empty-desc">Modifiez votre recherche ou le filtre sélectionné.</div>
        </div>
      }

      <!-- Grille items -->
      @if (filteredWishlist.length > 0) {
        <div class="wishlist-grid">
          @for (item of filteredWishlist; track item) {
            <article
              class="wish-card"
              [class.funded]="item.fundingStatus === 'FUNDED'"
              [class.reserved]="item.isReserved"
              (click)="openItemDetail.emit(item)"
            >
              <!-- Image -->
              <div class="wish-img-wrap">
                @if (item.imageUrl) {
                  <img [src]="item.imageUrl" [alt]="item.name" class="wish-img" />
                }
                @if (!item.imageUrl) {
                  <div class="wish-img-placeholder">🎁</div>
                }
                <!-- Badge statut -->
                <div class="wish-badges">
                  @if (item.fundingStatus === 'FUNDED') {
                    <span class="badge badge-funded">
                      <lucide-icon name="check" [size]="10" color="currentColor" [strokeWidth]="2.2" />
                      Financé
                    </span>
                  }
                  @if (item.fundingStatus === 'PARTIALLY_FUNDED') {
                    <span class="badge badge-partial"> En cours </span>
                  }
                  @if (item.isReserved && item.fundingStatus !== 'FUNDED') {
                    <span class="badge badge-reserved">
                      {{ item.reservedByMe ? 'Réservé par moi' : 'Réservé' }}
                    </span>
                  }
                </div>
              </div>
              <!-- Contenu -->
              <div class="wish-content">
                <div class="wish-name">{{ item.name }}</div>
                @if (item.price) {
                  <div class="wish-price">
                    {{ item.price | number:'1.0-0' }} XOF
                    @if (item.quantity > 1) { × {{ item.quantity }} }
                  </div>
                }
                <!-- Progress -->
                <div class="wish-progress-block">
                  <div class="wish-progress-header">
                    <span class="wish-funded-amount">{{ formatAmount(item.fundedAmount) }}</span>
                    <span class="wish-pct" [class.pct-done]="item.fundingStatus === 'FUNDED'">
                      {{ getPercent(item) }}%
                    </span>
                  </div>
                  <div class="wish-progress-track">
                    <div
                      class="wish-progress-fill"
                      [style.width]="getPercent(item) + '%'"
                      [class.fill-funded]="item.fundingStatus === 'FUNDED'"
                      [class.fill-partial]="item.fundingStatus === 'PARTIALLY_FUNDED'"
                    ></div>
                  </div>
                  <div class="wish-progress-footer">
                    @if (item.fundingStatus !== 'FUNDED') {
                      <span class="wish-remaining">
                        {{ formatAmount(item.remainingAmount) }} restants
                      </span>
                    }
                    <span class="wish-target">sur {{ formatAmount(item.targetAmount) }}</span>
                  </div>
                </div>
                <!-- Réservé par -->
                @if (item.isReserved && item.reservedByName) {
                  <div class="wish-reserved-by">
                    <lucide-icon name="user" [size]="12" color="currentColor" [strokeWidth]="1.8" />
                    {{
                      item.reservedByMe ? 'Réservé par vous' : 'Réservé par ' + item.reservedByName
                    }}
                  </div>
                }
                <!-- Actions -->
                <div class="wish-actions" (click)="$event.stopPropagation()">
                  <!-- Contribution -->
                  @if (item.canContribute || item.pendingContributionByMe) {
                    <button
                      class="btn-contribute"
                      [class.btn-pending]="item.pendingContributionByMe"
                      [disabled]="contributionLoading"
                      (click)="handleContribution.emit(item)"
                    >
                      <lucide-icon name="plus" [size]="14" color="currentColor" [strokeWidth]="2" />
                      {{ item.pendingContributionByMe ? 'Continuer le paiement' : 'Contribuer' }}
                    </button>
                  }
                  <!-- Réservation -->
                  @if (item.canReserve && !item.isReserved) {
                    <button
                      class="btn-reserve"
                      [disabled]="reservationLoading"
                      (click)="reserveItem.emit(item.id)"
                    >
                      <lucide-icon name="chevron-down" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                      Réserver
                    </button>
                  }
                  <!-- Détail -->
                  <button class="btn-detail" (click)="openItemDetail.emit(item)">
                    <lucide-icon name="info" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                    Détail
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .wishlist-wrap {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* ── HEADER ── */
      .wishlist-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .wishlist-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .wishlist-header-left h2 {
        font-size: 1.2rem;
        font-weight: 900;
        color: #111;
        margin: 0;
      }
      .item-count-badge {
        background: #111;
        color: white;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 800;
      }

      /* ── TOOLBAR ── */
      .toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .search-wrap {
        position: relative;
      }
      .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        pointer-events: none;
      }
      .search-input {
        padding: 8px 12px 8px 32px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        font: inherit;
        font-size: 0.85rem;
        background: white;
        outline: 0;
        width: 180px;
        transition: 0.2s;
      }
      .search-input:focus {
        border-color: #111;
        width: 220px;
      }

      .filter-pills {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .filter-pill {
        padding: 6px 12px;
        border: 1.5px solid #e5e7eb;
        border-radius: 999px;
        background: white;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: 0.15s;
      }
      .filter-pill:hover {
        border-color: #111;
        color: #111;
      }
      .filter-pill.active {
        background: #111;
        border-color: #111;
        color: white;
      }

      .sort-select {
        padding: 8px 12px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        font: inherit;
        font-size: 0.82rem;
        background: white;
        outline: 0;
        cursor: pointer;
        color: #374151;
      }

      /* ── ALERTES ── */
      .alert-error {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 12px;
        color: #991b1b;
        font-size: 0.85rem;
        font-weight: 500;
      }

      /* ── EMPTY ── */
      .empty-state {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        padding: 56px 24px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }
      .empty-icon {
        font-size: 2.5rem;
      }
      .empty-title {
        font-size: 1.05rem;
        font-weight: 800;
        color: #111;
      }
      .empty-desc {
        color: #9ca3af;
        font-size: 0.88rem;
      }

      /* ── GRILLE ── */
      .wishlist-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      /* ── CARD ── */
      .wish-card {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        cursor: pointer;
        transition:
          box-shadow 0.2s,
          transform 0.2s,
          border-color 0.2s;
      }
      .wish-card:hover {
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.09);
        transform: translateY(-2px);
        border-color: #e5e7eb;
      }
      .wish-card.funded {
        border-color: #bbf7d0;
      }
      .wish-card.reserved {
        border-color: #fde68a;
      }

      /* Image */
      .wish-img-wrap {
        position: relative;
        aspect-ratio: 4/3;
        background: #f9fafb;
        overflow: hidden;
      }
      .wish-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .wish-img-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        background: #f3f4f6;
      }

      /* Badges */
      .wish-badges {
        position: absolute;
        top: 10px;
        left: 10px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
      }
      .badge-funded {
        background: #dcfce7;
        color: #166534;
      }
      .badge-partial {
        background: #fef3c7;
        color: #92400e;
      }
      .badge-reserved {
        background: #fffbeb;
        color: #92400e;
        border: 1px solid #fde68a;
      }

      /* Contenu */
      .wish-content {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
      }
      .wish-name {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111;
        line-height: 1.3;
      }
      .wish-qty {
        font-size: 0.75rem;
        color: #9ca3af;
        font-weight: 500;
        margin-top: -6px;
      }
      .wish-price {
        font-size: 0.82rem;
        font-weight: 700;
        color: #6366f1;
        margin-top: -4px;
      }

      /* Progress */
      .wish-progress-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .wish-progress-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .wish-funded-amount {
        font-size: 0.95rem;
        font-weight: 900;
        color: #111;
      }
      .wish-pct {
        font-size: 0.75rem;
        font-weight: 700;
        color: #9ca3af;
      }
      .wish-pct.pct-done {
        color: #22c55e;
      }
      .wish-progress-track {
        height: 5px;
        background: #f3f4f6;
        border-radius: 999px;
        overflow: hidden;
      }
      .wish-progress-fill {
        height: 100%;
        border-radius: 999px;
        background: #e5e7eb;
        transition: width 0.4s ease;
      }
      .fill-funded {
        background: #22c55e;
      }
      .fill-partial {
        background: #ffd700;
      }
      .wish-progress-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 4px;
      }
      .wish-remaining {
        font-size: 0.75rem;
        color: #6b7280;
      }
      .wish-target {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      /* Réservé par */
      .wish-reserved-by {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.75rem;
        color: #92400e;
        background: #fffbeb;
        padding: 5px 10px;
        border-radius: 8px;
        font-weight: 600;
      }

      /* Actions */
      .wish-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: auto;
        padding-top: 4px;
      }

      .btn-contribute {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 9px 14px;
        border: 0;
        border-radius: 10px;
        background: #111;
        color: white;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.15s;
        white-space: nowrap;
      }
      .btn-contribute:hover:not(:disabled) {
        background: #000;
      }
      .btn-contribute.btn-pending {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
      }
      .btn-contribute.btn-pending:hover:not(:disabled) {
        background: #fde68a;
      }
      .btn-contribute:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-reserve {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 9px 12px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        color: #374151;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.15s;
        white-space: nowrap;
      }
      .btn-reserve:hover:not(:disabled) {
        border-color: #111;
        color: #111;
      }
      .btn-reserve:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-detail {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 9px 12px;
        border: 1.5px solid #f3f4f6;
        border-radius: 10px;
        background: #f9fafb;
        color: #6b7280;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: 0.15s;
        white-space: nowrap;
      }
      .btn-detail:hover {
        background: #f3f4f6;
        color: #111;
      }

      /* ── RESPONSIVE ── */
      @media (max-width: 1100px) {
        .wishlist-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 700px) {
        .wishlist-grid {
          grid-template-columns: 1fr;
        }
        .wishlist-header {
          flex-direction: column;
        }
        .toolbar {
          width: 100%;
        }
        .search-input {
          width: 100%;
        }
        .search-input:focus {
          width: 100%;
        }
      }
    `,
  ],
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
  readonly getFundingPercent = getFundingPercent;

  readonly filters: { label: string; value: WishlistFilter }[] = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Disponibles', value: 'AVAILABLE' },
    { label: 'Réservés', value: 'RESERVED' },
    { label: 'Financés', value: 'FUNDED' },
    { label: 'En attente', value: 'PENDING' },
  ];

  getPercent(item: WishlistItem): number {
    return this.getFundingPercent(item);
  }
}
