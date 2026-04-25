import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DashboardService, MyDashboardResponse } from '../services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">

      <!-- Hero -->
      <section class="dash-hero">
        <div class="hero-inner">
          <div class="hero-greeting">
            <div class="greeting-avatar">{{ initials() }}</div>
            <div>
              <div class="greeting-hey">Bonjour,</div>
              <h1 class="greeting-name">{{ firstName() }} 👋</h1>
            </div>
          </div>
          <a routerLink="/app/events/new" class="btn-create">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
            Créer un événement
          </a>
        </div>
      </section>

      <div class="dash-body">

        <!-- Chargement -->
        <div class="loading-row" *ngIf="loading()">
          <div class="skeleton" *ngFor="let i of [1,2,3,4,5,6]"></div>
        </div>

        <ng-container *ngIf="!loading() && data()">

          <!-- Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">🎉</div>
              <div class="stat-value">{{ data()!.summary?.organizedEventsCount ?? data()!.organizedEvents.length }}</div>
              <div class="stat-label">Événements organisés</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-value">{{ data()!.summary?.participatingEventsCount ?? data()!.joinedEvents.length }}</div>
              <div class="stat-label">Événements rejoints</div>
            </div>
            <div class="stat-card stat-accent">
              <div class="stat-icon">⭐</div>
              <div class="stat-value">{{ data()!.summary?.confirmedContributions ?? 0 }}</div>
              <div class="stat-label">Contributions confirmées</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💳</div>
              <div class="stat-value">{{ data()!.summary?.succeededPayments ?? 0 }}</div>
              <div class="stat-label">Paiements réussis</div>
            </div>
            <div class="stat-card stat-gold">
              <div class="stat-icon">💰</div>
              <div class="stat-value">{{ data()!.summary?.confirmedContributionsAmount ?? 0 | number:'1.0-0' }}</div>
              <div class="stat-label">FCFA contribués</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-value">{{ data()!.summary?.initiatedPayments ?? 0 }}</div>
              <div class="stat-label">Paiements en cours</div>
            </div>
          </div>

          <!-- Deux colonnes -->
          <div class="panels-grid">

            <!-- Événements organisés -->
            <div class="panel">
              <div class="panel-header">
                <h2>J'organise</h2>
                <a routerLink="/app/events" class="panel-link">Tout voir →</a>
              </div>
              <div class="empty-panel" *ngIf="data()!.organizedEvents.length === 0">
                <span class="empty-icon">🎊</span>
                <p>Aucun événement encore.</p>
                <a routerLink="/app/events/new" class="btn-sm-yellow">Créer maintenant</a>
              </div>
              <div class="event-list" *ngIf="data()!.organizedEvents.length > 0">
                <a
                  *ngFor="let e of data()!.organizedEvents.slice(0, 4)"
                  [routerLink]="['/app/events', e.id]"
                  class="event-row"
                >
                  <div class="event-dot dot-organizer"></div>
                  <div class="event-row-info">
                    <div class="event-row-title">{{ e.title }}</div>
                    <div class="event-row-date">{{ e.eventDate | date:'dd MMM yyyy' }}</div>
                  </div>
                  <span class="event-role">Organisateur</span>
                </a>
              </div>
            </div>

            <!-- Événements rejoints -->
            <div class="panel">
              <div class="panel-header">
                <h2>Je participe</h2>
                <a routerLink="/app/events" class="panel-link">Tout voir →</a>
              </div>
              <div class="empty-panel" *ngIf="data()!.joinedEvents.length === 0">
                <span class="empty-icon">🔗</span>
                <p>Rejoignez un événement via un lien de partage.</p>
              </div>
              <div class="event-list" *ngIf="data()!.joinedEvents.length > 0">
                <a
                  *ngFor="let e of data()!.joinedEvents.slice(0, 4)"
                  [routerLink]="['/app/events', e.id]"
                  class="event-row"
                >
                  <div class="event-dot dot-participant"></div>
                  <div class="event-row-info">
                    <div class="event-row-title">{{ e.title }}</div>
                    <div class="event-row-date">{{ e.eventDate | date:'dd MMM yyyy' }}</div>
                  </div>
                  <span class="event-role event-role-inv">Invité</span>
                </a>
              </div>
            </div>

          </div>

          <!-- Shortcuts -->
          <div class="shortcuts">
            <a routerLink="/app/contributions" class="shortcut-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 4.8L20 7.6l-4 3.9.95 5.5L12 14.3l-4.95 2.7.95-5.5-4-3.9 5.6-.8L12 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Mes contributions</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" class="arrow"><path d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </a>
            <a routerLink="/app/payments" class="shortcut-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="5" width="22" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M1 10h22" stroke="currentColor" stroke-width="1.8"/></svg>
              <span>Mes paiements</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" class="arrow"><path d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </a>
            <a routerLink="/catalog" class="shortcut-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Parcourir le catalogue</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" class="arrow"><path d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </a>
            <a routerLink="/app/events/new" class="shortcut-card shortcut-cta">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
              <span>Créer un événement</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" class="arrow"><path d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </a>
          </div>

        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { background: #f9fafb; min-height: calc(100vh - 64px); }

    /* HERO */
    .dash-hero { background: #000; padding: 40px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .hero-greeting { display: flex; align-items: center; gap: 16px; }
    .greeting-avatar { width: 56px; height: 56px; border-radius: 16px; background: #FFD700; color: #000; font-weight: 900; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .greeting-hey { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-bottom: 2px; }
    .greeting-name { color: white; font-size: 1.6rem; font-weight: 900; margin: 0; letter-spacing: -0.02em; }
    .btn-create { display: flex; align-items: center; gap: 8px; background: #FFD700; color: #000; padding: 11px 22px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 0.9rem; transition: 0.2s; }
    .btn-create:hover { background: #FFC000; }

    /* BODY */
    .dash-body { max-width: 1280px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 28px; }

    /* LOADING SKELETON */
    .loading-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }
    .skeleton { height: 100px; border-radius: 14px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:-200%}100%{background-position:200%} }

    /* STATS */
    .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
    .stat-card { background: white; border: 1.5px solid #f3f4f6; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 8px; transition: 0.2s; }
    .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .stat-card.stat-accent { border-color: #e0e7ff; background: #f5f3ff; }
    .stat-card.stat-gold { border-color: #fde68a; background: #fffbeb; }
    .stat-icon { font-size: 1.4rem; }
    .stat-value { font-size: 1.8rem; font-weight: 900; color: #111; line-height: 1; }
    .stat-label { font-size: 0.75rem; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

    /* PANELS */
    .panels-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .panel { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; padding: 24px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .panel-header h2 { font-size: 1.05rem; font-weight: 800; color: #111; margin: 0; }
    .panel-link { color: #6b7280; font-size: 0.82rem; font-weight: 600; text-decoration: none; }
    .panel-link:hover { color: #111; }

    .empty-panel { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 0; text-align: center; }
    .empty-icon { font-size: 2rem; }
    .empty-panel p { color: #9ca3af; font-size: 0.88rem; margin: 0; }
    .btn-sm-yellow { background: #FFD700; color: #000; padding: 8px 18px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 0.82rem; }

    .event-list { display: flex; flex-direction: column; gap: 6px; }
    .event-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; text-decoration: none; transition: 0.15s; }
    .event-row:hover { background: #f9fafb; }
    .event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot-organizer { background: #FFD700; }
    .dot-participant { background: #6366f1; }
    .event-row-info { flex: 1; min-width: 0; }
    .event-row-title { font-size: 0.88rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .event-row-date { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }
    .event-role { font-size: 0.7rem; font-weight: 700; background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
    .event-role-inv { background: #ede9fe; color: #6d28d9; }

    /* SHORTCUTS */
    .shortcuts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .shortcut-card { display: flex; align-items: center; gap: 14px; padding: 18px 20px; background: white; border: 1.5px solid #f3f4f6; border-radius: 16px; text-decoration: none; color: #374151; font-weight: 600; font-size: 0.9rem; transition: 0.2s; }
    .shortcut-card:hover { border-color: #111; background: #f9fafb; }
    .shortcut-card svg:first-child { color: #9ca3af; flex-shrink: 0; }
    .shortcut-card span { flex: 1; }
    .arrow { color: #d1d5db; flex-shrink: 0; }
    .shortcut-cta { background: #111; color: white; border-color: #111; }
    .shortcut-cta svg { color: white; }
    .shortcut-cta:hover { background: #000; }

    @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } .loading-row { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px) { .panels-grid { grid-template-columns: 1fr; } .shortcuts { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .shortcuts { grid-template-columns: 1fr; } }
  `],
})
export class MyDashboardPageComponent implements OnInit {
  private readonly dashService = inject(DashboardService);
  private readonly auth = inject(AuthService);

  readonly currentUser = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUserSnapshot() });
  readonly initials = computed(() => {
    const n = this.currentUser()?.name ?? '';
    return n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  });
  readonly firstName = computed(() => {
    const n = this.currentUser()?.name ?? '';
    return n.split(' ')[0] ?? '';
  });

  readonly data = signal<MyDashboardResponse | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.dashService.getMyDashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}