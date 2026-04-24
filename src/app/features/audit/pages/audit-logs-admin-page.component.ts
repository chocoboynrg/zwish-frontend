import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AuditAdminService,
  AuditLog,
  AuditLogsQuery,
  AuditLogsResponse,
} from '../services/audit.service';
import { ToastService } from '../../../core/services/toast.service';

// Actions connues pour le filtre rapide
const KNOWN_ACTIONS = [
  'USER_LOGIN',
  'USER_REGISTERED',
  'USER_SUSPENDED',
  'USER_UNSUSPENDED',
  'USER_ROLE_UPDATED',
  'USERS_EXPORTED',
  'PAYMENT_REFUNDED',
  'PAYMENTS_EXPORTED',
  'AUDIT_LOGS_EXPORTED',
  'USER_VERIFIED_EMAIL',
  'RESERVATION_EXPIRED',
];

const KNOWN_ENTITY_TYPES = [
  'User',
  'Payment',
  'Contribution',
  'Event',
  'Reservation',
  'AuditLog',
];

@Component({
  selector: 'app-audit-logs-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p class="subtitle">{{ response()?.summary?.totalCount ?? 0 }} entrées au total</p>
        </div>
        <button class="btn-export" (click)="exportCsv()" [disabled]="exporting()">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 3v10M6 9l4 4 4-4M4 17h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ exporting() ? 'Export...' : 'Export CSV' }}
        </button>
      </div>

      <!-- Filtres -->
      <div class="filters-card">
        <div class="filters-row">
          <input
            class="search-input"
            type="text"
            placeholder="Rechercher action, type, metadata..."
            [(ngModel)]="search"
            (ngModelChange)="onSearchChange()"
          />

          <select [(ngModel)]="actionFilter" (ngModelChange)="onFilterChange()">
            <option value="">Toutes les actions</option>
            <option *ngFor="let a of knownActions" [value]="a">{{ a }}</option>
          </select>

          <select [(ngModel)]="entityTypeFilter" (ngModelChange)="onFilterChange()">
            <option value="">Tous les types</option>
            <option *ngFor="let t of knownEntityTypes" [value]="t">{{ t }}</option>
          </select>
        </div>

        <div class="filters-row">
          <div class="filter-group">
            <label>User ID</label>
            <input
              type="number"
              placeholder="Ex: 34"
              [(ngModel)]="userIdFilter"
              (ngModelChange)="onFilterChange()"
              min="1"
            />
          </div>

          <div class="filter-group">
            <label>Entity ID</label>
            <input
              type="number"
              placeholder="Ex: 12"
              [(ngModel)]="entityIdFilter"
              (ngModelChange)="onFilterChange()"
              min="1"
            />
          </div>

          <div class="filter-group">
            <label>Du</label>
            <input
              type="date"
              [(ngModel)]="fromFilter"
              (ngModelChange)="onFilterChange()"
            />
          </div>

          <div class="filter-group">
            <label>Au</label>
            <input
              type="date"
              [(ngModel)]="toFilter"
              (ngModelChange)="onFilterChange()"
            />
          </div>

          <button class="btn-reset" (click)="resetFilters()" *ngIf="hasActiveFilters()">
            Réinitialiser
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-card">
        <div class="loading-bar" *ngIf="loading()"></div>

        <p class="empty-state" *ngIf="!loading() && logs().length === 0">
          Aucun log trouvé avec ces filtres.
        </p>

        <div class="table-wrapper" *ngIf="logs().length > 0">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Action</th>
                <th>Type</th>
                <th>Entity ID</th>
                <th>User ID</th>
                <th>IP</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of logs()" (click)="openDetail(log)" class="row-clickable">
                <td class="id-cell">#{{ log.id }}</td>
                <td>
                  <span class="action-badge" [ngClass]="getActionClass(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td>
                  <span class="entity-badge" *ngIf="log.entityType">{{ log.entityType }}</span>
                  <span class="muted" *ngIf="!log.entityType">—</span>
                </td>
                <td class="muted">{{ log.entityId ?? '—' }}</td>
                <td class="muted">{{ log.userId ?? '—' }}</td>
                <td class="muted ip-cell">{{ log.ip ?? '—' }}</td>
                <td class="date-cell">{{ log.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                <td>
                  <button class="btn-detail" (click)="openDetail(log); $event.stopPropagation()">
                    Détail
                  </button>
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

      <!-- Modal détail -->
      <div class="modal-backdrop" *ngIf="selectedLog()" (click)="closeDetail()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Log #{{ selectedLog()?.id }}</h2>
              <span class="action-badge" [ngClass]="getActionClass(selectedLog()?.action ?? '')">
                {{ selectedLog()?.action }}
              </span>
            </div>
            <button class="btn-close" (click)="closeDetail()">✕</button>
          </div>

          <div class="detail-grid" *ngIf="selectedLog() as log">
            <div class="detail-item">
              <span class="detail-label">Type</span>
              <span class="detail-value">{{ log.entityType ?? '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Entity ID</span>
              <span class="detail-value">{{ log.entityId ?? '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">User ID</span>
              <span class="detail-value">{{ log.userId ?? '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">IP</span>
              <span class="detail-value">{{ log.ip ?? '—' }}</span>
            </div>
            <div class="detail-item full">
              <span class="detail-label">User Agent</span>
              <span class="detail-value small">{{ log.userAgent ?? '—' }}</span>
            </div>
            <div class="detail-item full">
              <span class="detail-label">Date</span>
              <span class="detail-value">{{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
            </div>
          </div>

          <!-- Metadata JSON -->
          <div class="metadata-section" *ngIf="selectedLog()?.metadata">
            <div class="metadata-label">Metadata</div>
            <pre class="metadata-json">{{ selectedLog()?.metadata | json }}</pre>
          </div>

          <div class="modal-footer">
            <button class="btn-filter-from-log" (click)="filterByLog(selectedLog()!)">
              Filtrer par cet utilisateur
            </button>
            <button class="btn-cancel" (click)="closeDetail()">Fermer</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 0; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    h1 { margin: 0 0 4px; font-size: 1.8rem; font-weight: 800; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.95rem; }

    .btn-export {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border: 1.5px solid #d1d5db; border-radius: 10px;
      background: white; color: #374151; font: inherit; font-weight: 600;
      cursor: pointer; transition: 0.15s; white-space: nowrap;
    }
    .btn-export:hover:not(:disabled) { background: #f9fafb; }
    .btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Filtres */
    .filters-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .filters-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 10px 14px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      font: inherit;
      font-size: 0.95rem;
    }
    .search-input:focus { outline: none; border-color: #6366f1; }
    select {
      padding: 10px 14px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      font: inherit;
      background: white;
      color: #374151;
      cursor: pointer;
      min-width: 160px;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 120px;
    }
    .filter-group label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .filter-group input {
      padding: 9px 12px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      font: inherit;
      font-size: 0.9rem;
    }
    .filter-group input:focus { outline: none; border-color: #6366f1; }
    .btn-reset {
      padding: 9px 16px;
      border: 1.5px solid #fde68a;
      border-radius: 10px;
      background: #fffbeb;
      color: #92400e;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      align-self: flex-end;
      white-space: nowrap;
    }

    /* Table */
    .table-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
    }
    .loading-bar {
      height: 3px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1);
      background-size: 200%;
      animation: shimmer 1.2s infinite;
    }
    @keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }
    .empty-state { text-align: center; color: #9ca3af; padding: 48px; margin: 0; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f9fafb; }
    th {
      padding: 11px 14px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    td { padding: 12px 14px; border-top: 1px solid #f3f4f6; vertical-align: middle; }
    tr.row-clickable { cursor: pointer; }
    tr.row-clickable:hover td { background: #f9fafb; }

    .id-cell { color: #9ca3af; font-size: 0.85rem; font-family: monospace; }
    .muted { color: #9ca3af; font-size: 0.88rem; }
    .ip-cell { font-family: monospace; font-size: 0.82rem; }
    .date-cell { color: #6b7280; font-size: 0.85rem; white-space: nowrap; }

    /* Action badges */
    .action-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
      letter-spacing: 0.02em;
    }
    .action-danger { background: #fee2e2; color: #991b1b; }
    .action-warn { background: #fef3c7; color: #92400e; }
    .action-success { background: #dcfce7; color: #166534; }
    .action-info { background: #dbeafe; color: #1d4ed8; }
    .action-neutral { background: #f3f4f6; color: #374151; }

    .entity-badge {
      display: inline-flex;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #ede9fe;
      color: #6d28d9;
    }

    .btn-detail {
      padding: 5px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      color: #374151;
      white-space: nowrap;
    }
    .btn-detail:hover { background: #f9fafb; }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; padding: 16px; border-top: 1px solid #f3f4f6;
      color: #6b7280; font-size: 0.9rem;
    }
    .pagination button {
      padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 8px;
      background: white; cursor: pointer; font: inherit;
    }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 100; padding: 16px;
    }
    .modal {
      background: white; border-radius: 20px; padding: 28px;
      width: min(560px, 100%); display: flex; flex-direction: column; gap: 20px;
      max-height: 90vh; overflow-y: auto;
    }
    .modal-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 12px;
    }
    .modal-header h2 { margin: 0 0 8px; font-size: 1.2rem; color: #111827; }
    .btn-close {
      border: 0; background: #f3f4f6; border-radius: 8px;
      width: 32px; height: 32px; cursor: pointer; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .detail-item {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px; background: #f9fafb; border-radius: 10px;
    }
    .detail-item.full { grid-column: 1 / -1; }
    .detail-label {
      font-size: 0.72rem; font-weight: 700; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .detail-value { font-size: 0.9rem; color: #111827; font-weight: 500; }
    .detail-value.small { font-size: 0.78rem; word-break: break-all; color: #6b7280; }

    .metadata-section { display: flex; flex-direction: column; gap: 8px; }
    .metadata-label {
      font-size: 0.78rem; font-weight: 700; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .metadata-json {
      background: #0f172a; color: #a5b4fc; padding: 16px; border-radius: 12px;
      font-size: 0.78rem; line-height: 1.6; overflow-x: auto;
      margin: 0; white-space: pre-wrap; word-break: break-all;
    }

    .modal-footer {
      display: flex; gap: 10px; justify-content: flex-end;
      padding-top: 4px; border-top: 1px solid #f3f4f6;
    }
    .btn-cancel {
      padding: 10px 18px; border: 1px solid #d1d5db; border-radius: 10px;
      background: white; font: inherit; font-weight: 600; cursor: pointer;
    }
    .btn-filter-from-log {
      padding: 10px 18px; border: 0; border-radius: 10px;
      background: #ede9fe; color: #6d28d9; font: inherit;
      font-weight: 700; cursor: pointer;
    }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class AuditLogsAdminPageComponent implements OnInit {
  private readonly auditService = inject(AuditAdminService);
  private readonly toast = inject(ToastService);

  readonly response = signal<AuditLogsResponse | null>(null);
  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly selectedLog = signal<AuditLog | null>(null);

  readonly logs = computed(() => this.response()?.items ?? []);
  readonly totalPages = computed(() => {
    const r = this.response();
    if (!r) return 1;
    return Math.ceil(r.summary.totalCount / r.summary.limit);
  });

  readonly page = signal(1);

  // Filtres
  search = '';
  actionFilter = '';
  entityTypeFilter = '';
  userIdFilter: number | null = null;
  entityIdFilter: number | null = null;
  fromFilter = '';
  toFilter = '';

  readonly knownActions = KNOWN_ACTIONS;
  readonly knownEntityTypes = KNOWN_ENTITY_TYPES;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    const query: AuditLogsQuery = { page: this.page(), limit: 20 };
    if (this.search.trim()) query.search = this.search.trim();
    if (this.actionFilter) query.action = this.actionFilter;
    if (this.entityTypeFilter) query.entityType = this.entityTypeFilter;
    if (this.userIdFilter) query.userId = this.userIdFilter;
    if (this.entityIdFilter) query.entityId = this.entityIdFilter;
    if (this.fromFilter) query.from = this.fromFilter;
    if (this.toFilter) query.to = this.toFilter + 'T23:59:59';

    this.auditService.getLogs(query).subscribe({
      next: (r) => { this.response.set(r); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Impossible de charger les logs.'); },
    });
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.loadLogs(); }, 400);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadLogs();
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadLogs();
  }

  hasActiveFilters(): boolean {
    return !!(this.search || this.actionFilter || this.entityTypeFilter ||
      this.userIdFilter || this.entityIdFilter || this.fromFilter || this.toFilter);
  }

  resetFilters(): void {
    this.search = '';
    this.actionFilter = '';
    this.entityTypeFilter = '';
    this.userIdFilter = null;
    this.entityIdFilter = null;
    this.fromFilter = '';
    this.toFilter = '';
    this.page.set(1);
    this.loadLogs();
  }

  openDetail(log: AuditLog): void {
    this.selectedLog.set(log);
  }

  closeDetail(): void {
    this.selectedLog.set(null);
  }

  filterByLog(log: AuditLog): void {
    if (log.userId) {
      this.userIdFilter = log.userId;
      this.closeDetail();
      this.onFilterChange();
    }
  }

  exportCsv(): void {
    this.exporting.set(true);
    const query: AuditLogsQuery = {};
    if (this.actionFilter) query.action = this.actionFilter;
    if (this.entityTypeFilter) query.entityType = this.entityTypeFilter;
    if (this.userIdFilter) query.userId = this.userIdFilter;
    if (this.entityIdFilter) query.entityId = this.entityIdFilter;
    if (this.fromFilter) query.from = this.fromFilter;
    if (this.toFilter) query.to = this.toFilter + 'T23:59:59';
    if (this.search.trim()) query.search = this.search.trim();

    this.auditService.exportCsv(query).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => { this.exporting.set(false); this.toast.error('Erreur lors de l\'export.'); },
    });
  }

  getActionClass(action: string): string {
    if (!action) return 'action-neutral';
    const a = action.toUpperCase();
    if (a.includes('SUSPEND') || a.includes('FAIL') || a.includes('EXPIRED') || a.includes('REFUND')) return 'action-danger';
    if (a.includes('EXPORT') || a.includes('ROLE')) return 'action-warn';
    if (a.includes('LOGIN') || a.includes('REGISTER') || a.includes('VERIFIED') || a.includes('SUCCEEDED') || a.includes('CONFIRMED')) return 'action-success';
    if (a.includes('CREATED') || a.includes('UPDATED') || a.includes('LOADED')) return 'action-info';
    return 'action-neutral';
  }
}