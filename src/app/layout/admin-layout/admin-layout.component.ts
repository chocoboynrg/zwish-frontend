import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { toSignal } from '@angular/core/rxjs-interop';
import { NotificationCenterService } from '../../features/notifications/services/notification-center.service';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LucideAngularModule],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">Z</span>
          <span>ZWish Admin</span>
        </div>

        <nav class="nav">

          <!-- Dashboard -->
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <lucide-icon name="home" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Dashboard
          </a>

          <!-- Utilisateurs & Activité -->
          <div class="nav-group-label">Utilisateurs & Activité</div>
          <a routerLink="/admin/users" routerLinkActive="active">
            <lucide-icon name="user" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Utilisateurs
          </a>
          <a routerLink="/admin/events" routerLinkActive="active">
            <lucide-icon name="calendar" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Événements
          </a>
          <a routerLink="/admin/jackpot" routerLinkActive="active">
            <lucide-icon name="package" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Cagnottes
          </a>

          <!-- Finances -->
          <div class="nav-group-label">Finances</div>
          <a routerLink="/admin/payments" routerLinkActive="active">
            <lucide-icon name="credit-card" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Paiements
          </a>
          <a routerLink="/admin/reconciliation" routerLinkActive="active">
            <lucide-icon name="file-text" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Réconciliation
          </a>

          <!-- Catalogue & Produits -->
          <div class="nav-group-label">Catalogue & Produits</div>
          <a routerLink="/admin/catalog" routerLinkActive="active">
            <lucide-icon name="package" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Catalogue
          </a>
          @if (isSuperAdmin()) {
            <a routerLink="/admin/catalog-sales" routerLinkActive="active">
              <lucide-icon name="bar-chart-2" [size]="18" color="currentColor" [strokeWidth]="1.8" />
              Point des ventes
            </a>
          }
          <a routerLink="/admin/product-requests" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <lucide-icon name="file-text" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Demandes produit
          </a>
          @if (isSuperAdmin()) {
            <a routerLink="/admin/product-requests/assignment" routerLinkActive="active" class="nav-sub">
              <lucide-icon name="user" [size]="16" color="currentColor" [strokeWidth]="1.8" />
              Affectations
            </a>
          }
          <a routerLink="/admin/promotions" routerLinkActive="active">
            <lucide-icon name="tag" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Promotions
          </a>

          <!-- Commandes & Livraisons -->
          <div class="nav-group-label">Commandes & Livraisons</div>
          <a routerLink="/admin/wishlist-tracker" routerLinkActive="active">
            <lucide-icon name="clock" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Suivi wishlist
          </a>
          <a routerLink="/admin/purchase-orders" routerLinkActive="active">
            <lucide-icon name="file-text" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Bons de commande
          </a>
          <a routerLink="/admin/delivery-options" routerLinkActive="active">
            <lucide-icon name="truck" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Options livraison
          </a>
          <a routerLink="/admin/delivery-pending" routerLinkActive="active">
            <lucide-icon name="clock" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Livraisons en attente
          </a>
          <a routerLink="/admin/delivery-date-pending" routerLinkActive="active">
            <lucide-icon name="alert-triangle" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Dates à définir
          </a>

          <!-- Système -->
          <div class="nav-group-label">Système</div>
          <a routerLink="/admin/audit" routerLinkActive="active">
            <lucide-icon name="file-text" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Audit Logs
          </a>
          <a routerLink="/admin/notifications" routerLinkActive="active" class="nav-notif-link">
            <lucide-icon name="bell" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Notifications
            @if (unreadCount() > 0) {
              <span class="notif-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
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
            <lucide-icon name="arrow-left" [size]="16" color="currentColor" [strokeWidth]="1.8" />
            Mon espace
          </a>
          <button class="logout-btn" (click)="logout()">
            <lucide-icon name="log-out" [size]="16" color="currentColor" [strokeWidth]="1.8" />
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

      /* Group label */
      .nav-group-label {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #334155;
        padding: 14px 12px 4px;
        user-select: none;
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
