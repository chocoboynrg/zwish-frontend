import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CountdownTimerComponent } from '../../../shared/components/countdown-timer/countdown-timer.component';
import { MyPaymentItem, MyPaymentsService } from '../services/my-payments.service';

@Component({
  selector: 'app-payment-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CountdownTimerComponent],
  template: `
    <div class="page-wrap">

      <!-- Hero -->
      <div class="page-hero" [ngClass]="getHeroClass()">
        <div class="page-hero-inner">

          <a routerLink="/app/payments" class="back-link">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Mes paiements
          </a>

          <!-- Loading -->
          <div class="hero-loading" *ngIf="loading">
            <div class="loading-spinner"></div>
            <span>Chargement...</span>
          </div>

          <!-- Erreur -->
          <div class="hero-error" *ngIf="error && !loading">
            <div class="error-icon">⚠️</div>
            <h2>{{ error }}</h2>
          </div>

          <!-- Contenu hero -->
          <ng-container *ngIf="payment && !loading">
            <div class="hero-content">
              <div class="hero-left">
                <div class="hero-status-pill" [ngClass]="getStatusPillClass(payment.status)">
                  {{ getStatusEmoji(payment.status) }} {{ getStatusLabel(payment.status) }}
                </div>
                <div class="hero-item-name">{{ payment.contribution?.wishlistItem?.title ?? 'Transaction' }}</div>
                <div class="hero-event-name" *ngIf="payment.contribution?.event?.title">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  {{ payment.contribution!.event!.title }}
                </div>
                <div class="hero-meta-pills">
                  <span class="hero-meta-pill">#{{ payment.id }}</span>
                  <span class="hero-meta-pill">{{ payment.provider }}</span>
                  <span class="hero-meta-pill" *ngIf="payment.paymentMethod">{{ payment.paymentMethod }}</span>
                </div>
              </div>
              <div class="hero-right">
                <div class="hero-amount">{{ toNumber(payment.amount) | number:'1.0-0' }}</div>
                <div class="hero-currency">{{ payment.currencyCode }}</div>
              </div>
            </div>

            <!-- Action si paiement initié et URL disponible -->
            <div class="hero-action-bar" *ngIf="payment.status === 'INITIATED' && payment.paymentUrl">
              <div class="action-bar-text">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                Votre paiement est en attente de finalisation.
                <app-countdown-timer
                  *ngIf="payment.expiresAt"
                  [expiresAt]="payment.expiresAt"
                  [showExpired]="true"
                ></app-countdown-timer>
              </div>
              <a [href]="payment.paymentUrl" target="_blank" rel="noopener" class="btn-pay-now">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="1" y="5" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M1 9h18" stroke="currentColor" stroke-width="1.5"/></svg>
                Finaliser le paiement
              </a>
            </div>

          </ng-container>
        </div>
      </div>

      <!-- Body -->
      <div class="page-body" *ngIf="payment && !loading">
        <div class="body-inner">

          <!-- Timeline statut -->
          <div class="timeline-card">
            <div class="card-title">Chronologie</div>
            <div class="timeline">
              <div class="timeline-item" [class.done]="true">
                <div class="tl-dot tl-dot-done"></div>
                <div class="tl-content">
                  <div class="tl-label">Initié</div>
                  <div class="tl-date">{{ payment.initiatedAt ? (payment.initiatedAt | date:'dd MMM yyyy HH:mm') : (payment.createdAt | date:'dd MMM yyyy HH:mm') }}</div>
                </div>
              </div>
              <div class="timeline-connector"></div>
              <div class="timeline-item" [class.done]="payment.status === 'SUCCEEDED'">
                <div class="tl-dot" [ngClass]="payment.status === 'SUCCEEDED' ? 'tl-dot-done' : (payment.status === 'FAILED' || payment.status === 'EXPIRED' ? 'tl-dot-failed' : 'tl-dot-pending')"></div>
                <div class="tl-content">
                  <div class="tl-label">{{ payment.status === 'SUCCEEDED' ? 'Confirmé' : payment.status === 'FAILED' ? 'Échoué' : payment.status === 'EXPIRED' ? 'Expiré' : 'En attente de confirmation' }}</div>
                  <div class="tl-date" *ngIf="payment.confirmedAt">{{ payment.confirmedAt | date:'dd MMM yyyy HH:mm' }}</div>
                  <div class="tl-date" *ngIf="payment.failedAt">{{ payment.failedAt | date:'dd MMM yyyy HH:mm' }}</div>
                  <div class="tl-date tl-muted" *ngIf="!payment.confirmedAt && !payment.failedAt">En attente...</div>
                </div>
              </div>
              <ng-container *ngIf="payment.refundedAt">
                <div class="timeline-connector"></div>
                <div class="timeline-item done">
                  <div class="tl-dot tl-dot-refund"></div>
                  <div class="tl-content">
                    <div class="tl-label">Remboursé</div>
                    <div class="tl-date">{{ payment.refundedAt | date:'dd MMM yyyy HH:mm' }}</div>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>

          <div class="two-col">

            <!-- Détails transaction -->
            <div class="info-card">
              <div class="card-title">Détails de la transaction</div>
              <div class="info-list">
                <div class="info-row">
                  <span class="info-label">Référence paiement</span>
                  <span class="info-val mono">#{{ payment.id }}</span>
                </div>
                <div class="info-row" *ngIf="payment.providerReference">
                  <span class="info-label">Réf. opérateur</span>
                  <span class="info-val mono">{{ payment.providerReference }}</span>
                </div>
                <div class="info-row" *ngIf="payment.providerTransactionId">
                  <span class="info-label">Transaction ID</span>
                  <span class="info-val mono">{{ payment.providerTransactionId }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Opérateur</span>
                  <span class="info-val">{{ payment.provider }}</span>
                </div>
                <div class="info-row" *ngIf="payment.paymentMethod">
                  <span class="info-label">Méthode</span>
                  <span class="info-val">{{ payment.paymentMethod }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Montant</span>
                  <span class="info-val strong">{{ toNumber(payment.amount) | number:'1.0-0' }} {{ payment.currencyCode }}</span>
                </div>
                <div class="info-row" *ngIf="payment.failureReason">
                  <span class="info-label">Raison échec</span>
                  <span class="info-val error-val">{{ payment.failureReason }}</span>
                </div>
              </div>
            </div>

            <!-- Contribution liée -->
            <div class="info-card" *ngIf="payment.contribution">
              <div class="card-title">Contribution associée</div>
              <div class="info-list">
                <div class="info-row">
                  <span class="info-label">Référence</span>
                  <span class="info-val mono">#{{ payment.contribution!.id }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Statut contribution</span>
                  <span class="status-badge" [ngClass]="getContribStatusClass(payment.contribution!.status)">
                    {{ getContribStatusLabel(payment.contribution!.status) }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Montant contribution</span>
                  <span class="info-val strong">{{ toNumber(payment.contribution!.amount) | number:'1.0-0' }} {{ payment.currencyCode }}</span>
                </div>
                <div class="info-row" *ngIf="payment.contribution!.wishlistItem">
                  <span class="info-label">Item wishlist</span>
                  <span class="info-val">{{ payment.contribution!.wishlistItem!.title }}</span>
                </div>
                <div class="info-row" *ngIf="payment.contribution!.event">
                  <span class="info-label">Événement</span>
                  <span class="info-val">{{ payment.contribution!.event!.title }}</span>
                </div>
              </div>

              <!-- Lien vers événement -->
              <a
                *ngIf="payment.contribution!.event?.id"
                [routerLink]="['/app/events', payment.contribution!.event!.id]"
                class="card-link-btn"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Voir l'événement
              </a>
            </div>

          </div>

          <!-- Alerte si URL de paiement disponible -->
          <div class="pending-banner" *ngIf="payment.status === 'INITIATED' && payment.paymentUrl">
            <div class="pending-banner-left">
              <div class="pending-banner-icon">⏳</div>
              <div>
                <div class="pending-banner-title">Paiement en attente</div>
                <div class="pending-banner-desc">Votre session de paiement est active. Cliquez sur le bouton pour finaliser votre transaction.</div>
              </div>
            </div>
            <a [href]="payment.paymentUrl" target="_blank" rel="noopener" class="btn-pay-now-large">
              Finaliser le paiement →
            </a>
          </div>

          <!-- Retour contributions -->
          <div class="footer-nav">
            <a routerLink="/app/contributions" class="footer-nav-link">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10l6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              Retour à mes contributions
            </a>
            <a routerLink="/app/payments" class="footer-nav-link">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10l6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              Retour à mes paiements
            </a>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-wrap { background: #f9fafb; min-height: calc(100vh - 64px); }

    /* ── HERO ── */
    .page-hero { padding: 32px 0 36px; border-bottom: 4px solid rgba(0,0,0,0.06); }
    .page-hero.hero-succeeded { background: linear-gradient(135deg, #000 60%, #064e3b); }
    .page-hero.hero-initiated, .page-hero.hero-pending { background: linear-gradient(135deg, #000 60%, #78350f); }
    .page-hero.hero-failed, .page-hero.hero-expired { background: linear-gradient(135deg, #000 60%, #7f1d1d); }
    .page-hero.hero-refunded { background: linear-gradient(135deg, #000 60%, #4c1d95); }
    .page-hero.hero-default { background: #000; }

    .page-hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 24px; }

    .back-link { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.5); font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: color 0.2s; }
    .back-link:hover { color: white; }

    .hero-loading { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.5); font-size: 0.9rem; padding: 24px 0; }
    .loading-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #FFD700; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hero-error { display: flex; align-items: center; gap: 12px; color: white; padding: 24px 0; }
    .error-icon { font-size: 2rem; }
    .hero-error h2 { margin: 0; font-size: 1rem; font-weight: 700; }

    .hero-content { display: flex; align-items: flex-start; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
    .hero-left { display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .hero-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 999px; font-size: 0.78rem; font-weight: 800; align-self: flex-start; }
    .pill-succeeded { background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .pill-initiated, .pill-pending { background: rgba(251,191,36,0.2); color: #fde68a; border: 1px solid rgba(251,191,36,0.3); }
    .pill-failed, .pill-expired { background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
    .pill-refunded { background: rgba(167,139,250,0.2); color: #c4b5fd; border: 1px solid rgba(167,139,250,0.3); }
    .pill-default { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
    .hero-item-name { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 900; color: white; letter-spacing: -0.02em; line-height: 1.1; }
    .hero-event-name { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.5); font-size: 0.88rem; }
    .hero-meta-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .hero-meta-pill { padding: 3px 10px; border-radius: 999px; background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); }
    .hero-right { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .hero-amount { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; color: #FFD700; letter-spacing: -0.03em; line-height: 1; }
    .hero-currency { color: rgba(255,255,255,0.4); font-size: 0.85rem; font-weight: 700; margin-top: 4px; }

    .hero-action-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); border-radius: 14px; flex-wrap: wrap; }
    .action-bar-text { display: flex; align-items: center; gap: 8px; color: #fde68a; font-size: 0.85rem; font-weight: 600; }
    .btn-pay-now { display: flex; align-items: center; gap: 7px; padding: 10px 20px; background: #FFD700; color: #000; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 0.85rem; white-space: nowrap; transition: 0.2s; }
    .btn-pay-now:hover { background: #FFC000; }

    /* ── BODY ── */
    .page-body { padding: 32px 0; }
    .body-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }

    /* Timeline */
    .timeline-card { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; padding: 24px; }
    .card-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 20px; }
    .timeline { display: flex; align-items: flex-start; gap: 0; }
    .timeline-item { display: flex; align-items: flex-start; gap: 10px; flex: 1; }
    .timeline-connector { flex: 1; height: 2px; background: #f3f4f6; margin-top: 11px; }
    .tl-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #e5e7eb; background: white; flex-shrink: 0; transition: 0.2s; }
    .tl-dot-done { background: #22c55e; border-color: #22c55e; }
    .tl-dot-failed { background: #ef4444; border-color: #ef4444; }
    .tl-dot-pending { background: #FFD700; border-color: #FFD700; animation: pulse 1.5s infinite; }
    .tl-dot-refund { background: #8b5cf6; border-color: #8b5cf6; }
    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
    .tl-content { display: flex; flex-direction: column; gap: 2px; }
    .tl-label { font-size: 0.82rem; font-weight: 700; color: #111; }
    .tl-date { font-size: 0.72rem; color: #6b7280; }
    .tl-muted { color: #d1d5db; }

    /* Two col */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* Info cards */
    .info-card { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .info-list { display: flex; flex-direction: column; gap: 0; }
    .info-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px solid #f9fafb; }
    .info-row:last-child { border-bottom: 0; }
    .info-label { font-size: 0.78rem; color: #9ca3af; font-weight: 600; flex-shrink: 0; }
    .info-val { font-size: 0.88rem; color: #111; font-weight: 600; text-align: right; word-break: break-all; }
    .info-val.mono { font-family: monospace; }
    .info-val.strong { font-weight: 900; font-size: 1rem; }
    .info-val.error-val { color: #ef4444; }

    .status-badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .cs-confirmed { background: #dcfce7; color: #166534; }
    .cs-awaiting { background: #fef3c7; color: #92400e; }
    .cs-failed, .cs-cancelled { background: #fee2e2; color: #991b1b; }
    .cs-refunded { background: #ede9fe; color: #6d28d9; }
    .cs-default { background: #f3f4f6; color: #6b7280; }

    .card-link-btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 16px; border: 1.5px solid #e5e7eb; border-radius: 10px; text-decoration: none; color: #374151; font-size: 0.85rem; font-weight: 700; transition: 0.2s; align-self: flex-start; }
    .card-link-btn:hover { border-color: #111; color: #111; }

    /* Pending banner */
    .pending-banner { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 24px; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px; flex-wrap: wrap; }
    .pending-banner-left { display: flex; align-items: flex-start; gap: 14px; }
    .pending-banner-icon { font-size: 1.5rem; flex-shrink: 0; }
    .pending-banner-title { font-size: 0.95rem; font-weight: 800; color: #111; margin-bottom: 4px; }
    .pending-banner-desc { font-size: 0.82rem; color: #6b7280; line-height: 1.5; }
    .btn-pay-now-large { padding: 12px 24px; background: #FFD700; color: #000; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 0.9rem; white-space: nowrap; transition: 0.2s; flex-shrink: 0; }
    .btn-pay-now-large:hover { background: #FFC000; }

    /* Footer nav */
    .footer-nav { display: flex; gap: 16px; flex-wrap: wrap; padding-top: 4px; }
    .footer-nav-link { display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: color 0.2s; }
    .footer-nav-link:hover { color: #111; }

    @media (max-width: 900px) {
      .two-col { grid-template-columns: 1fr; }
      .timeline { flex-direction: column; }
      .timeline-connector { width: 2px; height: 24px; margin: 0 0 0 10px; }
      .timeline-item { flex-direction: row; }
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
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) { this.error = 'Identifiant invalide.'; this.loading = false; return; }
    this.myPaymentsService.getOne(id).subscribe({
      next: (p) => { this.payment = p; this.loading = false; },
      error: () => { this.error = 'Impossible de charger ce paiement.'; this.loading = false; },
    });
  }

  toNumber(v: unknown): number { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }

  getHeroClass(): string {
    if (!this.payment) return 'hero-default';
    const m: Record<string,string> = { SUCCEEDED: 'hero-succeeded', INITIATED: 'hero-initiated', PENDING: 'hero-pending', FAILED: 'hero-failed', EXPIRED: 'hero-expired', REFUNDED: 'hero-refunded' };
    return m[this.payment.status] ?? 'hero-default';
  }

  getStatusEmoji(s: string): string {
    const m: Record<string,string> = { SUCCEEDED: '✅', INITIATED: '⏳', PENDING: '⏳', FAILED: '❌', EXPIRED: '⌛', REFUNDED: '↩️' };
    return m[s] ?? 'ℹ️';
  }

  getStatusLabel(s: string): string {
    const m: Record<string,string> = { SUCCEEDED: 'Réussi', INITIATED: 'Initié', PENDING: 'En attente', FAILED: 'Échoué', EXPIRED: 'Expiré', REFUNDED: 'Remboursé' };
    return m[s] ?? s;
  }

  getStatusPillClass(s: string): string {
    const m: Record<string,string> = { SUCCEEDED: 'hero-status-pill pill-succeeded', INITIATED: 'hero-status-pill pill-initiated', PENDING: 'hero-status-pill pill-pending', FAILED: 'hero-status-pill pill-failed', EXPIRED: 'hero-status-pill pill-expired', REFUNDED: 'hero-status-pill pill-refunded' };
    return m[s] ?? 'hero-status-pill pill-default';
  }

  getContribStatusLabel(s: string): string {
    const m: Record<string,string> = { CONFIRMED: 'Confirmée', AWAITING_PAYMENT: 'En attente', FAILED: 'Échouée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée' };
    return m[s] ?? s;
  }

  getContribStatusClass(s: string): string {
    const m: Record<string,string> = { CONFIRMED: 'status-badge cs-confirmed', AWAITING_PAYMENT: 'status-badge cs-awaiting', FAILED: 'status-badge cs-failed', CANCELLED: 'status-badge cs-cancelled', REFUNDED: 'status-badge cs-refunded' };
    return m[s] ?? 'status-badge cs-default';
  }
}