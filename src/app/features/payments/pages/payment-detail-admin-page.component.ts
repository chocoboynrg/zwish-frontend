import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  AdminPaymentsService,
  AdminPaymentDetail,
  WebhookEvent,
  WebhookEventsResponse,
} from '../services/admin-payments.service';
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
            <ng-container *ngIf="p.status === 'INITIATED' || p.status === 'PENDING'">
              <button class="btn-success" (click)="showSucceedModal = true">✓ Valider</button>
              <button class="btn-fail" (click)="showFailModal = true">✕ Marquer échoué</button>
            </ng-container>
            <button *ngIf="p.status === 'SUCCEEDED'" class="btn-warn" (click)="showRefundModal = true">
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
              <div class="info-row">
                <span>URL paiement</span>
                <a *ngIf="p.paymentUrl" [href]="p.paymentUrl" target="_blank" class="link">Ouvrir →</a>
                <span *ngIf="!p.paymentUrl" class="muted">—</span>
              </div>
              <div class="info-row" *ngIf="p.failureReason">
                <span>Raison échec</span><span class="text-red">{{ p.failureReason }}</span>
              </div>
            </div>
          </div>

          <!-- Chronologie -->
          <div class="card">
            <h2>Chronologie</h2>
            <div class="info-list">
              <div class="info-row"><span>Créé</span><span>{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="info-row"><span>Initié</span><span>{{ p.initiatedAt ? (p.initiatedAt | date:'dd/MM/yyyy HH:mm') : '—' }}</span></div>
              <div class="info-row"><span>Expire</span><span>{{ p.expiresAt ? (p.expiresAt | date:'dd/MM/yyyy HH:mm') : '—' }}</span></div>
              <div class="info-row" *ngIf="p.confirmedAt"><span>Confirmé</span><span class="text-green">{{ p.confirmedAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="info-row" *ngIf="p.failedAt"><span>Échoué</span><span class="text-red">{{ p.failedAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="info-row" *ngIf="p.refundedAt"><span>Remboursé</span><span class="text-purple">{{ p.refundedAt | date:'dd/MM/yyyy HH:mm' }}</span></div>
            </div>
          </div>

          <!-- Payeur -->
          <div class="card" *ngIf="p.payer">
            <h2>Payeur</h2>
            <div class="info-list">
              <div class="info-row"><span>Nom</span><span>{{ p.payer.name }}</span></div>
              <div class="info-row"><span>Email</span><span>{{ p.payer.email }}</span></div>
              <div class="info-row">
                <span>Profil</span>
                <a [routerLink]="['/admin/users', p.payer.id]" class="link">Voir →</a>
              </div>
            </div>
          </div>

          <!-- Contribution -->
          <div class="card" *ngIf="p.contribution">
            <h2>Contribution liée</h2>
            <div class="info-list">
              <div class="info-row"><span>ID</span><span>#{{ p.contribution.id }}</span></div>
              <div class="info-row"><span>Statut</span>
                <span class="badge" [ngClass]="getStatusBadge(p.contribution.status)">{{ p.contribution.status }}</span>
              </div>
              <div class="info-row"><span>Montant</span><span>{{ p.contribution.amount | number }} {{ p.currencyCode }}</span></div>
              <div class="info-row" *ngIf="p.contribution.event">
                <span>Événement</span>
                <a [routerLink]="['/admin/events', p.contribution.event.id]" class="link">{{ p.contribution.event.title }} →</a>
              </div>
              <div class="info-row" *ngIf="p.contribution.wishlistItem">
                <span>Item</span><span>{{ p.contribution.wishlistItem.title }}</span>
              </div>
            </div>
          </div>

          <!-- Checks de cohérence -->
          <div class="card full-width" *ngIf="p.checks">
            <h2>Contrôles de cohérence</h2>
            <div class="checks-grid">
              <div class="check-item" [ngClass]="p.checks.paymentSucceededMatchesContribution ? 'check-ok' : 'check-fail'">
                <span class="check-icon">{{ p.checks.paymentSucceededMatchesContribution ? '✓' : '✕' }}</span>
                <span>Paiement réussi ↔ Contribution confirmée</span>
              </div>
              <div class="check-item" [ngClass]="p.checks.paymentExpiredConsistency ? 'check-ok' : 'check-fail'">
                <span class="check-icon">{{ p.checks.paymentExpiredConsistency ? '✓' : '✕' }}</span>
                <span>Cohérence expiration</span>
              </div>
              <div class="check-item" [ngClass]="p.checks.noOrphanSucceededPayment ? 'check-ok' : 'check-fail'">
                <span class="check-icon">{{ p.checks.noOrphanSucceededPayment ? '✓' : '✕' }}</span>
                <span>Pas de paiement orphelin</span>
              </div>
              <div class="check-item" [ngClass]="p.checks.noDuplicateSucceededWebhooks ? 'check-ok' : 'check-fail'">
                <span class="check-icon">{{ p.checks.noDuplicateSucceededWebhooks ? '✓' : '✕' }}</span>
                <span>Pas de webhook dupliqué</span>
              </div>
            </div>
          </div>

          <!-- ===== SECTION WEBHOOKS PAGINÉE ===== -->
          <div class="card full-width">
            <div class="section-header">
              <div>
                <h2>Webhooks</h2>
                <p class="section-sub" *ngIf="webhooksResponse()">
                  {{ webhooksResponse()!.summary.totalCount }} événement(s) —
                  <span class="text-green">{{ webhooksResponse()!.summary.succeededCount }} SUCCEEDED</span> /
                  <span class="text-red">{{ webhooksResponse()!.summary.failedCount }} FAILED</span>
                </p>
              </div>
              <div class="webhook-filters">
                <select [(ngModel)]="whExternalStatus" (ngModelChange)="loadWebhooks()">
                  <option value="">Tous les statuts</option>
                  <option value="SUCCEEDED">SUCCEEDED</option>
                  <option value="FAILED">FAILED</option>
                </select>
                <select [(ngModel)]="whProvider" (ngModelChange)="loadWebhooks()">
                  <option value="">Tous les providers</option>
                  <option value="CINETPAY">CINETPAY</option>
                  <option value="FEDAPAY">FEDAPAY</option>
                  <option value="STRIPE">STRIPE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            <div class="loading-bar" *ngIf="webhooksLoading()"></div>

            <p class="empty-webhooks" *ngIf="!webhooksLoading() && webhooks().length === 0">
              Aucun webhook pour ce paiement.
            </p>

            <div class="table-wrapper" *ngIf="webhooks().length > 0">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Provider</th>
                    <th>Statut externe</th>
                    <th>Résultat</th>
                    <th>Transaction ID</th>
                    <th>Référence</th>
                    <th>Raison échec</th>
                    <th>Traité le</th>
                    <th>Reçu le</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let wh of webhooks()">
                    <td class="mono muted">#{{ wh.id }}</td>
                    <td>{{ wh.provider }}</td>
                    <td>
                      <span class="badge" [ngClass]="wh.externalStatus === 'SUCCEEDED' ? 'badge-green' : 'badge-red'">
                        {{ wh.externalStatus }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadge(wh.resultingPaymentStatus ?? '')">
                        {{ wh.resultingPaymentStatus ?? '—' }}
                      </span>
                    </td>
                    <td class="mono muted">{{ wh.providerTransactionId ?? '—' }}</td>
                    <td class="mono muted">{{ wh.providerReference ?? '—' }}</td>
                    <td class="text-red small">{{ wh.failureReason ?? '—' }}</td>
                    <td class="muted small">{{ wh.processedAt ? (wh.processedAt | date:'dd/MM/yy HH:mm') : '—' }}</td>
                    <td class="muted small">{{ wh.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination webhooks -->
            <div class="pagination" *ngIf="webhooksTotalPages() > 1">
              <button (click)="goToWebhookPage(whPage() - 1)" [disabled]="whPage() === 1">←</button>
              <span>Page {{ whPage() }} / {{ webhooksTotalPages() }}</span>
              <button (click)="goToWebhookPage(whPage() + 1)" [disabled]="whPage() === webhooksTotalPages()">→</button>
            </div>
          </div>

        </div>
      </ng-container>

      <!-- ===== MODAL VALIDER ===== -->
      <div class="modal-backdrop" *ngIf="showSucceedModal" (click)="showSucceedModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Valider le paiement #{{ payment()?.id }}</h2>
          <p class="modal-sub">
            Marquera le paiement <strong>SUCCEEDED</strong> et confirmera la contribution.
            Notifications envoyées au payeur et à l'organisateur.
          </p>
          <label>Transaction ID (optionnel)<input type="text" [(ngModel)]="succeedTxId" placeholder="Ex: TXN_123456" /></label>
          <label>Référence provider (optionnel)<input type="text" [(ngModel)]="succeedRef" placeholder="Ex: REF_ABC" /></label>
          <label>Note interne (optionnel)<input type="text" [(ngModel)]="succeedNote" placeholder="Note pour l'audit" /></label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="showSucceedModal = false">Annuler</button>
            <button class="btn-success-action" (click)="doSucceed()" [disabled]="actionLoading()">
              {{ actionLoading() ? '...' : '✓ Confirmer la validation' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ===== MODAL ÉCHOUER ===== -->
      <div class="modal-backdrop" *ngIf="showFailModal" (click)="showFailModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Marquer échoué — #{{ payment()?.id }}</h2>
          <p class="modal-sub">Un paiement déjà réussi ne peut pas être marqué échoué.</p>
          <label>Raison de l'échec (optionnel)<input type="text" [(ngModel)]="failReason" placeholder="Ex: Fonds insuffisants" /></label>
          <label>Note interne (optionnel)<input type="text" [(ngModel)]="failNote" placeholder="Note pour l'audit" /></label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="showFailModal = false">Annuler</button>
            <button class="btn-danger" (click)="doFail()" [disabled]="actionLoading()">
              {{ actionLoading() ? '...' : '✕ Confirmer l\'échec' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ===== MODAL REMBOURSEMENT ===== -->
      <div class="modal-backdrop" *ngIf="showRefundModal" (click)="showRefundModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Rembourser #{{ payment()?.id }}</h2>
          <p class="modal-sub">{{ payment()?.amount | number }} {{ payment()?.currencyCode }} — {{ payment()?.payer?.name }}</p>
          <label>Raison <span class="required">*</span><input type="text" [(ngModel)]="refundReason" placeholder="Ex: Erreur de paiement" /></label>
          <label>Note interne (optionnel)<input type="text" [(ngModel)]="refundNote" placeholder="Note pour l'audit" /></label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="showRefundModal = false">Annuler</button>
            <button class="btn-danger" (click)="doRefund()" [disabled]="!refundReason.trim() || actionLoading()">
              {{ actionLoading() ? '...' : 'Confirmer le remboursement' }}
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
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 20px; background: white; border: 1px solid #e5e7eb;
      border-radius: 20px; padding: 28px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .payment-id {
      width: 56px; height: 56px; border-radius: 14px;
      background: #f3f4f6; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800; color: #9ca3af; font-family: monospace; flex-shrink: 0;
    }
    h1 { margin: 0 0 8px; font-size: 1.4rem; font-weight: 800; color: #111827; }
    .header-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .amount { font-size: 1.1rem; font-weight: 700; color: #111827; }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; }

    .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .full-width { grid-column: 1 / -1; }
    @media (max-width: 768px) { .grid-layout { grid-template-columns: 1fr; } }

    .card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; }
    .card h2 { margin: 0 0 18px; font-size: 1rem; font-weight: 700; color: #111827; }

    .section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .section-sub { margin: 4px 0 0; font-size: 0.85rem; color: #6b7280; }
    .webhook-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .webhook-filters select {
      padding: 8px 12px; border: 1.5px solid #d1d5db; border-radius: 8px;
      font: inherit; font-size: 0.85rem; background: white; cursor: pointer;
    }

    .info-list { display: flex; flex-direction: column; }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      gap: 16px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem;
    }
    .info-row:last-child { border-bottom: 0; }
    .info-row > span:first-child { color: #6b7280; font-weight: 500; flex-shrink: 0; }
    .info-row > span:last-child, .info-row > a { color: #111827; font-weight: 500; text-align: right; word-break: break-all; }
    .mono { font-family: monospace; font-size: 0.82rem; }
    .muted { color: #9ca3af; }
    .small { font-size: 0.8rem; }
    .text-red { color: #b91c1c; }
    .text-green { color: #166534; }
    .text-purple { color: #6d28d9; }
    .link { color: #6366f1; font-weight: 600; text-decoration: none; }
    .link:hover { text-decoration: underline; }

    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-purple { background: #ede9fe; color: #6d28d9; }
    .badge-gray { background: #f3f4f6; color: #6b7280; }

    .checks-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 640px) { .checks-grid { grid-template-columns: 1fr; } }
    .check-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 10px; font-size: 0.88rem; font-weight: 500; }
    .check-ok { background: #f0fdf4; color: #166534; }
    .check-fail { background: #fef2f2; color: #991b1b; }
    .check-icon { font-size: 1rem; font-weight: 900; flex-shrink: 0; }

    .loading-bar { height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1); background-size: 200%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }
    .empty-webhooks { text-align: center; color: #9ca3af; padding: 32px; margin: 0; }

    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 9px 12px; text-align: left; font-size: 0.72rem; font-weight: 700; color: #6b7280; text-transform: uppercase; background: #f9fafb; white-space: nowrap; }
    td { padding: 11px 12px; border-top: 1px solid #f3f4f6; font-size: 0.85rem; }

    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; padding: 14px; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 0.88rem;
    }
    .pagination button { padding: 7px 13px; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer; font: inherit; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-success, .btn-fail, .btn-warn {
      padding: 10px 18px; border: 0; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer;
    }
    .btn-success { background: #dcfce7; color: #166534; }
    .btn-fail { background: #fee2e2; color: #991b1b; }
    .btn-warn { background: #fef3c7; color: #92400e; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
    .modal { background: white; border-radius: 20px; padding: 28px; width: min(500px, 100%); display: flex; flex-direction: column; gap: 14px; }
    .modal h2 { margin: 0; font-size: 1.15rem; color: #111827; }
    .modal-sub { margin: 0; color: #6b7280; font-size: 0.88rem; line-height: 1.5; }
    .modal label { display: flex; flex-direction: column; gap: 5px; font-size: 0.85rem; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }
    .modal input { padding: 9px 13px; border: 1.5px solid #d1d5db; border-radius: 10px; font: inherit; font-size: 0.9rem; }
    .modal input:focus { outline: none; border-color: #6366f1; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }
    .btn-cancel { padding: 10px 18px; border: 1px solid #d1d5db; border-radius: 10px; background: white; font: inherit; font-weight: 600; cursor: pointer; }
    .btn-danger { padding: 10px 18px; border: 0; border-radius: 10px; background: #ef4444; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-success-action { padding: 10px 18px; border: 0; border-radius: 10px; background: #22c55e; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-success-action:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class PaymentDetailAdminPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentsService = inject(AdminPaymentsService);
  private readonly toast = inject(ToastService);

  readonly payment = signal<AdminPaymentDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionLoading = signal(false);

  // Webhooks section
  readonly webhooksResponse = signal<WebhookEventsResponse | null>(null);
  readonly webhooksLoading = signal(false);
  readonly whPage = signal(1);
  whExternalStatus = '';
  whProvider = '';
  readonly webhooks = computed(() => this.webhooksResponse()?.items ?? []);
  readonly webhooksTotalPages = computed(() => {
    const r = this.webhooksResponse();
    if (!r) return 1;
    return Math.ceil(r.summary.totalCount / r.summary.limit);
  });

  // Modals
  showSucceedModal = false;
  succeedTxId = '';
  succeedRef = '';
  succeedNote = '';

  showFailModal = false;
  failReason = '';
  failNote = '';

  showRefundModal = false;
  refundReason = '';
  refundNote = '';

  private paymentId = 0;

  ngOnInit(): void {
    this.paymentId = Number(this.route.snapshot.paramMap.get('id'));
    this.paymentsService.getPaymentById(this.paymentId).subscribe({
      next: (p) => {
        this.payment.set(p);
        this.loading.set(false);
        this.loadWebhooks();
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Impossible de charger ce paiement.');
        this.loading.set(false);
      },
    });
  }

  loadWebhooks(): void {
    this.webhooksLoading.set(true);
    const query: any = { page: this.whPage(), limit: 20 };
    if (this.whExternalStatus) query.externalStatus = this.whExternalStatus;
    if (this.whProvider) query.provider = this.whProvider;

    this.paymentsService.getWebhooks(this.paymentId, query).subscribe({
      next: (r) => { this.webhooksResponse.set(r); this.webhooksLoading.set(false); },
      error: () => { this.webhooksLoading.set(false); },
    });
  }

  goToWebhookPage(p: number): void {
    this.whPage.set(p);
    this.loadWebhooks();
  }

  doSucceed(): void {
    const p = this.payment();
    if (!p) return;
    this.actionLoading.set(true);
    this.paymentsService.markSucceeded(p.id, {
      providerTransactionId: this.succeedTxId.trim() || undefined,
      providerReference: this.succeedRef.trim() || undefined,
      note: this.succeedNote.trim() || undefined,
    }).subscribe({
      next: (updated) => {
        this.payment.update((prev) => prev ? { ...prev, ...updated } : prev);
        this.actionLoading.set(false);
        this.showSucceedModal = false;
        this.loadWebhooks();
        this.toast.success('Paiement validé. Contribution confirmée.');
      },
      error: (e) => { this.actionLoading.set(false); this.toast.error(e?.error?.message ?? 'Erreur.'); },
    });
  }

  doFail(): void {
    const p = this.payment();
    if (!p) return;
    this.actionLoading.set(true);
    this.paymentsService.markFailed(p.id, {
      failureReason: this.failReason.trim() || undefined,
      note: this.failNote.trim() || undefined,
    }).subscribe({
      next: (updated) => {
        this.payment.update((prev) => prev ? { ...prev, ...updated } : prev);
        this.actionLoading.set(false);
        this.showFailModal = false;
        this.toast.success('Paiement marqué comme échoué.');
      },
      error: (e) => { this.actionLoading.set(false); this.toast.error(e?.error?.message ?? 'Erreur.'); },
    });
  }

  doRefund(): void {
    const p = this.payment();
    if (!p || !this.refundReason.trim()) return;
    this.actionLoading.set(true);
    this.paymentsService.refund(p.id, this.refundReason.trim(), this.refundNote.trim() || undefined).subscribe({
      next: (updated) => {
        this.payment.update((prev) => prev ? { ...prev, ...updated } : prev);
        this.actionLoading.set(false);
        this.showRefundModal = false;
        this.toast.success('Paiement remboursé.');
      },
      error: (e) => { this.actionLoading.set(false); this.toast.error(e?.error?.message ?? 'Erreur.'); },
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'SUCCEEDED': case 'CONFIRMED': return 'badge-green';
      case 'FAILED': case 'CANCELLED': return 'badge-red';
      case 'REFUNDED': return 'badge-purple';
      case 'INITIATED': case 'PENDING': return 'badge-yellow';
      default: return 'badge-gray';
    }
  }
}