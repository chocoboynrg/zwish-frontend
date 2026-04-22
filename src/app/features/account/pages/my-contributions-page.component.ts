import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  MyContributionItem,
  MyContributionsResponse,
  MyContributionsService,
} from '../services/my-contributions.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type ContributionFilter =
  | 'ALL'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

@Component({
  selector: 'app-my-contributions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EmptyStateComponent],
  template: `
    <section class="page">
      <header class="hero-card">
        <div class="hero-top">
          <div>
            <span class="eyebrow">Espace utilisateur</span>
            <h1>Mes contributions</h1>
            <p class="subtitle">
              Suivez l’historique de vos participations financières, vos paiements
              en attente et vos contributions déjà confirmées.
            </p>
          </div>

          <a routerLink="/app" class="back-link">← Retour au tableau de bord</a>
        </div>

        <div class="hero-summary" *ngIf="!loading">
          <div class="hero-summary-card hero-summary-card-accent">
            <span class="hero-summary-label">Montant confirmé</span>
            <strong class="hero-summary-value">
              {{ confirmedAmount | number:'1.0-0' }} {{ defaultCurrency }}
            </strong>
            <span class="hero-summary-help">Contributions validées</span>
          </div>

          <div class="hero-summary-card">
            <span class="hero-summary-label">En attente</span>
            <strong class="hero-summary-value">
              {{ awaitingPaymentCount }}
            </strong>
            <span class="hero-summary-help">Paiement à finaliser</span>
          </div>
        </div>
      </header>

      <section class="toolbar-card">
        <div class="toolbar-copy">
          <div class="section-kicker">Filtrage</div>
          <h2>Afficher mes contributions</h2>
        </div>

        <div class="toolbar">
          <label for="status">Statut</label>
          <select
            id="status"
            [(ngModel)]="selectedStatus"
            (change)="loadContributions()"
          >
            <option value="ALL">Tous</option>
            <option value="AWAITING_PAYMENT">En attente de paiement</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="FAILED">Échouées</option>
            <option value="CANCELLED">Annulées</option>
            <option value="REFUNDED">Remboursées</option>
          </select>
        </div>
      </section>

      <div *ngIf="loading" class="state-card">
        <div class="state-title">Chargement des contributions...</div>
        <div class="state-text">Préparation de votre historique.</div>
      </div>

      <div *ngIf="error && !loading" class="state-card error">
        <div class="state-title">Impossible de charger les contributions</div>
        <div class="state-text">{{ error }}</div>
      </div>

      <ng-container *ngIf="!loading && data">
        <section class="stats-grid">
          <article class="stat-card">
            <span class="stat-label">Total contributions</span>
            <strong class="stat-value">
              {{ totalCount }}
            </strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Confirmées</span>
            <strong class="stat-value">
              {{ confirmedCount }}
            </strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">En attente</span>
            <strong class="stat-value">
              {{ awaitingPaymentCount }}
            </strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Montant confirmé</span>
            <strong class="stat-value">
              {{ confirmedAmount | number:'1.0-0' }} {{ defaultCurrency }}
            </strong>
          </article>
        </section>

        <app-empty-state
          *ngIf="!items.length"
          icon="🤝"
          title="Aucune contribution"
          description="Aucune contribution trouvée pour ce filtre."
        />

        <div class="contributions-list" *ngIf="items.length > 0">
          <article class="contribution-card" *ngFor="let contribution of items">
            <div class="card-top">
              <div class="card-main">
                <h2>{{ contribution.wishlistItem?.title || 'Contribution' }}</h2>
                <p class="event-name">
                  {{ contribution.event?.title || 'Événement non renseigné' }}
                </p>
              </div>

              <span class="badge" [ngClass]="getStatusClass(contribution.status)">
                {{ formatStatus(contribution.status) }}
              </span>
            </div>

            <div class="card-grid">
              <div class="info-block">
                <span class="info-label">Montant</span>
                <strong>
                  {{ toNumber(contribution.amount) | number:'1.0-0' }}
                  {{ contribution.currencyCode || defaultCurrency }}
                </strong>
              </div>

              <div class="info-block">
                <span class="info-label">Date</span>
                <strong>{{ contribution.createdAt | date:'medium' }}</strong>
              </div>

              <div class="info-block">
                <span class="info-label">Anonymat</span>
                <strong>{{ contribution.isAnonymous ? 'Oui' : 'Non' }}</strong>
              </div>

              <div class="info-block">
                <span class="info-label">Paiement</span>
                <strong>{{ formatPaymentStatus(contribution.payment?.status) }}</strong>
              </div>
            </div>

            <div
              class="payment-cta"
              *ngIf="
                contribution.status === 'AWAITING_PAYMENT' &&
                contribution.payment?.id
              "
            >
              <button
                type="button"
                class="btn btn-primary"
                (click)="goToPayment(contribution.payment!.id)"
              >
                Payer maintenant
              </button>
            </div>

            <div class="extra-lines">
              <p *ngIf="contribution.payment?.provider">
                <span class="muted">Prestataire :</span>
                {{ contribution.payment?.provider }}
              </p>

              <p *ngIf="contribution.payment?.paymentMethod">
                <span class="muted">Méthode :</span>
                {{ contribution.payment?.paymentMethod }}
              </p>

              <p *ngIf="contribution.confirmedAt">
                <span class="muted">Confirmée le :</span>
                {{ contribution.confirmedAt | date:'medium' }}
              </p>

              <p *ngIf="contribution.message">
                <span class="muted">Message :</span>
                {{ contribution.message }}
              </p>
            </div>
          </article>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      color: #111827;
    }

    .hero-card,
    .toolbar-card,
    .stat-card,
    .state-card,
    .contribution-card {
      background: #ffffff;
      border: 1px solid #f3e8e2;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .hero-card {
      padding: 24px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.16), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.10), transparent 32%),
        linear-gradient(135deg, #fff7f2, #ffffff 58%);
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .eyebrow,
    .section-kicker {
      color: #ea580c;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hero-card h1 {
      margin: 8px 0 10px;
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #111827;
    }

    .subtitle {
      margin: 0;
      color: #4b5563;
      line-height: 1.7;
      max-width: 760px;
    }

    .back-link {
      text-decoration: none;
      color: #ea580c;
      font-weight: 700;
      white-space: nowrap;
    }

    .back-link:hover {
      color: #c2410c;
    }

    .hero-summary {
      margin-top: 22px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .hero-summary-card {
      border-radius: 22px;
      padding: 18px;
      border: 1px solid #f3e8e2;
      background: white;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .hero-summary-card-accent {
      background: linear-gradient(135deg, #fff1e8, #ffffff);
    }

    .hero-summary-label {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .hero-summary-value {
      font-size: 1.7rem;
      line-height: 1.15;
      color: #111827;
    }

    .hero-summary-help {
      color: #6b7280;
      font-size: 0.92rem;
    }

    .toolbar-card {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .toolbar-copy h2 {
      margin: 4px 0 0;
      font-size: 1.25rem;
      color: #111827;
    }

    .toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .toolbar label {
      font-weight: 700;
      color: #374151;
    }

    .toolbar select {
      min-width: 240px;
      padding: 11px 13px;
      border: 1px solid #e5d7cf;
      border-radius: 14px;
      background: white;
      color: #111827;
      font: inherit;
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
      min-height: 120px;
      justify-content: center;
    }

    .stat-label {
      color: #6b7280;
      font-size: 14px;
    }

    .stat-value {
      font-size: 1.7rem;
      line-height: 1.2;
      color: #111827;
    }

    .state-card {
      padding: 18px 20px;
    }

    .state-card.error {
      border-color: #fecaca;
      background: #fff7f7;
    }

    .state-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .state-text {
      color: #6b7280;
      line-height: 1.6;
    }

    .contributions-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .contribution-card {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: linear-gradient(180deg, #fffdfc 0%, #ffffff 100%);
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .card-main h2 {
      margin: 0 0 6px;
      font-size: 1.2rem;
      color: #111827;
    }

    .event-name {
      margin: 0;
      color: #6b7280;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }

    .info-block {
      border: 1px solid #f3e8e2;
      border-radius: 16px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #fffaf7;
    }

    .info-label {
      font-size: 13px;
      color: #6b7280;
    }

    .payment-cta {
      display: flex;
      justify-content: flex-end;
    }

    .extra-lines {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .extra-lines p {
      margin: 0;
      color: #374151;
      line-height: 1.6;
    }

    .muted {
      color: #6b7280;
      font-weight: 700;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 7px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }

    .badge-confirmed {
      background: #dcfce7;
      color: #166534;
    }

    .badge-awaiting {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-failed,
    .badge-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-refunded {
      background: #e0f2fe;
      color: #075985;
    }

    .badge-default {
      background: #e5e7eb;
      color: #374151;
    }

    .btn {
      border: 0;
      border-radius: 14px;
      padding: 11px 16px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
      transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 14px 28px rgba(255, 122, 89, 0.18);
    }

    @media (max-width: 900px) {
      .hero-top,
      .toolbar-card,
      .card-top {
        flex-direction: column;
        align-items: stretch;
      }

      .hero-summary {
        grid-template-columns: 1fr;
      }

      .payment-cta {
        justify-content: stretch;
      }

      .payment-cta .btn {
        width: 100%;
      }
    }

    @media (max-width: 640px) {
      .hero-card,
      .toolbar-card,
      .stat-card,
      .state-card,
      .contribution-card {
        border-radius: 20px;
      }

      .hero-card,
      .toolbar-card,
      .state-card,
      .contribution-card {
        padding: 18px;
      }

      .toolbar select {
        min-width: 0;
        width: 100%;
      }
    }
  `],
})
export class MyContributionsPageComponent implements OnInit {
  private readonly myContributionsService = inject(MyContributionsService);
  private readonly router = inject(Router);

  loading = true;
  error = '';
  data: MyContributionsResponse | null = null;

  selectedStatus: ContributionFilter = 'ALL';
  defaultCurrency = 'FCFA';

  items: MyContributionItem[] = [];
  totalCount = 0;
  confirmedCount = 0;
  awaitingPaymentCount = 0;
  confirmedAmount = 0;

  ngOnInit(): void {
    this.loadContributions();
  }

  loadContributions(): void {
    this.loading = true;
    this.error = '';

    this.myContributionsService.getMine(this.selectedStatus).subscribe({
      next: (response) => {
        this.data = response;
        this.items = response?.items ?? [];
        this.computeSummaryFromItems(this.items);
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos contributions.';
        this.loading = false;
      },
    });
  }

  goToPayment(paymentId: number): void {
    this.router.navigate(['/app/payments', paymentId]);
  }

  toNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmée';
      case 'AWAITING_PAYMENT':
        return 'En attente de paiement';
      case 'FAILED':
        return 'Échouée';
      case 'CANCELLED':
        return 'Annulée';
      case 'REFUNDED':
        return 'Remboursée';
      default:
        return status || '—';
    }
  }

  formatPaymentStatus(status?: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'SUCCESS':
      case 'SUCCEEDED':
        return 'Réussi';
      case 'FAILED':
        return 'Échoué';
      case 'CANCELLED':
        return 'Annulé';
      case 'REFUNDED':
        return 'Remboursé';
      case 'INITIATED':
        return 'Initié';
      default:
        return status || '—';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'badge-confirmed';
      case 'AWAITING_PAYMENT':
        return 'badge-awaiting';
      case 'FAILED':
        return 'badge-failed';
      case 'CANCELLED':
        return 'badge-cancelled';
      case 'REFUNDED':
        return 'badge-refunded';
      default:
        return 'badge-default';
    }
  }

  private computeSummaryFromItems(items: MyContributionItem[]): void {
    this.totalCount = items.length;

    this.confirmedCount = items.filter(
      (item) => item.status === 'CONFIRMED'
    ).length;

    this.awaitingPaymentCount = items.filter(
      (item) => item.status === 'AWAITING_PAYMENT'
    ).length;

    this.confirmedAmount = items
      .filter((item) => item.status === 'CONFIRMED')
      .reduce((sum, item) => sum + this.toNumber(item.amount), 0);

    const firstCurrency = items.find((item) => item.currencyCode)?.currencyCode;
    if (firstCurrency) {
      this.defaultCurrency = firstCurrency;
    }
  }
}