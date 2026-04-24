import { CommonModule } from '@angular/common';
import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/services/auth.service';
import { NotificationCenterService } from '../features/notifications/services/notification-center.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <!-- TOPBAR -->
      <header class="topbar" [class.scrolled]="scrolled()">
        <div class="topbar-inner">
          <!-- Logo -->
          <a routerLink="/" class="topbar-logo"><span class="z">Z</span>Wish</a>

          <!-- Nav principale (desktop) -->
          <nav class="topbar-nav">
            <a routerLink="/app" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.6"/><rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.6"/></svg>
              Dashboard
            </a>
            <a routerLink="/app/events" routerLinkActive="active">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              Mes événements
            </a>
            <a routerLink="/app/contributions" routerLinkActive="active">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.39 4.84L18 7.64l-4 3.9.94 5.5L10 14.27l-4.94 2.77.94-5.5-4-3.9 5.61-.8L10 2z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Contributions
            </a>
            <a routerLink="/app/payments" routerLinkActive="active">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="1" y="5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M1 9h18" stroke="currentColor" stroke-width="1.6"/></svg>
              Paiements
            </a>
            <a routerLink="/catalog" routerLinkActive="active">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Catalogue
            </a>
          </nav>

          <!-- Actions droite -->
          <div class="topbar-actions">
            <!-- Notifications -->
            <button class="action-btn notif-btn" (click)="notifOpen.set(!notifOpen())" [class.has-badge]="unreadCount() > 0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              <span class="notif-badge" *ngIf="unreadCount() > 0">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
            </button>

            <!-- Créer un événement -->
            <a routerLink="/app/events/new" class="btn-new-event">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
              Créer
            </a>

            <!-- Avatar -->
            <div class="avatar-wrap" (click)="profileOpen.set(!profileOpen())" [class.open]="profileOpen()">
              <div class="avatar">{{ getInitials(currentUser()?.name ?? '') }}</div>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" class="avatar-chevron"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>

              <!-- Dropdown profil -->
              <div class="profile-dropdown" *ngIf="profileOpen()">
                <div class="dropdown-user">
                  <div class="dropdown-avatar">{{ getInitials(currentUser()?.name ?? '') }}</div>
                  <div>
                    <div class="dropdown-name">{{ currentUser()?.name }}</div>
                    <div class="dropdown-email">{{ currentUser()?.email }}</div>
                  </div>
                </div>
                <div class="dropdown-sep"></div>
                <a routerLink="/app" class="dropdown-item" (click)="profileOpen.set(false)">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
                  Dashboard
                </a>
                <a routerLink="/app/events" class="dropdown-item" (click)="profileOpen.set(false)">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  Mes événements
                </a>
                <div class="dropdown-sep"></div>
                <button class="dropdown-item dropdown-logout" (click)="logout()">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M13 3h4a1 1 0 011 1v12a1 1 0 01-1 1h-4M9 14l4-4-4-4M3 10h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Se déconnecter
                </button>
              </div>
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
          <a routerLink="/app/payments" (click)="mobileOpen.set(false)">Paiements</a>
          <a routerLink="/catalog" (click)="mobileOpen.set(false)">Catalogue</a>
          <div class="mobile-sep"></div>
          <a routerLink="/app/events/new" class="mobile-cta" (click)="mobileOpen.set(false)">+ Créer un événement</a>
          <button class="mobile-logout" (click)="logout()">Se déconnecter</button>
        </div>
      </header>

      <!-- Overlay profil -->
      <div class="overlay" *ngIf="profileOpen() || notifOpen()" (click)="profileOpen.set(false); notifOpen.set(false)"></div>

      <!-- MAIN CONTENT -->
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .shell { min-height: 100vh; background: #f9fafb; }

    /* TOPBAR */
    .topbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: rgba(255,255,255,0.92); backdrop-filter: blur(16px);
      border-bottom: 1px solid #f3f4f6; transition: box-shadow 0.3s;
    }
    .topbar.scrolled { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .topbar-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; gap: 32px; }

    .topbar-logo { font-size: 1.3rem; font-weight: 900; color: #111; text-decoration: none; letter-spacing: -0.02em; flex-shrink: 0; }
    .z { color: #FFD700; }

    .topbar-nav { display: flex; gap: 4px; flex: 1; }
    .topbar-nav a {
      display: flex; align-items: center; gap: 6px; padding: 8px 12px;
      border-radius: 10px; color: #6b7280; text-decoration: none; font-size: 0.85rem; font-weight: 600;
      transition: 0.15s; white-space: nowrap;
    }
    .topbar-nav a:hover { background: #f3f4f6; color: #111; }
    .topbar-nav a.active { background: #111; color: white; }
    .topbar-nav a.active svg { stroke: white; }

    .topbar-actions { display: flex; align-items: center; gap: 8px; }

    .action-btn { width: 40px; height: 40px; border: 1px solid #e5e7eb; border-radius: 10px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; position: relative; transition: 0.15s; }
    .action-btn:hover { background: #f9fafb; }
    .notif-badge { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; background: #ef4444; color: white; border-radius: 50%; font-size: 0.65rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

    .btn-new-event {
      display: flex; align-items: center; gap: 6px; padding: 9px 16px;
      background: #FFD700; color: #000; border-radius: 10px; font: inherit;
      font-size: 0.85rem; font-weight: 800; text-decoration: none; transition: 0.2s;
    }
    .btn-new-event:hover { background: #FFC000; }

    .avatar-wrap { position: relative; display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 4px; border-radius: 10px; transition: 0.15s; user-select: none; }
    .avatar-wrap:hover { background: #f3f4f6; }
    .avatar { width: 36px; height: 36px; border-radius: 10px; background: #111; color: white; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .avatar-chevron { color: #6b7280; flex-shrink: 0; }

    .profile-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0; width: 240px;
      background: white; border: 1px solid #e5e7eb; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12); overflow: hidden; z-index: 200;
    }
    .dropdown-user { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .dropdown-avatar { width: 40px; height: 40px; border-radius: 10px; background: #111; color: white; font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .dropdown-name { font-weight: 700; color: #111; font-size: 0.9rem; }
    .dropdown-email { color: #9ca3af; font-size: 0.78rem; }
    .dropdown-sep { height: 1px; background: #f3f4f6; }
    .dropdown-item { display: flex; align-items: center; gap: 10px; padding: 11px 16px; color: #374151; text-decoration: none; font-size: 0.88rem; font-weight: 500; transition: 0.15s; }
    .dropdown-item:hover { background: #f9fafb; color: #111; }
    .dropdown-logout { background: 0; border: 0; width: 100%; text-align: left; cursor: pointer; font: inherit; color: #ef4444 !important; }
    .dropdown-logout:hover { background: #fef2f2 !important; }

    .hamburger { display: none; flex-direction: column; gap: 5px; background: 0; border: 0; cursor: pointer; padding: 6px; }
    .hamburger span { display: block; width: 22px; height: 2px; background: #374151; transition: 0.3s; border-radius: 1px; }
    .hamburger span.open:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger span.open:nth-child(2) { opacity: 0; }
    .hamburger span.open:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    .mobile-nav { display: none; flex-direction: column; border-top: 1px solid #f3f4f6; background: white; max-height: 0; overflow: hidden; transition: max-height 0.3s; }
    .mobile-nav.open { max-height: 500px; }
    .mobile-nav a { padding: 14px 24px; color: #374151; text-decoration: none; font-weight: 500; border-bottom: 1px solid #f9fafb; }
    .mobile-nav a:hover { background: #f9fafb; }
    .mobile-sep { height: 1px; background: #f3f4f6; margin: 4px 0; }
    .mobile-cta { background: #FFD700; color: #000 !important; font-weight: 800 !important; margin: 8px 16px; border-radius: 10px; text-align: center; }
    .mobile-logout { background: 0; border: 0; width: 100%; text-align: left; padding: 14px 24px; color: #ef4444; font: inherit; font-weight: 600; cursor: pointer; }

    .overlay { position: fixed; inset: 0; z-index: 99; }

    /* MAIN */
    .app-main { padding-top: 64px; min-height: 100vh; }

    @media (max-width: 900px) {
      .topbar-nav { display: none; }
      .btn-new-event span { display: none; }
      .hamburger { display: flex; }
      .mobile-nav { display: flex; }
    }
    @media (max-width: 480px) {
      .btn-new-event { padding: 9px 12px; }
    }
  `],
})
export class UserLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifService = inject(NotificationCenterService);

  readonly currentUser = toSignal(this.auth.currentUser$);
  readonly unreadCount = this.notifService.unreadCount;
  readonly scrolled = signal(false);
  readonly profileOpen = signal(false);
  readonly notifOpen = signal(false);
  readonly mobileOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 10); }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}