import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CountdownTimerComponent } from '../../../shared/components/countdown-timer/countdown-timer.component';
import {
  MyContributionsService,
  MyContributionItem,
  MyContributionsResponse,
} from '../services/my-contributions.service';

type Filter = 'ALL' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

@Component({
  selector: 'app-my-contributions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CountdownTimerComponent, LucideAngularModule],
  template: `
    <div class="page-wrap">
      <!-- Hero -->
      <div class="page-hero">
        <div class="page-hero-inner">
          <div>
            <div class="page-eyebrow">Mon espace</div>
            <h1>Mes contributions</h1>
            <p>Suivez vos participations financières et leurs statuts.</p>
          </div>
          @if (!loading() && data()) {
            <div class="hero-stats">
              <div class="hero-stat">
                <strong>{{ confirmedAmount() | number: '1.0-0' }} FCFA</strong>
                <span>Montant confirmé</span>
              </div>
              <div class="hero-stat-sep"></div>
              <div class="hero-stat">
                <strong>{{ data()!.items.length }}</strong>
                <span>Total contributions</span>
              </div>
              <div class="hero-stat-sep"></div>
              <div class="hero-stat">
                <strong>{{ pendingCount() }}</strong>
                <span>En attente</span>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="page-body">
        <!-- Filtres -->
        <div class="filter-row">
          @for (f of filters; track f.value) {
            <button
              class="filter-btn"
              [class.active]="activeFilter() === f.value"
              (click)="activeFilter.set(f.value)"
            >
              {{ f.label }}
              @if (getCount(f.value) > 0) {
                <span class="filter-count">{{ getCount(f.value) }}</span>
              }
            </button>
          }
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="loading-state">
            <div class="loading-spinner"></div>
            Chargement...
          </div>
        }

        <!-- Empty -->
        @if (!loading() && filtered().length === 0) {
          <div class="empty-block">
            <div class="empty-icon">⭐</div>
            <p>Aucune contribution{{ activeFilter() !== 'ALL' ? ' avec ce statut' : '' }}.</p>
            <a routerLink="/catalog" class="btn-yellow">Parcourir le catalogue</a>
          </div>
        }

        <!-- Liste -->
        @if (!loading() && filtered().length > 0) {
          <div class="contrib-list">
            @for (c of filtered(); track c.id) {
              <div
                class="contrib-card"
                [class.selected]="selectedContrib()?.id === c.id"
                (click)="select(c)"
              >
                <div class="contrib-card-left">
                  <div class="contrib-item-icon">🎁</div>
                  <div class="contrib-info">
                    <div class="contrib-item-name">{{ c.wishlistItem?.title ?? '—' }}</div>
                    <div class="contrib-event-name">
                      <lucide-icon name="calendar" [size]="12" color="currentColor" [strokeWidth]="1.8" />
                      {{ c.event?.title ?? '—' }}
                    </div>
                    <div class="contrib-date">{{ c.createdAt | date: 'dd MMM yyyy' }}</div>
                  </div>
                </div>
                <div class="contrib-card-right">
                  <div class="contrib-amount">
                    {{ c.amount | number: '1.0-0' }}
                    <span class="currency">{{ c.currencyCode }}</span>
                  </div>
                  <span class="status-badge" [ngClass]="getStatusClass(c.status)">{{
                    getStatusLabel(c.status)
                  }}</span>
                  @if (c.status === 'AWAITING_PAYMENT' && c.payment?.expiresAt) {
                    <app-countdown-timer
                      [expiresAt]="c.payment!.expiresAt!"
                      [showExpired]="true"
                    ></app-countdown-timer>
                  }
                  <lucide-icon name="chevron-right" [size]="16" color="currentColor" [strokeWidth]="1.8" class="chevron" />
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- ===================== -->
    <!-- DRAWER DETAIL         -->
    <!-- ===================== -->
    @if (selectedContrib()) {
      <div class="overlay" (click)="selectedContrib.set(null)"></div>
    }

    <div class="detail-drawer" [class.open]="!!selectedContrib()">
      @if (selectedContrib(); as c) {
        <div class="drawer-header">
          <div class="drawer-eyebrow">Détail de la contribution</div>
          <button class="btn-close" (click)="selectedContrib.set(null)">
            <lucide-icon name="x" [size]="18" color="currentColor" [strokeWidth]="1.8" />
          </button>
        </div>
        <div class="drawer-content">
          <!-- Statut -->
          <div class="detail-status-banner" [ngClass]="getBannerClass(c.status)">
            <div class="banner-icon">{{ getStatusIcon(c.status) }}</div>
            <div>
              <div class="banner-status">{{ getStatusLabel(c.status) }}</div>
              <div class="banner-sub">{{ getStatusDescription(c.status) }}</div>
            </div>
          </div>
          <!-- Montant -->
          <div class="detail-amount-block">
            <div class="detail-amount">{{ c.amount | number: '1.0-0' }}</div>
            <div class="detail-currency">{{ c.currencyCode }}</div>
          </div>
          <!-- Infos item + événement -->
          <div class="detail-info-cards">
            <div class="detail-info-card">
              <div class="detail-info-label">Item wishlist</div>
              <div class="detail-info-value">{{ c.wishlistItem?.title ?? '—' }}</div>
            </div>
            <div class="detail-info-card">
              <div class="detail-info-label">Événement</div>
              <div class="detail-info-value">{{ c.event?.title ?? '—' }}</div>
              @if (c.event?.eventDate) {
                <div class="detail-info-sub">
                  {{ c.event!.eventDate | date: 'dd MMM yyyy' }}
                </div>
              }
            </div>
            <div class="detail-info-card">
              <div class="detail-info-label">Date de contribution</div>
              <div class="detail-info-value">{{ c.createdAt | date: 'dd MMMM yyyy à HH:mm' }}</div>
            </div>
            @if (c.confirmedAt) {
              <div class="detail-info-card">
                <div class="detail-info-label">Confirmée le</div>
                <div class="detail-info-value">
                  {{ c.confirmedAt | date: 'dd MMMM yyyy à HH:mm' }}
                </div>
              </div>
            }
            <div class="detail-info-card">
              <div class="detail-info-label">Anonymat</div>
              <div class="detail-info-value">{{ c.isAnonymous ? '🔒 Anonyme' : '👁 Visible' }}</div>
            </div>
          </div>
          <!-- Message -->
          @if (c.message) {
            <div class="detail-message-block">
              <div class="detail-message-label">
                <lucide-icon name="mail" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                Votre message
              </div>
              <div class="detail-message-text">{{ c.message }}</div>
            </div>
          }
          <!-- Paiement associé -->
          @if (c.payment) {
            <div class="detail-payment-block">
              <div class="detail-section-title">Paiement associé</div>
              <div class="detail-payment-card">
                <div class="payment-row">
                  <span class="payment-label">Référence</span>
                  <span class="payment-val mono">#{{ c.payment!.id }}</span>
                </div>
                <div class="payment-row">
                  <span class="payment-label">Statut</span>
                  <span class="status-badge" [ngClass]="getPaymentStatusClass(c.payment!.status)">{{
                    getPaymentStatusLabel(c.payment!.status)
                  }}</span>
                </div>
                @if (c.payment!.provider) {
                  <div class="payment-row">
                    <span class="payment-label">Opérateur</span>
                    <span class="payment-val">{{ c.payment!.provider }}</span>
                  </div>
                }
                @if (c.payment!.paymentMethod) {
                  <div class="payment-row">
                    <span class="payment-label">Méthode</span>
                    <span class="payment-val">{{ c.payment!.paymentMethod }}</span>
                  </div>
                }
              </div>
              <a
                [routerLink]="['/app/payments', c.payment!.id]"
                class="btn-see-payment"
                (click)="selectedContrib.set(null)"
              >
                <lucide-icon name="credit-card" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                Voir le détail du paiement
              </a>
            </div>
          }
          <!-- Lien vers l'événement -->
          @if (c.event?.id) {
            <a
              [routerLink]="['/app/events', c.event!.id]"
              class="btn-see-event"
              (click)="selectedContrib.set(null)"
            >
              <lucide-icon name="calendar" [size]="14" color="currentColor" [strokeWidth]="1.8" />
              Voir l'événement
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* ──────────────────── PAGE ──────────────────── */
      .page-wrap {
        background: #f9fafb;
        min-height: calc(100vh - 64px);
      }

      .page-hero {
        background: #000;
        padding: 40px 0;
      }
      .page-hero-inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
      }
      .page-eyebrow {
        color: #ffd700;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 8px;
      }
      h1 {
        font-size: 2rem;
        font-weight: 900;
        color: white;
        margin: 0 0 8px;
        letter-spacing: -0.02em;
      }
      .page-hero p {
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
        font-size: 0.9rem;
      }
      .hero-stats {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .hero-stat {
        display: flex;
        flex-direction: column;
        gap: 3px;
        text-align: right;
      }
      .hero-stat strong {
        color: white;
        font-size: 1.1rem;
        font-weight: 900;
      }
      .hero-stat span {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.72rem;
      }
      .hero-stat-sep {
        width: 1px;
        height: 28px;
        background: rgba(255, 255, 255, 0.1);
      }

      .page-body {
        max-width: 1280px;
        margin: 0 auto;
        padding: 28px 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* Filtres */
      .filter-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .filter-btn {
        padding: 8px 14px;
        border: 1.5px solid #e5e7eb;
        border-radius: 999px;
        background: white;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: 0.15s;
      }
      .filter-btn:hover {
        border-color: #111;
        color: #111;
      }
      .filter-btn.active {
        background: #111;
        border-color: #111;
        color: white;
      }
      .filter-count {
        background: rgba(255, 255, 255, 0.18);
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 800;
      }
      .filter-btn:not(.active) .filter-count {
        background: #f3f4f6;
        color: #6b7280;
      }

      /* Loading */
      .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 56px;
        color: #9ca3af;
        font-size: 0.9rem;
      }
      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f4f6;
        border-top-color: #111;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Empty */
      .empty-block {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        padding: 56px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      }
      .empty-icon {
        font-size: 2.5rem;
      }
      .empty-block p {
        color: #9ca3af;
        margin: 0;
      }
      .btn-yellow {
        background: #ffd700;
        color: #000;
        padding: 10px 20px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 800;
        font-size: 0.88rem;
      }

      /* Liste contributions */
      .contrib-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .contrib-card {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 16px;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        cursor: pointer;
        transition: 0.2s;
        flex-wrap: wrap;
      }
      .contrib-card:hover {
        border-color: #e5e7eb;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      }
      .contrib-card.selected {
        border-color: #111;
        background: #fafafa;
      }
      .contrib-card-left {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;
        min-width: 0;
      }
      .contrib-item-icon {
        width: 42px;
        height: 42px;
        background: #f3f4f6;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        flex-shrink: 0;
      }
      .contrib-info {
        flex: 1;
        min-width: 0;
      }
      .contrib-item-name {
        font-size: 0.92rem;
        font-weight: 700;
        color: #111;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .contrib-event-name {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.78rem;
        color: #6b7280;
        margin-top: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .contrib-date {
        font-size: 0.72rem;
        color: #9ca3af;
        margin-top: 2px;
      }
      .contrib-card-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      .contrib-amount {
        font-size: 1.05rem;
        font-weight: 900;
        color: #111;
      }
      .currency {
        font-size: 0.72rem;
        color: #9ca3af;
      }
      .chevron {
        color: #d1d5db;
      }
      .contrib-card:hover .chevron {
        color: #6b7280;
      }

      /* Badges statut */
      .status-badge {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        white-space: nowrap;
      }
      .s-confirmed {
        background: #dcfce7;
        color: #166534;
      }
      .s-awaiting {
        background: #fef3c7;
        color: #92400e;
      }
      .s-failed,
      .s-cancelled {
        background: #fee2e2;
        color: #991b1b;
      }
      .s-refunded {
        background: #ede9fe;
        color: #6d28d9;
      }
      .s-default {
        background: #f3f4f6;
        color: #6b7280;
      }

      /* ──────────────────── DRAWER ──────────────────── */
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 299;
      }

      .detail-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: 300;
        width: min(460px, 100vw);
        background: white;
        display: flex;
        flex-direction: column;
        box-shadow: -8px 0 48px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .detail-drawer.open {
        transform: translateX(0);
      }

      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        background: #000;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        flex-shrink: 0;
      }
      .drawer-eyebrow {
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.5);
      }
      .btn-close {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .btn-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .drawer-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      /* Status banner */
      .detail-status-banner {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 20px;
        border-bottom: 1px solid #f3f4f6;
      }
      .banner-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }
      .banner-status {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111;
      }
      .banner-sub {
        font-size: 0.78rem;
        color: #6b7280;
        margin-top: 2px;
      }
      .banner-confirmed {
        background: #f0fdf4;
      }
      .banner-awaiting {
        background: #fffbeb;
      }
      .banner-failed {
        background: #fef2f2;
      }
      .banner-refunded {
        background: #f5f3ff;
      }
      .banner-default {
        background: #f9fafb;
      }

      /* Montant */
      .detail-amount-block {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 24px 20px 20px;
        border-bottom: 1px solid #f3f4f6;
      }
      .detail-amount {
        font-size: 2.2rem;
        font-weight: 900;
        color: #111;
        letter-spacing: -0.03em;
      }
      .detail-currency {
        font-size: 0.9rem;
        font-weight: 700;
        color: #9ca3af;
      }

      /* Info cards */
      .detail-info-cards {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .detail-info-card {
        padding: 14px 20px;
        border-bottom: 1px solid #f9fafb;
      }
      .detail-info-label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #9ca3af;
        margin-bottom: 4px;
      }
      .detail-info-value {
        font-size: 0.9rem;
        font-weight: 700;
        color: #111;
      }
      .detail-info-sub {
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 2px;
      }

      /* Message */
      .detail-message-block {
        padding: 16px 20px;
        background: #f9fafb;
        border-bottom: 1px solid #f3f4f6;
      }
      .detail-message-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b7280;
        margin-bottom: 8px;
      }
      .detail-message-text {
        font-size: 0.88rem;
        color: #374151;
        line-height: 1.6;
        font-style: italic;
        padding: 12px 14px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
      }

      /* Paiement */
      .detail-payment-block {
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        border-bottom: 1px solid #f3f4f6;
      }
      .detail-section-title {
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6b7280;
      }
      .detail-payment-card {
        background: #f9fafb;
        border: 1px solid #f3f4f6;
        border-radius: 12px;
        overflow: hidden;
      }
      .payment-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid #f3f4f6;
      }
      .payment-row:last-child {
        border-bottom: 0;
      }
      .payment-label {
        font-size: 0.78rem;
        color: #9ca3af;
      }
      .payment-val {
        font-size: 0.85rem;
        font-weight: 600;
        color: #111;
      }
      .mono {
        font-family: monospace;
      }

      .btn-see-payment {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 11px 16px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        color: #374151;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 700;
        transition: 0.2s;
      }
      .btn-see-payment:hover {
        border-color: #111;
        color: #111;
      }

      /* Lien événement */
      .btn-see-event {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 16px 20px;
        padding: 13px 16px;
        border: 0;
        border-radius: 12px;
        background: #111;
        color: white;
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 700;
        transition: 0.2s;
      }
      .btn-see-event:hover {
        background: #000;
      }

      /* Payment status badges */
      .ps-succeeded {
        background: #dcfce7;
        color: #166534;
      }
      .ps-initiated,
      .ps-pending {
        background: #fef3c7;
        color: #92400e;
      }
      .ps-failed,
      .ps-expired {
        background: #fee2e2;
        color: #991b1b;
      }
      .ps-refunded {
        background: #ede9fe;
        color: #6d28d9;
      }

      @media (max-width: 640px) {
        .contrib-card {
          flex-direction: column;
          align-items: flex-start;
        }
        .contrib-card-right {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class MyContributionsPageComponent implements OnInit {
  private readonly service = inject(MyContributionsService);

  readonly data = signal<MyContributionsResponse | null>(null);
  readonly loading = signal(true);
  readonly activeFilter = signal<Filter>('ALL');
  readonly selectedContrib = signal<MyContributionItem | null>(null);

  readonly filters = [
    { label: 'Toutes', value: 'ALL' as Filter },
    { label: 'En attente', value: 'AWAITING_PAYMENT' as Filter },
    { label: 'Confirmées', value: 'CONFIRMED' as Filter },
    { label: 'Échouées', value: 'FAILED' as Filter },
    { label: 'Annulées', value: 'CANCELLED' as Filter },
    { label: 'Remboursées', value: 'REFUNDED' as Filter },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    const items = this.data()?.items ?? [];
    if (f === 'ALL') return items;
    return items.filter((c) => c.status === f);
  });

  readonly confirmedAmount = computed(() =>
    (this.data()?.items ?? [])
      .filter((c) => c.status === 'CONFIRMED')
      .reduce((s, c) => s + Number(c.amount), 0),
  );
  readonly pendingCount = computed(
    () => (this.data()?.items ?? []).filter((c) => c.status === 'AWAITING_PAYMENT').length,
  );

  getCount(f: Filter): number {
    const items = this.data()?.items ?? [];
    if (f === 'ALL') return items.length;
    return items.filter((c) => c.status === f).length;
  }

  select(c: MyContributionItem): void {
    this.selectedContrib.set(this.selectedContrib()?.id === c.id ? null : c);
  }

  ngOnInit(): void {
    this.service.getMine().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStatusLabel(s: string): string {
    const m: Record<string, string> = {
      CONFIRMED: 'Confirmée',
      AWAITING_PAYMENT: 'En attente',
      FAILED: 'Échouée',
      CANCELLED: 'Annulée',
      REFUNDED: 'Remboursée',
    };
    return m[s] ?? s;
  }
  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      CONFIRMED: 's-confirmed',
      AWAITING_PAYMENT: 's-awaiting',
      FAILED: 's-failed',
      CANCELLED: 's-cancelled',
      REFUNDED: 's-refunded',
    };
    return m[s] ?? 's-default';
  }
  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      CONFIRMED: '✅',
      AWAITING_PAYMENT: '⏳',
      FAILED: '❌',
      CANCELLED: '🚫',
      REFUNDED: '↩️',
    };
    return m[s] ?? 'ℹ️';
  }
  getStatusDescription(s: string): string {
    const m: Record<string, string> = {
      CONFIRMED: 'Votre contribution a été validée avec succès.',
      AWAITING_PAYMENT: 'En attente de finalisation du paiement.',
      FAILED: 'Le paiement associé a échoué.',
      CANCELLED: 'Cette contribution a été annulée.',
      REFUNDED: 'Vous avez été remboursé pour cette contribution.',
    };
    return m[s] ?? '';
  }
  getBannerClass(s: string): string {
    const m: Record<string, string> = {
      CONFIRMED: 'banner-confirmed',
      AWAITING_PAYMENT: 'banner-awaiting',
      FAILED: 'banner-failed',
      REFUNDED: 'banner-refunded',
    };
    return m[s] ?? 'banner-default';
  }
  getPaymentStatusLabel(s: string): string {
    const m: Record<string, string> = {
      SUCCEEDED: 'Réussi',
      INITIATED: 'Initié',
      PENDING: 'En attente',
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé',
      EXPIRED: 'Expiré',
    };
    return m[s] ?? s;
  }
  getPaymentStatusClass(s: string): string {
    const m: Record<string, string> = {
      SUCCEEDED: 'status-badge ps-succeeded',
      INITIATED: 'status-badge ps-initiated',
      PENDING: 'status-badge ps-pending',
      FAILED: 'status-badge ps-failed',
      EXPIRED: 'status-badge ps-expired',
      REFUNDED: 'status-badge ps-refunded',
    };
    return m[s] ?? 'status-badge s-default';
  }
}
