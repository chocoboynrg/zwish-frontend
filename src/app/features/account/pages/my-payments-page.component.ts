import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  MyPaymentItem,
  MyPaymentsResponse,
  MyPaymentsService,
} from '../services/my-payments.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type PaymentFilter =
  | 'ALL'
  | 'SUCCEEDED'
  | 'PENDING'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

@Component({
  selector: 'app-my-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, EmptyStateComponent],
  template: `
    <section class="page">
      <header class="hero-card">
        <div class="hero-top">
          <div>
            <span class="eyebrow">Espace utilisateur</span>
            <h1>Mes paiements</h1>
            <p class="subtitle">
              Suivez l’historique de vos transactions, reprenez un paiement en attente
              et visualisez rapidement les paiements réussis, en cours ou échoués.
            </p>
          </div>

          <a routerLink="/app" class="back-link">← Retour au tableau de bord</a>
        </div>

        <div class="hero-summary" *ngIf="!loading">
          <div class="hero-summary-card hero-summary-card-accent">
            <span class="hero-summary-label">Montant payé</span>
            <strong class="hero-summary-value">
              {{ succeededAmount | number:'1.0-0' }} {{ defaultCurrency }}
            </strong>
            <span class="hero-summary-help">
              {{ succeededCount }} paiement(s) réussi(s)
            </span>
          </div>

          <div class="hero-summary-card">
            <span class="hero-summary-label">Paiements en attente</span>
            <strong class="hero-summary-value">
              {{ pendingCount }}
            </strong>
            <span class="hero-summary-help">Transactions à finaliser</span>
          </div>

          <div class="hero-summary-card">
            <span class="hero-summary-label">Paiements échoués</span>
            <strong class="hero-summary-value">
              {{ failedCount }}
            </strong>
            <span class="hero-summary-help">À vérifier ou relancer</span>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="state-card">
        <div class="state-title">Chargement des paiements...</div>
        <div class="state-text">Préparation de votre historique de transactions.</div>
      </div>

      <div *ngIf="error && !loading" class="state-card error">
        <div class="state-title">Impossible de charger vos paiements</div>
        <div class="state-text">{{ error }}</div>
      </div>

      <ng-container *ngIf="!loading && data">
        <section class="stats-grid">
          <article class="stat-card">
            <span class="stat-label">Total paiements</span>
            <strong class="stat-value">{{ totalCount }}</strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Réussis</span>
            <strong class="stat-value">{{ succeededCount }}</strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">En attente</span>
            <strong class="stat-value">{{ pendingCount }}</strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Échoués</span>
            <strong class="stat-value">{{ failedCount }}</strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Montant payé</span>
            <strong class="stat-value">
              {{ succeededAmount | number:'1.0-0' }} {{ defaultCurrency }}
            </strong>
          </article>
        </section>

        <section class="filters-card" *ngIf="items.length > 0">
          <div class="filters-top">
            <div class="search-box">
              <label for="payment-search">Recherche</label>
              <input
                id="payment-search"
                type="text"
                [(ngModel)]="searchTerm"
                placeholder="Rechercher un événement, un item, une référence..."
              />
            </div>

            <div class="summary-mini">
              <span>{{ filteredItems.length }} résultat(s)</span>
            </div>
          </div>

          <div class="filter-chips">
            <button
              type="button"
              class="filter-chip"
              [class.active]="selectedFilter === 'ALL'"
              (click)="selectedFilter = 'ALL'"
            >
              Tous
            </button>

            <button
              type="button"
              class="filter-chip filter-chip-success"
              [class.active]="selectedFilter === 'SUCCEEDED'"
              (click)="selectedFilter = 'SUCCEEDED'"
            >
              Réussis
            </button>

            <button
              type="button"
              class="filter-chip filter-chip-pending"
              [class.active]="selectedFilter === 'PENDING'"
              (click)="selectedFilter = 'PENDING'"
            >
              En attente
            </button>

            <button
              type="button"
              class="filter-chip filter-chip-failed"
              [class.active]="selectedFilter === 'FAILED'"
              (click)="selectedFilter = 'FAILED'"
            >
              Échoués
            </button>

            <button
              type="button"
              class="filter-chip"
              [class.active]="selectedFilter === 'CANCELLED'"
              (click)="selectedFilter = 'CANCELLED'"
            >
              Annulés
            </button>

            <button
              type="button"
              class="filter-chip"
              [class.active]="selectedFilter === 'REFUNDED'"
              (click)="selectedFilter = 'REFUNDED'"
            >
              Remboursés
            </button>
          </div>
        </section>

        <app-empty-state
          *ngIf="!items.length"
          icon="💳"
          title="Aucun paiement"
          description="Vos paiements apparaîtront ici."
        />

        <app-empty-state
          *ngIf="items.length > 0 && !filteredItems.length"
          icon="🔎"
          title="Aucun résultat"
          description="Aucun paiement ne correspond à votre recherche ou au filtre choisi."
        />

        <div class="payments-list payments-grid" *ngIf="filteredItems.length > 0">
          <article class="payment-card" *ngFor="let payment of filteredItems">
            <div class="payment-card-top">
              <div class="payment-card-main">
                <div class="payment-kicker">
                  {{ payment.contribution?.event?.title || 'Événement non renseigné' }}
                </div>

                <h2>{{ payment.contribution?.wishlistItem?.title || 'Paiement' }}</h2>

                <p class="payment-subtitle">
                  Paiement #{{ payment.id }} · Créé le {{ payment.createdAt | date:'medium' }}
                </p>
              </div>

              <div class="payment-status-wrap">
                <span class="badge" [ngClass]="getStatusClass(payment.status)">
                  {{ formatStatus(payment.status) }}
                </span>
              </div>
            </div>

            <div class="payment-highlight-row">
              <div class="amount-box">
                <span class="amount-label">Montant</span>
                <strong class="amount-value">
                  {{ toNumber(payment.amount) | number:'1.0-0' }}
                  {{ payment.currencyCode || defaultCurrency }}
                </strong>
              </div>

              <div class="quick-meta">
                <span>{{ payment.provider || 'Prestataire non renseigné' }}</span>
                <span>{{ payment.paymentMethod || 'Méthode non renseignée' }}</span>
              </div>
            </div>

            <div class="card-grid">
              <div class="info-block">
                <span class="info-label">Prestataire</span>
                <strong>{{ payment.provider || '—' }}</strong>
              </div>

              <div class="info-block">
                <span class="info-label">Méthode</span>
                <strong>{{ payment.paymentMethod || '—' }}</strong>
              </div>

              <div class="info-block">
                <span class="info-label">Contribution</span>
                <strong>{{ formatContributionStatus(payment.contribution?.status) }}</strong>
              </div>

              <div class="info-block">
                <span class="info-label">Date</span>
                <strong>{{ payment.createdAt | date:'medium' }}</strong>
              </div>
            </div>

            <div class="timeline-strip">
              <div class="timeline-pill" *ngIf="payment.initiatedAt">
                Initié : {{ payment.initiatedAt | date:'short' }}
              </div>

              <div class="timeline-pill timeline-pill-success" *ngIf="payment.confirmedAt">
                Confirmé : {{ payment.confirmedAt | date:'short' }}
              </div>

              <div class="timeline-pill timeline-pill-failed" *ngIf="payment.failedAt">
                Échec : {{ payment.failedAt | date:'short' }}
              </div>

              <div class="timeline-pill" *ngIf="payment.refundedAt">
                Remboursé : {{ payment.refundedAt | date:'short' }}
              </div>
            </div>

            <div class="extra-lines">
              <p *ngIf="payment.providerReference">
                <span class="muted">Référence :</span>
                {{ payment.providerReference }}
              </p>

              <p *ngIf="payment.providerTransactionId">
                <span class="muted">Transaction PSP :</span>
                {{ payment.providerTransactionId }}
              </p>

              <p *ngIf="payment.failureReason">
                <span class="muted">Motif d’échec :</span>
                {{ payment.failureReason }}
              </p>
            </div>

            <div class="card-actions">
              <a
                class="btn btn-secondary link-btn"
                [routerLink]="['/app/payments', payment.id]"
              >
                Voir détail
              </a>

              <a
                *ngIf="canRetryPayment(payment)"
                class="btn btn-primary link-btn"
                [href]="payment.paymentUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                Reprendre le paiement
              </a>
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
    .stat-card,
    .state-card,
    .payment-card,
    .filters-card {
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

    .state-card,
    .payment-card,
    .filters-card {
      padding: 20px;
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .eyebrow {
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
      grid-template-columns: repeat(3, minmax(0, 1fr));
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
      margin: 0;
    }

    .filters-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 16px;
    }

    .search-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .search-box label {
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
    }

    .search-box input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #e5d7cf;
      border-radius: 14px;
      padding: 11px 13px;
      font: inherit;
      background: #ffffff;
      color: #111827;
    }

    .summary-mini {
      color: #6b7280;
      font-size: 0.92rem;
      white-space: nowrap;
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .filter-chip {
      border: 1px solid #f3dfd4;
      background: #fff7f3;
      color: #9a3412;
      border-radius: 999px;
      padding: 10px 14px;
      cursor: pointer;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 700;
      transition: all 0.16s ease;
    }

    .filter-chip:hover {
      transform: translateY(-1px);
    }

    .filter-chip.active {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: #ffffff;
      border-color: transparent;
      box-shadow: 0 12px 22px rgba(255, 122, 89, 0.18);
    }

    .filter-chip-success:not(.active) {
      background: #f0fdf4;
      color: #166534;
      border-color: #bbf7d0;
    }

    .filter-chip-pending:not(.active) {
      background: #fff7ed;
      color: #9a3412;
      border-color: #fed7aa;
    }

    .filter-chip-failed:not(.active) {
      background: #fef2f2;
      color: #991b1b;
      border-color: #fecaca;
    }

    .payments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .payments-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .payment-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: linear-gradient(180deg, #fffdfc 0%, #ffffff 100%);
      min-width: 0;
    }

    .payment-card-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .payment-card-main {
      min-width: 0;
      flex: 1;
    }

    .payment-kicker {
      color: #ea580c;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    .payment-card-main h2 {
      margin: 0 0 6px;
      font-size: 1.2rem;
      line-height: 1.35;
      color: #111827;
    }

    .payment-subtitle {
      margin: 0;
      color: #6b7280;
      line-height: 1.5;
    }

    .payment-status-wrap {
      display: flex;
      justify-content: flex-end;
      flex-shrink: 0;
    }

    .payment-highlight-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 18px;
      background: linear-gradient(135deg, #fff7f2, #ffffff);
      border: 1px solid #f3e8e2;
    }

    .amount-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .amount-label {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .amount-value {
      font-size: 1.35rem;
      line-height: 1.1;
      color: #111827;
      letter-spacing: -0.02em;
    }

    .quick-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: right;
      font-size: 0.82rem;
      color: #6b7280;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
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

    .timeline-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .timeline-pill {
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #374151;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .timeline-pill-success {
      background: #dcfce7;
      color: #166534;
    }

    .timeline-pill-failed {
      background: #fee2e2;
      color: #991b1b;
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
      word-break: break-word;
    }

    .muted {
      color: #6b7280;
      font-weight: 700;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: auto;
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

    .badge-succeeded {
      background: #dcfce7;
      color: #166534;
    }

    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-cancelled,
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
      text-align: center;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 14px 28px rgba(255, 122, 89, 0.18);
    }

    .btn-secondary {
      background: #fff7f3;
      color: #9a3412;
      border: 1px solid #f3dfd4;
    }

    .link-btn {
      text-decoration: none;
    }

    @media (max-width: 1100px) {
      .hero-summary,
      .payments-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 900px) {
      .hero-top,
      .payment-card-top,
      .filters-top {
        flex-direction: column;
        align-items: stretch;
      }

      .card-grid {
        grid-template-columns: 1fr;
      }

      .card-actions {
        justify-content: stretch;
      }

      .card-actions .btn {
        width: 100%;
      }

      .quick-meta,
      .summary-mini {
        text-align: left;
      }

      .payment-status-wrap {
        justify-content: flex-start;
      }

      .payment-highlight-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    @media (max-width: 640px) {
      .hero-card,
      .stat-card,
      .state-card,
      .payment-card,
      .filters-card {
        border-radius: 20px;
      }

      .hero-card,
      .state-card,
      .payment-card,
      .filters-card {
        padding: 18px;
      }

      .filter-chips {
        gap: 8px;
      }

      .filter-chip,
      .card-actions .btn {
        width: 100%;
      }

      .amount-value {
        font-size: 1.15rem;
      }
    }
  `],
})
export class MyPaymentsPageComponent implements OnInit {
  private readonly myPaymentsService = inject(MyPaymentsService);

  loading = true;
  error = '';
  data: MyPaymentsResponse | null = null;

  items: MyPaymentItem[] = [];
  totalCount = 0;
  defaultCurrency = 'XOF';
  succeededCount = 0;
  pendingCount = 0;
  failedCount = 0;
  succeededAmount = 0;

  selectedFilter: PaymentFilter = 'ALL';
  searchTerm = '';

  ngOnInit(): void {
    this.loadPayments();
  }

  get filteredItems(): MyPaymentItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.items.filter((payment) => {
      const normalizedStatus = this.normalizePaymentStatus(payment.status);

      const matchesFilter =
        this.selectedFilter === 'ALL' || normalizedStatus === this.selectedFilter;

      const searchHaystack = [
        payment.contribution?.wishlistItem?.title,
        payment.contribution?.event?.title,
        payment.provider,
        payment.paymentMethod,
        payment.providerReference,
        payment.providerTransactionId,
        payment.failureReason,
        String(payment.id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !term || searchHaystack.includes(term);

      return matchesFilter && matchesSearch;
    });
  }

  loadPayments(): void {
    this.loading = true;
    this.error = '';

    this.myPaymentsService.getMine().subscribe({
      next: (response: MyPaymentsResponse) => {
        this.data = response;
        this.items = response?.items ?? [];
        this.computeSummary(this.items, response.summary);
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos paiements.';
        this.loading = false;
      },
    });
  }

  toNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatStatus(status: string | null | undefined): string {
    switch (status) {
      case 'SUCCEEDED':
        return 'Réussi';
      case 'INITIATED':
        return 'Initié';
      case 'PENDING':
        return 'En attente';
      case 'FAILED':
        return 'Échoué';
      case 'CANCELLED':
        return 'Annulé';
      case 'REFUNDED':
        return 'Remboursé';
      default:
        return status || '—';
    }
  }

  formatContributionStatus(status: string | null | undefined): string {
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
      case 'PENDING':
        return 'En attente';
      default:
        return status || '—';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCEEDED':
        return 'badge-succeeded';
      case 'INITIATED':
      case 'PENDING':
        return 'badge-pending';
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

  canRetryPayment(payment: MyPaymentItem): boolean {
    return (
      (payment.status === 'INITIATED' || payment.status === 'PENDING') &&
      !!payment.paymentUrl
    );
  }

  private normalizePaymentStatus(status: string | null | undefined): PaymentFilter {
    switch (status) {
      case 'SUCCEEDED':
        return 'SUCCEEDED';
      case 'INITIATED':
      case 'PENDING':
        return 'PENDING';
      case 'FAILED':
        return 'FAILED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'REFUNDED':
        return 'REFUNDED';
      default:
        return 'ALL';
    }
  }

  private computeSummary(
    items: MyPaymentItem[],
    summary?: MyPaymentsResponse['summary'],
  ): void {
    this.items = items;

    if (summary) {
      this.totalCount = summary.totalCount ?? items.length;
      this.succeededCount = summary.succeededCount ?? 0;
      this.pendingCount = summary.pendingCount ?? 0;
      this.failedCount = summary.failedCount ?? 0;
      this.succeededAmount = Number(summary.totalSucceededAmount ?? 0);
      this.defaultCurrency =
        summary.currencyCode ||
        items.find((item) => item.currencyCode)?.currencyCode ||
        'XOF';
      return;
    }

    this.totalCount = items.length;

    this.succeededCount = items.filter((item) => item.status === 'SUCCEEDED').length;

    this.pendingCount = items.filter(
      (item) => item.status === 'INITIATED' || item.status === 'PENDING',
    ).length;

    this.failedCount = items.filter((item) => item.status === 'FAILED').length;

    this.succeededAmount = items
      .filter((item) => item.status === 'SUCCEEDED')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const firstCurrency = items.find((item) => item.currencyCode)?.currencyCode;
    if (firstCurrency) {
      this.defaultCurrency = firstCurrency;
    }
  }
}