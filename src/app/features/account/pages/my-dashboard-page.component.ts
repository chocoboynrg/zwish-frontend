import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

import { DashboardService, MyDashboardResponse } from '../services/dashboard.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-my-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  template: `
    <section class="page">
      <div class="hero-card">
        <div class="hero-copy">
          <span class="eyebrow">Mon espace ZWish</span>
          <h1>Mon tableau de bord</h1>
          <p class="subtitle">
            Retrouvez en un coup d’œil vos événements, contributions et paiements.
          </p>
        </div>

        <div class="hero-actions">
          <a routerLink="/app/events/new" class="btn btn-primary">
            Créer un événement
          </a>
          <a routerLink="/app/events" class="btn btn-secondary">
            Voir mes événements
          </a>
        </div>
      </div>

      <div *ngIf="loading" class="state-card">
        Chargement du tableau de bord...
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

          <article class="stat-card">
            <span class="stat-label">Contributions confirmées</span>
            <strong class="stat-value">
              {{ data.summary?.confirmedContributions ?? 0 }}
            </strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Paiements réussis</span>
            <strong class="stat-value">
              {{ data.summary?.succeededPayments ?? 0 }}
            </strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Montant contribué</span>
            <strong class="stat-value">
              {{ data.summary?.confirmedContributionsAmount ?? 0 | number:'1.0-0' }} FCFA
            </strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Paiements initiés</span>
            <strong class="stat-value">
              {{ data.summary?.initiatedPayments ?? 0 }}
            </strong>
          </article>
        </div>

        <div class="content-grid">
          <section class="panel">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Organisation</span>
                <h2>Mes événements organisés</h2>
              </div>
              <a routerLink="/app/events" class="link-btn">Voir tout</a>
            </div>

            <app-empty-state
              *ngIf="!data.organizedEvents.length"
              icon="🎉"
              title="Aucun événement organisé"
              description="Créez votre premier événement pour commencer."
              actionLabel="Créer un événement"
              (actionClick)="goToCreateEvent()"
            />

            <div class="list" *ngIf="data.organizedEvents.length">
              <article class="list-item" *ngFor="let event of data.organizedEvents">
                <div>
                  <h3>{{ event.title }}</h3>
                  <p>{{ event.eventDate | date:'mediumDate' }}</p>
                </div>

                <a class="open-link" [routerLink]="['/app/events', event.id]">
                  Ouvrir
                </a>
              </article>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <span class="panel-kicker">Participation</span>
                <h2>Mes événements rejoints</h2>
              </div>
            </div>

            <app-empty-state
              *ngIf="!data.joinedEvents.length"
              icon="🤝"
              title="Aucun événement rejoint"
              description="Les événements auxquels vous participez apparaîtront ici."
            />

            <div class="list" *ngIf="data.joinedEvents.length">
              <article class="list-item" *ngFor="let event of data.joinedEvents">
                <div>
                  <h3>{{ event.title }}</h3>
                  <p>{{ event.eventDate | date:'mediumDate' }}</p>
                </div>

                <a class="open-link" [routerLink]="['/app/events', event.id]">
                  Ouvrir
                </a>
              </article>
            </div>
          </section>
        </div>

        <div class="quick-links">
          <a routerLink="/app/notifications" class="quick-link-card">
            <span class="quick-title">Notifications</span>
            <span class="quick-text">Voir mes alertes et rappels</span>
          </a>

          <a routerLink="/app/contributions" class="quick-link-card">
            <span class="quick-title">Contributions</span>
            <span class="quick-text">Suivre mes participations financières</span>
          </a>

          <a routerLink="/app/payments" class="quick-link-card">
            <span class="quick-title">Paiements</span>
            <span class="quick-text">Consulter mes transactions</span>
          </a>

          <a routerLink="/app/events" class="quick-link-card">
            <span class="quick-title">Événements</span>
            <span class="quick-text">Gérer ou rejoindre mes événements</span>
          </a>
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
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .hero-card,
    .stat-card,
    .panel,
    .state-card,
    .quick-link-card {
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
      gap: 20px;
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

    .hero-copy h1 {
      margin: 0 0 8px;
      font-size: 2rem;
      color: #111827;
    }

    .subtitle {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      padding: 12px 18px;
      text-decoration: none;
      font-weight: 700;
      border: 1px solid transparent;
      transition: 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border-color: #eadfd9;
    }

    .btn-primary:hover,
    .btn-secondary:hover,
    .quick-link-card:hover {
      transform: translateY(-1px);
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

    .link-btn,
    .open-link {
      text-decoration: none;
      color: #ff7a59;
      font-weight: 700;
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

    .list-item h3 {
      margin: 0 0 6px;
      font-size: 16px;
      color: #111827;
    }

    .list-item p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
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

    .quick-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .quick-link-card {
      padding: 18px;
      text-decoration: none;
      color: #111827;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: 0.2s ease;
    }

    .quick-title {
      font-weight: 700;
    }

    .quick-text {
      color: #6b7280;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    @media (max-width: 900px) {
      .hero-card,
      .content-grid {
        grid-template-columns: 1fr;
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `],
})
export class MyDashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  loading = true;
  error = '';
  data: MyDashboardResponse | null = null;

  ngOnInit(): void {
    this.dashboardService.getMyDashboard().subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger votre tableau de bord.';
        this.loading = false;
      },
    });
  }

  goToCreateEvent(): void {
    this.router.navigate(['/app/events/new']);
  }
}