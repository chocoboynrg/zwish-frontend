import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CountdownTimerComponent } from '../../../shared/components/countdown-timer/countdown-timer.component';
import { MyPaymentsService, MyPaymentItem } from '../services/my-payments.service';

@Component({
  selector: 'app-my-payments-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CountdownTimerComponent],
  template: `
    <div class="page-wrap">

      <div class="page-hero">
        <div class="page-hero-inner">
          <div>
            <div class="page-eyebrow">Mon espace</div>
            <h1>Mes paiements</h1>
            <p>Historique complet de vos transactions.</p>
          </div>
          <div class="hero-stats" *ngIf="!loading()">
            <div class="hero-stat">
              <strong>{{ succeededAmount() | number:'1.0-0' }} FCFA</strong>
              <span>Total réussi</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
              <strong>{{ payments().length }}</strong>
              <span>Transactions</span>
            </div>
          </div>
        </div>
      </div>

      <div class="page-body">

        <!-- Filtres -->
        <div class="filter-row">
          <button *ngFor="let f of filters" class="filter-btn" [class.active]="activeFilter() === f.value" (click)="activeFilter.set(f.value)">
            {{ f.label }}
            <span class="filter-count" *ngIf="getCount(f.value) > 0">{{ getCount(f.value) }}</span>
          </button>
        </div>

        <div class="loading-state" *ngIf="loading()">Chargement...</div>

        <div class="empty-block" *ngIf="!loading() && filtered().length === 0">
          <div class="empty-icon">💳</div>
          <p>Aucun paiement{{ activeFilter() !== 'ALL' ? ' avec ce statut' : '' }}.</p>
        </div>

        <!-- Table -->
        <div class="table-card" *ngIf="!loading() && filtered().length > 0">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Événement</th>
                  <th>Montant</th>
                  <th>Provider</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of filtered()">
                  <td class="mono muted">#{{ p.id }}</td>
                  <td class="event-cell">{{ p.contribution?.event?.title ?? '—' }}</td>
                  <td class="amount-cell">{{ p.amount | number:'1.0-0' }} <span class="currency">{{ p.currencyCode }}</span></td>
                  <td class="muted">{{ p.provider }}</td>
                  <td><span class="status-badge" [ngClass]="getStatusClass(p.status)">{{ getStatusLabel(p.status) }}</span>
                    <app-countdown-timer
                      *ngIf="(p.status === 'INITIATED' || p.status === 'PENDING') && p.expiresAt"
                      [expiresAt]="p.expiresAt!"
                      [showExpired]="true"
                    ></app-countdown-timer>
                  </td>
                  <td class="muted small">{{ p.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                  <td>
                    <a [routerLink]="['/app/payments', p.id]" class="table-link">Détail</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-wrap { background: #f9fafb; min-height: calc(100vh - 64px); }
    .page-hero { background: #000; padding: 40px 0; }
    .page-hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
    .page-eyebrow { color: #FFD700; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
    h1 { font-size: 2rem; font-weight: 900; color: white; margin: 0 0 8px; letter-spacing: -0.02em; }
    .page-hero p { color: rgba(255,255,255,0.5); margin: 0; font-size: 0.9rem; }
    .hero-stats { display: flex; align-items: center; gap: 24px; }
    .hero-stat { display: flex; flex-direction: column; gap: 4px; text-align: right; }
    .hero-stat strong { color: white; font-size: 1.3rem; font-weight: 900; }
    .hero-stat span { color: rgba(255,255,255,0.4); font-size: 0.75rem; }
    .hero-stat-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }

    .page-body { max-width: 1280px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; gap: 24px; }
    .loading-state { color: #9ca3af; text-align: center; padding: 48px; }

    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn { padding: 8px 16px; border: 1.5px solid #e5e7eb; border-radius: 999px; background: white; font: inherit; font-size: 0.82rem; font-weight: 600; color: #6b7280; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.15s; }
    .filter-btn:hover { border-color: #111; color: #111; }
    .filter-btn.active { background: #111; border-color: #111; color: white; }
    .filter-count { background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 999px; font-size: 0.7rem; }
    .filter-btn:not(.active) .filter-count { background: #f3f4f6; color: #6b7280; }

    .empty-block { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .empty-icon { font-size: 2.5rem; }
    .empty-block p { color: #9ca3af; margin: 0; }

    .table-card { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f9fafb; }
    th { padding: 12px 16px; text-align: left; font-size: 0.72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
    td { padding: 14px 16px; border-top: 1px solid #f3f4f6; font-size: 0.88rem; }
    tr:hover td { background: #fafafa; }
    .mono { font-family: monospace; }
    .muted { color: #9ca3af; }
    .small { font-size: 0.8rem; }
    .event-cell { font-weight: 600; color: #111; max-width: 200px; }
    .amount-cell { font-weight: 800; color: #111; font-size: 0.95rem; white-space: nowrap; }
    .currency { font-size: 0.72rem; font-weight: 600; color: #9ca3af; }
    .status-badge { padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
    .s-succeeded { background: #dcfce7; color: #166534; }
    .s-initiated, .s-pending { background: #fef3c7; color: #92400e; }
    .s-failed { background: #fee2e2; color: #991b1b; }
    .s-refunded { background: #ede9fe; color: #6d28d9; }
    .s-default { background: #f3f4f6; color: #6b7280; }
    .table-link { color: #6b7280; font-size: 0.8rem; font-weight: 700; text-decoration: none; padding: 5px 10px; border: 1px solid #e5e7eb; border-radius: 7px; }
    .table-link:hover { background: #f9fafb; color: #111; }
  `],
})
export class MyPaymentsPageComponent implements OnInit {
  private readonly service = inject(MyPaymentsService);

  readonly payments = signal<MyPaymentItem[]>([]);
  readonly loading = signal(true);
  readonly activeFilter = signal<string>('ALL');

  readonly filters = [
    { label: 'Tous', value: 'ALL' },
    { label: 'Réussis', value: 'SUCCEEDED' },
    { label: 'En cours', value: 'INITIATED' },
    { label: 'Échoués', value: 'FAILED' },
    { label: 'Remboursés', value: 'REFUNDED' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'ALL') return this.payments();
    return this.payments().filter(p => p.status === f);
  });

  readonly succeededAmount = computed(() =>
    this.payments().filter(p => p.status === 'SUCCEEDED').reduce((s, p) => s + Number(p.amount), 0)
  );

  getCount(f: string): number {
    if (f === 'ALL') return this.payments().length;
    return this.payments().filter(p => p.status === f).length;
  }

  ngOnInit(): void {
    this.service.getMine().subscribe({
      next: (r) => { this.payments.set(r.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getStatusLabel(s: string): string {
    const m: Record<string, string> = { SUCCEEDED: 'Réussi', INITIATED: 'Initié', PENDING: 'En attente', FAILED: 'Échoué', REFUNDED: 'Remboursé', CANCELLED: 'Annulé' };
    return m[s] ?? s;
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { SUCCEEDED: 's-succeeded', INITIATED: 's-initiated', PENDING: 's-pending', FAILED: 's-failed', REFUNDED: 's-refunded' };
    return m[s] ?? 's-default';
  }
}