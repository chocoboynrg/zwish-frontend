import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationCenterService } from '../../notifications/services/notification-center.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { AppNotification } from '../../notifications/models/notification.model';

// Types de notifs pertinents pour l'admin
const ADMIN_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  PRODUCT_REQUEST_SUBMITTED: { label: 'Demande produit',  color: '#1d4ed8', bg: '#dbeafe' },
  PAYMENT_SUCCEEDED:         { label: 'Paiement réussi',  color: '#166534', bg: '#dcfce7' },
  PAYMENT_FAILED:            { label: 'Paiement échoué',  color: '#991b1b', bg: '#fee2e2' },
  PAYMENT_EXPIRED:           { label: 'Paiement expiré',  color: '#92400e', bg: '#fef3c7' },
  CONTRIBUTION_CONFIRMED:    { label: 'Contribution',     color: '#6d28d9', bg: '#ede9fe' },
};

const DEFAULT_META = { label: 'Notification', color: '#374151', bg: '#f3f4f6' };

@Component({
  selector: 'app-notifications-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1>Notifications</h1>
          <p class="subtitle">{{ unreadCount() > 0 ? unreadCount() + ' non lue(s)' : 'Tout est à jour' }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-mark-all" (click)="markAll()" [disabled]="markLoading() || unreadCount() === 0">
            {{ markLoading() ? '...' : 'Tout marquer lu' }}
          </button>
          <button class="btn-refresh" (click)="refresh()">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 016-6 6 6 0 015.66 4M16 4v4h-4M16 10a6 6 0 01-6 6 6 6 0 01-5.66-4M4 16v-4h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filter-row">
        <button class="filter-btn" [class.active]="showUnread()" (click)="showUnread.set(!showUnread())">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.3"/><circle cx="10" cy="10" r="4" fill="currentColor"/></svg>
          Non lues seulement
        </button>
        <button *ngFor="let f of typeFilters"
          class="filter-btn" [class.active]="activeType() === f.value"
          (click)="activeType.set(activeType() === f.value ? null : f.value)"
        >{{ f.label }}</button>
      </div>

      <!-- Loading -->
      <div class="state-card" *ngIf="loading()">Chargement...</div>

      <!-- Empty -->
      <div class="state-card" *ngIf="!loading() && displayed().length === 0">
        <div style="font-size:2rem;margin-bottom:8px">🔔</div>
        <div>Aucune notification{{ showUnread() ? ' non lue' : '' }}.</div>
      </div>

      <!-- Liste -->
      <div class="notif-list" *ngIf="!loading() && displayed().length > 0">
        <div
          class="notif-card"
          *ngFor="let n of displayed()"
          [class.unread]="!isRead(n)"
          (click)="markRead(n)"
        >
          <div class="notif-accent" [style.background]="getMeta(n.type).color"></div>
          <div class="notif-body">
            <div class="notif-top">
              <span class="type-pill" [style.background]="getMeta(n.type).bg" [style.color]="getMeta(n.type).color">
                {{ getMeta(n.type).label }}
              </span>
              <span class="notif-time">{{ n.createdAt | date:'dd MMM HH:mm' }}</span>
              <span class="unread-dot" *ngIf="!isRead(n)"></span>
            </div>
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-body-text" *ngIf="n.body">{{ n.body }}</div>
            <!-- Actions rapides -->
            <div class="notif-actions" *ngIf="getPayload(n) as p">
              <a *ngIf="p['productRequestId']" [routerLink]="['/admin/product-requests']" class="notif-action-link" (click)="$event.stopPropagation()">
                Voir la demande →
              </a>
              <a *ngIf="p['paymentId']" [routerLink]="['/admin/payments', p['paymentId']]" class="notif-action-link" (click)="$event.stopPropagation()">
                Voir le paiement →
              </a>
              <a *ngIf="p['eventId'] && !p['paymentId'] && !p['productRequestId']" [routerLink]="['/admin/events', p['eventId']]" class="notif-action-link" (click)="$event.stopPropagation()">
                Voir l'événement →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 900px; display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    h1 { font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 0.88rem; margin: 0; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .btn-mark-all { padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px; background: white; color: #374151; font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: 0.15s; }
    .btn-mark-all:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
    .btn-mark-all:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-refresh { width: 38px; height: 38px; border: 1.5px solid #e2e8f0; border-radius: 9px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.15s; }
    .btn-refresh:hover { background: #f8fafc; color: #374151; }

    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border: 1.5px solid #e2e8f0; border-radius: 999px; background: white; font: inherit; font-size: 0.8rem; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.15s; }
    .filter-btn:hover { border-color: #6366f1; color: #6366f1; }
    .filter-btn.active { background: #6366f1; border-color: #6366f1; color: white; }

    .state-card { background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 48px; text-align: center; color: #94a3b8; font-size: 0.9rem; }

    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-card {
      background: white; border: 1px solid #f1f5f9; border-radius: 14px;
      display: flex; overflow: hidden; cursor: pointer; transition: 0.15s;
    }
    .notif-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); border-color: #e2e8f0; }
    .notif-card.unread { background: #f8f9ff; border-color: #e0e7ff; }
    .notif-accent { width: 4px; flex-shrink: 0; }
    .notif-body { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
    .notif-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .type-pill { padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .notif-time { font-size: 0.72rem; color: #94a3b8; margin-left: auto; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #6366f1; flex-shrink: 0; }
    .notif-title { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
    .notif-body-text { font-size: 0.82rem; color: #64748b; line-height: 1.5; }
    .notif-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .notif-action-link { font-size: 0.8rem; font-weight: 700; color: #6366f1; text-decoration: none; }
    .notif-action-link:hover { color: #4f46e5; }
  `],
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
    { label: 'Demandes produit', value: 'PRODUCT_REQUEST_SUBMITTED' },
    { label: 'Paiements', value: 'PAYMENT_SUCCEEDED' },
  ];

  readonly displayed = computed(() => {
    let list = this.notifications();
    if (this.showUnread()) list = list.filter(n => !this.isRead(n));
    if (this.activeType()) list = list.filter(n => n.type === this.activeType());
    return list;
  });

  isRead(n: AppNotification): boolean { return this.center.isRead(n); }

  getMeta(type: string | null | undefined) {
    return ADMIN_TYPE_META[type ?? ''] ?? DEFAULT_META;
  }

  getPayload(n: AppNotification): Record<string, any> | null {
    return (n as any).dataPayload ?? null;
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.center.loadNotifications(true);
    setTimeout(() => this.loading.set(false), 600);
  }

  refresh(): void {
    this.loading.set(true);
    this.center.loadNotifications(true);
    setTimeout(() => this.loading.set(false), 600);
  }

  markRead(n: AppNotification): void {
    if (!this.isRead(n)) {
      this.service.markAsRead(n.id).subscribe(() => this.center.loadUnreadCount());
    }
  }

  markAll(): void {
    this.markLoading.set(true);
    this.service.markAllAsRead().subscribe({
      next: () => { this.center.loadUnreadCount(); this.center.loadNotifications(true); this.markLoading.set(false); },
      error: () => this.markLoading.set(false),
    });
  }
}