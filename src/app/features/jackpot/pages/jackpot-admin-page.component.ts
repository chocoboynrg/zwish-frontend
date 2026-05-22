import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { JackpotService } from '../services/jackpot.service';
import { Jackpot, JackpotStatus } from '../models/jackpot.model';

type StatusTab = '' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'En attente', cls: 'badge-pending' },
  APPROVED: { label: 'Approuvée',  cls: 'badge-approved' },
  REJECTED: { label: 'Refusée',    cls: 'badge-rejected' },
  CLOSED:   { label: 'Clôturée',   cls: 'badge-closed' },
};

@Component({
  selector: 'app-jackpot-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1>Cagnottes</h1>
          <p class="subtitle">
            {{ filtered().length }} cagnotte(s)
            @if (statusTab()) { · <em>{{ tabLabel(statusTab()) }}</em> }
          </p>
        </div>
        <button class="btn-refresh" (click)="load()" [disabled]="loading()">
          <lucide-icon name="refresh-cw" [size]="14" color="currentColor" [strokeWidth]="1.8" />
          Actualiser
        </button>
      </div>

      <div class="tabs">
        @for (t of tabs; track t.value) {
          <button class="tab" [class.active]="statusTab() === t.value" (click)="statusTab.set(t.value)">
            {{ t.label }}
            <span class="tab-count">{{ getCount(t.value) }}</span>
          </button>
        }
      </div>

      @if (loading()) { <div class="loading-bar"></div> }

      @if (error() && !loading()) {
        <div class="alert-error">{{ error() }}</div>
      }

      @if (!loading() && filtered().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <p>Aucune cagnotte trouvée.</p>
        </div>
      }

      @if (!loading() && filtered().length > 0) {
        <div class="jackpot-list">
          @for (p of filtered(); track p.id) {
            <div class="jackpot-card" [class.card-pending]="p.status === 'PENDING'">

              <div class="card-left">
                <div class="card-title-row">
                  <span class="status-badge" [ngClass]="getMeta(p.status).cls">{{ getMeta(p.status).label }}</span>
                  <h3 class="card-title">{{ p.title }}</h3>
                  <span class="card-id muted">#{{ p.id }}</span>
                </div>

                @if (p.purposeCategory) {
                  <div class="card-category">
                    <lucide-icon name="folder" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    {{ p.purposeCategory }}
                  </div>
                }

                <div class="organizer-row">
                  <div class="org-avatar">{{ initials(p.owner.name) }}</div>
                  <span class="org-name">{{ p.owner.name }}</span>
                  <span class="card-date muted">· {{ p.createdAt | date:'d MMM yyyy' }}</span>
                </div>
              </div>

              <div class="card-right">
                <div class="stats-row">
                  <div class="stat-chip">
                    <lucide-icon name="info" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    <span>{{ p.visibility === 'PUBLIC' ? 'Public' : 'Privé' }}</span>
                  </div>
                  @if (p.deadlineAt) {
                    <div class="stat-chip">
                      <lucide-icon name="calendar" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                      <span>{{ p.deadlineAt | date:'d MMM' }}</span>
                    </div>
                  }
                </div>

                <div class="progress-wrap">
                  <div class="progress-amounts">
                    <span class="funded-amount">{{ p.collectedAmount | number }} XOF</span>
                    <span class="target-amount">/ {{ p.targetAmount | number }} XOF</span>
                    <span class="progress-pct" [class.pct-full]="progressPercent(p) === 100">{{ progressPercent(p) }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill"
                      [style.width.%]="progressPercent(p)"
                      [class.fill-partial]="progressPercent(p) > 0 && progressPercent(p) < 100"
                      [class.fill-full]="progressPercent(p) === 100">
                    </div>
                  </div>
                </div>

                <a [routerLink]="['/admin/jackpot', p.id]" class="btn-detail">
                  Voir le détail
                  <lucide-icon name="chevron-right" [size]="13" color="currentColor" [strokeWidth]="2" />
                </a>
              </div>

            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 32px 24px; display: flex; flex-direction: column; gap: 20px; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    h1 { margin: 0 0 4px; font-size: 1.8rem; font-weight: 800; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .subtitle em { color: #111; font-style: normal; font-weight: 600; }

    .btn-refresh {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 16px; border: 1.5px solid #d1d5db; border-radius: 10px;
      background: white; color: #374151; font: inherit; font-weight: 600;
      font-size: 0.86rem; cursor: pointer; transition: 0.15s; white-space: nowrap;
    }
    .btn-refresh:hover:not(:disabled) { background: #f9fafb; }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

    .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tab {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 14px; border: 1.5px solid #e5e7eb; border-radius: 999px;
      background: white; font: inherit; font-size: 0.82rem; font-weight: 600;
      color: #6b7280; cursor: pointer; transition: 0.15s;
    }
    .tab:hover { border-color: #111827; color: #111827; }
    .tab.active { background: #111827; border-color: #111827; color: white; }
    .tab-count { background: rgba(0,0,0,0.08); color: inherit; font-size: 0.7rem; font-weight: 800; padding: 1px 6px; border-radius: 999px; }
    .tab.active .tab-count { background: rgba(255,255,255,0.2); }

    .loading-bar {
      height: 3px; border-radius: 2px;
      background: linear-gradient(90deg, #111827 25%, #6b7280 50%, #111827 75%);
      background-size: 200%; animation: shimmer 1.2s infinite;
    }
    @keyframes shimmer { 0% { background-position: -200%; } 100% { background-position: 200%; } }

    .alert-error { padding: 14px 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; font-size: 0.88rem; }

    .empty-state { text-align: center; padding: 64px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; color: #9ca3af; }
    .empty-icon { font-size: 2.8rem; }

    .status-badge {
      padding: 3px 9px; border-radius: 999px; font-size: 0.68rem; font-weight: 800;
      white-space: nowrap; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0;
    }
    .badge-pending  { background: #fef3c7; color: #92400e; }
    .badge-approved { background: #dcfce7; color: #166534; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    .badge-closed   { background: #f3f4f6; color: #6b7280; }

    .jackpot-list { display: flex; flex-direction: column; gap: 12px; }

    .jackpot-card {
      background: white; border: 1.5px solid #e5e7eb; border-radius: 16px;
      padding: 20px 24px; display: grid; grid-template-columns: 1fr auto;
      gap: 24px; align-items: start; transition: 0.15s;
    }
    .jackpot-card:hover { border-color: #d1d5db; box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
    .jackpot-card.card-pending { border-color: #fde68a; background: #fffdf5; }

    .card-left { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    .card-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .card-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #111827; }
    .card-id { font-size: 0.75rem; font-family: monospace; }

    .card-category { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #6b7280; }
    .card-category svg { color: #9ca3af; flex-shrink: 0; }

    .organizer-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .org-avatar {
      width: 28px; height: 28px; border-radius: 50%; background: #f3f4f6;
      border: 1.5px solid #e5e7eb; font-size: 0.68rem; font-weight: 800; color: #374151;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .org-name { font-size: 0.88rem; font-weight: 700; color: #111827; }
    .card-date { font-size: 0.82rem; }

    .card-right { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; flex-shrink: 0; min-width: 220px; }

    .stats-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .stat-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 10px; border: 1px solid #f0f1f3; border-radius: 8px;
      background: #f9fafb; font-size: 0.78rem; color: #374151;
    }

    .progress-wrap { width: 100%; display: flex; flex-direction: column; gap: 5px; }
    .progress-amounts { display: flex; align-items: baseline; gap: 5px; font-size: 0.82rem; }
    .funded-amount { font-weight: 800; color: #111827; }
    .target-amount { color: #9ca3af; }
    .progress-pct { margin-left: auto; font-weight: 800; font-size: 0.88rem; color: #6366f1; }
    .pct-full { color: #16a34a; }
    .progress-bar { height: 7px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; background: #e5e7eb; transition: width 0.4s; }
    .fill-partial { background: #6366f1; }
    .fill-full { background: #22c55e; }

    .btn-detail {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border: 1.5px solid #e5e7eb; border-radius: 10px;
      background: white; color: #374151; text-decoration: none;
      font-size: 0.82rem; font-weight: 700; transition: 0.15s; white-space: nowrap;
    }
    .btn-detail:hover { border-color: #111827; color: #111827; background: #f9fafb; }

    .muted { color: #9ca3af; }

    @media (max-width: 760px) {
      .jackpot-card { grid-template-columns: 1fr; }
      .card-right { align-items: flex-start; }
      .stats-row { justify-content: flex-start; }
    }
  `],
})
export class JackpotAdminPageComponent implements OnInit {
  private readonly service = inject(JackpotService);

  readonly items = signal<Jackpot[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly statusTab = signal<StatusTab>('');

  readonly tabs: { label: string; value: StatusTab }[] = [
    { label: 'Toutes',      value: '' },
    { label: 'En attente',  value: 'PENDING' },
    { label: 'Approuvées',  value: 'APPROVED' },
    { label: 'Refusées',    value: 'REJECTED' },
    { label: 'Clôturées',   value: 'CLOSED' },
  ];

  readonly filtered = computed(() => {
    const f = this.statusTab();
    if (!f) return this.items();
    return this.items().filter((p) => p.status === f);
  });

  getCount(v: StatusTab): number {
    if (!v) return this.items().length;
    return this.items().filter((p) => p.status === v).length;
  }

  tabLabel(v: StatusTab): string {
    return this.tabs.find((t) => t.value === v)?.label ?? '';
  }

  getMeta(status: string) {
    return STATUS_META[status] ?? STATUS_META['PENDING'];
  }

  progressPercent(p: Jackpot): number {
    if (!p.targetAmount) return 0;
    return Math.min(100, Math.round((Number(p.collectedAmount) / Number(p.targetAmount)) * 100));
  }

  initials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.getAll().subscribe({
      next: (rs) => { this.items.set(rs); this.loading.set(false); },
      error: () => { this.error.set('Erreur de chargement.'); this.loading.set(false); },
    });
  }
}
