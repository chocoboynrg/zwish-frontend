import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/></svg>
            Dashboard
          </a>
          <a routerLink="/admin/users" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            Utilisateurs
          </a>
          <a routerLink="/admin/payments" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="1" y="5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M1 9h18" stroke="currentColor" stroke-width="1.6"/><path d="M5 13h3M13 13h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            Paiements
          </a>
          <a routerLink="/admin/reconciliation" routerLinkActive="active">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="currentColor" stroke-width="1.6"/>
            <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Réconciliation
        </a>
          <a routerLink="/admin/events" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            Événements
          </a>
          <a routerLink="/admin/catalog" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            Catalogue
          </a>
          <a routerLink="/admin/product-requests" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M9 2H4a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9m-9-7l7 7m-7-7v7h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Demandes produit
          </a>
          <a routerLink="/admin/notifications" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2.5a6.5 6.5 0 016.5 6.5v3l1.5 2H2l1.5-2V9A6.5 6.5 0 0110 2.5zM8 16a2 2 0 004 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            Notifications
          </a>
          <a routerLink="/admin/audit" routerLinkActive="active">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M9 2H4a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M9 2v7h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M5 12h6M5 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            Audit Logs
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="current-user" *ngIf="currentUser() as user">
            <div class="user-avatar">{{ getInitials(user.name) }}</div>
            <div class="user-meta">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-role">{{ user.platformRole }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M13 15l4-5-4-5M17 10H7M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Déconnexion
          </button>
        </div>
      </aside>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-shell { min-height: 100vh; display: grid; grid-template-columns: 256px 1fr; background: #f5f7fb; }
    .sidebar { background: #0f172a; color: white; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    .brand { display: flex; align-items: center; gap: 10px; padding: 24px 20px; font-size: 1.1rem; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .brand-mark { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 900; flex-shrink: 0; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 16px 12px; flex: 1; }
    .nav a { display: flex; align-items: center; gap: 10px; color: #94a3b8; text-decoration: none; padding: 10px 12px; border-radius: 10px; font-weight: 500; font-size: 0.92rem; transition: 0.15s; }
    .nav a:hover { background: rgba(255,255,255,0.06); color: white; }
    .nav a.active { background: rgba(99,102,241,0.2); color: #a5b4fc; }
    .nav a svg { flex-shrink: 0; opacity: 0.7; }
    .nav a.active svg { opacity: 1; }
    .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 10px; }
    .current-user { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.05); }
    .user-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0; }
    .user-meta { display: flex; flex-direction: column; min-width: 0; }
    .user-name { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .logout-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; border: 0; border-radius: 10px; background: rgba(239,68,68,0.12); color: #fca5a5; font: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: 0.15s; }
    .logout-btn:hover { background: rgba(239,68,68,0.2); color: #f87171; }
    .content { padding: 28px; min-width: 0; }
    @media (max-width: 900px) { .admin-shell { grid-template-columns: 1fr; } .sidebar { display: none; } .content { padding: 16px; } }
  `],
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly currentUser = () => this.authService.getCurrentUserSnapshot();
  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }
  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}