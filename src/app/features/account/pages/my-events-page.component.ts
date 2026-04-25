import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService, MyDashboardResponse } from '../services/dashboard.service';

@Component({
  selector: 'app-my-events-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrap">

      <!-- Header -->
      <div class="page-hero">
        <div class="page-hero-inner">
          <div>
            <div class="page-eyebrow">Mon espace</div>
            <h1>Mes événements</h1>
            <p>Gérez vos événements organisés et ceux auxquels vous participez.</p>
          </div>
          <a routerLink="/app/events/new" class="btn-create">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
            Créer un événement
          </a>
        </div>
      </div>

      <div class="page-body">
        <div class="loading-state" *ngIf="loading()">Chargement...</div>

        <ng-container *ngIf="!loading() && data()">

          <!-- Stats -->
          <div class="mini-stats">
            <div class="mini-stat">
              <strong>{{ data()!.organizedEvents.length }}</strong>
              <span>organisés</span>
            </div>
            <div class="mini-stat">
              <strong>{{ data()!.joinedEvents.length }}</strong>
              <span>rejoints</span>
            </div>
          </div>

          <!-- Organisés -->
          <div class="section-block">
            <div class="section-head">
              <h2>Événements que j'organise</h2>
              <span class="count-badge">{{ data()!.organizedEvents.length }}</span>
            </div>

            <div class="empty-block" *ngIf="data()!.organizedEvents.length === 0">
              <div class="empty-icon">🎊</div>
              <p>Vous n'organisez aucun événement pour l'instant.</p>
              <a routerLink="/app/events/new" class="btn-yellow">Créer mon premier événement</a>
            </div>

            <div class="events-grid" *ngIf="data()!.organizedEvents.length > 0">
              <a
                *ngFor="let e of data()!.organizedEvents"
                [routerLink]="['/app/events', e.id]"
                class="event-card"
              >
                <div class="event-card-header">
                  <span class="event-badge badge-organizer">Organisateur</span>
                  <span class="event-date">{{ e.eventDate | date:'dd MMM yyyy' }}</span>
                </div>
                <div class="event-title">{{ e.title }}</div>
                <div class="event-desc" *ngIf="e.description">{{ e.description | slice:0:80 }}{{ e.description.length > 80 ? '…' : '' }}</div>
                <div class="event-footer">
                  <span>Voir l'événement →</span>
                </div>
              </a>
            </div>
          </div>

          <!-- Rejoints -->
          <div class="section-block">
            <div class="section-head">
              <h2>Événements auxquels je participe</h2>
              <span class="count-badge">{{ data()!.joinedEvents.length }}</span>
            </div>

            <div class="empty-block" *ngIf="data()!.joinedEvents.length === 0">
              <div class="empty-icon">🔗</div>
              <p>Rejoignez un événement via le lien de partage envoyé par un organisateur.</p>
            </div>

            <div class="events-grid" *ngIf="data()!.joinedEvents.length > 0">
              <a
                *ngFor="let e of data()!.joinedEvents"
                [routerLink]="['/app/events', e.id]"
                class="event-card"
              >
                <div class="event-card-header">
                  <span class="event-badge badge-guest">Invité</span>
                  <span class="event-date">{{ e.eventDate | date:'dd MMM yyyy' }}</span>
                </div>
                <div class="event-title">{{ e.title }}</div>
                <div class="event-desc" *ngIf="e.description">{{ e.description | slice:0:80 }}{{ e.description.length > 80 ? '…' : '' }}</div>
                <div class="event-footer">
                  <span>Voir la wishlist →</span>
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
    .page-hero { background: #000; padding: 40px 0; }
    .page-hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .page-eyebrow { color: #FFD700; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
    h1 { font-size: 2rem; font-weight: 900; color: white; margin: 0 0 8px; letter-spacing: -0.02em; }
    .page-hero p { color: rgba(255,255,255,0.5); margin: 0; font-size: 0.9rem; }
    .btn-create { display: flex; align-items: center; gap: 8px; background: #FFD700; color: #000; padding: 11px 22px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 0.9rem; white-space: nowrap; }
    .btn-create:hover { background: #FFC000; }

    .page-body { max-width: 1280px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 32px; }
    .loading-state { color: #9ca3af; text-align: center; padding: 48px; }

    .mini-stats { display: flex; gap: 16px; }
    .mini-stat { background: white; border: 1.5px solid #f3f4f6; border-radius: 12px; padding: 14px 24px; display: flex; flex-direction: column; gap: 4px; }
    .mini-stat strong { font-size: 1.5rem; font-weight: 900; color: #111; }
    .mini-stat span { font-size: 0.78rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }

    .section-block { display: flex; flex-direction: column; gap: 16px; }
    .section-head { display: flex; align-items: center; gap: 12px; }
    .section-head h2 { font-size: 1.15rem; font-weight: 800; color: #111; margin: 0; }
    .count-badge { background: #111; color: white; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 800; }

    .empty-block { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .empty-icon { font-size: 2.5rem; }
    .empty-block p { color: #9ca3af; margin: 0; font-size: 0.9rem; }
    .btn-yellow { background: #FFD700; color: #000; padding: 10px 22px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 0.88rem; }

    .events-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .event-card { background: white; border: 1.5px solid #f3f4f6; border-radius: 18px; padding: 20px; text-decoration: none; display: flex; flex-direction: column; gap: 10px; transition: 0.2s; }
    .event-card:hover { border-color: #111; box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .event-card-header { display: flex; align-items: center; justify-content: space-between; }
    .event-badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .badge-organizer { background: #fffbeb; color: #92400e; }
    .badge-guest { background: #ede9fe; color: #6d28d9; }
    .event-date { font-size: 0.78rem; color: #9ca3af; }
    .event-title { font-size: 1rem; font-weight: 800; color: #111; line-height: 1.3; }
    .event-desc { font-size: 0.82rem; color: #9ca3af; line-height: 1.5; flex: 1; }
    .event-footer { font-size: 0.82rem; font-weight: 700; color: #6b7280; padding-top: 8px; border-top: 1px solid #f3f4f6; }
    .event-card:hover .event-footer { color: #111; }

    @media (max-width: 900px) { .events-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .events-grid { grid-template-columns: 1fr; } }
  `],
})
export class MyEventsPageComponent implements OnInit {
  private readonly dashService = inject(DashboardService);
  readonly data = signal<MyDashboardResponse | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.dashService.getMyDashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}