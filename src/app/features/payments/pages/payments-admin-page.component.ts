import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminPaymentsService, AdminPayment, AdminPaymentsResponse } from '../services/admin-payments.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-payments-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- Tabs -->
      <div class="tabs">
        <button [class.active]="activeTab() === 'list'" (click)="activeTab.set('list')">Paiements</button>
        <button [class.active]="activeTab() === 'reconciliation'" (click)="switchToReconciliation()">
          Réconciliation
          <span class="tab-badge" *ngIf="recoSummary() && recoSummary()!.highSeverityCount > 0">
            {{ recoSummary()!.highSeverityCount }}
          </span>
        </button>
      </div>

      <!-- ===== LISTE PAIEMENTS ===== -->
      <ng-container *ngIf="activeTab() === 'list'">

        <div class="page-header">
          <div>
            <h1>Paiements</h1>
            <p class="subtitle">{{ response()?.summary?.totalCount ?? 0 }} paiements au total</p>
          </div>
          <button class="btn-export" (click)="exportCsv()" [disabled]="exporting()">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 9l4 4 4-4M4 17h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ exporting() ? 'Export...' : 'Export CSV' }}
          </button>
        </div>

        <!-- Stats -->
        <div class="stats-row" *ngIf="response() as r">
          <div class="stat stat-green">
            <span class="stat-value">{{ r.summary.succeededCount }}</span>
            <span class="stat-label">Réussis</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ r.summary.pendingCount }}</span>
            <span class="stat-label">En cours</span>
          </div>
          <div class="stat stat-red">
            <span class="stat-value">{{ r.summary.failedCount }}</span>
            <span class="stat-label">Échoués</span>
          </div>
          <div class="stat stat-muted">
            <span class="stat-value">{{ r.summary.refundedCount }}</span>
            <span class="stat-label">Remboursés</span>
          </div>
        </div>

        <!-- Filtres -->
        <div class="filters-bar">
          <select [(ngModel)]="statusFilter" (ngModelChange)="loadPayments()">
            <option value="">Tous les statuts</option>
            <option value="INITIATED">INITIATED</option>
            <option value="PENDING">PENDING</option>
            <option value="SUCCEEDED">SUCCEEDED</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
          <select [(ngModel)]="providerFilter" (ngModelChange)="loadPayments()">
            <option value="">Tous les providers</option>
            <option value="CINETPAY">CINETPAY</option>
            <option value="FEDAPAY">FEDAPAY</option>
            <option value="STRIPE">STRIPE</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

        <!-- Table -->
        <div class="table-card">
          <div class="loading-bar" *ngIf="loading()"></div>
          <p class="empty-state" *ngIf="!loading() && payments().length === 0">Aucun paiement trouvé.</p>

          <div class="table-wrapper" *ngIf="payments().length > 0">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Payeur</th>
                  <th>Montant</th>
                  <th>Provider</th>
                  <th>Statut</th>
                  <th>Événement</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of payments()">
                  <td class="id-cell">#{{ p.id }}</td>
                  <td>
                    <div class="user-cell" *ngIf="p.payer">
                      <div class="avatar">{{ getInitials(p.payer.name) }}</div>
                      <div>
                        <div class="user-name">{{ p.payer.name }}</div>
                        <div class="user-email">{{ p.payer.email }}</div>
                      </div>
                    </div>
                    <span *ngIf="!p.payer" class="muted">—</span>
                  </td>
                  <td class="amount-cell">{{ p.amount | number }} <span class="currency">{{ p.currencyCode }}</span></td>
                  <td><span class="badge badge-gray">{{ p.provider }}</span></td>
                  <td><span class="badge" [ngClass]="getStatusBadge(p.status)">{{ p.status }}</span></td>
                  <td class="muted">{{ p.contribution?.event?.title ?? '—' }}</td>
                  <td class="date-cell">{{ p.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                  <td>
                    <div class="actions-cell">
                      <a [routerLink]="['/admin/payments', p.id]" class="btn-sm btn-view">Voir</a>
                      <button
                        *ngIf="p.status === 'SUCCEEDED'"
                        class="btn-sm btn-warn"
                        (click)="openRefundModal(p)"
                      >
                        Rembourser
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination" *ngIf="totalPages() > 1">
            <button (click)="goToPage(page() - 1)" [disabled]="page() === 1">←</button>
            <span>Page {{ page() }} / {{ totalPages() }}</span>
            <button (click)="goToPage(page() + 1)" [disabled]="page() === totalPages()">→</button>
          </div>
        </div>
      </ng-container>

      <!-- ===== RÉCONCILIATION ===== -->
      <ng-container *ngIf="activeTab() === 'reconciliation'">

        <div class="page-header">
          <div>
            <h1>Réconciliation</h1>
            <p class="subtitle">Détection des anomalies paiements/contributions</p>
          </div>
        </div>

        <!-- Stats réconciliation -->
        <div class="stats-row" *ngIf="recoSummary() as s">
          <div class="stat stat-red">
            <span class="stat-value">{{ s.highSeverityCount }}</span>
            <span class="stat-label">Critiques</span>
          </div>
          <div class="stat stat-warn">
            <span class="stat-value">{{ s.mediumSeverityCount }}</span>
            <span class="stat-label">Moyennes</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ s.lowSeverityCount }}</span>
            <span class="stat-label">Faibles</span>
          </div>
          <div class="stat stat-muted">
            <span class="stat-value">{{ s.totalCount }}</span>
            <span class="stat-label">Total anomalies</span>
          </div>
        </div>

        <!-- Filtres réconciliation -->
        <div class="filters-bar">
          <select [(ngModel)]="recoSeverity" (ngModelChange)="loadReconciliation()">
            <option value="">Toutes sévérités</option>
            <option value="high">Critique</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>
          <select [(ngModel)]="recoType" (ngModelChange)="loadReconciliation()">
            <option value="">Tous les types</option>
            <option value="PAYMENT_WEBHOOK_MISMATCH">Webhook mismatch</option>
            <option value="CONTRIBUTION_MISMATCH">Contribution mismatch</option>
            <option value="ORPHAN_SUCCESS">Paiement orphelin</option>
            <option value="EXPIRED_PENDING_ANOMALY">Expiré en attente</option>
            <option value="DUPLICATE_WEBHOOK_SIGNALS">Webhooks dupliqués</option>
          </select>
        </div>

        <div class="table-card">
          <div class="loading-bar" *ngIf="recoLoading()"></div>
          <p class="empty-state" *ngIf="!recoLoading() && recoIssues().length === 0">
            ✅ Aucune anomalie détectée.
          </p>

          <div class="issues-list" *ngIf="recoIssues().length > 0">
            <div class="issue-item" *ngFor="let issue of recoIssues()" [ngClass]="'issue-' + issue.severity">
              <div class="issue-header">
                <span class="severity-dot" [ngClass]="'dot-' + issue.severity"></span>
                <span class="issue-type">{{ issue.type }}</span>
                <span class="badge" [ngClass]="getSeverityBadge(issue.severity)">{{ issue.severity }}</span>
                <span class="issue-date muted" *ngIf="issue.createdAt">{{ issue.createdAt | date:'dd/MM/yy HH:mm' }}</span>
              </div>
              <p class="issue-message">{{ issue.message }}</p>
              <div class="issue-links">
                <a *ngIf="issue.paymentId" [routerLink]="['/admin/payments', issue.paymentId]" class="issue-link">
                  Paiement #{{ issue.paymentId }} →
                </a>
              </div>
            </div>
          </div>

          <div class="pagination" *ngIf="recoTotalPages() > 1">
            <button (click)="goToRecoPage(recoPage() - 1)" [disabled]="recoPage() === 1">←</button>
            <span>Page {{ recoPage() }} / {{ recoTotalPages() }}</span>
            <button (click)="goToRecoPage(recoPage() + 1)" [disabled]="recoPage() === recoTotalPages()">→</button>
          </div>
        </div>
      </ng-container>

      <!-- Modal remboursement -->
      <div class="modal-backdrop" *ngIf="refundTarget()" (click)="closeRefundModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Rembourser le paiement #{{ refundTarget()?.id }}</h2>
          <p class="modal-sub">
            {{ refundTarget()?.amount | number }} {{ refundTarget()?.currencyCode }} —
            {{ refundTarget()?.payer?.name }}
          </p>
          <label>
            Raison <span class="required">*</span>
            <input type="text" [(ngModel)]="refundReason" placeholder="Ex: Erreur de paiement" />
          </label>
          <label>
            Note interne (optionnel)
            <input type="text" [(ngModel)]="refundNote" placeholder="Note pour l'audit" />
          </label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeRefundModal()">Annuler</button>
            <button class="btn-danger" (click)="confirmRefund()" [disabled]="!refundReason.trim() || refundLoading()">
              {{ refundLoading() ? '...' : 'Confirmer le remboursement' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 0; }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0;
    }
    .tabs button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: 0;
      background: transparent;
      font: inherit;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: 0.15s;
    }
    .tabs button.active { color: #6366f1; border-bottom-color: #6366f1; }
    .tabs button:hover:not(.active) { color: #374151; }
    .tab-badge {
      background: #ef4444;
      color: white;
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 0.72rem;
      font-weight: 800;
    }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    h1 { margin: 0 0 4px; font-size: 1.8rem; font-weight: 800; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.95rem; }

    .btn-export {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px;
      border: 1.5px solid #d1d5db; border-radius: 10px; background: white;
      color: #374151; font: inherit; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Stats */
    .stats-row { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat {
      background: white; border: 1px solid #e5e7eb; border-radius: 14px;
      padding: 16px 22px; display: flex; flex-direction: column; gap: 4px; min-width: 120px;
    }
    .stat-green { border-color: #bbf7d0; background: #f0fdf4; }
    .stat-red { border-color: #fecaca; background: #fef2f2; }
    .stat-warn { border-color: #fde68a; background: #fffbeb; }
    .stat-muted { opacity: 0.7; }
    .stat-value { font-size: 1.8rem; font-weight: 800; color: #111827; }
    .stat-label { font-size: 0.78rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Filtres */
    .filters-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
    select {
      padding: 10px 14px; border: 1.5px solid #d1d5db; border-radius: 10px;
      font: inherit; background: white; color: #374151; cursor: pointer;
    }

    /* Table */
    .table-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .loading-bar { height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1); background-size: 200%; animation: shimmer 1.2s infinite; }
    @keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }
    .empty-state { text-align: center; color: #9ca3af; padding: 48px; margin: 0; font-size: 1rem; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f9fafb; }
    th { padding: 12px 16px; text-align: left; font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    td { padding: 14px 16px; border-top: 1px solid #f3f4f6; vertical-align: middle; }
    tr:hover td { background: #fafafa; }
    .id-cell { font-weight: 700; color: #6b7280; font-size: 0.88rem; }
    .amount-cell { font-weight: 700; color: #111827; white-space: nowrap; }
    .currency { color: #9ca3af; font-size: 0.8rem; font-weight: 400; }
    .date-cell { color: #6b7280; font-size: 0.85rem; white-space: nowrap; }
    .muted { color: #9ca3af; font-size: 0.88rem; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 800; flex-shrink: 0;
    }
    .user-name { font-weight: 600; color: #111827; font-size: 0.88rem; }
    .user-email { color: #9ca3af; font-size: 0.78rem; }

    .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-gray { background: #f3f4f6; color: #6b7280; }
    .badge-purple { background: #ede9fe; color: #6d28d9; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }

    .actions-cell { display: flex; gap: 6px; }
    .btn-sm { padding: 6px 12px; border-radius: 8px; font: inherit; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: 0; white-space: nowrap; }
    .btn-view { background: #f3f4f6; color: #374151; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-view:hover { background: #e5e7eb; }
    .btn-warn { background: #fef3c7; color: #92400e; }
    .btn-warn:hover { background: #fde68a; }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 0.9rem; }
    .pagination button { padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer; font: inherit; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Issues réconciliation */
    .issues-list { display: flex; flex-direction: column; gap: 0; }
    .issue-item { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
    .issue-item:last-child { border-bottom: 0; }
    .issue-high { background: #fef9f9; }
    .issue-medium { background: #fffdf0; }
    .issue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
    .severity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot-high { background: #ef4444; }
    .dot-medium { background: #f59e0b; }
    .dot-low { background: #6b7280; }
    .issue-type { font-weight: 700; color: #111827; font-size: 0.88rem; font-family: monospace; }
    .issue-message { margin: 0 0 8px; color: #374151; font-size: 0.9rem; }
    .issue-date { margin-left: auto; }
    .issue-links { display: flex; gap: 12px; }
    .issue-link { color: #6366f1; font-weight: 600; font-size: 0.85rem; text-decoration: none; }
    .issue-link:hover { text-decoration: underline; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
    .modal { background: white; border-radius: 20px; padding: 32px; width: min(500px, 100%); display: flex; flex-direction: column; gap: 16px; }
    .modal h2 { margin: 0; font-size: 1.2rem; color: #111827; }
    .modal-sub { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .modal label { display: flex; flex-direction: column; gap: 8px; font-weight: 600; font-size: 0.9rem; color: #374151; }
    .required { color: #ef4444; }
    .modal input { padding: 10px 14px; border: 1.5px solid #d1d5db; border-radius: 10px; font: inherit; }
    .modal input:focus { outline: none; border-color: #6366f1; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .btn-cancel { padding: 10px 18px; border: 1px solid #d1d5db; border-radius: 10px; background: white; font: inherit; font-weight: 600; cursor: pointer; }
    .btn-danger { padding: 10px 18px; border: 0; border-radius: 10px; background: #ef4444; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class PaymentsAdminPageComponent implements OnInit {
  private readonly paymentsService = inject(AdminPaymentsService);
  private readonly toast = inject(ToastService);

  readonly activeTab = signal<'list' | 'reconciliation'>('list');

  // Liste
  readonly response = signal<AdminPaymentsResponse | null>(null);
  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly page = signal(1);
  statusFilter = '';
  providerFilter = '';

  readonly payments = computed(() => this.response()?.items ?? []);
  readonly totalPages = computed(() => {
    const r = this.response();
    if (!r) return 1;
    return Math.ceil(r.summary.totalCount / r.summary.limit);
  });

  // Réconciliation
  readonly recoIssues = signal<any[]>([]);
  readonly recoSummary = signal<any>(null);
  readonly recoLoading = signal(false);
  readonly recoPage = signal(1);
  recoSeverity = '';
  recoType = '';
  readonly recoTotalPages = computed(() => {
    const s = this.recoSummary();
    if (!s) return 1;
    return Math.ceil(s.totalCount / 20);
  });

  // Refund modal
  readonly refundTarget = signal<AdminPayment | null>(null);
  refundReason = '';
  refundNote = '';
  readonly refundLoading = signal(false);

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading.set(true);
    const query: any = { page: this.page(), limit: 20 };
    if (this.statusFilter) query.status = this.statusFilter;
    if (this.providerFilter) query.provider = this.providerFilter;

    this.paymentsService.getPayments(query).subscribe({
      next: (r) => { this.response.set(r); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Impossible de charger les paiements.'); },
    });
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadPayments();
  }

  switchToReconciliation(): void {
    this.activeTab.set('reconciliation');
    if (this.recoIssues().length === 0) this.loadReconciliation();
  }

  loadReconciliation(): void {
    this.recoLoading.set(true);
    const query: any = { page: this.recoPage(), limit: 20 };
    if (this.recoSeverity) query.severity = this.recoSeverity;
    if (this.recoType) query.issueType = this.recoType;

    this.paymentsService.getReconciliation(query).subscribe({
      next: (r) => {
        this.recoIssues.set(r.items);
        this.recoSummary.set(r.summary);
        this.recoLoading.set(false);
      },
      error: () => { this.recoLoading.set(false); this.toast.error('Erreur lors du chargement.'); },
    });
  }

  goToRecoPage(p: number): void {
    this.recoPage.set(p);
    this.loadReconciliation();
  }

  openRefundModal(p: AdminPayment): void {
    this.refundTarget.set(p);
    this.refundReason = '';
    this.refundNote = '';
  }

  closeRefundModal(): void {
    this.refundTarget.set(null);
  }

  confirmRefund(): void {
    const target = this.refundTarget();
    if (!target || !this.refundReason.trim()) return;
    this.refundLoading.set(true);

    this.paymentsService.refund(target.id, this.refundReason.trim(), this.refundNote.trim() || undefined).subscribe({
      next: (updated) => {
        this.response.update((r) => r ? { ...r, items: r.items.map((p) => p.id === updated.id ? { ...p, ...updated } : p) } : r);
        this.refundLoading.set(false);
        this.closeRefundModal();
        this.toast.success(`Paiement #${updated.id} remboursé.`);
      },
      error: (e) => {
        this.refundLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur lors du remboursement.');
      },
    });
  }

  exportCsv(): void {
    this.exporting.set(true);
    const query: any = {};
    if (this.statusFilter) query.status = this.statusFilter;
    if (this.providerFilter) query.provider = this.providerFilter;

    this.paymentsService.exportCsv(query).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => { this.exporting.set(false); this.toast.error('Erreur lors de l\'export.'); },
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

  getSeverityBadge(severity: string): string {
    if (severity === 'high') return 'badge-red';
    if (severity === 'medium') return 'badge-yellow';
    return 'badge-gray';
  }
}