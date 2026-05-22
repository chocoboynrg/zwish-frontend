import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal, HostListener, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { NotificationCenterService } from '../features/notifications/services/notification-center.service';
import { NotificationsService } from '../features/notifications/services/notifications.service';
import { AppNotification } from '../features/notifications/models/notification.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="shell">
      <!-- TOPBAR -->
      <header class="topbar" [class.scrolled]="scrolled()">
        <div class="topbar-inner">
          <!-- Logo -->
          <a routerLink="/" class="topbar-logo"><span class="z">Z</span>Wish</a>

          <!-- Nav principale (desktop) -->
          <nav class="topbar-nav">
            <a
              routerLink="/app"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
            >
              <lucide-icon name="home" [size]="16" color="currentColor" [strokeWidth]="1.8" />
              Dashboard
            </a>
            <a routerLink="/app/events" routerLinkActive="active">
              <lucide-icon name="calendar" [size]="16" color="currentColor" [strokeWidth]="1.8" />
              Mes événements
            </a>
            <a routerLink="/app/contributions" routerLinkActive="active">
              <lucide-icon name="star" [size]="16" color="currentColor" [strokeWidth]="1.8" />
              Contributions
            </a>
            <a routerLink="/app/jackpot" routerLinkActive="active">
              <lucide-icon name="package" [size]="16" color="currentColor" [strokeWidth]="1.8" />
              Mes cagnottes
            </a>
            <a routerLink="/catalog" routerLinkActive="active">
              <lucide-icon name="package" [size]="16" color="currentColor" [strokeWidth]="1.8" />
              Catalogue
            </a>
          </nav>

          <!-- Actions droite -->
          <div class="topbar-actions">
            <!-- Notifications dropdown -->
            <div class="notif-menu">
              <button
                class="action-btn notif-btn"
                (click)="toggleNotif()"
                [class.active]="notifOpen()"
              >
                <lucide-icon name="bell" [size]="20" color="currentColor" [strokeWidth]="1.8" />
                @if (unreadCount() > 0) {
                  <span class="notif-badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
                }
              </button>

              <!-- Dropdown preview -->
              @if (notifOpen()) {
                <div class="notif-dropdown" (click)="$event.stopPropagation()">
                  <div class="notif-drop-header">
                    <div>
                      <div class="notif-drop-title">Notifications</div>
                      <div class="notif-drop-sub">
                        {{ unreadCount() > 0 ? unreadCount() + ' non lue(s)' : 'Tout est à jour' }}
                      </div>
                    </div>
                    <button
                      class="btn-mark-all-sm"
                      [disabled]="markAllLoading || unreadCount() === 0"
                      (click)="markAllRead()"
                    >
                      {{ markAllLoading ? '...' : 'Tout lire' }}
                    </button>
                  </div>
                  @if (latestNotifications().length > 0) {
                    <div class="notif-drop-list">
                      @for (n of latestNotifications(); track n) {
                        <button
                          class="notif-preview-item"
                          [class.notif-preview-read]="isRead(n)"
                          (click)="openNotif(n)"
                        >
                          <div
                            class="notif-preview-accent"
                            [ngClass]="getAccentClass(n.type)"
                          ></div>
                          <div class="notif-preview-body">
                            <div class="notif-preview-top">
                              <span class="notif-preview-title">{{ n.title }}</span>
                              <span class="notif-preview-status" [class.status-unread]="!isRead(n)">
                                {{ isRead(n) ? 'Lu' : 'Nouveau' }}
                              </span>
                            </div>
                            @if (n.body) {
                              <div class="notif-preview-text">
                                {{ n.body | slice: 0 : 80 }}{{ n.body.length > 80 ? '…' : '' }}
                              </div>
                            }
                            <div class="notif-preview-date">
                              {{ n.createdAt | date: 'dd MMM HH:mm' }}
                            </div>
                          </div>
                        </button>
                      }
                    </div>
                  }
                  @if (latestNotifications().length === 0) {
                    <div class="notif-drop-empty">
                      <div>🔔</div>
                      <span>Aucune notification</span>
                    </div>
                  }
                  <a
                    routerLink="/app/notifications"
                    class="notif-drop-footer"
                    (click)="notifOpen.set(false)"
                  >
                    Voir toutes les notifications →
                  </a>
                </div>
              }
            </div>

            <!-- Créer un événement -->
            <a routerLink="/app/events/new" class="btn-new-event">
              <lucide-icon name="plus" [size]="14" color="currentColor" [strokeWidth]="2" />
              Créer
            </a>

            <!-- Avatar -->
            <div
              class="avatar-wrap"
              (click)="profileOpen.set(!profileOpen())"
              [class.open]="profileOpen()"
            >
              <div class="avatar">{{ getInitials(currentUser()?.name ?? '') }}</div>
              <lucide-icon name="chevron-down" [size]="14" color="currentColor" [strokeWidth]="1.8" class="avatar-chevron" />

              <!-- Dropdown profil -->
              @if (profileOpen()) {
                <div class="profile-dropdown">
                  <div class="dropdown-user">
                    <div class="dropdown-avatar">{{ getInitials(currentUser()?.name ?? '') }}</div>
                    <div>
                      <div class="dropdown-name">{{ currentUser()?.name }}</div>
                      <div class="dropdown-email">{{ currentUser()?.email }}</div>
                    </div>
                  </div>
                  <div class="dropdown-sep"></div>
                  <a routerLink="/app" class="dropdown-item" (click)="profileOpen.set(false)">
                    <lucide-icon name="home" [size]="16" color="currentColor" [strokeWidth]="1.8" />
                    Dashboard
                  </a>
                  <a
                    routerLink="/app/events"
                    class="dropdown-item"
                    (click)="profileOpen.set(false)"
                  >
                    <lucide-icon name="calendar" [size]="16" color="currentColor" [strokeWidth]="1.8" />
                    Mes événements
                  </a>
                  @if (isAdmin()) {
                    <a
                      routerLink="/admin"
                      class="dropdown-item dropdown-admin"
                      (click)="profileOpen.set(false)"
                    >
                      <lucide-icon name="settings" [size]="16" color="currentColor" [strokeWidth]="1.8" />
                      Espace Admin
                    </a>
                  }
                  <a
                    routerLink="/app/reservations"
                    class="dropdown-item"
                    (click)="profileOpen.set(false)"
                  >
                    <lucide-icon name="file-text" [size]="16" color="currentColor" [strokeWidth]="1.8" />
                    Mes réservations
                  </a>
                  <a
                    routerLink="/app/profile"
                    class="dropdown-item"
                    (click)="profileOpen.set(false)"
                  >
                    <lucide-icon name="user" [size]="16" color="currentColor" [strokeWidth]="1.8" />
                    Mon profil
                  </a>
                  <div class="dropdown-sep"></div>
                  <button class="dropdown-item dropdown-logout" (click)="logout()">
                    <lucide-icon name="log-out" [size]="16" color="currentColor" [strokeWidth]="1.8" />
                    Se déconnecter
                  </button>
                </div>
              }
            </div>

            <!-- Hamburger mobile -->
            <button class="hamburger" (click)="mobileOpen.set(!mobileOpen())">
              <span [class.open]="mobileOpen()"></span>
              <span [class.open]="mobileOpen()"></span>
              <span [class.open]="mobileOpen()"></span>
            </button>
          </div>
        </div>

        <!-- Mobile nav -->
        <div class="mobile-nav" [class.open]="mobileOpen()">
          <a routerLink="/app" (click)="mobileOpen.set(false)">Dashboard</a>
          <a routerLink="/app/events" (click)="mobileOpen.set(false)">Mes événements</a>
          <a routerLink="/app/contributions" (click)="mobileOpen.set(false)">Contributions</a>
          <a routerLink="/app/reservations" (click)="mobileOpen.set(false)">Réservations</a>
          <a routerLink="/catalog" (click)="mobileOpen.set(false)">Catalogue</a>
          <a routerLink="/app/profile" (click)="mobileOpen.set(false)">Mon profil</a>
          <div class="mobile-sep"></div>
          <a routerLink="/app/events/new" class="mobile-cta" (click)="mobileOpen.set(false)"
            >+ Créer un événement</a
          >
          <button class="mobile-logout" (click)="logout()">Se déconnecter</button>
        </div>
      </header>

      <!-- Overlay profil + notif -->
      @if (profileOpen() || notifOpen()) {
        <div class="overlay" (click)="profileOpen.set(false); notifOpen.set(false)"></div>
      }

      <!-- MAIN CONTENT -->
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .shell {
        min-height: 100vh;
        background: #f9fafb;
      }

      /* TOPBAR */
      .topbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid #f3f4f6;
        transition: box-shadow 0.3s;
      }
      .topbar.scrolled {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
      .topbar-inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
        height: 64px;
        display: flex;
        align-items: center;
        gap: 32px;
      }

      .topbar-logo {
        font-size: 1.3rem;
        font-weight: 900;
        color: #111;
        text-decoration: none;
        letter-spacing: -0.02em;
        flex-shrink: 0;
      }
      .z {
        color: #ffd700;
      }

      .topbar-nav {
        display: flex;
        gap: 4px;
        flex: 1;
      }
      .topbar-nav a {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 10px;
        color: #6b7280;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
        transition: 0.15s;
        white-space: nowrap;
      }
      .topbar-nav a:hover {
        background: #f3f4f6;
        color: #111;
      }
      .topbar-nav a.active {
        background: #111;
        color: white;
      }
      .topbar-nav a.active svg {
        stroke: white;
      }

      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .action-btn {
        width: 40px;
        height: 40px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #374151;
        position: relative;
        transition: 0.15s;
      }
      .action-btn:hover {
        background: #f9fafb;
      }
      .action-btn.active {
        background: #f3f4f6;
        border-color: #d1d5db;
      }
      .notif-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 18px;
        height: 18px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        font-size: 0.65rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
      }

      /* Dropdown notifications */
      .notif-menu {
        position: relative;
      }
      .notif-dropdown {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 360px;
        z-index: 300;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        animation: dropFade 0.15s ease;
      }
      @keyframes dropFade {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .notif-drop-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid #f3f4f6;
      }
      .notif-drop-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111;
      }
      .notif-drop-sub {
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 2px;
      }
      .btn-mark-all-sm {
        padding: 5px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 7px;
        background: white;
        color: #6b7280;
        font: inherit;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.15s;
        white-space: nowrap;
      }
      .btn-mark-all-sm:hover:not(:disabled) {
        border-color: #111;
        color: #111;
      }
      .btn-mark-all-sm:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .notif-drop-list {
        display: flex;
        flex-direction: column;
        max-height: 320px;
        overflow-y: auto;
      }
      .notif-preview-item {
        display: flex;
        align-items: stretch;
        border: 0;
        background: white;
        cursor: pointer;
        text-align: left;
        border-bottom: 1px solid #f9fafb;
        transition: 0.15s;
        width: 100%;
      }
      .notif-preview-item:hover {
        background: #f9fafb;
      }
      .notif-preview-read {
        opacity: 0.6;
      }
      .notif-preview-accent {
        width: 3px;
        flex-shrink: 0;
      }
      .accent-payment {
        background: #6366f1;
      }
      .accent-event {
        background: #22c55e;
      }
      .accent-contribution {
        background: #ffd700;
      }
      .accent-default {
        background: #e5e7eb;
      }
      .notif-preview-body {
        flex: 1;
        padding: 11px 14px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .notif-preview-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .notif-preview-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #111;
        line-height: 1.3;
        flex: 1;
      }
      .notif-preview-status {
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 999px;
        background: #f3f4f6;
        color: #9ca3af;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .status-unread {
        background: #fef3c7;
        color: #92400e;
      }
      .notif-preview-text {
        font-size: 0.75rem;
        color: #6b7280;
        line-height: 1.4;
      }
      .notif-preview-date {
        font-size: 0.68rem;
        color: #d1d5db;
      }
      .notif-drop-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 32px;
        color: #9ca3af;
        font-size: 0.85rem;
      }
      .notif-drop-empty div {
        font-size: 2rem;
      }
      .notif-drop-footer {
        display: block;
        padding: 12px 18px;
        border-top: 1px solid #f3f4f6;
        text-align: center;
        font-size: 0.82rem;
        font-weight: 700;
        color: #6b7280;
        text-decoration: none;
        transition: 0.15s;
      }
      .notif-drop-footer:hover {
        color: #111;
        background: #f9fafb;
      }

      .btn-new-event {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 9px 16px;
        background: #ffd700;
        color: #000;
        border-radius: 10px;
        font: inherit;
        font-size: 0.85rem;
        font-weight: 800;
        text-decoration: none;
        transition: 0.2s;
      }
      .btn-new-event:hover {
        background: #ffc000;
      }

      .avatar-wrap {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        padding: 4px;
        border-radius: 10px;
        transition: 0.15s;
        user-select: none;
      }
      .avatar-wrap:hover {
        background: #f3f4f6;
      }
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #111;
        color: white;
        font-weight: 800;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .avatar-chevron {
        color: #6b7280;
        flex-shrink: 0;
      }

      .profile-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 240px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        z-index: 200;
      }
      .dropdown-user {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
      }
      .dropdown-avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: #111;
        color: white;
        font-weight: 800;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .dropdown-name {
        font-weight: 700;
        color: #111;
        font-size: 0.9rem;
      }
      .dropdown-email {
        color: #9ca3af;
        font-size: 0.78rem;
      }
      .dropdown-sep {
        height: 1px;
        background: #f3f4f6;
      }
      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 16px;
        color: #374151;
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 500;
        transition: 0.15s;
      }
      .dropdown-item:hover {
        background: #f9fafb;
        color: #111;
      }
      .dropdown-admin {
        color: #6366f1 !important;
        font-weight: 700 !important;
      }
      .dropdown-admin:hover {
        background: #ede9fe !important;
      }
      .dropdown-logout {
        background: 0;
        border: 0;
        width: 100%;
        text-align: left;
        cursor: pointer;
        font: inherit;
        color: #ef4444 !important;
      }
      .dropdown-logout:hover {
        background: #fef2f2 !important;
      }

      .hamburger {
        display: none;
        flex-direction: column;
        gap: 5px;
        background: 0;
        border: 0;
        cursor: pointer;
        padding: 6px;
      }
      .hamburger span {
        display: block;
        width: 22px;
        height: 2px;
        background: #374151;
        transition: 0.3s;
        border-radius: 1px;
      }
      .hamburger span.open:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      .hamburger span.open:nth-child(2) {
        opacity: 0;
      }
      .hamburger span.open:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }

      .mobile-nav {
        display: none;
        flex-direction: column;
        border-top: 1px solid #f3f4f6;
        background: white;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s;
      }
      .mobile-nav.open {
        max-height: 500px;
      }
      .mobile-nav a {
        padding: 14px 24px;
        color: #374151;
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid #f9fafb;
      }
      .mobile-nav a:hover {
        background: #f9fafb;
      }
      .mobile-sep {
        height: 1px;
        background: #f3f4f6;
        margin: 4px 0;
      }
      .mobile-cta {
        background: #ffd700;
        color: #000 !important;
        font-weight: 800 !important;
        margin: 8px 16px;
        border-radius: 10px;
        text-align: center;
      }
      .mobile-logout {
        background: 0;
        border: 0;
        width: 100%;
        text-align: left;
        padding: 14px 24px;
        color: #ef4444;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .overlay {
        position: fixed;
        inset: 0;
        z-index: 99;
      }

      /* MAIN */
      .app-main {
        padding-top: 64px;
        min-height: 100vh;
      }

      @media (max-width: 900px) {
        .topbar-nav {
          display: none;
        }
        .btn-new-event span {
          display: none;
        }
        .hamburger {
          display: flex;
        }
        .mobile-nav {
          display: flex;
        }
      }
      @media (max-width: 480px) {
        .btn-new-event {
          padding: 9px 12px;
        }
      }
    `,
  ],
})
export class UserLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifCenter = inject(NotificationCenterService);
  private readonly notifService = inject(NotificationsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser = toSignal(this.auth.currentUser$);
  readonly isAdmin = computed(() => {
    const r = this.currentUser()?.platformRole;
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  });
  readonly unreadCount = this.notifCenter.unreadCount;
  readonly latestNotifications = computed(() => this.notifCenter.notifications().slice(0, 5));

  readonly scrolled = signal(false);
  readonly profileOpen = signal(false);
  readonly notifOpen = signal(false);
  readonly mobileOpen = signal(false);
  markAllLoading = false;

  ngOnInit(): void {
    // Chargement initial
    this.notifCenter.loadUnreadCount();
    this.notifCenter.loadNotifications();

    // Rafraîchissement automatique toutes les 60 secondes
    timer(60_000, 60_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.notifCenter.loadUnreadCount());
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 10);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isRead(n: AppNotification): boolean {
    return this.notifCenter.isRead(n);
  }

  getAccentClass(type: string | null | undefined): string {
    const m: Record<string, string> = {
      PAYMENT: 'accent-payment',
      EVENT: 'accent-event',
      CONTRIBUTION: 'accent-contribution',
    };
    return m[type ?? ''] ?? 'accent-default';
  }

  toggleNotif(): void {
    const opening = !this.notifOpen();
    this.notifOpen.set(opening);
    if (opening) {
      this.notifCenter.loadNotifications(true);
    }
  }

  openNotif(n: AppNotification): void {
    if (!this.isRead(n)) {
      this.notifCenter.markOneAsReadLocally(n.id);
      this.notifService.markAsRead(n.id).subscribe();
    }
    this.notifOpen.set(false);

    const payload = n.dataPayload;
    if (n.type === 'JACKPOT_APPROVED' || n.type === 'JACKPOT_REJECTED') {
      this.router.navigate(['/app/jackpot']);
      return;
    }
    if (n.type === 'JACKPOT_CONTRIBUTION' && payload?.['jackpotId']) {
      this.router.navigate(['/jackpot', payload['shareToken'] ?? '']);
      return;
    }
    this.router.navigate(['/app/notifications']);
  }

  markAllRead(): void {
    if (this.markAllLoading || this.unreadCount() === 0) return;
    this.markAllLoading = true;
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifCenter.markAllAsReadLocally();
        this.markAllLoading = false;
      },
      error: () => {
        this.markAllLoading = false;
      },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
