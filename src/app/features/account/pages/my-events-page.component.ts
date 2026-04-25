import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService, MyDashboardResponse, DashboardEventItem } from '../services/dashboard.service';

@Component({
  selector: 'app-my-events-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrap">

      <!-- Hero -->
      <div class="page-hero">
        <div class="page-hero-inner">
          <div class="hero-text">
            <div class="page-eyebrow">Mon espace</div>
            <h1>Mes événements</h1>
            <p>Organisez vos moments importants et suivez les wishlists de vos proches.</p>
          </div>
          <a routerLink="/app/events/new" class="btn-create">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
            Créer un événement
          </a>
        </div>

        <!-- Stats bar -->
        <div class="hero-stats-bar" *ngIf="!loading() && data()">
          <div class="hero-stat-item">
            <div class="hsi-val">{{ data()!.organizedEvents.length }}</div>
            <div class="hsi-label">Organisés</div>
          </div>
          <div class="hsi-sep"></div>
          <div class="hero-stat-item">
            <div class="hsi-val">{{ data()!.joinedEvents.length }}</div>
            <div class="hsi-label">Rejoints</div>
          </div>
          <div class="hsi-sep"></div>
          <div class="hero-stat-item">
            <div class="hsi-val">{{ upcomingCount() }}</div>
            <div class="hsi-label">À venir</div>
          </div>
          <div class="hsi-sep"></div>
          <div class="hero-stat-item">
            <div class="hsi-val">{{ pastCount() }}</div>
            <div class="hsi-label">Passés</div>
          </div>
        </div>
      </div>

      <div class="page-body">

        <!-- Loading -->
        <div class="loading-state" *ngIf="loading()">
          <div class="loading-spinner"></div>
          Chargement...
        </div>

        <ng-container *ngIf="!loading() && data()">

          <!-- ──────────────────── -->
          <!-- J'ORGANISE           -->
          <!-- ──────────────────── -->
          <div class="section-block">
            <div class="section-head">
              <div class="section-head-left">
                <div class="section-dot dot-organizer"></div>
                <h2>J'organise</h2>
                <span class="count-pill">{{ data()!.organizedEvents.length }}</span>
              </div>
              <a routerLink="/app/events/new" class="section-action">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
                Nouveau
              </a>
            </div>

            <!-- Empty -->
            <div class="empty-block" *ngIf="data()!.organizedEvents.length === 0">
              <div class="empty-icon">🎊</div>
              <div class="empty-title">Aucun événement organisé</div>
              <p>Créez votre premier événement et partagez votre wishlist avec vos proches.</p>
              <a routerLink="/app/events/new" class="btn-yellow">Créer mon premier événement</a>
            </div>

            <!-- Grille -->
            <div class="events-grid" *ngIf="data()!.organizedEvents.length > 0">
              <a
                *ngFor="let e of data()!.organizedEvents"
                [routerLink]="['/app/events', e.id]"
                class="event-card organizer-card"
                [class.past-card]="isPast(e.eventDate)"
              >
                <!-- Top -->
                <div class="card-top">
                  <div class="card-type-badge badge-org">
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.5 4.5H16l-3.7 2.7 1.4 4.3L10 11l-3.7 2.5 1.4-4.3L4 6.5h4.5L10 2z" stroke="currentColor" stroke-width="1.3"/></svg>
                    Organisateur
                  </div>
                  <div class="card-timing" [class.timing-past]="isPast(e.eventDate)" [class.timing-soon]="isSoon(e.eventDate)">
                    <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    {{ formatDate(e.eventDate) }}
                  </div>
                </div>

                <!-- Contenu -->
                <div class="card-body">
                  <div class="card-title">{{ e.title }}</div>
                  <div class="card-desc" *ngIf="e.description">{{ e.description | slice:0:90 }}{{ (e.description?.length ?? 0) > 90 ? '…' : '' }}</div>
                  <div class="card-no-desc" *ngIf="!e.description">Aucune description renseignée.</div>
                </div>

                <!-- Footer -->
                <div class="card-footer">
                  <div class="card-footer-tags">
                    <span class="card-tag tag-past" *ngIf="isPast(e.eventDate)">Passé</span>
                    <span class="card-tag tag-soon" *ngIf="isSoon(e.eventDate) && !isPast(e.eventDate)">Bientôt</span>
                    <span class="card-tag tag-future" *ngIf="!isPast(e.eventDate) && !isSoon(e.eventDate)">À venir</span>
                  </div>
                  <span class="card-cta">Gérer →</span>
                </div>
              </a>
            </div>
          </div>

          <!-- ──────────────────── -->
          <!-- JE PARTICIPE         -->
          <!-- ──────────────────── -->
          <div class="section-block">
            <div class="section-head">
              <div class="section-head-left">
                <div class="section-dot dot-guest"></div>
                <h2>Je participe</h2>
                <span class="count-pill">{{ data()!.joinedEvents.length }}</span>
              </div>
            </div>

            <!-- Empty -->
            <div class="empty-block" *ngIf="data()!.joinedEvents.length === 0">
              <div class="empty-icon">🔗</div>
              <div class="empty-title">Aucun événement rejoint</div>
              <p>Rejoignez un événement via le lien de partage envoyé par un organisateur.</p>
            </div>

            <!-- Grille -->
            <div class="events-grid" *ngIf="data()!.joinedEvents.length > 0">
              <a
                *ngFor="let e of data()!.joinedEvents"
                [routerLink]="['/app/events', e.id]"
                class="event-card guest-card"
                [class.past-card]="isPast(e.eventDate)"
              >
                <div class="card-top">
                  <div class="card-type-badge badge-guest">
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M10 11a4 4 0 100-8 4 4 0 000 8zM2 19a8 8 0 0116 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    Invité
                  </div>
                  <div class="card-timing" [class.timing-past]="isPast(e.eventDate)" [class.timing-soon]="isSoon(e.eventDate)">
                    <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    {{ formatDate(e.eventDate) }}
                  </div>
                </div>

                <div class="card-body">
                  <div class="card-title">{{ e.title }}</div>
                  <div class="card-desc" *ngIf="e.description">{{ e.description | slice:0:90 }}{{ (e.description?.length ?? 0) > 90 ? '…' : '' }}</div>
                  <div class="card-no-desc" *ngIf="!e.description">Aucune description renseignée.</div>
                </div>

                <div class="card-footer">
                  <div class="card-footer-tags">
                    <span class="card-tag tag-past" *ngIf="isPast(e.eventDate)">Passé</span>
                    <span class="card-tag tag-soon" *ngIf="isSoon(e.eventDate) && !isPast(e.eventDate)">Bientôt</span>
                    <span class="card-tag tag-future" *ngIf="!isPast(e.eventDate) && !isSoon(e.eventDate)">À venir</span>
                  </div>
                  <span class="card-cta">Voir la wishlist →</span>
                </div>
              </a>
            </div>
          </div>

        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { background: #f9fafb; min-height: calc(100vh - 64px); }

    /* HERO */
    .page-hero { background: #000; padding-bottom: 0; }
    .page-hero-inner { max-width: 1280px; margin: 0 auto; padding: 36px 24px 28px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .page-eyebrow { color: #FFD700; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
    h1 { font-size: 2rem; font-weight: 900; color: white; margin: 0 0 8px; letter-spacing: -0.02em; }
    .page-hero p { color: rgba(255,255,255,0.5); margin: 0; font-size: 0.9rem; }
    .btn-create { display: flex; align-items: center; gap: 8px; background: #FFD700; color: #000; padding: 11px 22px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 0.9rem; white-space: nowrap; flex-shrink: 0; transition: 0.2s; }
    .btn-create:hover { background: #FFC000; }

    /* Stats bar */
    .hero-stats-bar { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; gap: 0; border-top: 1px solid rgba(255,255,255,0.08); }
    .hero-stat-item { flex: 1; padding: 16px 0; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .hsi-val { font-size: 1.3rem; font-weight: 900; color: white; }
    .hsi-label { font-size: 0.72rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .hsi-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.08); }

    /* BODY */
    .page-body { max-width: 1280px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 40px; }

    /* Loading */
    .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 56px; color: #9ca3af; }
    .loading-spinner { width: 20px; height: 20px; border: 2px solid #f3f4f6; border-top-color: #111; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Section */
    .section-block { display: flex; flex-direction: column; gap: 20px; }
    .section-head { display: flex; align-items: center; justify-content: space-between; }
    .section-head-left { display: flex; align-items: center; gap: 10px; }
    .section-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .dot-organizer { background: #FFD700; }
    .dot-guest { background: #818cf8; }
    h2 { font-size: 1.15rem; font-weight: 900; color: #111; margin: 0; }
    .count-pill { background: #111; color: white; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 800; }
    .section-action { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border: 1.5px solid #e5e7eb; border-radius: 9px; text-decoration: none; color: #6b7280; font-size: 0.82rem; font-weight: 700; transition: 0.2s; }
    .section-action:hover { border-color: #111; color: #111; }

    /* Empty */
    .empty-block { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; padding: 48px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .empty-icon { font-size: 2.5rem; }
    .empty-title { font-size: 1rem; font-weight: 800; color: #111; }
    .empty-block p { color: #9ca3af; margin: 0; font-size: 0.88rem; max-width: 340px; }
    .btn-yellow { background: #FFD700; color: #000; padding: 10px 22px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 0.88rem; }

    /* Grid */
    .events-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

    /* Card */
    .event-card {
      background: white; border: 1.5px solid #f3f4f6; border-radius: 20px;
      text-decoration: none; display: flex; flex-direction: column;
      overflow: hidden; transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
      position: relative;
    }
    .event-card:hover { box-shadow: 0 10px 32px rgba(0,0,0,0.1); transform: translateY(-3px); border-color: #e5e7eb; }
    .organizer-card:hover { border-color: rgba(255,215,0,0.4); }
    .guest-card:hover { border-color: rgba(129,140,248,0.4); }
    .past-card { opacity: 0.75; }
    .past-card:hover { opacity: 1; }

    /* Card top strip */
    .card-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #f9fafb;
    }
    .card-type-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 800; }
    .badge-org { background: #fffbeb; color: #92400e; }
    .badge-guest { background: #ede9fe; color: #6d28d9; }
    .card-timing { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 600; color: #9ca3af; }
    .timing-past { color: #9ca3af; }
    .timing-soon { color: #f59e0b; }

    /* Card body */
    .card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .card-title { font-size: 1rem; font-weight: 800; color: #111; line-height: 1.3; }
    .card-desc { font-size: 0.82rem; color: #9ca3af; line-height: 1.6; flex: 1; }
    .card-no-desc { font-size: 0.82rem; color: #d1d5db; font-style: italic; flex: 1; }

    /* Card footer */
    .card-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid #f9fafb; }
    .card-footer-tags { display: flex; gap: 6px; }
    .card-tag { padding: 3px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; }
    .tag-past { background: #f3f4f6; color: #9ca3af; }
    .tag-soon { background: #fef3c7; color: #92400e; }
    .tag-future { background: #f0fdf4; color: #166534; }
    .card-cta { font-size: 0.8rem; font-weight: 700; color: #9ca3af; }
    .event-card:hover .card-cta { color: #111; }

    @media (max-width: 1100px) { .events-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .events-grid { grid-template-columns: 1fr; } .hero-stats-bar { display: grid; grid-template-columns: 1fr 1fr; } .hsi-sep { display: none; } }
  `],
})
export class MyEventsPageComponent implements OnInit {
  private readonly dashService = inject(DashboardService);
  readonly data = signal<MyDashboardResponse | null>(null);
  readonly loading = signal(true);

  readonly allEvents = computed(() => [
    ...(this.data()?.organizedEvents ?? []),
    ...(this.data()?.joinedEvents ?? []),
  ]);

  readonly upcomingCount = computed(() =>
    this.allEvents().filter(e => !this.isPast(e.eventDate)).length
  );
  readonly pastCount = computed(() =>
    this.allEvents().filter(e => this.isPast(e.eventDate)).length
  );

  ngOnInit(): void {
    this.dashService.getMyDashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isPast(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  isSoon(dateStr: string): boolean {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // dans les 30 jours
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (this.isPast(dateStr)) {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Demain';
    if (days <= 7) return `Dans ${days} jours`;
    if (days <= 30) return `Dans ${Math.ceil(days / 7)} sem.`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}