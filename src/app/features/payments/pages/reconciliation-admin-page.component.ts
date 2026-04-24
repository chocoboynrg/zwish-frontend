import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminPaymentsService, ReconciliationIssue, ReconciliationResponse } from '../services/admin-payments.service';
import { ToastService } from '../../../core/services/toast.service';

const ISSUE_TYPES = [
  'PAYMENT_WEBHOOK_MISMATCH',
  'CONTRIBUTION_MISMATCH',
  'ORPHAN_SUCCESS',
  'EXPIRED_PENDING_ANOMALY',
  'DUPLICATE_WEBHOOK_SIGNALS',
];

@Component({
  selector: 'app-reconciliation-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Réconciliation</h1>
          <p class="subtitle" *ngIf="response()">
            {{ response()!.summary.totalCount }} anomalie(s) détectée(s)
          </p>
          <p class="subtitle" *ngIf="!response() && !loading()">Analyse des incohérences financières</p>
        </div>
        <button class="btn-refresh" (click)="loadIssues()" [disabled]="loading()">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 10a6 6 0 016-6 6 6 0 015.66 4M16 4v4h-4M16 10a6 6 0 01-6 6 6 6 0 01-5.66-4M4 16v-4h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ loading() ? 'Analyse...' : 'Rafraîchir' }}
        </button>
      </div>

      <!-- Stats summary -->
      <div class="stats-row" *ngIf="response() as r">
        <div class="stat stat-danger">
          <span class="stat-value">{{ r.summary.highSeverityCount }}</span>
          <span class="stat-label">Critique</span>
        </div>
        <div class="stat stat-warn">
          <span class="stat-value">{{ r.summary.mediumSeverityCount }}</span>
          <span class="stat-label">Moyen</span>
        </div>
        <div class="stat stat-muted">
          <span class="stat-value">{{ r.summary.lowSeverityCount }}</span>
          <span class="stat-label">Faible</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-value">{{ r.summary.paymentWebhookMismatchCount }}</span>
          <span class="stat-label">Webhook mismatch</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ r.summary.contributionMismatchCount }}</span>
          <span class="stat-label">Contribution mismatch</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ r.summary.orphanSuccessCount }}</span>
          <span class="stat-label">Orphelin</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ r.summary.expiredPendingAnomalyCount }}</span>
          <span class="stat-label">Expiré pending</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ r.summary.duplicateWebhookSignalsCount }}</span>
          <span class="stat-label">Webhook dupliqué</span>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-card">
        <div class="filters-row">
          <select [(ngModel)]="severityFilter" (ngModelChange)="onFilterChange()">
            <option value="">Toutes les sévérités</option>
            <option value="high">🔴 Critique (high)</option>
            <option value="medium">🟡 Moyen (medium)</option>
            <option value="low">🟢 Faible (low)</option>
          </select>

          <select [(ngModel)]="typeFilter" (ngModelChange)="onFilterChange()">
            <option value="">Tous les types</option>
            <option *ngFor="let t of issueTypes" [value]="t">{{ t }}</option>
          </select>

          <div class="filter-group">
            <label>Payment ID</label>
            <input type="number" placeholder="Ex: 42" [(ngModel)]="paymentIdFilter" (ngModelChange)="onFilterChange()" min="1" />
          </div>

          <div class="filter-group">
            <label>Contribution ID</label>
            <input type="number" placeholder="Ex: 12" [(ngModel)]="contributionIdFilter" (ngModelChange)="onFilterChange()" min="1" />
          </div>

          <div class="filter-group">
            <label>Event ID</label>
            <input type="number" placeholder="Ex: 5" [(ngModel)]="eventIdFilter" (ngModelChange)="onFilterChange()" min="1" />
          </div>

          <button class="btn-reset" *ngIf="hasActiveFilters()" (click)="resetFilters()">
            Réinitialiser
          </button>
        </div>
      </div>

      <!-- Liste des anomalies -->
      <div class="issues-container">
        <div class="loading-bar" *ngIf="loading()"></div>

        <p class="empty-state" *ngIf="!loading() && issues().length === 0 && response()">
          ✅ Aucune anomalie détectée avec ces filtres.
        </p>

        <div class="issues-list" *ngIf="issues().length > 0">
          <div
            class="issue-card"
            *ngFor="let issue of issues()"
            [ngClass]="'issue-' + issue.severity"
          >
            <!-- Header de l'issue -->
            <div class="issue-header">
              <div class="issue-left">
                <span class="severity-indicator" [ngClass]="'sev-' + issue.severity">
                  {{ getSeverityLabel(issue.severity) }}
                </span>
                <span class="issue-type">{{ issue.type }}</span>
              </div>
              <span class="issue-date muted" *ngIf="issue.createdAt">
                {{ issue.createdAt | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </div>

            <!-- Message principal -->
            <p class="issue-message">{{ issue.message }}</p>

            <!-- Liens vers les entités -->
            <div class="issue-links">
              <a
                *ngIf="issue.paymentId"
                [routerLink]="['/admin/payments', issue.paymentId]"
                class="issue-link"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="1" y="5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M1 9h18" stroke="currentColor" stroke-width="1.6"/></svg>
                Paiement #{{ issue.paymentId }}
              </a>
              <a
                *ngIf="issue.eventId"
                [routerLink]="['/admin/events', issue.eventId]"
                class="issue-link"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                Événement #{{ issue.eventId }}
              </a>
              <span class="contribution-ref" *ngIf="issue.contributionId">
                Contribution #{{ issue.contributionId }}
              </span>
            </div>

            <!-- Détails techniques (expandable) -->
            <details class="issue-details" *ngIf="issue.details && hasDetails(issue.details)">
              <summary>Détails techniques</summary>
              <pre class="details-json">{{ issue.details | json }}</pre>
            </details>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages() > 1">
          <button (click)="goToPage(page() - 1)" [disabled]="page() === 1">←</button>
          <span>Page {{ page() }} / {{ totalPages() }}</span>
          <button (click)="goToPage(page() + 1)" [disabled]="page() === totalPages()">→</button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 0; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
    }
    h1 { margin: 0 0 4px; font-size: 1.8rem; font-weight: 800; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.95rem; }

    .btn-refresh {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border: 1.5px solid #d1d5db; border-radius: 10px;
      background: white; color: #374151; font: inherit; font-weight: 600;
      cursor: pointer; white-space: nowrap; transition: 0.15s;
    }
    .btn-refresh:hover:not(:disabled) { background: #f9fafb; }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Stats */
    .stats-row {
      display: flex; gap: 12px; margin-bottom: 20px;
      flex-wrap: wrap; align-items: stretch;
    }
    .stat {
      background: white; border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 14px 18px; display: flex; flex-direction: column; gap: 4px; min-width: 100px;
    }
    .stat-danger { border-color: #fca5a5; background: #fff5f5; }
    .stat-warn { border-color: #fde68a; background: #fffbeb; }
    .stat-muted { opacity: 0.7; }
    .stat-divider { width: 1px; background: #e5e7eb; margin: 0 4px; align-self: stretch; }
    .stat-value { font-size: 1.6rem; font-weight: 800; color: #111827; }
    .stat-label { font-size: 0.72rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Filtres */
    .filters-card {
      background: white; border: 1px solid #e5e7eb; border-radius: 16px;
      padding: 18px 20px; margin-bottom: 16px;
    }
    .filters-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
    select {
      padding: 9px 12px; border: 1.5px solid #d1d5db; border-radius: 10px;
      font: inherit; font-size: 0.9rem; background: white; cursor: pointer; min-width: 160px;
    }
    .filter-group { display: flex; flex-direction: column; gap: 5px; min-width: 120px; }
    .filter-group label { font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
    .filter-group input {
      padding: 8px 12px; border: 1.5px solid #d1d5db; border-radius: 10px;
      font: inherit; font-size: 0.9rem;
    }
    .filter-group input:focus { outline: none; border-color: #6366f1; }
    .btn-reset {
      padding: 9px 16px; border: 1.5px solid #fde68a; border-radius: 10px;
      background: #fffbeb; color: #92400e; font: inherit; font-weight: 600;
      cursor: pointer; align-self: flex-end; white-space: nowrap;
    }

    /* Issues */
    .issues-container {
      display: flex; flex-direction: column; gap: 0;
    }
    .loading-bar {
      height: 3px; border-radius: 2px;
      background: linear-gradient(90deg, #ef4444, #f97316, #ef4444);
      background-size: 200%; animation: shimmer 1.2s infinite; margin-bottom: 16px;
    }
    @keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }
    .empty-state { text-align: center; color: #6b7280; padding: 48px; font-size: 1rem; }

    .issues-list { display: flex; flex-direction: column; gap: 12px; }

    .issue-card {
      background: white; border: 1.5px solid #e5e7eb;
      border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px;
      transition: box-shadow 0.15s;
    }
    .issue-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .issue-high { border-left: 4px solid #ef4444; }
    .issue-medium { border-left: 4px solid #f59e0b; }
    .issue-low { border-left: 4px solid #6b7280; }

    .issue-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .issue-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .severity-indicator {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
    }
    .sev-high { background: #fee2e2; color: #991b1b; }
    .sev-medium { background: #fef3c7; color: #92400e; }
    .sev-low { background: #f3f4f6; color: #374151; }

    .issue-type {
      font-family: monospace; font-size: 0.82rem; font-weight: 700;
      color: #374151; background: #f3f4f6; padding: 3px 8px; border-radius: 6px;
    }
    .issue-date { font-size: 0.82rem; white-space: nowrap; }
    .muted { color: #9ca3af; }

    .issue-message { margin: 0; color: #111827; font-size: 0.92rem; line-height: 1.5; }

    .issue-links { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .issue-link {
      display: inline-flex; align-items: center; gap: 5px;
      color: #6366f1; font-weight: 600; font-size: 0.85rem; text-decoration: none;
      padding: 4px 10px; border: 1px solid #e0e7ff; border-radius: 8px; background: #f5f3ff;
    }
    .issue-link:hover { background: #ede9fe; }
    .contribution-ref {
      font-size: 0.82rem; color: #6b7280; padding: 4px 10px;
      border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;
    }

    .issue-details summary {
      cursor: pointer; font-size: 0.82rem; font-weight: 600; color: #6b7280;
      user-select: none; list-style: none; display: flex; align-items: center; gap: 6px;
    }
    .issue-details summary::before { content: '▶'; font-size: 0.65rem; }
    .issue-details[open] summary::before { content: '▼'; }
    .details-json {
      margin: 8px 0 0; background: #0f172a; color: #a5b4fc;
      padding: 14px; border-radius: 10px; font-size: 0.75rem; line-height: 1.6;
      overflow-x: auto; white-space: pre-wrap; word-break: break-all;
    }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; padding: 20px 0 0; color: #6b7280; font-size: 0.9rem;
    }
    .pagination button {
      padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 8px;
      background: white; cursor: pointer; font: inherit;
    }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
  `],
})
export class ReconciliationAdminPageComponent implements OnInit {
  private readonly paymentsService = inject(AdminPaymentsService);
  private readonly toast = inject(ToastService);

  readonly response = signal<ReconciliationResponse | null>(null);
  readonly loading = signal(false);
  readonly page = signal(1);

  readonly issues = computed(() => this.response()?.items ?? []);
  readonly totalPages = computed(() => {
    const r = this.response();
    if (!r) return 1;
    return Math.ceil(r.summary.totalCount / r.summary.limit);
  });

  // Filtres
  severityFilter = '';
  typeFilter = '';
  paymentIdFilter: number | null = null;
  contributionIdFilter: number | null = null;
  eventIdFilter: number | null = null;

  readonly issueTypes = ISSUE_TYPES;

  private filterTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadIssues();
  }

  loadIssues(): void {
    this.loading.set(true);
    const query: any = { page: this.page(), limit: 20 };
    if (this.severityFilter) query.severity = this.severityFilter;
    if (this.typeFilter) query.issueType = this.typeFilter;
    if (this.paymentIdFilter) query.paymentId = this.paymentIdFilter;
    if (this.contributionIdFilter) query.contributionId = this.contributionIdFilter;
    if (this.eventIdFilter) query.eventId = this.eventIdFilter;

    this.paymentsService.getReconciliation(query).subscribe({
      next: (r) => { this.response.set(r); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Erreur lors du chargement.'); },
    });
  }

  onFilterChange(): void {
    if (this.filterTimer) clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => { this.page.set(1); this.loadIssues(); }, 300);
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadIssues();
  }

  hasActiveFilters(): boolean {
    return !!(this.severityFilter || this.typeFilter ||
      this.paymentIdFilter || this.contributionIdFilter || this.eventIdFilter);
  }

  resetFilters(): void {
    this.severityFilter = '';
    this.typeFilter = '';
    this.paymentIdFilter = null;
    this.contributionIdFilter = null;
    this.eventIdFilter = null;
    this.page.set(1);
    this.loadIssues();
  }

  hasDetails(details: Record<string, unknown>): boolean {
    return Object.keys(details).length > 0;
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'high': return '🔴 Critique';
      case 'medium': return '🟡 Moyen';
      case 'low': return '🟢 Faible';
      default: return severity;
    }
  }
}