import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../core/services/auth.service';
import { AppNavbarComponent } from '../shared/components/app-navbar/app-navbar.component';
import { NotificationCenterService } from '../features/notifications/services/notification-center.service';

type NavItem = {
  label: string;
  path: string;
  hasNotificationBadge?: boolean;
};

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppNavbarComponent],
  template: `
    <div class="shell">
      <app-navbar
        [navItems]="topNavItems"
        [mobileExtraItems]="mobileExtraItems"
      />

      <main class="app-main">
        <div class="container app-grid">
          <aside class="side-panel desktop-side-panel">
            <div class="side-card profile-card" *ngIf="currentUser() as user">
              <div class="profile-avatar">
                {{ getInitials(user.name) }}
              </div>
              <div class="profile-name">{{ user.name }}</div>
              <div class="profile-email">{{ user.email }}</div>
            </div>

            <nav class="side-card side-nav">
              <button
                *ngFor="let item of navItems"
                type="button"
                class="side-nav-btn"
                [class.active]="isActive(item.path)"
                (click)="go(item.path)"
              >
                <span>{{ item.label }}</span>

                <span
                  *ngIf="item.hasNotificationBadge && unreadCount() > 0"
                  class="side-badge"
                  [ngClass]="getUnreadBadgeClass(unreadCount())"
                >
                  {{ formatUnreadCount(unreadCount()) }}
                </span>
              </button>
            </nav>
          </aside>

          <section class="page-content">
            <router-outlet></router-outlet>
          </section>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #fffaf8;
      color: #111827;
    }

    .shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .container {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .app-main {
      flex: 1;
      padding: 24px 0 32px;
    }

    .app-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      align-items: start;
    }

    .side-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 96px;
    }

    .side-card {
      background: white;
      border: 1px solid #f0e5df;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .profile-card {
      padding: 20px;
      text-align: center;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.12), transparent 35%),
        linear-gradient(135deg, #fff5f0, #ffffff);
    }

    .profile-avatar {
      width: 58px;
      height: 58px;
      margin: 0 auto 12px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 800;
      font-size: 1.1rem;
    }

    .profile-name {
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .profile-email {
      color: #6b7280;
      font-size: 0.92rem;
      word-break: break-word;
    }

    .side-nav {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .side-nav-btn {
      width: 100%;
      text-align: left;
      border: 0;
      background: transparent;
      color: #4b5563;
      padding: 12px 14px;
      border-radius: 14px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .side-nav-btn.active {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.16);
    }

    .side-badge {
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
      flex-shrink: 0;
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

    .page-content {
      min-width: 0;
    }

    @media (max-width: 1100px) {
      .desktop-side-panel {
        display: none;
      }

      .app-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class UserLayoutComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationCenter = inject(NotificationCenterService);

  readonly currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.getCurrentUserSnapshot(),
  });

  readonly unreadCount = this.notificationCenter.unreadCount;

  readonly topNavItems = [
    { label: 'Tableau de bord', path: '/app', exact: true },
    { label: 'Mes événements', path: '/app/events' },
    { label: 'Demandes produit', path: '/app/product-requests' },
    { label: 'Contributions', path: '/app/contributions' },
    { label: 'Paiements', path: '/app/payments' },
    { label: 'Notifications', path: '/app/notifications' },
  ];

  readonly mobileExtraItems = [
    { label: 'Accueil', path: '/', exact: true },
    { label: 'Catalogue', path: '/catalog' },
    { label: 'Comment ça marche', path: '/how-it-works' },
  ];

  readonly navItems: NavItem[] = [
    { label: 'Tableau de bord', path: '/app' },
    { label: 'Mes événements', path: '/app/events' },
    { label: 'Demandes produit', path: '/app/product-requests' },
    { label: 'Mes contributions', path: '/app/contributions' },
    { label: 'Mes paiements', path: '/app/payments' },
    { label: 'Mes notifications', path: '/app/notifications', hasNotificationBadge: true },
  ];

  constructor() {
    this.notificationCenter.loadUnreadCount();
  }

  go(path: string): void {
    if (this.router.url !== path) {
      this.router.navigateByUrl(path);
    }
  }

  isActive(path: string): boolean {
    if (path === '/app') {
      return this.router.url === '/app';
    }
    return this.router.url.startsWith(path);
  }

  formatUnreadCount(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  getUnreadBadgeClass(count: number): string {
    if (count >= 10) return 'badge-high';
    if (count >= 4) return 'badge-medium';
    return 'badge-low';
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
}