import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SKIP_GLOBAL_ERROR_TOAST } from '../../../core/http/http-context-tokens';
import { map } from 'rxjs/operators';

interface TrackerItem {
  id: number;
  name: string;
  targetAmount: number;
  fundedAmount: number;
  remainingAmount: number;
  fundingStatus: 'NOT_FUNDED' | 'PARTIALLY_FUNDED' | 'FUNDED';
  quantity: number;
  imageUrl: string | null;
  updatedAt: string;
  progressPercent: number;
  contributionCount: number;
  event: {
    id: number;
    title: string;
    eventDate: string;
    organizerName: string;
  };
}

@Component({
  selector: 'app-wishlist-tracker-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Suivi en temps réel</h1>
          <p class="subtitle">Items terminés ou à plus de {{ minProgress() }}% de financement</p>
        </div>
        <div class="header-right">
          <div class="refresh-info">
            <div class="pulse" [class.active]="!loading()"></div>
            Actualisation dans {{ countdown() }}s
          </div>
          <div class="threshold-wrap">
            <label>Seuil :</label>
            <select [value]="minProgress()" (change)="setMinProgress(+$any($event.target).value)">
              <option value="50">50%</option>
              <option value="70">70%</option>
              <option value="80">80%</option>
              <option value="90">90%</option>
              <option value="100">100% seulement</option>
            </select>
          </div>
          <button class="btn-refresh" (click)="load()" [disabled]="loading()">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M17 10A7 7 0 116.23 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M14 1v5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Stats rapides -->
      <div class="quick-stats">
        <div class="qs-card qs-green">
          <div class="qs-val">{{ funded().length }}</div>
          <div class="qs-label">Terminés (100%)</div>
        </div>
        <div class="qs-card qs-amber">
          <div class="qs-val">{{ nearlyFunded().length }}</div>
          <div class="qs-label">Presque terminés (≥80%)</div>
        </div>
        <div class="qs-card qs-purple">
          <div class="qs-val">{{ items().length }}</div>
          <div class="qs-label">Total suivis</div>
        </div>
        <div class="qs-card qs-blue">
          <div class="qs-val">{{ totalCollected() | number }} <span class="qs-curr">XOF</span></div>
          <div class="qs-label">Total collecté</div>
        </div>
      </div>

      @if (loading() && items().length === 0) {
        <div class="loading-bar"></div>
      }

      <!-- Filtre status -->
      <div class="filter-tabs">
        <button class="ftab" [class.active]="statusFilter() === 'all'" (click)="statusFilter.set('all')">
          Tous <span class="ftab-count">{{ items().length }}</span>
        </button>
        <button class="ftab ftab-green" [class.active]="statusFilter() === 'funded'" (click)="statusFilter.set('funded')">
          Terminés <span class="ftab-count">{{ funded().length }}</span>
        </button>
        <button class="ftab ftab-amber" [class.active]="statusFilter() === 'near'" (click)="statusFilter.set('near')">
          Presque <span class="ftab-count">{{ nearlyFunded().length }}</span>
        </button>
      </div>

      @if (filteredItems().length === 0 && !loading()) {
        <div class="empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#d1d5db" stroke-width="1.5"/>
            <path d="M12 8v4l2.5 2.5" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p>Aucun item au-dessus du seuil de {{ minProgress() }}%.</p>
        </div>
      }

      <div class="items-grid">
        @for (item of filteredItems(); track item.id) {
          <div class="item-card" [class.card-funded]="item.fundingStatus === 'FUNDED'" [class.card-near]="item.progressPercent >= 80 && item.fundingStatus !== 'FUNDED'">
            <!-- Barre de progression en haut -->
            <div class="card-progress-bar">
              <div class="card-progress-fill"
                [style.width.%]="item.progressPercent"
                [class.fill-green]="item.fundingStatus === 'FUNDED'"
                [class.fill-amber]="item.progressPercent >= 80 && item.fundingStatus !== 'FUNDED'"
              ></div>
            </div>

            <div class="card-body">
              <div class="card-top">
                <div class="card-name">{{ item.name }}</div>
                <span class="card-badge"
                  [class.badge-funded]="item.fundingStatus === 'FUNDED'"
                  [class.badge-near]="item.progressPercent >= 80 && item.fundingStatus !== 'FUNDED'"
                  [class.badge-partial]="item.progressPercent < 80 && item.fundingStatus !== 'FUNDED'"
                >
                  {{ item.fundingStatus === 'FUNDED' ? '✓ Terminé' : item.progressPercent + '%' }}
                </span>
              </div>

              <div class="card-event">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <a [routerLink]="['/admin/events', item.event.id]" class="event-link">{{ item.event.title }}</a>
                <span class="card-organizer">· {{ item.event.organizerName }}</span>
              </div>

              <div class="card-amounts">
                <div class="amount-funded">{{ item.fundedAmount | number }} XOF</div>
                <div class="amount-sep">sur</div>
                <div class="amount-target">{{ item.targetAmount | number }} XOF</div>
              </div>

              @if (item.remainingAmount > 0) {
                <div class="amount-remaining">{{ item.remainingAmount | number }} XOF restants</div>
              }

              <div class="card-footer">
                <div class="card-meta">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                    <path d="M3 6h14M6 6V4a1 1 0 011-1h6a1 1 0 011 1v2M4 6l1 11h10l1-11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  {{ item.contributionCount }} contribution(s)
                </div>
                <div class="card-meta">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 6v4l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  {{ formatDate(item.updatedAt) }}
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 32px 24px; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    h1 { margin: 0 0 4px; font-size: 1.8rem; font-weight: 800; color: #111827; }
    .subtitle { margin: 0; font-size: 0.9rem; color: #6b7280; }

    .header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .refresh-info { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #6b7280; }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; }
    .pulse.active { background: #22c55e; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .threshold-wrap { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #374151; }
    .threshold-wrap select { padding: 7px 10px; border: 1.5px solid #d1d5db; border-radius: 8px; font: inherit; background: white; }

    .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 9px 16px; border: 1.5px solid #d1d5db; border-radius: 10px; background: white; font: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .btn-refresh:hover:not(:disabled) { background: #f9fafb; }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Quick stats */
    .quick-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .qs-card { background: white; border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 16px 20px; }
    .qs-val { font-size: 1.5rem; font-weight: 800; color: #111827; }
    .qs-curr { font-size: 0.7rem; font-weight: 600; color: #9ca3af; }
    .qs-label { font-size: 0.78rem; color: #6b7280; margin-top: 4px; }
    .qs-green .qs-val { color: #16a34a; }
    .qs-amber .qs-val { color: #d97706; }
    .qs-purple .qs-val { color: #7c3aed; }
    .qs-blue .qs-val { color: #2563eb; }

    .loading-bar { height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1); background-size: 200%; animation: shimmer 1.2s infinite; border-radius: 2px; margin-bottom: 16px; }
    @keyframes shimmer { 0% { background-position: -200%; } 100% { background-position: 200%; } }

    /* Filter tabs */
    .filter-tabs { display: flex; gap: 0; border-bottom: 2px solid #f3f4f6; margin-bottom: 20px; }
    .ftab { padding: 10px 18px; border: 0; background: transparent; font: inherit; font-size: 0.88rem; font-weight: 600; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 7px; transition: 0.15s; }
    .ftab.active { color: #111827; border-bottom-color: #111827; }
    .ftab-green.active { color: #16a34a; border-bottom-color: #16a34a; }
    .ftab-amber.active { color: #d97706; border-bottom-color: #d97706; }
    .ftab-count { background: #f3f4f6; color: #6b7280; padding: 1px 7px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .ftab.active .ftab-count { background: #111827; color: white; }
    .ftab-green.active .ftab-count { background: #16a34a; color: white; }
    .ftab-amber.active .ftab-count { background: #d97706; color: white; }

    .empty { text-align: center; padding: 60px 24px; color: #9ca3af; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .empty p { margin: 0; }

    /* Items grid */
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .item-card { background: white; border: 1.5px solid #e5e7eb; border-radius: 16px; overflow: hidden; transition: box-shadow 0.15s, transform 0.15s; }
    .item-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .card-funded { border-color: #86efac; }
    .card-near { border-color: #fde68a; }

    .card-progress-bar { height: 5px; background: #f3f4f6; }
    .card-progress-fill { height: 100%; background: #6366f1; transition: width 0.5s; }
    .fill-green { background: #22c55e; }
    .fill-amber { background: #f59e0b; }

    .card-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .card-name { font-weight: 800; color: #111827; font-size: 0.95rem; line-height: 1.3; }
    .card-badge { display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
    .badge-funded { background: #dcfce7; color: #166534; }
    .badge-near { background: #fef3c7; color: #92400e; }
    .badge-partial { background: #f3f4f6; color: #6b7280; }

    .card-event { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #6b7280; }
    .event-link { color: #6366f1; text-decoration: none; font-weight: 600; }
    .event-link:hover { text-decoration: underline; }
    .card-organizer { color: #9ca3af; }

    .card-amounts { display: flex; align-items: baseline; gap: 6px; }
    .amount-funded { font-size: 1.15rem; font-weight: 800; color: #111827; }
    .amount-sep { color: #9ca3af; font-size: 0.85rem; }
    .amount-target { color: #6b7280; font-size: 0.9rem; }
    .amount-remaining { font-size: 0.78rem; color: #9ca3af; }

    .card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #f3f4f6; }
    .card-meta { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: #9ca3af; }

    @media (max-width: 768px) {
      .page { padding: 16px; }
      .quick-stats { grid-template-columns: 1fr 1fr; }
      .items-grid { grid-template-columns: 1fr; }
      .header-right { width: 100%; }
    }
  `],
})
export class WishlistTrackerAdminPageComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/wishlist-items/admin/tracking`;

  readonly loading = signal(false);
  readonly items = signal<TrackerItem[]>([]);
  readonly minProgress = signal(70);
  readonly statusFilter = signal<'all' | 'funded' | 'near'>('all');
  readonly countdown = signal(30);

  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  readonly funded = computed(() => this.items().filter(i => i.fundingStatus === 'FUNDED'));
  readonly nearlyFunded = computed(() => this.items().filter(i => i.progressPercent >= 80 && i.fundingStatus !== 'FUNDED'));
  readonly totalCollected = computed(() => this.items().reduce((s, i) => s + i.fundedAmount, 0));

  readonly filteredItems = computed(() => {
    const f = this.statusFilter();
    if (f === 'funded') return this.funded();
    if (f === 'near') return this.nearlyFunded();
    return this.items();
  });

  ngOnInit(): void {
    this.load();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  load(): void {
    this.loading.set(true);
    this.http
      .get<{ success: boolean; data: { items: TrackerItem[] } }>(
        `${this.url}?minProgress=${this.minProgress()}`,
        { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) }
      )
      .pipe(map(r => r.data.items))
      .subscribe({
        next: (items) => { this.items.set(items); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  setMinProgress(val: number): void {
    this.minProgress.set(val);
    this.load();
  }

  private startAutoRefresh(): void {
    this.countdown.set(30);
    this.countdownInterval = setInterval(() => {
      this.countdown.update(v => {
        if (v <= 1) {
          this.load();
          return 30;
        }
        return v - 1;
      });
    }, 1000);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}
