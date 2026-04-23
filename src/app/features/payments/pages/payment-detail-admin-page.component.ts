import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminPaymentsService, AdminPaymentDetail } from '../services/admin-payments.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-payment-detail-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <a routerLink="/admin/payments" class="back-link">← Retour paiements</a>

      <div *ngIf="loading()" class="loading-state">Chargement...</div>
      <div *ngIf="error()" class="error-state">{{ error() }}</div>

      <ng-container *ngIf="payment() as p">

        <!-- Header -->
        <div class="payment-header">
          <div class="header-left">
            <div class="payment-id">#{{ p.id }}</div>
            <div>
              <h1>Paiement {{ p.provider }}</h1>
              <div class="header-meta">
                <span class="badge" [ngClass]="getStatusBadge(p.status)">{{ p.status }}</span>
                <span class="amount">{{ p.amount | number }} {{ p.currencyCode }}</span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button
              *ngIf="p.status === 'SUCCEEDED'"
              class="btn-warn"
              (click)="showRefundModal = true"
            >
              Rembourser
            </button>
          </div>
        </div>

        <div class="grid-layout">

          <!-- Infos paiement -->
          <div class="card">
            <h2>Détails paiement</h2>
            <div class="info-list">
              <div class="info-row"><span>Méthode</span><span>{{ p.paymentMethod }}</span></div>
              <div class="info-row"><span>Provider Ref</span><span class="mono">{{ p.providerReference ?? '—' }}</span></div>
              <div class="info-row"><span>Transaction ID</span><span class="mono">{{ p.providerTransactionId ?? '—' }}</span></div>
              <div class="info-row"><span>Initié le</span><span>{{ p.initiatedAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="info-row" *ngIf="p.confirmedAt"><span>Confirmé le</span><span class="text-green">{{ p.confirmedAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="info-row" *ngIf="p.failedAt"><span>Échoué le</span><span class="text-red">{{ p.failedAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="info-row" *ngIf="p.refundedAt"><span>Remboursé le</span><span class="text-purple">{{ p.refundedAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="info-row" *ngIf="p.expiresAt"><span>Expire le</span><span>{{ p.expiresAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="info-row" *ngIf="p.failureReason"><span>Raison échec</span><span class="text-red">{{ p.failureReason }}</span></div>
            </div>
          </div>

          <!-- Payeur -->
          <div class="card" *ngIf="p.payer">
            <h2>Payeur</h2>
            <div class="payer-card">
              <div class="payer-avatar">{{ getInitials(p.payer.name) }}</div>
              <div>
                <div class="payer-name">{{ p.payer.name }}</div>
                <div class="payer-email">{{ p.payer.email }}</div>
                <a [routerLink]="['/admin/users', p.payer.id]" class="link-small">Voir le profil →</a>
              </div>
            </div>
          </div>

          <!-- Contribution liée -->
          <div class="card" *ngIf="p.contribution">
            <h2>Contribution liée</h2>
            <div class="info-list">
              <div class="info-row"><span>ID Contribution</span><span>#{{ p.contribution.id }}</span></div>
              <div class="info-row"><span>Statut</span><span class="badge badge-gray">{{ p.contribution.status }}</span></div>
              <div class="info-row"><span>Montant</span><span>{{ p.contribution.amount | number }} XOF</span></div>
              <div class="info-row" *ngIf="p.contribution.event"><span>Événement</span>
                <a [routerLink]="['/admin/events', p.contribution.event.id]" class="link-small">{{ p.contribution.event.title }}</a>
              </div>
              <div class="info-row" *ngIf="p.contribution.wishlistItem"><span>Item</span><span>{{ p.contribution.wishlistItem.title }}</span></div>
            </div>
          </div>

          <!-- Checks réconciliation -->
          <div class="card">
            <h2>Réconciliation</h2>
            <div class="checks-list" *ngIf="p.checks">
              <div class="check-item" [ngClass]="p.checks.paymentSucceededMatchesContribution ? 'check-ok' : 'check-fail'">
                <span class="check-icon">{{ p.checks.paymentSucceededMatchesContribution ? '✓' : '✗' }}</span>
                <span>Paiement réussi = contribution confirmée</span>
              </div>
              <div class="check-item" [ngClass]="p.checks.paymentExpiredConsistency ? 'check-ok' : 'check-fail'">
                <span class="check-icon">{{ p.checks.paymentExpiredConsistency ? '✓' : '✗' }}</span>
                <span>Cohérence expiration</span>
              </div>
              <div class="check-item" [ngClass]="p.checks.noOrphanSucceededPayment ? 'check-ok' : 'check-fail'">
                <span class="check-icon">{{ p.checks.noOrphanSucceededPayment ? '✓' : '✗' }}</span>
                <span>Pas de paiement orphelin</span>
              </div>
              <div class="check-item" [ngClass]="p.checks.noDuplicateSucceededWebhooks ? 'check-ok' : 'check-fail'">
                <span class="check-icon">{{ p.checks.noDuplicateSucceededWebhooks ? '✓' : '✗' }}</span>
                <span>Pas de webhook dupliqué</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Webhooks -->
        <div class="card" *ngIf="p.webhooks && p.webhooks.length > 0">
          <h2>Événements webhook ({{ p.webhooks.length }})</h2>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Provider</th>
                  <th>Statut externe</th>
                  <th>Résultat</th>
                  <th>Transaction ID</th>
                  <th>Traité le</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let wh of p.webhooks">
                  <td>#{{ wh.id }}</td>
                  <td>{{ wh.provider }}</td>
                  <td><span class="badge badge-gray">{{ wh.externalStatus }}</span></td>
                  <td><span class="badge" [ngClass]="getStatusBadge(wh.resultingPaymentStatus ?? '')">{{ wh.resultingPaymentStatus ?? '—' }}</span></td>
                  <td class="mono muted">{{ wh.providerTransactionId ?? '—' }}</td>
                  <td class="muted">{{ wh.processedAt | date:'dd/MM/yy HH:mm' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </ng-container>

      <!-- Modal remboursement -->
      <div class="modal-backdrop" *ngIf="showRefundModal" (click)="showRefundModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Confirmer le remboursement</h2>
          <p class="modal-sub">Paiement #{{ payment()?.id }} — {{ payment()?.amount | number }} {{ payment()?.currencyCode }}</p>
          <label>
            Raison <span class="required">*</span>
            <input type="text" [(ngModel)]="refundReason" placeholder="Ex: Demande client" />
          </label>
          <label>
            Note interne (optionnel)
            <input type="text" [(ngModel)]="refundNote" />
          </label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="showRefundModal = false">Annuler</button>
            <button class="btn-danger" (click)="doRefund()" [disabled]="!refundReason.trim() || refundLoading()">
              {{ refundLoading() ? '...' : 'Rembourser' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 0; }
    .back-link { display: inline-flex; color: #6b7280; text-decoration: none; font-weight: 600; font-size: 0.9rem; margin-bottom: 20px; }
    .back-link:hover { color: #111827; }
    .loading-state, .error-state { padding: 40px; text-align: center; color: #6b7280; }
    .error-state { color: #b91c1c; }

    .payment-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
      background: white; border: 1px solid #e5e7eb; border-radius: 20px;
      padding: 28px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .header-left { display: flex; align-items: flex-start; gap: 16px; }
    .payment-id {
      font-size: 1.5rem; font-weight: 900; color: #d1d5db;
      font-family: monospace; line-height: 1;
    }
    h1 { margin: 0 0 10px; font-size: 1.4rem; font-weight: 800; color: #111827; }
    .header-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .amount { font-size: 1.2rem; font-weight: 800; color: #111827; }
    .header-actions { display: flex; gap: 10px; align-items: flex-start; }

    .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    @media (max-width: 768px) { .grid-layout { grid-template-columns: 1fr; } }

    .card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; }
    .card h2 { margin: 0 0 18px; font-size: 1rem; font-weight: 700; color: #111827; }

    .info-list { display: flex; flex-direction: column; gap: 0; }
    .info-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
    .info-row:last-child { border-bottom: 0; }
    .info-row span:first-child { color: #6b7280; font-weight: 600; }
    .info-row span:last-child { color: #111827; text-align: right; }
    .mono { font-family: monospace; font-size: 0.82rem; }
    .text-green { color: #166534; }
    .text-red { color: #991b1b; }
    .text-purple { color: #6d28d9; }
    .muted { color: #9ca3af; font-size: 0.85rem; }

    .payer-card { display: flex; align-items: center; gap: 14px; }
    .payer-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; font-weight: 800; flex-shrink: 0;
    }
    .payer-name { font-weight: 700; color: #111827; }
    .payer-email { color: #6b7280; font-size: 0.85rem; margin-bottom: 4px; }
    .link-small { color: #6366f1; font-weight: 600; font-size: 0.82rem; text-decoration: none; }

    /* Checks */
    .checks-list { display: flex; flex-direction: column; gap: 10px; }
    .check-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; font-weight: 500; }
    .check-ok { background: #f0fdf4; color: #166534; }
    .check-fail { background: #fef2f2; color: #991b1b; }
    .check-icon { font-weight: 900; font-size: 1rem; }

    /* Table webhooks */
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px 12px; text-align: left; font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; background: #f9fafb; white-space: nowrap; }
    td { padding: 12px; border-top: 1px solid #f3f4f6; font-size: 0.88rem; color: #374151; }

    .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-gray { background: #f3f4f6; color: #6b7280; }
    .badge-purple { background: #ede9fe; color: #6d28d9; }

    .btn-warn { padding: 10px 18px; border: 0; border-radius: 10px; background: #fef3c7; color: #92400e; font: inherit; font-weight: 700; cursor: pointer; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
    .modal { background: white; border-radius: 20px; padding: 32px; width: min(500px, 100%); display: flex; flex-direction: column; gap: 16px; }
    .modal h2 { margin: 0; font-size: 1.2rem; color: #111827; }
    .modal-sub { margin: 0; color: #6b7280; }
    .modal label { display: flex; flex-direction: column; gap: 8px; font-weight: 600; font-size: 0.9rem; color: #374151; }
    .required { color: #ef4444; }
    .modal input { padding: 10px 14px; border: 1.5px solid #d1d5db; border-radius: 10px; font: inherit; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancel { padding: 10px 18px; border: 1px solid #d1d5db; border-radius: 10px; background: white; font: inherit; font-weight: 600; cursor: pointer; }
    .btn-danger { padding: 10px 18px; border: 0; border-radius: 10px; background: #ef4444; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class PaymentDetailAdminPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentsService = inject(AdminPaymentsService);
  private readonly toast = inject(ToastService);

  readonly payment = signal<AdminPaymentDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly refundLoading = signal(false);

  showRefundModal = false;
  refundReason = '';
  refundNote = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.paymentsService.getPaymentById(id).subscribe({
      next: (p) => { this.payment.set(p); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Impossible de charger ce paiement.'); this.loading.set(false); },
    });
  }

  doRefund(): void {
    const p = this.payment();
    if (!p || !this.refundReason.trim()) return;
    this.refundLoading.set(true);

    this.paymentsService.refund(p.id, this.refundReason.trim(), this.refundNote.trim() || undefined).subscribe({
      next: (updated) => {
        this.payment.update((prev) => prev ? { ...prev, ...updated } : prev);
        this.refundLoading.set(false);
        this.showRefundModal = false;
        this.toast.success('Paiement remboursé.');
      },
      error: (e) => {
        this.refundLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur lors du remboursement.');
      },
    });
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'SUCCEEDED': return 'badge-green';
      case 'FAILED': return 'badge-red';
      case 'REFUNDED': return 'badge-purple';
      case 'INITIATED': case 'PENDING': return 'badge-yellow';
      default: return 'badge-gray';
    }
  }
}