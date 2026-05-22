import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationCenterService } from '../services/notification-center.service';
import { NotificationsService } from '../services/notifications.service';
import { AppNotification } from '../models/notification.model';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrap">
      <div class="page-hero">
        <div class="page-hero-inner">
          <div>
            <div class="page-eyebrow">Mon espace</div>
            <h1>Notifications</h1>
            <p>Toutes vos alertes et mises à jour en un seul endroit.</p>
          </div>
          <div class="hero-right">
            @if (unreadCount() > 0) {
              <div class="unread-pill">{{ unreadCount() }} non lue(s)</div>
            }
            <button
              class="btn-mark-all"
              (click)="markAll()"
              [disabled]="markLoading() || unreadCount() === 0"
            >
              {{ markLoading() ? '...' : 'Tout marquer lu' }}
            </button>
          </div>
        </div>
      </div>

      <div class="page-body">
        <!-- Filtres -->
        <div class="filter-row">
          <button
            class="filter-btn"
            [class.active]="showUnreadOnly() === false"
            (click)="showUnreadOnly.set(false)"
          >
            Toutes <span class="filter-count">{{ notifications().length }}</span>
          </button>
          <button
            class="filter-btn"
            [class.active]="showUnreadOnly() === true"
            (click)="showUnreadOnly.set(true)"
          >
            Non lues
            @if (unreadCount() > 0) {
              <span class="filter-count">{{ unreadCount() }}</span>
            }
          </button>
        </div>

        @if (loading()) {
          <div class="loading-state">Chargement...</div>
        }

        @if (!loading() && displayed().length === 0) {
          <div class="empty-block">
            <div class="empty-icon">🔔</div>
            <p>{{ showUnreadOnly() ? 'Aucune notification non lue.' : 'Aucune notification.' }}</p>
          </div>
        }

        @if (!loading() && displayed().length > 0) {
          <div class="notif-list">
            @for (n of displayed(); track n.id) {
              <div class="notif-card" [class.unread]="!isRead(n)" (click)="markRead(n)">
                <div class="notif-dot" [class.dot-visible]="!isRead(n)"></div>
                <div class="notif-body">
                  <div class="notif-header">
                    <span class="notif-type-pill" [ngClass]="getTypeClass(n.type)">{{
                      formatType(n.type)
                    }}</span>
                    <span class="notif-date">{{ n.createdAt | date: 'dd MMM yyyy HH:mm' }}</span>
                  </div>
                  <div class="notif-title">{{ n.title }}</div>
                  @if (n.body) {
                    <div class="notif-text">{{ n.body }}</div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
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
      .hero-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .unread-pill {
        background: #ef4444;
        color: white;
        padding: 5px 14px;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 700;
      }
      .btn-mark-all {
        padding: 9px 18px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        font: inherit;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-mark-all:hover:not(:disabled) {
        border-color: white;
        color: white;
      }
      .btn-mark-all:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .page-body {
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .loading-state {
        color: #9ca3af;
        text-align: center;
        padding: 48px;
      }

      .filter-row {
        display: flex;
        gap: 8px;
      }
      .filter-btn {
        padding: 8px 16px;
        border: 1.5px solid #e5e7eb;
        border-radius: 999px;
        background: white;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: 0.15s;
      }
      .filter-btn.active {
        background: #111;
        border-color: #111;
        color: white;
      }
      .filter-count {
        background: rgba(255, 255, 255, 0.2);
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 0.7rem;
      }
      .filter-btn:not(.active) .filter-count {
        background: #f3f4f6;
        color: #6b7280;
      }

      .empty-block {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        padding: 64px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      .empty-icon {
        font-size: 3rem;
      }
      .empty-block p {
        color: #9ca3af;
        margin: 0;
      }

      .notif-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .notif-card {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 16px;
        padding: 18px 20px;
        display: flex;
        align-items: flex-start;
        gap: 14px;
        cursor: pointer;
        transition: 0.2s;
      }
      .notif-card:hover {
        border-color: #e5e7eb;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      }
      .notif-card.unread {
        background: #fffbf0;
        border-color: #fde68a;
      }
      .notif-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: transparent;
        margin-top: 6px;
        flex-shrink: 0;
      }
      .dot-visible {
        background: #ffd700;
      }
      .notif-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .notif-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .notif-type-pill {
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .type-payment {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .type-event {
        background: #dcfce7;
        color: #166534;
      }
      .type-contribution {
        background: #ede9fe;
        color: #6d28d9;
      }
      .type-jackpot {
        background: #fef3c7;
        color: #92400e;
      }
      .type-product {
        background: #e0f2fe;
        color: #0369a1;
      }
      .type-delivery {
        background: #fce7f3;
        color: #9d174d;
      }
      .type-default {
        background: #f3f4f6;
        color: #6b7280;
      }
      .notif-date {
        font-size: 0.75rem;
        color: #9ca3af;
      }
      .notif-title {
        font-weight: 700;
        color: #111;
        font-size: 0.92rem;
      }
      .notif-text {
        font-size: 0.85rem;
        color: #6b7280;
        line-height: 1.5;
      }
    `,
  ],
})
export class NotificationsPageComponent implements OnInit {
  private readonly center = inject(NotificationCenterService);
  private readonly service = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly notifications = this.center.notifications;
  readonly unreadCount = this.center.unreadCount;
  readonly loading = signal(false);
  readonly markLoading = signal(false);
  readonly showUnreadOnly = signal(false);

  readonly displayed = computed(() => {
    const all = this.notifications();
    if (this.showUnreadOnly()) return all.filter((n) => !this.isRead(n));
    return all;
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.center.refreshAll();
    setTimeout(() => this.loading.set(false), 800);
  }

  isRead(n: AppNotification): boolean {
    return this.center.isRead(n);
  }

  markRead(n: AppNotification): void {
    if (!this.isRead(n)) {
      this.center.markOneAsReadLocally(n.id);
      this.service.markAsRead(n.id).subscribe();
    }
    this.navigateForNotification(n);
  }

  private navigateForNotification(n: AppNotification): void {
    const payload = n.dataPayload;
    if (
      n.type === 'DELIVERY_SELECTION_REQUIRED' &&
      payload?.['wishlistItemId']
    ) {
      this.router.navigate(['/app/delivery', payload['wishlistItemId']]);
    } else if (n.type === 'DELIVERY_DATE_PENDING_ADMIN') {
      this.router.navigate(['/admin/delivery-date-pending']);
    }
  }

  markAll(): void {
    this.markLoading.set(true);
    this.service.markAllAsRead().subscribe({
      next: () => {
        this.center.markAllAsReadLocally();
        this.markLoading.set(false);
      },
      error: () => this.markLoading.set(false),
    });
  }

  formatType(type: string | null | undefined): string {
    const m: Record<string, string> = {
      PAYMENT_SUCCEEDED: 'Paiement',
      PAYMENT_FAILED: 'Paiement',
      PAYMENT_EXPIRED: 'Paiement',
      CONTRIBUTION_CONFIRMED: 'Contribution',
      JACKPOT_SUBMITTED: 'Cagnotte',
      JACKPOT_APPROVED: 'Cagnotte',
      JACKPOT_REJECTED: 'Cagnotte',
      JACKPOT_CONTRIBUTION: 'Cagnotte',
      PRODUCT_REQUEST_SUBMITTED: 'Demande produit',
      PRODUCT_REQUEST_APPROVED: 'Demande produit',
      PRODUCT_REQUEST_REJECTED: 'Demande produit',
      PRODUCT_REQUEST_UNDER_REVIEW: 'Demande produit',
      WISHLIST_ITEM_RESERVED: 'Réservation',
      WISHLIST_ITEM_RESERVATION_EXPIRED: 'Réservation',
      RESERVATION_EXPIRED: 'Réservation',
      DELIVERY_SELECTION_REQUIRED: 'Livraison',
      DELIVERY_SELECTION_CONFIRMED: 'Livraison',
      DELIVERY_DATE_PENDING_ADMIN: 'Livraison',
    };
    return m[type ?? ''] ?? 'Notification';
  }

  getTypeClass(type: string | null | undefined): string {
    const m: Record<string, string> = {
      PAYMENT_SUCCEEDED: 'type-payment',
      PAYMENT_FAILED: 'type-payment',
      PAYMENT_EXPIRED: 'type-payment',
      CONTRIBUTION_CONFIRMED: 'type-contribution',
      JACKPOT_SUBMITTED: 'type-jackpot',
      JACKPOT_APPROVED: 'type-jackpot',
      JACKPOT_REJECTED: 'type-jackpot',
      JACKPOT_CONTRIBUTION: 'type-jackpot',
      PRODUCT_REQUEST_SUBMITTED: 'type-product',
      PRODUCT_REQUEST_APPROVED: 'type-product',
      PRODUCT_REQUEST_REJECTED: 'type-product',
      PRODUCT_REQUEST_UNDER_REVIEW: 'type-product',
      WISHLIST_ITEM_RESERVED: 'type-event',
      WISHLIST_ITEM_RESERVATION_EXPIRED: 'type-event',
      RESERVATION_EXPIRED: 'type-event',
      DELIVERY_SELECTION_REQUIRED: 'type-delivery',
      DELIVERY_SELECTION_CONFIRMED: 'type-delivery',
      DELIVERY_DATE_PENDING_ADMIN: 'type-delivery',
    };
    return m[type ?? ''] ?? 'type-default';
  }
}
