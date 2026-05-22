import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationCenterService } from '../../notifications/services/notification-center.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import {
  AppNotification,
  NotificationPayload,
} from '../../notifications/models/notification.model';
import { LucideAngularModule } from 'lucide-angular';

// Types de notifs pertinents pour l'admin
const ADMIN_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  PRODUCT_REQUEST_SUBMITTED: { label: 'Demande produit', color: '#1d4ed8', bg: '#dbeafe' },
  PAYMENT_SUCCEEDED: { label: 'Paiement réussi', color: '#166534', bg: '#dcfce7' },
  PAYMENT_FAILED: { label: 'Paiement échoué', color: '#991b1b', bg: '#fee2e2' },
  PAYMENT_EXPIRED: { label: 'Paiement expiré', color: '#92400e', bg: '#fef3c7' },
  CONTRIBUTION_CONFIRMED: { label: 'Contribution', color: '#6d28d9', bg: '#ede9fe' },
  JACKPOT_SUBMITTED: { label: 'Cagnotte', color: '#92400e', bg: '#fef3c7' },
};

const DEFAULT_META = { label: 'Notification', color: '#374151', bg: '#f3f4f6' };

@Component({
  selector: 'app-notifications-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Notifications</h1>
          <p class="subtitle">
            {{ unreadCount() > 0 ? unreadCount() + ' non lue(s)' : 'Tout est à jour' }}
          </p>
        </div>
        <div class="header-actions">
          <button
            class="btn-mark-all"
            (click)="markAll()"
            [disabled]="markLoading() || unreadCount() === 0"
          >
            {{ markLoading() ? '...' : 'Tout marquer lu' }}
          </button>
          <button class="btn-refresh" (click)="refresh()">
            <lucide-icon name="refresh-cw" [size]="15" color="currentColor" [strokeWidth]="1.8" />
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filter-row">
        <button
          class="filter-btn"
          [class.active]="showUnread()"
          (click)="showUnread.set(!showUnread())"
        >
          <lucide-icon name="circle" [size]="12" color="currentColor" [strokeWidth]="1.8" />
          Non lues seulement
        </button>
        @for (f of typeFilters; track f.value) {
          <button
            class="filter-btn"
            [class.active]="activeType() === f.value"
            (click)="activeType.set(activeType() === f.value ? null : f.value)"
          >
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="state-card">Chargement...</div>
      }

      <!-- Empty -->
      @if (!loading() && displayed().length === 0) {
        <div class="state-card">
          <div style="font-size:2rem;margin-bottom:8px">🔔</div>
          <div>Aucune notification{{ showUnread() ? ' non lue' : '' }}.</div>
        </div>
      }

      <!-- Liste -->
      @if (!loading() && displayed().length > 0) {
        <div class="notif-list">
          @for (n of displayed(); track n.id) {
            <div class="notif-card" [class.unread]="!isRead(n)" (click)="markRead(n)">
              <div class="notif-accent" [style.background]="getMeta(n.type).color"></div>
              <div class="notif-body">
                <div class="notif-top">
                  <span
                    class="type-pill"
                    [style.background]="getMeta(n.type).bg"
                    [style.color]="getMeta(n.type).color"
                  >
                    {{ getMeta(n.type).label }}
                  </span>
                  <span class="notif-time">{{ n.createdAt | date: 'dd MMM HH:mm' }}</span>
                  @if (!isRead(n)) {
                    <span class="unread-dot"></span>
                  }
                </div>
                <div class="notif-title">{{ n.title }}</div>
                @if (n.body) {
                  <div class="notif-body-text">{{ n.body }}</div>
                }
                <!-- Actions rapides -->
                @if (getPayload(n); as p) {
                  <div class="notif-actions">
                    @if (p['jackpotId']) {
                      <a
                        [routerLink]="['/admin/jackpot']"
                        class="notif-action-link notif-action-jackpot"
                        (click)="$event.stopPropagation()"
                      >
                        💰 Valider la cagnotte →
                      </a>
                    }
                    @if (p['productRequestId']) {
                      <a
                        [routerLink]="['/admin/product-requests']"
                        class="notif-action-link"
                        (click)="$event.stopPropagation()"
                      >
                        Voir la demande →
                      </a>
                    }
                    @if (p['paymentId']) {
                      <a
                        [routerLink]="['/admin/payments', p['paymentId']]"
                        class="notif-action-link"
                        (click)="$event.stopPropagation()"
                      >
                        Voir le paiement →
                      </a>
                    }
                    @if (p['eventId'] && !p['paymentId'] && !p['productRequestId']) {
                      <a
                        [routerLink]="['/admin/events', p['eventId']]"
                        class="notif-action-link"
                        (click)="$event.stopPropagation()"
                      >
                        Voir l'événement →
                      </a>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page {
        padding: 32px;
        max-width: 900px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 900;
        color: #0f172a;
        margin: 0 0 4px;
      }
      .subtitle {
        color: #64748b;
        font-size: 0.88rem;
        margin: 0;
      }
      .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .btn-mark-all {
        padding: 9px 18px;
        border: 1.5px solid #e2e8f0;
        border-radius: 9px;
        background: white;
        color: #374151;
        font: inherit;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.15s;
      }
      .btn-mark-all:hover:not(:disabled) {
        border-color: #6366f1;
        color: #6366f1;
      }
      .btn-mark-all:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .btn-refresh {
        width: 38px;
        height: 38px;
        border: 1.5px solid #e2e8f0;
        border-radius: 9px;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        transition: 0.15s;
      }
      .btn-refresh:hover {
        background: #f8fafc;
        color: #374151;
      }

      .filter-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .filter-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 999px;
        background: white;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: 0.15s;
      }
      .filter-btn:hover {
        border-color: #6366f1;
        color: #6366f1;
      }
      .filter-btn.active {
        background: #6366f1;
        border-color: #6366f1;
        color: white;
      }

      .state-card {
        background: white;
        border: 1px solid #f1f5f9;
        border-radius: 16px;
        padding: 48px;
        text-align: center;
        color: #94a3b8;
        font-size: 0.9rem;
      }

      .notif-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .notif-card {
        background: white;
        border: 1px solid #f1f5f9;
        border-radius: 14px;
        display: flex;
        overflow: hidden;
        cursor: pointer;
        transition: 0.15s;
      }
      .notif-card:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        border-color: #e2e8f0;
      }
      .notif-card.unread {
        background: #f8f9ff;
        border-color: #e0e7ff;
      }
      .notif-accent {
        width: 4px;
        flex-shrink: 0;
      }
      .notif-body {
        flex: 1;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .notif-top {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .type-pill {
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
      }
      .notif-time {
        font-size: 0.72rem;
        color: #94a3b8;
        margin-left: auto;
      }
      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6366f1;
        flex-shrink: 0;
      }
      .notif-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #0f172a;
      }
      .notif-body-text {
        font-size: 0.82rem;
        color: #64748b;
        line-height: 1.5;
      }
      .notif-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .notif-action-link {
        font-size: 0.8rem;
        font-weight: 700;
        color: #6366f1;
        text-decoration: none;
      }
      .notif-action-link:hover {
        color: #4f46e5;
      }
      .notif-action-jackpot {
        color: #92400e;
        background: #fef3c7;
        padding: 4px 10px;
        border-radius: 6px;
      }
      .notif-action-jackpot:hover {
        color: #78350f;
        background: #fde68a;
      }
    `,
  ],
})
export class NotificationsAdminPageComponent implements OnInit {
  private readonly center = inject(NotificationCenterService);
  private readonly service = inject(NotificationsService);

  readonly notifications = this.center.notifications;
  readonly unreadCount = this.center.unreadCount;
  readonly loading = signal(false);
  readonly markLoading = signal(false);
  readonly showUnread = signal(false);
  readonly activeType = signal<string | null>(null);

  readonly typeFilters = [
    { label: 'Cagnottes', value: 'JACKPOT_SUBMITTED' },
    { label: 'Demandes produit', value: 'PRODUCT_REQUEST_SUBMITTED' },
    { label: 'Paiements', value: 'PAYMENT_SUCCEEDED' },
  ];

  readonly displayed = computed(() => {
    let list = this.notifications();
    if (this.showUnread()) list = list.filter((n) => !this.isRead(n));
    if (this.activeType()) list = list.filter((n) => n.type === this.activeType());
    return list;
  });

  isRead(n: AppNotification): boolean {
    return this.center.isRead(n);
  }

  getMeta(type: string | null | undefined) {
    return ADMIN_TYPE_META[type ?? ''] ?? DEFAULT_META;
  }

  getPayload(n: AppNotification): NotificationPayload | null {
    return n.dataPayload ?? null;
  }

  ngOnInit(): void {
    // Force le rechargement à chaque visite de la page
    this.loading.set(true);
    this.center.refreshAll();
    setTimeout(() => this.loading.set(false), 800);
  }

  refresh(): void {
    this.loading.set(true);
    this.center.refreshAll();
    setTimeout(() => this.loading.set(false), 800);
  }

  markRead(n: AppNotification): void {
    if (!this.isRead(n)) {
      // Met à jour le signal local immédiatement → le style change sans attendre l'API
      this.center.markOneAsReadLocally(n.id);
      this.service.markAsRead(n.id).subscribe();
    }
  }

  markAll(): void {
    this.markLoading.set(true);
    this.service.markAllAsRead().subscribe({
      next: () => {
        // Met à jour localement pour que l'UI réagisse immédiatement
        this.center.markAllAsReadLocally();
        this.markLoading.set(false);
      },
      error: () => this.markLoading.set(false),
    });
  }
}
