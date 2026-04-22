import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  DashboardService,
  MyDashboardResponse,
} from '../services/dashboard.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-my-events-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  template: `
    <section class="page">
      <div class="hero-card">
        <div>
          <span class="eyebrow">Mes événements</span>
          <h1>Retrouvez vos événements</h1>
          <p class="subtitle">
            Gérez les événements que vous organisez et ceux auxquels vous participez.
          </p>
        </div>

        <a routerLink="/app/events/new" class="create-link">
          Créer un événement
        </a>
      </div>

      <div *ngIf="loading" class="state-card">
        Chargement des événements...
      </div>

      <div *ngIf="error && !loading" class="state-card error">
        {{ error }}
      </div>

      <ng-container *ngIf="data && !loading">
        <div class="stats-grid">
          <article class="stat-card">
            <span class="stat-label">Événements organisés</span>
            <strong class="stat-value">
              {{ data.summary?.organizedEventsCount ?? data.organizedEvents.length }}
            </strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Événements rejoints</span>
            <strong class="stat-value">
              {{ data.summary?.participatingEventsCount ?? data.joinedEvents.length }}
            </strong>
          </article>
        </div>

        <div class="content-grid">
          <section class="panel">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Organisation</span>
                <h2>J’organise</h2>
              </div>
            </div>

            <app-empty-state
              *ngIf="data.organizedEvents.length === 0"
              icon="🎉"
              title="Aucun événement organisé"
              description="Créez votre premier événement pour commencer."
              actionLabel="Créer un événement"
              (actionClick)="goToCreateEvent()"
            />

            <div class="list" *ngIf="data.organizedEvents.length > 0">
              <article class="list-item" *ngFor="let event of data.organizedEvents">
                <div class="main">
                  <h3>{{ event.title }}</h3>
                  <p>{{ event.eventDate | date:'mediumDate' }}</p>
                </div>

                <div class="actions">
                  <span class="badge">ORGANIZER</span>
                  <a class="action-link" [routerLink]="['/app/events', event.id]">
                    Ouvrir
                  </a>
                </div>
              </article>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Participation</span>
                <h2>Je participe</h2>
              </div>
            </div>

            <app-empty-state
              *ngIf="data.joinedEvents.length === 0"
              icon="🤝"
              title="Aucun événement rejoint"
              description="Les événements rejoints apparaîtront ici."
            />

            <div class="list" *ngIf="data.joinedEvents.length > 0">
              <article class="list-item" *ngFor="let event of data.joinedEvents">
                <div class="main">
                  <h3>{{ event.title }}</h3>
                  <p>{{ event.eventDate | date:'mediumDate' }}</p>
                </div>

                <div class="actions">
                  <span class="badge">{{ event.participantRole || 'PARTICIPANT' }}</span>
                  <a class="action-link" [routerLink]="['/app/events', event.id]">
                    Ouvrir
                  </a>
                </div>
              </article>
            </div>
          </section>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      background: #fffaf8;
      min-height: 100%;
    }

    .page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px;
    }

    .hero-card,
    .stat-card,
    .panel,
    .state-card {
      background: #ffffff;
      border: 1px solid #f0e5df;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .hero-card {
      padding: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.14), transparent 30%),
        linear-gradient(135deg, #fff5f0, #ffffff);
    }

    .eyebrow,
    .panel-kicker {
      display: inline-block;
      margin-bottom: 10px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .hero-card h1 {
      margin: 0 0 8px;
      font-size: 2rem;
      color: #111827;
    }

    .subtitle {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
    }

    .create-link {
      text-decoration: none;
      color: white;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      padding: 12px 18px;
      border-radius: 14px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
      white-space: nowrap;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-label {
      color: #6b7280;
      font-size: 14px;
    }

    .stat-value {
      font-size: 28px;
      color: #111827;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .panel {
      padding: 22px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
      margin-bottom: 16px;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 20px;
      color: #111827;
    }

    .list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .list-item {
      border: 1px solid #ece4df;
      border-radius: 16px;
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: #fffdfc;
    }

    .main h3 {
      margin: 0 0 6px;
      font-size: 16px;
      color: #111827;
    }

    .main p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: #eef2ff;
      color: #4338ca;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .action-link {
      text-decoration: none;
      color: #ff7a59;
      font-weight: 700;
    }

    .state-card {
      padding: 18px;
      color: #374151;
    }

    .state-card.error {
      color: #b91c1c;
      background: #fff7f7;
      border-color: #fecaca;
    }

    @media (max-width: 900px) {
      .hero-card,
      .content-grid,
      .list-item {
        flex-direction: column;
        align-items: flex-start;
        grid-template-columns: 1fr;
      }

      .actions {
        justify-content: flex-start;
      }
    }
  `],
})
export class MyEventsPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  loading = true;
  error = '';
  data: MyDashboardResponse | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';

    this.dashboardService.getMyDashboard().subscribe({
      next: (response: MyDashboardResponse) => {
        this.data = response;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos événements.';
        this.loading = false;
      },
    });
  }

  goToCreateEvent(): void {
    this.router.navigate(['/app/events/new']);
  }
}