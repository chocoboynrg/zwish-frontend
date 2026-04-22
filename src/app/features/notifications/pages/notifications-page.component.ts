import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { NotificationsService } from '../services/notifications.service';
import { NotificationCenterService } from '../services/notification-center.service';
import { AppNotification } from '../models/notification.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../core/services/toast.service';

type NotificationPayload = {
  paymentId?: number;
  eventId?: number;
  wishlistItemId?: number;
  contributionId?: number;
};

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  template: `
    <section class="page">
      <header class="hero-card">
        <div class="hero-top">
          <div>
            <span class="eyebrow">Espace utilisateur</span>
            <h1>Notifications</h1>
            <p class="subtitle">
              Retrouvez ici vos notifications récentes, vos actions à effectuer
              et les informations importantes liées à vos événements.
            </p>
          </div>

          <div class="hero-actions">
            <a routerLink="/app" class="back-link">← Retour au tableau de bord</a>

            <button
              type="button"
              class="btn btn-primary"
              [disabled]="markAllLoading || unreadCount() === 0"
              (click)="markAllAsRead()"
            >
              {{ markAllLoading ? 'Traitement...' : 'Tout marquer comme lu' }}
            </button>
          </div>
        </div>

        <div class="hero-summary" *ngIf="!loading()">
          <div class="hero-summary-card hero-summary-card-accent">
            <span class="hero-summary-label">Total notifications</span>
            <strong class="hero-summary-value">
              {{ notifications().length }}
            </strong>
            <span class="hero-summary-help">Historique récent</span>
          </div>

          <div class="hero-summary-card">
            <span class="hero-summary-label">Non lues</span>
            <strong
              class="hero-summary-value"
              [ngClass]="getUnreadTextClass(unreadCount())"
            >
              {{ unreadCount() }}
            </strong>
            <span class="hero-summary-help">
              {{ unreadCount() > 0 ? 'Actions à consulter' : 'Tout est à jour' }}
            </span>
          </div>
        </div>
      </header>

      <section class="stats-grid" *ngIf="!loading() && !error()">
        <article class="stat-card">
          <span class="stat-label">Total</span>
          <strong class="stat-value">{{ notifications().length }}</strong>
        </article>

        <article class="stat-card">
          <span class="stat-label">Non lues</span>
          <strong class="stat-value" [ngClass]="getUnreadTextClass(unreadCount())">
            {{ unreadCount() }}
          </strong>
        </article>

        <article class="stat-card">
          <span class="stat-label">Lues</span>
          <strong class="stat-value">{{ readCount() }}</strong>
        </article>
      </section>

      <div *ngIf="loading()" class="state-card">
        <div class="state-title">Chargement des notifications...</div>
        <div class="state-text">Préparation de vos dernières alertes.</div>
      </div>

      <div *ngIf="error() && !loading()" class="state-card error">
        <div class="state-title">Impossible de charger les notifications</div>
        <div class="state-text">{{ error() }}</div>
      </div>

      <ng-container *ngIf="!loading() && !error()">
        <app-empty-state
          *ngIf="notifications().length === 0"
          icon="🔔"
          title="Aucune notification"
          description="Vos nouvelles notifications apparaîtront ici."
        />

        <div class="notifications-list" *ngIf="notifications().length > 0">
          <article
            class="notification-card"
            *ngFor="let notification of notifications()"
            [class.notification-read]="isRead(notification)"
            [class.notification-unread]="!isRead(notification)"
            (click)="openNotification(notification)"
          >
            <div class="notification-accent" [ngClass]="getTypeAccentClass(notification.type)"></div>

            <div class="notification-main">
              <div class="notification-top">
                <div class="notification-head">
                  <div class="title-row">
                    <h2>{{ notification.title }}</h2>

                    <span
                      class="status-badge"
                      [class.status-read]="isRead(notification)"
                      [class.status-unread]="!isRead(notification)"
                    >
                      {{ isRead(notification) ? 'Lu' : 'Non lu' }}
                    </span>
                  </div>

                  <p class="notification-body">
                    {{ notification.body }}
                  </p>
                </div>
              </div>

              <div class="notification-meta">
                <span class="type-pill" [ngClass]="getTypePillClass(notification.type)">
                  {{ formatType(notification.type) }}
                </span>
                <span>•</span>
                <span>{{ notification.createdAt | date:'medium' }}</span>
              </div>
            </div>

            <div class="notification-actions">
              <button
                type="button"
                class="btn btn-secondary"
                *ngIf="!isRead(notification)"
                (click)="markOneAsRead(notification, $event)"
              >
                Marquer comme lu
              </button>

              <button
                type="button"
                class="btn btn-primary"
                (click)="openNotification(notification, $event)"
              >
                Ouvrir
              </button>
            </div>
          </article>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      color: #111827;
    }

    .hero-card,
    .stat-card,
    .state-card,
    .notification-card {
      background: #ffffff;
      border: 1px solid #f3e8e2;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .hero-card {
      padding: 24px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.16), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.10), transparent 32%),
        linear-gradient(135deg, #fff7f2, #ffffff 58%);
    }

    .state-card,
    .notification-card {
      padding: 20px;
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .hero-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: flex-start;
    }

    .eyebrow {
      color: #ea580c;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hero-card h1 {
      margin: 8px 0 10px;
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #111827;
    }

    .subtitle {
      margin: 0;
      color: #4b5563;
      line-height: 1.7;
      max-width: 760px;
    }

    .back-link {
      text-decoration: none;
      color: #ea580c;
      font-weight: 700;
      white-space: nowrap;
      padding: 11px 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.82);
      border: 1px solid #f3dfd4;
    }

    .back-link:hover {
      color: #c2410c;
    }

    .hero-summary {
      margin-top: 22px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .hero-summary-card {
      border-radius: 22px;
      padding: 18px;
      border: 1px solid #f3e8e2;
      background: white;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .hero-summary-card-accent {
      background: linear-gradient(135deg, #fff1e8, #ffffff);
    }

    .hero-summary-label {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .hero-summary-value {
      font-size: 1.7rem;
      line-height: 1.15;
      color: #111827;
    }

    .hero-summary-help {
      color: #6b7280;
      font-size: 0.92rem;
    }

    .unread-count-low {
      color: #ea580c;
    }

    .unread-count-medium {
      color: #2563eb;
    }

    .unread-count-high {
      color: #b91c1c;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 120px;
      justify-content: center;
    }

    .stat-label {
      color: #6b7280;
      font-size: 14px;
    }

    .stat-value {
      font-size: 1.7rem;
      line-height: 1.2;
      color: #111827;
    }

    .state-card.error {
      border-color: #fecaca;
      background: #fff7f7;
    }

    .state-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .state-text {
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notification-card {
      display: grid;
      grid-template-columns: 6px minmax(0, 1fr) auto;
      gap: 18px;
      align-items: stretch;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      overflow: hidden;
    }

    .notification-card:hover {
      transform: translateY(-1px);
      border-color: #f3dfd4;
    }

    .notification-read {
      opacity: 0.9;
    }

    .notification-unread {
      box-shadow: 0 22px 55px rgba(255, 122, 89, 0.08);
    }

    .notification-accent {
      border-radius: 999px;
      min-height: 100%;
      background: #e5e7eb;
    }

    .accent-payment {
      background: linear-gradient(180deg, #2563eb, #60a5fa);
    }

    .accent-event {
      background: linear-gradient(180deg, #ff7a59, #ffb347);
    }

    .accent-contribution {
      background: linear-gradient(180deg, #7c3aed, #a78bfa);
    }

    .accent-default {
      background: linear-gradient(180deg, #6b7280, #9ca3af);
    }

    .notification-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .notification-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .notification-head {
      min-width: 0;
      width: 100%;
    }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 6px;
    }

    .title-row h2 {
      margin: 0;
      font-size: 1.1rem;
      color: #111827;
      line-height: 1.35;
    }

    .notification-body {
      margin: 0;
      color: #4b5563;
      line-height: 1.6;
    }

    .notification-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
      color: #6b7280;
      font-size: 13px;
      align-items: center;
    }

    .type-pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }

    .type-payment {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .type-event {
      background: #fff1eb;
      color: #e85d3e;
    }

    .type-contribution {
      background: #ede9fe;
      color: #6d28d9;
    }

    .type-default {
      background: #f3f4f6;
      color: #374151;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .status-unread {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .status-read {
      background: #e5e7eb;
      color: #374151;
    }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
      justify-content: center;
    }

    .btn {
      border: 0;
      border-radius: 14px;
      padding: 11px 16px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
      transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
      text-align: center;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 14px 28px rgba(255, 122, 89, 0.18);
    }

    .btn-secondary {
      background: #fff7f3;
      color: #9a3412;
      border: 1px solid #f3dfd4;
    }

    @media (max-width: 980px) {
      .hero-top,
      .hero-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .hero-summary {
        grid-template-columns: 1fr;
      }

      .notification-card {
        grid-template-columns: 6px 1fr;
      }

      .notification-actions {
        grid-column: 2;
        align-items: stretch;
      }

      .title-row {
        flex-direction: column;
        align-items: stretch;
      }
    }

    @media (max-width: 640px) {
      .hero-card,
      .stat-card,
      .state-card,
      .notification-card {
        border-radius: 20px;
      }

      .hero-card,
      .state-card,
      .notification-card {
        padding: 18px;
      }
    }
  `],
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly notificationCenter = inject(NotificationCenterService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly loading = this.notificationCenter.loading;
  readonly error = this.notificationCenter.error;
  readonly notifications = this.notificationCenter.notifications;
  readonly unreadCount = this.notificationCenter.unreadCount;
  readonly readCount = this.notificationCenter.readCount;

  markAllLoading = false;

  ngOnInit(): void {
    this.notificationCenter.loadNotifications(true);
  }

  isRead(notification: AppNotification): boolean {
    return this.notificationCenter.isRead(notification);
  }

  formatType(type: string | null | undefined): string {
    switch (type) {
      case 'PAYMENT':
        return 'Paiement';
      case 'EVENT':
        return 'Événement';
      case 'CONTRIBUTION':
        return 'Contribution';
      default:
        return type || 'Notification';
    }
  }

  getTypePillClass(type: string | null | undefined): string {
    switch (type) {
      case 'PAYMENT':
        return 'type-payment';
      case 'EVENT':
        return 'type-event';
      case 'CONTRIBUTION':
        return 'type-contribution';
      default:
        return 'type-default';
    }
  }

  getTypeAccentClass(type: string | null | undefined): string {
    switch (type) {
      case 'PAYMENT':
        return 'accent-payment';
      case 'EVENT':
        return 'accent-event';
      case 'CONTRIBUTION':
        return 'accent-contribution';
      default:
        return 'accent-default';
    }
  }

  getUnreadTextClass(count: number): string {
    if (count >= 10) return 'unread-count-high';
    if (count >= 4) return 'unread-count-medium';
    if (count >= 1) return 'unread-count-low';
    return '';
  }

  markOneAsRead(notification: AppNotification, event?: Event): void {
    event?.stopPropagation();

    if (this.isRead(notification)) {
      return;
    }

    this.notificationCenter.markOneAsReadLocally(notification.id);

    this.notificationsService.markAsRead(notification.id).subscribe({
      next: (updated) => {
        this.notificationCenter.replaceNotification(updated);
      },
      error: () => {
        this.notificationCenter.refreshAll();
        this.toastService.error('Impossible de marquer la notification comme lue.');
      },
    });
  }

  markAllAsRead(): void {
    if (!this.notifications().length || this.markAllLoading || this.unreadCount() === 0) {
      return;
    }

    this.markAllLoading = true;
    this.notificationCenter.markAllAsReadLocally();

    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.markAllLoading = false;
        this.toastService.success('Toutes les notifications ont été marquées comme lues.');
      },
      error: () => {
        this.markAllLoading = false;
        this.notificationCenter.refreshAll();
        this.toastService.error('Impossible de marquer toutes les notifications comme lues.');
      },
    });
  }

  openNotification(notification: AppNotification, event?: Event): void {
    event?.stopPropagation();

    const payload = notification.dataPayload as NotificationPayload | null;

    if (!this.isRead(notification)) {
      this.notificationCenter.markOneAsReadLocally(notification.id);

      this.notificationsService.markAsRead(notification.id).subscribe({
        next: (updated) => {
          this.notificationCenter.replaceNotification(updated);
          this.navigateFromPayload(payload);
        },
        error: () => {
          this.notificationCenter.refreshAll();
          this.navigateFromPayload(payload);
        },
      });

      return;
    }

    this.navigateFromPayload(payload);
  }

  private navigateFromPayload(payload: NotificationPayload | null): void {
    if (!payload) {
      return;
    }

    if (payload.paymentId) {
      this.router.navigate(['/app/payments', payload.paymentId]);
      return;
    }

    if (payload.eventId) {
      this.router.navigate(['/app/events', payload.eventId]);
      return;
    }

    if (payload.contributionId) {
      this.router.navigate(['/app/contributions']);
      return;
    }
  }
}