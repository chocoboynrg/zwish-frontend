import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpContext } from '@angular/common/http';

import { NotificationsService } from './notifications.service';
import { AppNotification } from '../models/notification.model';
import { SKIP_GLOBAL_ERROR_TOAST } from '../../../core/http/http-context-tokens';

@Injectable({
  providedIn: 'root',
})
export class NotificationCenterService {
  private readonly notificationsService = inject(NotificationsService);

  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);
  private readonly _error = signal('');
  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal(0);

  readonly loading = computed(() => this._loading());
  readonly loaded = computed(() => this._loaded());
  readonly error = computed(() => this._error());
  readonly notifications = computed(() => this._notifications());
  readonly unreadCount = computed(() => this._unreadCount());
  readonly readCount = computed(() =>
    this._notifications().filter((item) => this.isRead(item)).length,
  );

  loadUnreadCount(force = false): void {
    if (this._loading() && !force) {
      return;
    }

    this.notificationsService.getUnreadCount().subscribe({
      next: (result) => {
        this._unreadCount.set(Number(result?.unreadCount ?? 0));
      },
      error: () => {
        // ✅ Silencieux — pas de toast, pas de déconnexion
        // Un 401 ici = token pas encore prêt, on ignore
      },
    });
  }

  loadNotifications(force = false): void {
    if (this._loading() && !force) {
      return;
    }

    if (this._loaded() && !force) {
      return;
    }

    this._loading.set(true);
    this._error.set('');

    this.notificationsService.getMyNotifications().subscribe({
      next: (notifications) => {
        const safeNotifications = notifications ?? [];
        this._notifications.set(safeNotifications);
        this._unreadCount.set(
          safeNotifications.filter((item) => !this.isRead(item)).length,
        );
        this._loaded.set(true);
        this._loading.set(false);
      },
      error: () => {
        // ✅ Silencieux — pas de toast, pas de déconnexion
        this._loading.set(false);
      },
    });
  }

  refreshAll(): void {
    this.loadNotifications(true);
    this.loadUnreadCount(true);
  }

  setNotifications(notifications: AppNotification[]): void {
    const safeNotifications = notifications ?? [];
    this._notifications.set(safeNotifications);
    this._unreadCount.set(
      safeNotifications.filter((item) => !this.isRead(item)).length,
    );
    this._loaded.set(true);
    this._error.set('');
  }

  markOneAsReadLocally(notificationId: number): void {
    const beforeUnread = this._notifications().some(
      (item) => item.id === notificationId && !this.isRead(item),
    );

    this._notifications.update((items) =>
      items.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              status: 'READ',
              readAt: item.readAt ?? new Date().toISOString(),
            }
          : item,
      ),
    );

    if (beforeUnread) {
      this._unreadCount.update((count) => Math.max(0, count - 1));
    }
  }

  markAllAsReadLocally(): void {
    if (this._notifications().length > 0) {
      this._notifications.update((items) =>
        items.map((item) => ({
          ...item,
          status: 'READ',
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
    }

    this._unreadCount.set(0);
  }

  replaceNotification(updated: AppNotification): void {
    let unreadDelta = 0;

    this._notifications.update((items) =>
      items.map((item) => {
        if (item.id !== updated.id) {
          return item;
        }

        const wasUnread = !this.isRead(item);
        const isUnreadNow = !this.isRead(updated);

        if (wasUnread && !isUnreadNow) unreadDelta = -1;
        if (!wasUnread && isUnreadNow) unreadDelta = 1;

        return updated;
      }),
    );

    if (unreadDelta !== 0) {
      this._unreadCount.update((count) => Math.max(0, count + unreadDelta));
    }
  }

  isRead(notification: AppNotification): boolean {
    return notification.status === 'READ' || !!notification.readAt;
  }
}