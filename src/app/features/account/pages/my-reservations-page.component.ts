import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { UserReservationService, ReservationItem } from '../services/user-reservation.service';

type Filter = 'ALL' | 'ACTIVE' | 'RELEASED' | 'EXPIRED' | 'CONFIRMED';

@Component({
  selector: 'app-my-reservations-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="page-wrap">
      <!-- Hero -->
      <div class="page-hero">
        <div class="page-hero-inner">
          <div>
            <div class="page-eyebrow">Mon espace</div>
            <h1>Mes réservations</h1>
            <p>Les cadeaux que vous avez réservés pour vos proches.</p>
          </div>
          @if (!loading() && items().length > 0) {
            <div class="hero-stats">
              <div class="hero-stat">
                <strong>{{ activeCount() }}</strong>
                <span>Actives</span>
              </div>
              <div class="hero-stat-sep"></div>
              <div class="hero-stat">
                <strong>{{ items().length }}</strong>
                <span>Total</span>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="page-body">
        <!-- Filtres -->
        <div class="filter-row">
          @for (f of filters; track f.value) {
            <button
              class="filter-btn"
              [class.active]="activeFilter() === f.value"
              (click)="activeFilter.set(f.value)"
            >
              {{ f.label }}
              @if (getCount(f.value) > 0) {
                <span class="filter-count">{{ getCount(f.value) }}</span>
              }
            </button>
          }
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="loading-state">
            <div class="loading-spinner"></div>
            Chargement...
          </div>
        }

        <!-- Erreur -->
        @if (!loading() && error()) {
          <div class="error-block">
            <p>{{ error() }}</p>
            <button class="btn-retry" (click)="load()">Réessayer</button>
          </div>
        }

        <!-- Vide -->
        @if (!loading() && !error() && filtered().length === 0) {
          <div class="empty-block">
            <div class="empty-icon">🎁</div>
            <p>Aucune réservation{{ activeFilter() !== 'ALL' ? ' avec ce statut' : '' }}.</p>
            <a routerLink="/app/events" class="btn-yellow">Voir mes événements</a>
          </div>
        }

        <!-- Liste -->
        @if (!loading() && filtered().length > 0) {
          <div class="reserv-list">
            @for (r of filtered(); track r.id) {
              <div class="reserv-card" [class]="'status-' + r.status.toLowerCase()">
                <div class="reserv-card-left">
                  <div class="reserv-item-icon">🎁</div>
                  <div class="reserv-info">
                    <div class="reserv-item-name">{{ r.wishlistItem?.name ?? 'Item #' + r.id }}</div>
                    @if (r.event) {
                      <div class="reserv-event-name">
                        <lucide-icon name="calendar" [size]="12" color="currentColor" [strokeWidth]="1.8" />
                        {{ r.event.title }}
                      </div>
                    }
                    @if (r.wishlistItem?.price) {
                      <div class="reserv-price">{{ r.wishlistItem!.price | number: '1.0-0' }} FCFA</div>
                    }
                    <div class="reserv-date">Réservé le {{ r.reservedAt | date: 'd MMM yyyy' : '' : 'fr' }}</div>
                  </div>
                </div>
                <div class="reserv-card-right">
                  <span class="status-badge" [class]="'badge-' + r.status.toLowerCase()">
                    {{ statusLabel(r.status) }}
                  </span>
                  @if (r.status === 'ACTIVE') {
                    <button
                      class="btn-release"
                      [disabled]="releasingId() === r.id"
                      (click)="release(r)"
                    >
                      @if (releasingId() === r.id) {
                        <span class="btn-spinner"></span>
                      }
                      {{ releasingId() === r.id ? '...' : 'Libérer' }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { min-height: 100vh; background: #f8f9fb; }

    .page-hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 2.5rem 1.5rem 2rem;
      color: #fff;
    }
    .page-hero-inner {
      max-width: 860px; margin: 0 auto;
      display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem;
      flex-wrap: wrap;
    }
    .page-eyebrow { font-size: .75rem; text-transform: uppercase; letter-spacing: .1em; color: #f0c040; margin-bottom: .4rem; font-weight: 600; }
    h1 { font-size: 1.8rem; font-weight: 700; margin: 0 0 .4rem; }
    p { color: rgba(255,255,255,.65); margin: 0; font-size: .95rem; }

    .hero-stats { display: flex; align-items: center; gap: .75rem; }
    .hero-stat { text-align: center; }
    .hero-stat strong { display: block; font-size: 1.5rem; font-weight: 700; color: #f0c040; }
    .hero-stat span { font-size: .75rem; color: rgba(255,255,255,.6); }
    .hero-stat-sep { width: 1px; height: 2rem; background: rgba(255,255,255,.2); }

    .page-body { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem; }

    .filter-row { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .filter-btn {
      padding: .4rem .9rem; border-radius: 999px;
      border: 1.5px solid #e0e0e0; background: #fff;
      font-size: .85rem; font-weight: 500; cursor: pointer; color: #555;
      display: flex; align-items: center; gap: .35rem; transition: all .15s;
    }
    .filter-btn:hover { border-color: #1a1a2e; color: #1a1a2e; }
    .filter-btn.active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; }
    .filter-count {
      background: rgba(255,255,255,.25); color: inherit;
      padding: .05rem .4rem; border-radius: 999px; font-size: .75rem;
    }
    .filter-btn:not(.active) .filter-count { background: #f0f0f0; color: #555; }

    .loading-state {
      display: flex; align-items: center; gap: .75rem;
      color: #666; padding: 3rem; justify-content: center;
    }
    .loading-spinner {
      width: 20px; height: 20px;
      border: 2.5px solid #e0e0e0; border-top-color: #1a1a2e;
      border-radius: 50%; animation: spin .7s linear infinite;
    }

    .error-block { text-align: center; padding: 3rem; color: #c0392b; }
    .btn-retry {
      margin-top: .75rem; padding: .5rem 1.25rem;
      background: #c0392b; color: #fff; border: none;
      border-radius: .5rem; cursor: pointer; font-weight: 600;
    }

    .empty-block { text-align: center; padding: 4rem 1rem; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-block p { color: #666; margin-bottom: 1rem; }
    .btn-yellow {
      display: inline-block; padding: .6rem 1.5rem;
      background: #f0c040; color: #1a1a2e;
      border-radius: .5rem; font-weight: 700; text-decoration: none;
    }

    .reserv-list { display: flex; flex-direction: column; gap: .75rem; }

    .reserv-card {
      background: #fff;
      border-radius: .75rem;
      padding: 1.1rem 1.25rem;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      box-shadow: 0 1px 6px rgba(0,0,0,.06);
      border-left: 4px solid #e0e0e0;
      flex-wrap: wrap;
    }
    .reserv-card.status-active { border-left-color: #4361ee; }
    .reserv-card.status-confirmed { border-left-color: #27ae60; }
    .reserv-card.status-released { border-left-color: #e67e22; }
    .reserv-card.status-expired { border-left-color: #95a5a6; }

    .reserv-card-left { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0; }
    .reserv-item-icon { font-size: 1.5rem; flex-shrink: 0; }
    .reserv-info { min-width: 0; }
    .reserv-item-name { font-weight: 600; font-size: .95rem; color: #1a1a2e; }
    .reserv-event-name {
      display: flex; align-items: center; gap: .3rem;
      font-size: .8rem; color: #666; margin-top: .2rem;
    }
    .reserv-price { font-size: .85rem; color: #4361ee; font-weight: 600; margin-top: .2rem; }
    .reserv-date { font-size: .78rem; color: #999; margin-top: .2rem; }

    .reserv-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: .5rem; flex-shrink: 0; }

    .status-badge {
      font-size: .75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .05em; padding: .2rem .7rem; border-radius: 999px;
    }
    .badge-active { background: #ebf0ff; color: #4361ee; }
    .badge-confirmed { background: #e8f8ef; color: #27ae60; }
    .badge-released { background: #fef3e8; color: #e67e22; }
    .badge-expired { background: #f0f0f0; color: #95a5a6; }

    .btn-release {
      padding: .35rem .9rem;
      background: transparent;
      border: 1.5px solid #e74c3c;
      color: #e74c3c; border-radius: .4rem;
      font-size: .8rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: .35rem;
      transition: all .15s;
    }
    .btn-release:hover:not(:disabled) { background: #e74c3c; color: #fff; }
    .btn-release:disabled { opacity: .5; cursor: not-allowed; }

    .btn-spinner {
      width: 12px; height: 12px;
      border: 2px solid rgba(231,76,60,.3);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 600px) {
      .page-hero { padding: 1.5rem 1rem 1.25rem; }
      .page-body { padding: 1.25rem 1rem; }
      .reserv-card { padding: .9rem 1rem; }
      .reserv-card-right { flex-direction: row; align-items: center; }
    }
  `],
})
export class MyReservationsPageComponent implements OnInit {
  private readonly reservationService = inject(UserReservationService);

  readonly items = signal<ReservationItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly releasingId = signal<number | null>(null);
  readonly activeFilter = signal<Filter>('ALL');

  readonly filters: { label: string; value: Filter }[] = [
    { label: 'Toutes', value: 'ALL' },
    { label: 'Actives', value: 'ACTIVE' },
    { label: 'Confirmées', value: 'CONFIRMED' },
    { label: 'Libérées', value: 'RELEASED' },
    { label: 'Expirées', value: 'EXPIRED' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'ALL') return this.items();
    return this.items().filter(r => r.status === f);
  });

  readonly activeCount = computed(() => this.items().filter(r => r.status === 'ACTIVE').length);

  getCount(f: Filter): number {
    if (f === 'ALL') return this.items().length;
    return this.items().filter(r => r.status === f).length;
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      CONFIRMED: 'Confirmée',
      RELEASED: 'Libérée',
      EXPIRED: 'Expirée',
    };
    return labels[status] ?? status;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.reservationService.getMyReservations().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message ?? 'Impossible de charger les réservations.');
        this.loading.set(false);
      },
    });
  }

  release(r: ReservationItem): void {
    if (this.releasingId() !== null) return;
    if (!confirm(`Libérer la réservation de "${r.wishlistItem?.name ?? 'cet item'}" ?`)) return;
    this.releasingId.set(r.id);
    this.reservationService.releaseReservation(r.id).subscribe({
      next: (updated) => {
        this.items.update(list => list.map(i => i.id === updated.id ? updated : i));
        this.releasingId.set(null);
      },
      error: () => {
        this.releasingId.set(null);
      },
    });
  }
}
