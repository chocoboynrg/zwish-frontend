import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MyContributionsService, MyContributionItem, MyContributionsResponse } from '../services/my-contributions.service';

type Filter = 'ALL' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

@Component({
  selector: 'app-my-contributions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrap">

      <div class="page-hero">
        <div class="page-hero-inner">
          <div>
            <div class="page-eyebrow">Mon espace</div>
            <h1>Mes contributions</h1>
            <p>Suivez vos participations financières et leurs statuts.</p>
          </div>
          <div class="hero-stats" *ngIf="!loading()">
            <div class="hero-stat">
              <strong>{{ confirmedAmount() | number:'1.0-0' }} FCFA</strong>
              <span>Montant confirmé</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
              <strong>{{ pendingCount() }}</strong>
              <span>En attente</span>
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
          <div class="empty-icon">⭐</div>
          <p>Aucune contribution {{ activeFilter() !== 'ALL' ? 'avec ce statut' : '' }}.</p>
          <a routerLink="/catalog" class="btn-yellow">Parcourir le catalogue</a>
        </div>

        <div class="contrib-list" *ngIf="!loading() && filtered().length > 0">
          <div class="contrib-card" *ngFor="let c of filtered()">
            <div class="contrib-header">
              <div class="contrib-item-name">{{ c.wishlistItem?.title ?? '—' }}</div>
              <span class="status-badge" [ngClass]="getStatusClass(c.status)">{{ getStatusLabel(c.status) }}</span>
            </div>
            <div class="contrib-meta">
              <div class="contrib-event">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                {{ c.event?.title ?? '—' }}
              </div>
              <div class="contrib-date">{{ c.createdAt | date:'dd MMM yyyy' }}</div>
            </div>
            <div class="contrib-footer">
              <div class="contrib-amount">{{ c.amount | number:'1.0-0' }} <span class="currency">{{ c.currencyCode }}</span></div>
              <a [routerLink]="['/app/events', c.event?.id]" class="contrib-link">Voir l'événement →</a>
            </div>
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
    .btn-yellow { background: #FFD700; color: #000; padding: 10px 22px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 0.88rem; }

    .contrib-list { display: flex; flex-direction: column; gap: 12px; }
    .contrib-card { background: white; border: 1.5px solid #f3f4f6; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: 0.2s; }
    .contrib-card:hover { border-color: #e5e7eb; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .contrib-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .contrib-item-name { font-weight: 700; color: #111; font-size: 0.95rem; }
    .status-badge { padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
    .s-confirmed { background: #dcfce7; color: #166534; }
    .s-awaiting { background: #fef3c7; color: #92400e; }
    .s-failed, .s-cancelled { background: #fee2e2; color: #991b1b; }
    .s-refunded { background: #ede9fe; color: #6d28d9; }
    .s-default { background: #f3f4f6; color: #6b7280; }
    .contrib-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 0.82rem; color: #6b7280; flex-wrap: wrap; }
    .contrib-event { display: flex; align-items: center; gap: 6px; }
    .contrib-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #f3f4f6; }
    .contrib-amount { font-size: 1.1rem; font-weight: 900; color: #111; }
    .currency { font-size: 0.75rem; font-weight: 600; color: #9ca3af; }
    .contrib-link { color: #6b7280; font-size: 0.82rem; font-weight: 700; text-decoration: none; }
    .contrib-link:hover { color: #111; }
  `],
})
export class MyContributionsPageComponent implements OnInit {
  private readonly service = inject(MyContributionsService);

  readonly data = signal<MyContributionsResponse | null>(null);
  readonly loading = signal(true);
  readonly activeFilter = signal<Filter>('ALL');

  readonly filters = [
    { label: 'Toutes', value: 'ALL' as Filter },
    { label: 'En attente', value: 'AWAITING_PAYMENT' as Filter },
    { label: 'Confirmées', value: 'CONFIRMED' as Filter },
    { label: 'Échouées', value: 'FAILED' as Filter },
    { label: 'Annulées', value: 'CANCELLED' as Filter },
    { label: 'Remboursées', value: 'REFUNDED' as Filter },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    const items = this.data()?.items ?? [];
    if (f === 'ALL') return items;
    return items.filter(c => c.status === f);
  });

  readonly confirmedAmount = computed(() =>
    (this.data()?.items ?? []).filter(c => c.status === 'CONFIRMED').reduce((s, c) => s + Number(c.amount), 0)
  );

  readonly pendingCount = computed(() =>
    (this.data()?.items ?? []).filter(c => c.status === 'AWAITING_PAYMENT').length
  );

  getCount(f: Filter): number {
    const items = this.data()?.items ?? [];
    if (f === 'ALL') return items.length;
    return items.filter(c => c.status === f).length;
  }

  ngOnInit(): void {
    this.service.getMine().subscribe({
      next: (d: MyContributionsResponse) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getStatusLabel(s: string): string {
    const m: Record<string, string> = { CONFIRMED: 'Confirmée', AWAITING_PAYMENT: 'En attente', FAILED: 'Échouée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée' };
    return m[s] ?? s;
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = { CONFIRMED: 's-confirmed', AWAITING_PAYMENT: 's-awaiting', FAILED: 's-failed', CANCELLED: 's-cancelled', REFUNDED: 's-refunded' };
    return m[s] ?? 's-default';
  }
}