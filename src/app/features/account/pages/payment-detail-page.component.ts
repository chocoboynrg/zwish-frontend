import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  MyPaymentItem,
  MyPaymentsService,
} from '../services/my-payments.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-payment-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  template: `
    <section class="page">
      <div class="top-nav">
        <a routerLink="/app/payments" class="back-link">← Retour à mes paiements</a>
      </div>

      <div *ngIf="loading" class="state-card">
        <div class="state-title">Chargement du paiement...</div>
        <div class="state-text">Préparation du détail de la transaction.</div>
      </div>

      <div *ngIf="error && !loading" class="state-card error">
        <div class="state-title">Impossible de charger le paiement</div>
        <div class="state-text">{{ error }}</div>
      </div>

      <ng-container *ngIf="payment && !loading">
        <header class="hero-card">
          <div class="hero-head">
            <div class="hero-main">
              <span class="eyebrow">Détail paiement</span>
              <h1>{{ payment.contribution?.wishlistItem?.title || 'Transaction' }}</h1>
              <p class="hero-subtitle">
                {{ payment.contribution?.event?.title || 'Événement non renseigné' }}
              </p>

              <div class="hero-meta">
                <span class="meta-pill">Paiement #{{ payment.id }}</span>
                <span class="meta-pill">{{ payment.createdAt | date:'medium' }}</span>
                <span class="meta-pill">{{ payment.provider || 'Prestataire non renseigné' }}</span>
              </div>
            </div>

            <div class="hero-side">
              <span class="status-badge" [ngClass]="getStatusClass(payment.status)">
                {{ formatStatus(payment.status) }}
              </span>

              <div class="hero-amount-card">
                <span class="hero-amount-label">Montant</span>
                <strong class="hero-amount-value">
                  {{ toNumber(payment.amount) | number:'1.0-0' }}
                  {{ payment.currencyCode || 'XOF' }}
                </strong>
                <span class="hero-amount-help">
                  {{ formatContributionStatus(payment.contribution?.status) }}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section class="action-banner" *ngIf="getActionState() as actionState">
          <div class="action-banner-content">
            <div class="action-kicker">Prochaine action</div>
            <h2>{{ actionState.title }}</h2>
            <p>{{ actionState.message }}</p>
          </div>

          <div class="action-banner-actions">
            <a
              *ngIf="actionState.showRetry"
              class="btn btn-primary link-btn"
              [href]="payment.paymentUrl || ''"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reprendre le paiement
            </a>

            <a class="btn btn-secondary link-btn" routerLink="/app/payments">
              Voir tous mes paiements
            </a>
          </div>
        </section>

        <section class="summary-grid">
          <article class="summary-card summary-card-accent">
            <span class="summary-label">Statut paiement</span>
            <strong class="summary-value">{{ formatStatus(payment.status) }}</strong>
            <span class="summary-help">État actuel de la transaction</span>
          </article>

          <article class="summary-card">
            <span class="summary-label">Statut contribution</span>
            <strong class="summary-value">
              {{ formatContributionStatus(payment.contribution?.status) }}
            </strong>
            <span class="summary-help">Synchronisé avec la wishlist</span>
          </article>

          <article class="summary-card">
            <span class="summary-label">Méthode</span>
            <strong class="summary-value">
              {{ payment.paymentMethod || 'Non renseignée' }}
            </strong>
            <span class="summary-help">Canal utilisé pour payer</span>
          </article>
        </section>

        <section class="content-grid">
          <article class="content-card">
            <div class="section-head">
              <div>
                <span class="section-kicker">Transaction</span>
                <h2>Informations générales</h2>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-block">
                <span class="info-label">ID paiement</span>
                <strong>{{ payment.id }}</strong>
              </div>

              <div class="info-block">
                <span class="info-label">Montant</span>
                <strong>
                  {{ toNumber(payment.amount) | number:'1.0-0' }}
                  {{ payment.currencyCode || 'XOF' }}
                </strong>
              </div>

              <div class="info-block">
                <span class="info-label">Prestataire</span>
                <strong>{{ payment.provider || '—' }}</strong>
              </div>

              <div class="info-block">
                <span class="info-label">Méthode</span>
                <strong>{{ payment.paymentMethod || '—' }}</strong>
              </div>

              <div class="info-block" *ngIf="payment.providerReference">
                <span class="info-label">Référence prestataire</span>
                <strong>{{ payment.providerReference }}</strong>
              </div>

              <div class="info-block" *ngIf="payment.providerTransactionId">
                <span class="info-label">Transaction PSP</span>
                <strong>{{ payment.providerTransactionId }}</strong>
              </div>
            </div>
          </article>

          <article class="content-card">
            <div class="section-head">
              <div>
                <span class="section-kicker">Contexte</span>
                <h2>Événement et item</h2>
              </div>
            </div>

            <div class="context-stack">
              <div class="context-block">
                <span class="context-label">Événement</span>
                <strong>{{ payment.contribution?.event?.title || '—' }}</strong>
              </div>

              <div class="context-block">
                <span class="context-label">Item</span>
                <strong>{{ payment.contribution?.wishlistItem?.title || '—' }}</strong>
              </div>

              <div class="context-block">
                <span class="context-label">Montant contribution</span>
                <strong>
                  {{ toNumber(payment.contribution?.amount) | number:'1.0-0' }}
                  {{ payment.currencyCode || 'XOF' }}
                </strong>
              </div>

              <div class="context-block">
                <span class="context-label">Contribution</span>
                <strong>{{ formatContributionStatus(payment.contribution?.status) }}</strong>
              </div>

              <div class="context-block">
                <span class="context-label">Funding item</span>
                <strong>{{ payment.contribution?.wishlistItem?.fundingStatus || '—' }}</strong>
              </div>
            </div>
          </article>
        </section>

        <section class="content-card">
          <div class="section-head">
            <div>
              <span class="section-kicker">Suivi</span>
              <h2>Timeline du paiement</h2>
            </div>
          </div>

          <div class="timeline">
            <div class="timeline-item" [class.active]="!!payment.createdAt">
              <div class="timeline-dot"></div>
              <div class="timeline-body">
                <strong>Création</strong>
                <p>{{ payment.createdAt | date:'medium' }}</p>
              </div>
            </div>

            <div class="timeline-item" [class.active]="!!payment.initiatedAt">
              <div class="timeline-dot"></div>
              <div class="timeline-body">
                <strong>Initialisation</strong>
                <p>
                  {{
                    payment.initiatedAt
                      ? (payment.initiatedAt | date:'medium')
                      : 'Non disponible'
                  }}
                </p>
              </div>
            </div>

            <div class="timeline-item success" [class.active]="!!payment.confirmedAt">
              <div class="timeline-dot"></div>
              <div class="timeline-body">
                <strong>Confirmation</strong>
                <p>
                  {{
                    payment.confirmedAt
                      ? (payment.confirmedAt | date:'medium')
                      : 'Pas encore confirmé'
                  }}
                </p>
              </div>
            </div>

            <div class="timeline-item failed" [class.active]="!!payment.failedAt">
              <div class="timeline-dot"></div>
              <div class="timeline-body">
                <strong>Échec</strong>
                <p>
                  {{
                    payment.failedAt
                      ? (payment.failedAt | date:'medium')
                      : 'Aucun échec enregistré'
                  }}
                </p>
              </div>
            </div>

            <div class="timeline-item refunded" [class.active]="!!payment.refundedAt">
              <div class="timeline-dot"></div>
              <div class="timeline-body">
                <strong>Remboursement</strong>
                <p>
                  {{
                    payment.refundedAt
                      ? (payment.refundedAt | date:'medium')
                      : 'Aucun remboursement'
                  }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="content-card" *ngIf="payment.failureReason || canRetryPayment(payment)">
          <div class="section-head">
            <div>
              <span class="section-kicker">Assistance</span>
              <h2>Action et diagnostic</h2>
            </div>
          </div>

          <div class="support-stack">
            <div class="support-box support-box-failed" *ngIf="payment.failureReason">
              <span class="support-label">Motif d’échec</span>
              <strong class="multiline">{{ payment.failureReason }}</strong>
            </div>

            <div class="support-box support-box-action" *ngIf="canRetryPayment(payment)">
              <span class="support-label">Lien de paiement</span>
              <p>
                Cette transaction peut encore être reprise si le lien de paiement est toujours valide.
              </p>

              <a
                class="btn btn-primary link-btn"
                [href]="payment.paymentUrl || ''"
                target="_blank"
                rel="noopener noreferrer"
              >
                Reprendre le paiement
              </a>
            </div>
          </div>
        </section>

        <app-empty-state
          *ngIf="!payment"
          icon="💳"
          title="Paiement introuvable"
          description="Impossible d’afficher le détail de cette transaction."
        />
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

    .top-nav {
      display: flex;
      align-items: center;
    }

    .back-link {
      color: #ea580c;
      text-decoration: none;
      font-weight: 700;
    }

    .back-link:hover {
      color: #c2410c;
    }

    .hero-card,
    .summary-card,
    .content-card,
    .state-card,
    .action-banner {
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

    .content-card,
    .state-card,
    .action-banner {
      padding: 20px;
    }

    .eyebrow,
    .section-kicker,
    .action-kicker {
      color: #ea580c;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hero-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }

    .hero-main {
      min-width: 0;
      flex: 1;
    }

    .hero-main h1 {
      margin: 8px 0 8px;
      font-size: clamp(2rem, 4vw, 2.7rem);
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #111827;
    }

    .hero-subtitle {
      margin: 0;
      color: #4b5563;
      line-height: 1.7;
      font-size: 1rem;
    }

    .hero-meta {
      margin-top: 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #f3dfd4;
      color: #7c2d12;
      font-size: 0.88rem;
      font-weight: 700;
    }

    .hero-side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 14px;
      min-width: 260px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 10px 14px;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .status-succeeded {
      background: #dcfce7;
      color: #166534;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-cancelled,
    .status-refunded {
      background: #e0f2fe;
      color: #075985;
    }

    .status-default {
      background: #e5e7eb;
      color: #374151;
    }

    .hero-amount-card {
      width: 100%;
      border-radius: 22px;
      padding: 18px;
      background: #ffffff;
      border: 1px solid #f3e8e2;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .hero-amount-label {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .hero-amount-value {
      font-size: 1.7rem;
      line-height: 1.15;
      color: #111827;
    }

    .hero-amount-help {
      color: #6b7280;
      font-size: 0.92rem;
    }

    .action-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      background: linear-gradient(135deg, #fff7f2, #ffffff);
    }

    .action-banner-content h2 {
      margin: 6px 0;
      font-size: 1.2rem;
      color: #111827;
    }

    .action-banner-content p {
      margin: 0;
      color: #4b5563;
      line-height: 1.6;
    }

    .action-banner-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: flex-end;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .summary-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .summary-card-accent {
      background: linear-gradient(135deg, #fff1e8, #ffffff);
    }

    .summary-label {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .summary-value {
      font-size: 1.35rem;
      line-height: 1.2;
      color: #111827;
      word-break: break-word;
    }

    .summary-help {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-head h2 {
      margin: 4px 0 0;
      font-size: 1.2rem;
      color: #111827;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .info-block,
    .context-block,
    .support-box {
      border: 1px solid #f3e8e2;
      border-radius: 16px;
      padding: 14px;
      background: #fffaf7;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .info-label,
    .context-label,
    .support-label {
      font-size: 13px;
      color: #6b7280;
    }

    .context-stack,
    .support-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .multiline {
      line-height: 1.6;
      word-break: break-word;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .timeline-item {
      display: grid;
      grid-template-columns: 24px 1fr;
      gap: 14px;
      align-items: start;
      opacity: 0.55;
    }

    .timeline-item.active {
      opacity: 1;
    }

    .timeline-dot {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: #d1d5db;
      margin-top: 4px;
      position: relative;
    }

    .timeline-item.active .timeline-dot {
      background: #ea580c;
      box-shadow: 0 0 0 6px rgba(234, 88, 12, 0.12);
    }

    .timeline-item.success.active .timeline-dot {
      background: #16a34a;
      box-shadow: 0 0 0 6px rgba(22, 163, 74, 0.12);
    }

    .timeline-item.failed.active .timeline-dot {
      background: #dc2626;
      box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.12);
    }

    .timeline-item.refunded.active .timeline-dot {
      background: #0284c7;
      box-shadow: 0 0 0 6px rgba(2, 132, 199, 0.12);
    }

    .timeline-body strong {
      display: block;
      margin-bottom: 4px;
      color: #111827;
    }

    .timeline-body p {
      margin: 0;
      color: #6b7280;
      line-height: 1.6;
    }

    .support-box-failed {
      background: #fff7f7;
      border-color: #fecaca;
    }

    .support-box-action {
      background: #fffaf7;
    }

    .support-box p {
      margin: 0;
      color: #4b5563;
      line-height: 1.6;
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
      .summary-grid,
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 900px) {
      .hero-head,
      .action-banner,
      .section-head {
        flex-direction: column;
        align-items: stretch;
      }

      .hero-side {
        align-items: stretch;
        min-width: 0;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .action-banner-actions {
        justify-content: stretch;
      }

      .action-banner-actions .btn {
        width: 100%;
      }
    }

    @media (max-width: 640px) {
      .hero-card,
      .summary-card,
      .content-card,
      .state-card,
      .action-banner {
        border-radius: 20px;
      }

      .hero-card,
      .content-card,
      .state-card,
      .action-banner {
        padding: 18px;
      }

      .hero-main h1 {
        font-size: 1.9rem;
      }

      .hero-amount-value {
        font-size: 1.35rem;
      }
    }
  `],
})
export class PaymentDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly myPaymentsService = inject(MyPaymentsService);

  loading = true;
  error = '';
  payment: MyPaymentItem | null = null;

  ngOnInit(): void {
    this.loadPayment();
  }

  private loadPayment(): void {
    const paymentId = Number(this.route.snapshot.paramMap.get('id'));

    if (!paymentId || Number.isNaN(paymentId)) {
      this.error = 'Identifiant paiement invalide.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    this.myPaymentsService.getOne(paymentId).subscribe({
      next: (payment: MyPaymentItem) => {
        this.payment = payment;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le détail du paiement.';
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

  getStatusClass(status: string | null | undefined): string {
    switch (status) {
      case 'SUCCEEDED':
        return 'status-succeeded';
      case 'INITIATED':
      case 'PENDING':
        return 'status-pending';
      case 'FAILED':
        return 'status-failed';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'REFUNDED':
        return 'status-refunded';
      default:
        return 'status-default';
    }
  }

  canRetryPayment(payment: MyPaymentItem | null): boolean {
    if (!payment) {
      return false;
    }

    return (
      (payment.status === 'INITIATED' || payment.status === 'PENDING') &&
      !!payment.paymentUrl
    );
  }

  getActionState():
    | { title: string; message: string; showRetry: boolean }
    | null {
    if (!this.payment) {
      return null;
    }

    switch (this.payment.status) {
      case 'SUCCEEDED':
        return {
          title: 'Paiement terminé avec succès',
          message:
            'La contribution a été confirmée. Vous pouvez revenir à la liste des paiements ou consulter l’événement concerné.',
          showRetry: false,
        };

      case 'INITIATED':
      case 'PENDING':
        return {
          title: 'Paiement à finaliser',
          message:
            'Votre transaction est encore en attente. Reprenez le paiement pour terminer le processus si le lien est toujours valide.',
          showRetry: this.canRetryPayment(this.payment),
        };

      case 'FAILED':
        return {
          title: 'Paiement non abouti',
          message:
            'La transaction a échoué. Vérifiez le motif d’échec ci-dessous puis relancez le paiement si possible.',
          showRetry: this.canRetryPayment(this.payment),
        };

      case 'CANCELLED':
        return {
          title: 'Paiement annulé',
          message:
            'Cette transaction a été annulée. Vous pouvez revenir à vos paiements ou relancer une nouvelle contribution si nécessaire.',
          showRetry: false,
        };

      case 'REFUNDED':
        return {
          title: 'Paiement remboursé',
          message:
            'Le montant de cette transaction a été remboursé. Les détails de remboursement sont visibles dans la timeline.',
          showRetry: false,
        };

      default:
        return null;
    }
  }
}