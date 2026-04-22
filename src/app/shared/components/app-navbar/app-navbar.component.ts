import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  HostListener,
  Input,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationCenterService } from '../../../features/notifications/services/notification-center.service'; 
import { NotificationsService } from '../../../features/notifications/services/notifications.service';
import { AppNotification } from '../../../features/notifications/models/notification.model';

type PrimaryNavItem = {
  label: string;
  path: string;
  exact?: boolean;
};

type NotificationPayload = {
  paymentId?: number;
  eventId?: number;
  wishlistItemId?: number;
  contributionId?: number;
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="container topbar-inner">
        <a routerLink="/" class="brand" (click)="closeAllMenus()">
          <span class="brand-mark">Z</span>
          <span class="brand-text">ZWish</span>
        </a>

        <nav class="nav desktop-nav">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.path"
            [routerLinkActiveOptions]="{ exact: !!item.exact }"
            routerLinkActive="active"
          >
            {{ item.label }}
          </a>
        </nav>

        <div class="actions">
          <ng-container *ngIf="currentUser() as user; else guestActions">
            <div class="notification-menu desktop-notification-menu">
              <button
                type="button"
                class="notification-btn"
                [class.active]="notificationsMenuOpen() || isNotificationsActive()"
                aria-label="Voir les notifications"
                (click)="toggleNotificationsMenu($event)"
              >
                <svg viewBox="0 0 24 24" fill="none" class="notification-icon" aria-hidden="true">
                  <path
                    d="M15 18H9M18 16V11C18 7.68629 15.3137 5 12 5C8.68629 5 6 7.68629 6 11V16L4.5 17.5V18H19.5V17.5L18 16Z"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <span
                  *ngIf="unreadCount() > 0"
                  class="notification-badge"
                  [ngClass]="getUnreadBadgeClass(unreadCount())"
                >
                  {{ formatUnreadCount(unreadCount()) }}
                </span>
              </button>

              <div class="dropdown notifications-dropdown" *ngIf="notificationsMenuOpen()">
                <div class="dropdown-title-row">
                  <div>
                    <div class="dropdown-title">Notifications</div>
                    <div class="dropdown-subtitle">
                      {{ unreadCount() > 0 ? unreadCount() + ' non lue(s)' : 'Tout est à jour' }}
                    </div>
                  </div>

                  <button
                    type="button"
                    class="mark-read-link"
                    [disabled]="markAllLoading || unreadCount() === 0"
                    (click)="markAllAsReadFromNavbar($event)"
                  >
                    {{ markAllLoading ? '...' : 'Tout lire' }}
                  </button>
                </div>

                <div class="notifications-preview" *ngIf="latestNotifications().length > 0; else noNotifications">
                  <button
                    type="button"
                    class="notification-preview-card"
                    *ngFor="let notification of latestNotifications()"
                    [class.preview-read]="isRead(notification)"
                    (click)="openNotificationFromNavbar(notification, $event)"
                  >
                    <div
                      class="preview-accent"
                      [ngClass]="getTypeAccentClass(notification.type)"
                    ></div>

                    <div class="preview-content">
                      <div class="preview-top">
                        <strong class="preview-title">{{ notification.title }}</strong>
                        <span
                          class="mini-status"
                          [class.status-read]="isRead(notification)"
                          [class.status-unread]="!isRead(notification)"
                        >
                          {{ isRead(notification) ? 'Lu' : 'Nouveau' }}
                        </span>
                      </div>

                      <p class="preview-body">{{ notification.body }}</p>

                      <div class="preview-meta">
                        <span class="type-pill" [ngClass]="getTypePillClass(notification.type)">
                          {{ formatType(notification.type) }}
                        </span>
                        <span>{{ notification.createdAt | date:'short' }}</span>
                      </div>
                    </div>
                  </button>
                </div>

                <ng-template #noNotifications>
                  <div class="dropdown-empty">
                    <div class="dropdown-empty-icon">🔔</div>
                    <div class="dropdown-empty-title">Aucune notification</div>
                    <div class="dropdown-empty-text">
                      Vos nouvelles notifications apparaîtront ici.
                    </div>
                  </div>
                </ng-template>

                <div class="dropdown-footer">
                  <a routerLink="/app/notifications" (click)="closeAllMenus()">
                    Voir toutes les notifications
                  </a>
                </div>
              </div>
            </div>

            <div class="user-menu desktop-user-menu">
              <button type="button" class="user-trigger" (click)="toggleUserMenu($event)">
                <div class="avatar">{{ getInitials(user.name) }}</div>

                <div class="user-meta">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-role">{{ getRoleLabel(user.platformRole) }}</span>
                </div>

                <span class="caret">▾</span>
              </button>

              <div class="dropdown" *ngIf="userMenuOpen()">
                <div class="dropdown-head">
                  <div class="avatar large">{{ getInitials(user.name) }}</div>
                  <div>
                    <div class="dropdown-name">{{ user.name }}</div>
                    <div class="dropdown-email">{{ user.email }}</div>
                  </div>
                </div>

                <div class="dropdown-links">
                  <a routerLink="/app" (click)="closeAllMenus()">Mon espace</a>
                  <a routerLink="/app/notifications" (click)="closeAllMenus()">
                    Notifications
                    <span
                      *ngIf="unreadCount() > 0"
                      class="inline-badge"
                      [ngClass]="getUnreadBadgeClass(unreadCount())"
                    >
                      {{ formatUnreadCount(unreadCount()) }}
                    </span>
                  </a>
                  <a routerLink="/" (click)="closeAllMenus()">Accueil</a>
                  <a routerLink="/catalog" (click)="closeAllMenus()">Catalogue</a>
                  <a routerLink="/how-it-works" (click)="closeAllMenus()">Comment ça marche</a>
                  <a *ngIf="isAdmin()" routerLink="/admin" (click)="closeAllMenus()">Admin</a>
                </div>

                <button type="button" class="dropdown-logout" (click)="logout()">
                  Déconnexion
                </button>
              </div>
            </div>
          </ng-container>

          <ng-template #guestActions>
            <div class="desktop-guest-actions">
              <a routerLink="/login" class="btn btn-ghost">Connexion</a>
              <a routerLink="/app/events/new" class="btn btn-primary">
                Créer un événement
              </a>
            </div>
          </ng-template>

          <button
            type="button"
            class="hamburger"
            [class.active]="mobileMenuOpen()"
            (click)="toggleMobileMenu($event)"
            aria-label="Ouvrir le menu"
            [attr.aria-expanded]="mobileMenuOpen()"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>

    <div
      class="mobile-overlay"
      *ngIf="mobileMenuOpen()"
      (click)="closeAllMenus()"
    ></div>

    <aside class="mobile-drawer" [class.open]="mobileMenuOpen()">
      <div class="mobile-drawer-inner">
        <div class="mobile-drawer-head">
          <div class="mobile-brand">
            <span class="brand-mark">Z</span>
            <span class="brand-text">ZWish</span>
          </div>

          <button type="button" class="mobile-close" (click)="closeAllMenus()">
            ✕
          </button>
        </div>

        <nav class="mobile-links">
          <a
            *ngFor="let item of mobileNavItems()"
            [routerLink]="item.path"
            [class.active]="isMobileActive(item.path, !!item.exact)"
            (click)="closeAllMenus()"
          >
            <span>{{ item.label }}</span>

            <span
              *ngIf="item.path === '/app/notifications' && unreadCount() > 0"
              class="mobile-notification-badge"
              [ngClass]="getUnreadBadgeClass(unreadCount())"
            >
              {{ formatUnreadCount(unreadCount()) }}
            </span>
          </a>

          <ng-container *ngIf="!isAuthenticated(); else mobileAuthLinks">
            <a
              routerLink="/login"
              [class.active]="isMobileActive('/login', true)"
              (click)="closeAllMenus()"
            >
              Connexion
            </a>
            <a
              routerLink="/app/events/new"
              [class.active]="isMobileActive('/app/events/new', true)"
              (click)="closeAllMenus()"
            >
              Créer un événement
            </a>
          </ng-container>

          <ng-template #mobileAuthLinks>
            <a
              *ngIf="isAdmin()"
              routerLink="/admin"
              [class.active]="isMobileActive('/admin')"
              (click)="closeAllMenus()"
            >
              Admin
            </a>
            <button type="button" class="mobile-logout" (click)="logout()">Déconnexion</button>
          </ng-template>
        </nav>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
    }

    .container {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(255, 250, 248, 0.88);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid #f1e7e3;
    }

    .topbar-inner {
      min-height: 74px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }

    .brand,
    .mobile-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
      font-weight: 800;
      font-size: 1.16rem;
      white-space: nowrap;
    }

    .brand-mark {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 900;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
      flex-shrink: 0;
    }

    .nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      flex: 1;
      flex-wrap: wrap;
    }

    .nav a {
      text-decoration: none;
      color: #4b5563;
      font-weight: 600;
      transition: 0.2s ease;
    }

    .nav a:hover,
    .nav a.active {
      color: #ff7a59;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      position: relative;
    }

    .desktop-guest-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 10px 16px;
      text-decoration: none;
      font-weight: 700;
      border: 1px solid transparent;
      cursor: pointer;
      transition: 0.2s ease;
      font: inherit;
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
    }

    .btn-ghost {
      background: white;
      color: #374151;
      border-color: #eadfd9;
    }

    .notification-menu,
    .user-menu {
      position: relative;
    }

    .notification-btn {
      position: relative;
      width: 46px;
      height: 46px;
      border-radius: 14px;
      border: 1px solid #eadfd9;
      background: white;
      color: #374151;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: 0.2s ease;
      flex-shrink: 0;
      cursor: pointer;
    }

    .notification-btn:hover,
    .notification-btn.active {
      border-color: #f3dfd4;
      background: #fff7f3;
      color: #ea580c;
    }

    .notification-icon {
      width: 21px;
      height: 21px;
    }

    .notification-badge,
    .mobile-notification-badge,
    .inline-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 7px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      line-height: 1;
      color: white;
    }

    .notification-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      box-shadow: 0 8px 18px rgba(17, 24, 39, 0.16);
    }

    .badge-low {
      background: #f59e0b;
    }

    .badge-medium {
      background: #2563eb;
    }

    .badge-high {
      background: #dc2626;
    }

    .user-trigger {
      border: 1px solid #eadfd9;
      background: white;
      border-radius: 999px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font: inherit;
      min-height: 50px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 800;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .avatar.large {
      width: 44px;
      height: 44px;
      font-size: 1rem;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 0;
    }

    .user-name {
      font-weight: 700;
      color: #111827;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-role {
      font-size: 0.78rem;
      color: #6b7280;
    }

    .caret {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 300px;
      background: white;
      border: 1px solid #f0e5df;
      border-radius: 20px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.12);
      padding: 14px;
      z-index: 60;
      animation: dropdownFade 180ms ease;
      transform-origin: top right;
    }

    .notifications-dropdown {
      width: 380px;
      padding: 12px;
    }

    .dropdown-head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f3ece8;
      margin-bottom: 12px;
    }

    .dropdown-name,
    .dropdown-title {
      font-weight: 700;
      color: #111827;
    }

    .dropdown-email,
    .dropdown-subtitle {
      color: #6b7280;
      font-size: 0.86rem;
      word-break: break-word;
    }

    .dropdown-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      padding: 4px 4px 12px;
      border-bottom: 1px solid #f3ece8;
      margin-bottom: 12px;
    }

    .mark-read-link {
      border: 0;
      background: transparent;
      color: #ea580c;
      font-weight: 700;
      cursor: pointer;
      font: inherit;
      padding: 0;
    }

    .mark-read-link:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .notifications-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 360px;
      overflow: auto;
      padding-right: 2px;
    }

    .notification-preview-card {
      width: 100%;
      border: 1px solid #f3e8e2;
      background: #fffdfc;
      border-radius: 16px;
      padding: 12px;
      display: grid;
      grid-template-columns: 5px minmax(0, 1fr);
      gap: 12px;
      text-align: left;
      cursor: pointer;
      transition: 0.18s ease;
    }

    .notification-preview-card:hover {
      background: #fff7f3;
      border-color: #f3dfd4;
    }

    .preview-read {
      opacity: 0.9;
    }

    .preview-accent {
      border-radius: 999px;
      background: #e5e7eb;
      min-height: 100%;
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

    .preview-content {
      min-width: 0;
    }

    .preview-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: flex-start;
      margin-bottom: 6px;
    }

    .preview-title {
      color: #111827;
      line-height: 1.35;
      font-size: 0.95rem;
    }

    .preview-body {
      margin: 0 0 10px;
      color: #4b5563;
      font-size: 0.9rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .preview-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      color: #6b7280;
      font-size: 12px;
      align-items: center;
    }

    .type-pill {
      display: inline-flex;
      align-items: center;
      padding: 5px 9px;
      border-radius: 999px;
      font-size: 11px;
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

    .mini-status {
      display: inline-flex;
      align-items: center;
      padding: 5px 8px;
      border-radius: 999px;
      font-size: 11px;
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

    .dropdown-empty {
      padding: 18px 10px;
      text-align: center;
      color: #6b7280;
    }

    .dropdown-empty-icon {
      font-size: 1.4rem;
      margin-bottom: 8px;
    }

    .dropdown-empty-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .dropdown-empty-text {
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .dropdown-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f3ece8;
    }

    .dropdown-footer a {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px 12px;
      text-decoration: none;
      color: #ea580c;
      font-weight: 700;
      border-radius: 12px;
      background: #fff7f3;
    }

    .dropdown-links {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
    }

    .dropdown-links a {
      text-decoration: none;
      color: #374151;
      font-weight: 600;
      padding: 10px 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .dropdown-links a:hover {
      background: #fff7f3;
      color: #ff7a59;
    }

    .dropdown-logout,
    .mobile-logout {
      width: 100%;
      border: 0;
      border-radius: 12px;
      padding: 12px 14px;
      background: #111827;
      color: white;
      font-weight: 700;
      cursor: pointer;
      font: inherit;
      text-align: left;
    }

    .hamburger {
      display: none;
      border: 1px solid #eadfd9;
      background: white;
      border-radius: 12px;
      width: 46px;
      height: 46px;
      cursor: pointer;
      padding: 0;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 5px;
    }

    .hamburger span {
      display: block;
      width: 18px;
      height: 2px;
      border-radius: 999px;
      background: #374151;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .hamburger.active span:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }

    .hamburger.active span:nth-child(2) {
      opacity: 0;
    }

    .hamburger.active span:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    .mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.34);
      backdrop-filter: blur(2px);
      z-index: 48;
      animation: overlayFade 180ms ease;
    }

    .mobile-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: min(360px, calc(100vw - 24px));
      height: 100vh;
      background: white;
      border-left: 1px solid #f0e5df;
      box-shadow: -20px 0 60px rgba(17, 24, 39, 0.16);
      z-index: 49;
      transform: translateX(100%);
      transition: transform 220ms ease;
      overflow: auto;
    }

    .mobile-drawer.open {
      transform: translateX(0);
    }

    .mobile-drawer-inner {
      padding: 18px 18px 24px;
    }

    .mobile-drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
    }

    .mobile-close {
      width: 42px;
      height: 42px;
      border: 1px solid #eadfd9;
      background: white;
      border-radius: 12px;
      cursor: pointer;
      font: inherit;
    }

    .mobile-links {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .mobile-links a,
    .mobile-logout {
      text-decoration: none;
      color: #374151;
      font-weight: 600;
      padding: 13px 14px;
      border: 0;
      background: transparent;
      font: inherit;
      cursor: pointer;
      border-radius: 14px;
      transition: 0.18s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .mobile-links a.active {
      background: #fff3ee;
      color: #ff7a59;
    }

    .mobile-links a:hover {
      background: #fff7f3;
      color: #ff7a59;
    }

    @keyframes overlayFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes dropdownFade {
      from {
        opacity: 0;
        transform: translateY(-6px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 980px) {
      .desktop-nav,
      .desktop-guest-actions,
      .desktop-user-menu,
      .desktop-notification-menu {
        display: none;
      }

      .hamburger {
        display: inline-flex;
      }
    }
  `],
})
export class AppNavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationCenter = inject(NotificationCenterService);
  private readonly notificationsService = inject(NotificationsService);

  @Input() navItems: PrimaryNavItem[] = [];
  @Input() mobileExtraItems: PrimaryNavItem[] = [];

  readonly currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.getCurrentUserSnapshot(),
  });

  readonly unreadCount = this.notificationCenter.unreadCount;
  readonly notifications = this.notificationCenter.notifications;
  readonly latestNotifications = computed(() => this.notifications().slice(0, 5));

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => {
    const user = this.currentUser();
    return user?.platformRole === 'ADMIN' || user?.platformRole === 'SUPER_ADMIN';
  });

  readonly userMenuOpen = signal(false);
  readonly notificationsMenuOpen = signal(false);
  readonly mobileMenuOpen = signal(false);

  readonly mobileNavItems = computed(() => [...this.navItems, ...this.mobileExtraItems]);

  markAllLoading = false;

  constructor() {
    effect(() => {
      document.body.style.overflow = this.mobileMenuOpen() ? 'hidden' : '';
    });

    effect(() => {
      if (this.isAuthenticated()) {
        this.notificationCenter.loadUnreadCount();
        this.notificationCenter.loadNotifications();
      }
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeAllMenus();
      });
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.notificationsMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.userMenuOpen.update((value) => !value);
  }

  toggleNotificationsMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.notificationsMenuOpen.update((value) => !value);
    if (this.notificationsMenuOpen()) {
      this.notificationCenter.loadNotifications(true);
    }
  }

  toggleMobileMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.set(false);
    this.notificationsMenuOpen.set(false);
    this.mobileMenuOpen.update((value) => !value);
  }

  closeAllMenus(): void {
    this.userMenuOpen.set(false);
    this.notificationsMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
  }

  isMobileActive(path: string, exact = false): boolean {
    if (exact) {
      return this.router.url === path;
    }
    return this.router.url.startsWith(path);
  }

  isNotificationsActive(): boolean {
    return this.router.url.startsWith('/app/notifications');
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

  openNotificationFromNavbar(notification: AppNotification, event?: Event): void {
    event?.stopPropagation();

    const payload = notification.dataPayload as NotificationPayload | null;

    if (!this.isRead(notification)) {
      this.notificationCenter.markOneAsReadLocally(notification.id);

      this.notificationsService.markAsRead(notification.id).subscribe({
        next: (updated) => {
          this.notificationCenter.replaceNotification(updated);
          this.navigateFromPayload(payload);
          this.closeAllMenus();
        },
        error: () => {
          this.notificationCenter.refreshAll();
          this.navigateFromPayload(payload);
          this.closeAllMenus();
        },
      });

      return;
    }

    this.navigateFromPayload(payload);
    this.closeAllMenus();
  }

  markAllAsReadFromNavbar(event?: Event): void {
    event?.stopPropagation();

    if (this.markAllLoading || this.unreadCount() === 0) {
      return;
    }

    this.markAllLoading = true;
    this.notificationCenter.markAllAsReadLocally();

    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.markAllLoading = false;
      },
      error: () => {
        this.markAllLoading = false;
        this.notificationCenter.refreshAll();
      },
    });
  }

  private navigateFromPayload(payload: NotificationPayload | null): void {
    if (!payload) {
      this.router.navigate(['/app/notifications']);
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

    this.router.navigate(['/app/notifications']);
  }

  formatUnreadCount(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  getUnreadBadgeClass(count: number): string {
    if (count >= 10) return 'badge-high';
    if (count >= 4) return 'badge-medium';
    return 'badge-low';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAllMenus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAllMenus();
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return 'ZU';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  getRoleLabel(role: string | null | undefined): string {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super admin';
      case 'ADMIN':
        return 'Admin';
      case 'USER':
        return 'Utilisateur';
      default:
        return 'Compte';
    }
  }

  logout(): void {
    this.closeAllMenus();
    this.authService.logout();
    this.router.navigateByUrl('/');
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}