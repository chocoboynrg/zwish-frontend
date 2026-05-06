import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { toSignal } from '@angular/core/rxjs-interop';
import { NotificationCenterService } from '../../features/notifications/services/notification-center.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">Z</span>
          <span>ZWish Admin</span>
        </div>

        <nav class="nav">
          <a
            routerLink="/admin"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect
                x="2"
                y="2"
                width="7"
                height="7"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <rect
                x="11"
                y="2"
                width="7"
                height="7"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <rect
                x="2"
                y="11"
                width="7"
                height="7"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <rect
                x="11"
                y="11"
                width="7"
                height="7"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.6"
              />
            </svg>
            Dashboard
          </a>
          <a routerLink="/admin/users" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Utilisateurs
          </a>
          <a routerLink="/admin/payments" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect
                x="1"
                y="5"
                width="18"
                height="12"
                rx="2"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <path d="M1 9h18" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M5 13h3M13 13h2"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Paiements
          </a>
          <a routerLink="/admin/reconciliation" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 6h12M4 10h8M4 14h10"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Réconciliation
          </a>
          <a routerLink="/admin/events" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect
                x="2"
                y="4"
                width="16"
                height="14"
                rx="2"
                stroke="currentColor"
                stroke-width="1.6"
              />
              <path
                d="M6 2v4M14 2v4M2 9h16"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Événements
          </a>
          <a routerLink="/admin/jackpot" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2c0 0-7 3.5-7 9a7 7 0 0014 0c0-5.5-7-9-7-9z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M10 8v4M8 10h4"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Cagnottes
          </a>
          <a routerLink="/admin/catalog" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h14"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Catalogue
          </a>
          @if (isSuperAdmin()) {
            <a routerLink="/admin/catalog-sales" routerLinkActive="active">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M3 17V8M7 17V4M11 17v-6M15 17v-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M3 5l4-2 4 3 4-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Point des ventes
            </a>
          }
          <a routerLink="/admin/wishlist-tracker" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
              <path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            </svg>
            Suivi en temps réel
          </a>
          <a routerLink="/admin/promotions" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 10l7-7 7 7M5 8v8a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="10" cy="14" r="1.5" fill="currentColor"/>
            </svg>
            Promotions
          </a>
          <a routerLink="/admin/product-requests" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 3H6a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V7l-3-4z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path d="M12 3v4h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              <path
                d="M8 11h4M8 14h2"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Demandes produit
          </a>
          @if (isSuperAdmin()) {
            <a routerLink="/admin/product-requests/assignment" routerLinkActive="active" class="nav-sub">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.6"/>
                <path d="M3 17c0-3 3-5 7-5s7 2 7 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M14 4l2 2-2 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Affectations
            </a>
          }
          <a routerLink="/admin/purchase-orders" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 3h14v3H3zM3 8h14v9H3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M7 12h6M7 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            Bons de commande
          </a>
          <a routerLink="/admin/delivery-options" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 10l7-7 7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 8.5V17h10V8.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 17v-5h4v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Options livraison
          </a>
          <a routerLink="/admin/audit" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
              <path
                d="M5 12h6M5 15h4"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Audit Logs
          </a>

          <!-- Séparateur -->
          <div class="nav-sep"></div>

          <!-- Notifications avec badge -->
          <a routerLink="/admin/notifications" routerLinkActive="active" class="nav-notif-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18H9M18 16V11C18 7.686 15.314 5 12 5S6 7.686 6 11v5l-1.5 1.5V18h15v-.5L18 16z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Notifications
            @if (unreadCount() > 0) {
              <span class="notif-badge">
                {{ unreadCount() > 99 ? '99+' : unreadCount() }}
              </span>
            }
          </a>
        </nav>

        <div class="sidebar-footer">
          @if (currentUser(); as user) {
            <div class="current-user">
              <div class="user-avatar">{{ getInitials(user.name) }}</div>
              <div class="user-meta">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-role">{{ user.platformRole }}</span>
              </div>
            </div>
          }
          <a routerLink="/app" class="user-space-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M9 15l-5-5 5-5M4 10h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Mon espace
          </a>
          <button class="logout-btn" (click)="logout()">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 15l4-5-4-5M17 10H7M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 256px 1fr;
        background: #f5f7fb;
      }
      .sidebar {
        background: #0f172a;
        color: white;
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100vh;
        overflow-y: auto;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 24px 20px;
        font-size: 1.1rem;
        font-weight: 800;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .brand-mark {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        font-weight: 900;
        flex-shrink: 0;
      }
      .nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 16px 12px;
        flex: 1;
      }

      .nav a {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #94a3b8;
        text-decoration: none;
        padding: 10px 12px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 0.92rem;
        transition: 0.15s;
        position: relative;
      }
      .nav a:hover {
        background: rgba(255, 255, 255, 0.06);
        color: white;
      }
      .nav a.active {
        background: rgba(99, 102, 241, 0.15);
        color: white;
      }
      .nav a.active svg {
        color: #818cf8;
      }

      /* Sub-nav link (indented child) */
      .nav-sub {
        padding-left: 36px !important;
        font-size: 0.85rem !important;
        color: #64748b !important;
      }
      .nav-sub.active {
        background: rgba(99, 102, 241, 0.1) !important;
        color: #a5b4fc !important;
      }

      /* Séparateur */
      .nav-sep {
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
        margin: 8px 0;
      }

      /* Lien notifications avec badge */
      .nav-notif-link {
        justify-content: flex-start;
      }
      .notif-badge {
        margin-left: auto;
        background: #ef4444;
        color: white;
        min-width: 20px;
        height: 20px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
        animation: notif-pulse 2s infinite;
      }
      @keyframes notif-pulse {
        0%,
        100% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
        }
        50% {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
        }
      }

      .sidebar-footer {
        padding: 16px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .current-user {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 10px;
      }
      .user-avatar {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.82rem;
        flex-shrink: 0;
      }
      .user-meta {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }
      .user-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .user-role {
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .user-space-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 9px 12px;
        border-radius: 9px;
        background: rgba(255, 255, 255, 0.06);
        color: #94a3b8;
        font-size: 0.85rem;
        font-weight: 600;
        text-decoration: none;
        transition: 0.15s;
      }
      .user-space-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      .logout-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 9px 12px;
        border: 0;
        border-radius: 9px;
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
        font: inherit;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: 0.15s;
      }
      .logout-btn:hover {
        background: rgba(239, 68, 68, 0.2);
      }

      .content {
        overflow: auto;
        min-height: 100vh;
      }
    `,
  ],
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationCenter = inject(NotificationCenterService);

  readonly currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.getCurrentUserSnapshot(),
  });

  readonly isSuperAdmin = computed(() => this.currentUser()?.platformRole === 'SUPER_ADMIN');

  readonly unreadCount = this.notificationCenter.unreadCount;

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }
}
