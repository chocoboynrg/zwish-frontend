import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsService, AdminEventFull } from '../services/events.service';
import { LucideAngularModule } from 'lucide-angular';

type StatusTab = 'all' | 'upcoming' | 'past' | 'archived';

@Component({
  selector: 'app-events-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Événements</h1>
          <p class="subtitle">
            {{ filtered().length }} événement(s)
            @if (search().trim()) { correspondant à <em>"{{ search() }}"</em> }
          </p>
        </div>
        <button class="btn-refresh" (click)="load()" [disabled]="loading()">
          <lucide-icon name="refresh-cw" [size]="14" color="currentColor" [strokeWidth]="1.8" />
          Actualiser
        </button>
      </div>

      <!-- Search + tabs -->
      <div class="toolbar">
        <div class="search-wrap">
          <lucide-icon name="search" [size]="15" color="currentColor" [strokeWidth]="1.8" class="search-icon" />
          <input
            type="text"
            class="search-input"
            placeholder="Rechercher par titre ou organisateur…"
            [(ngModel)]="searchVal"
            (ngModelChange)="search.set($event)"
          />
          @if (search().trim()) {
            <button class="search-clear" (click)="search.set(''); searchVal = ''">✕</button>
          }
        </div>
        <div class="tabs">
          @for (t of tabs; track t.value) {
            <button
              class="tab"
              [class.active]="statusTab() === t.value"
              (click)="statusTab.set(t.value)"
            >
              {{ t.label }}
              <span class="tab-count">{{ getTabCount(t.value) }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-bar"></div>
      }

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="alert-error">{{ error() }}</div>
      }

      <!-- Empty -->
      @if (!loading() && filtered().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>Aucun événement trouvé.</p>
        </div>
      }

      <!-- Event cards -->
      @if (!loading() && filtered().length > 0) {
        <div class="events-list">
          @for (ev of filtered(); track ev.id) {
            <div class="event-card" [class.archived]="ev.isArchived">

              <!-- Left: main info -->
              <div class="card-left">
                <!-- Status badge + title -->
                <div class="card-title-row">
                  <span class="status-badge" [ngClass]="getStatusClass(ev)">{{ getStatusLabel(ev) }}</span>
                  <h3 class="card-title">{{ ev.title }}</h3>
                  <span class="card-id muted">#{{ ev.id }}</span>
                </div>

                <!-- Date -->
                <div class="card-date">
                  <lucide-icon name="calendar" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                  {{ ev.eventDate | date:'EEEE d MMMM yyyy, HH:mm' }}
                </div>

                <!-- Organizer -->
                @if (ev.organizer) {
                  <div class="organizer-row">
                    <div class="org-avatar">{{ initials(ev.organizer.name) }}</div>
                    <div class="org-info">
                      <span class="org-name">{{ ev.organizer.name }}</span>
                      <div class="org-contacts">
                        <a [href]="'mailto:' + ev.organizer.email" class="contact-link email-link" (click)="$event.stopPropagation()">
                          <lucide-icon name="mail" [size]="12" color="currentColor" [strokeWidth]="1.8" />
                          {{ ev.organizer.email }}
                        </a>
                        @if (ev.organizer.phoneNumber) {
                          <a [href]="'tel:' + ev.organizer.phoneNumber" class="contact-link phone-link" (click)="$event.stopPropagation()">
                            <lucide-icon name="phone" [size]="12" color="currentColor" [strokeWidth]="1.8" />
                            {{ ev.organizer.phoneNumber }}
                          </a>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Right: stats + progress -->
              <div class="card-right">
                <!-- Stats chips -->
                <div class="stats-row">
                  <div class="stat-chip">
                    <lucide-icon name="user" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    <span>{{ ev.stats.participantsCount }}</span>
                    <span class="stat-label">participants</span>
                  </div>
                  <div class="stat-chip">
                    <lucide-icon name="package" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    <span>{{ ev.stats.itemsCount }}</span>
                    <span class="stat-label">items</span>
                  </div>
                  <div class="stat-chip" [class.chip-funded]="ev.stats.fundedItemsCount > 0">
                    <lucide-icon name="check" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    <span>{{ ev.stats.fundedItemsCount }}</span>
                    <span class="stat-label">financés</span>
                  </div>
                </div>

                <!-- Progress -->
                @if (ev.stats.itemsCount > 0) {
                  <div class="progress-wrap">
                    <div class="progress-amounts">
                      <span class="funded-amount">{{ ev.stats.totalFunded | number }} XOF</span>
                      <span class="target-amount">/ {{ ev.stats.totalTarget | number }} XOF</span>
                      <span class="progress-pct" [class.pct-full]="ev.stats.progressPercent === 100">
                        {{ ev.stats.progressPercent }}%
                      </span>
                    </div>
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        [style.width.%]="ev.stats.progressPercent"
                        [class.fill-full]="ev.stats.progressPercent === 100"
                        [class.fill-partial]="ev.stats.progressPercent > 0 && ev.stats.progressPercent < 100"
                      ></div>
                    </div>
                  </div>
                }

                <a [routerLink]="['/admin/events', ev.id]" class="btn-detail">
                  Voir le détail
                  <lucide-icon name="chevron-right" [size]="13" color="currentColor" [strokeWidth]="1.8" />
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

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
    }
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

    /* Toolbar */
    .toolbar { display: flex; flex-direction: column; gap: 12px; }
    .search-wrap {
      position: relative; display: flex; align-items: center;
      background: white; border: 1.5px solid #e5e7eb; border-radius: 12px;
      padding: 0 14px; transition: 0.15s;
    }
    .search-wrap:focus-within { border-color: #111827; }
    .search-icon { color: #9ca3af; flex-shrink: 0; }
    .search-input {
      flex: 1; border: 0; outline: 0; padding: 11px 10px;
      font: inherit; font-size: 0.9rem; background: transparent;
    }
    .search-clear {
      background: none; border: 0; cursor: pointer; color: #9ca3af;
      font-size: 0.85rem; padding: 4px; border-radius: 4px;
    }
    .search-clear:hover { color: #374151; }

    .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tab {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 14px; border: 1.5px solid #e5e7eb; border-radius: 999px;
      background: white; font: inherit; font-size: 0.82rem; font-weight: 600;
      color: #6b7280; cursor: pointer; transition: 0.15s;
    }
    .tab:hover { border-color: #111827; color: #111827; }
    .tab.active { background: #111827; border-color: #111827; color: white; }
    .tab-count {
      background: rgba(0,0,0,0.08); color: inherit;
      font-size: 0.7rem; font-weight: 800;
      padding: 1px 6px; border-radius: 999px;
    }
    .tab.active .tab-count { background: rgba(255,255,255,0.2); }

    /* Loading */
    .loading-bar {
      height: 3px; border-radius: 2px;
      background: linear-gradient(90deg, #111827 25%, #6b7280 50%, #111827 75%);
      background-size: 200%; animation: shimmer 1.2s infinite;
    }
    @keyframes shimmer { 0% { background-position: -200%; } 100% { background-position: 200%; } }

    .alert-error {
      padding: 14px 18px; background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 12px; color: #991b1b; font-size: 0.88rem;
    }

    .empty-state {
      text-align: center; padding: 64px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      color: #9ca3af;
    }
    .empty-icon { font-size: 2.8rem; }

    /* Event cards */
    .events-list { display: flex; flex-direction: column; gap: 12px; }

    .event-card {
      background: white; border: 1.5px solid #e5e7eb; border-radius: 16px;
      padding: 20px 24px; display: grid; grid-template-columns: 1fr auto;
      gap: 24px; align-items: start; transition: 0.15s;
    }
    .event-card:hover { border-color: #d1d5db; box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
    .event-card.archived { opacity: 0.65; background: #f9fafb; }

    /* Card left */
    .card-left { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

    .card-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .card-title {
      margin: 0; font-size: 1.05rem; font-weight: 800; color: #111827;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .card-id { font-size: 0.75rem; font-family: monospace; }

    .status-badge {
      padding: 3px 9px; border-radius: 999px;
      font-size: 0.68rem; font-weight: 800; white-space: nowrap;
      text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0;
    }
    .badge-upcoming { background: #dbeafe; color: #1d4ed8; }
    .badge-past     { background: #f3f4f6; color: #6b7280; }
    .badge-archived { background: #fef3c7; color: #92400e; }

    .card-date {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.82rem; color: #6b7280;
    }
    .card-date svg { flex-shrink: 0; color: #9ca3af; }

    /* Organizer */
    .organizer-row { display: flex; align-items: flex-start; gap: 10px; }
    .org-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #f3f4f6; color: #374151;
      font-size: 0.72rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; border: 1.5px solid #e5e7eb;
    }
    .org-info { display: flex; flex-direction: column; gap: 4px; }
    .org-name { font-size: 0.88rem; font-weight: 700; color: #111827; }
    .org-contacts { display: flex; flex-wrap: wrap; gap: 8px; }
    .contact-link {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.78rem; font-weight: 600; text-decoration: none;
      padding: 3px 8px; border-radius: 6px; transition: 0.12s;
    }
    .email-link { color: #1d4ed8; background: #eff6ff; }
    .email-link:hover { background: #dbeafe; }
    .phone-link { color: #166534; background: #f0fdf4; }
    .phone-link:hover { background: #dcfce7; }

    /* Card right */
    .card-right {
      display: flex; flex-direction: column; gap: 12px;
      align-items: flex-end; flex-shrink: 0; min-width: 220px;
    }

    .stats-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .stat-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 10px; border: 1px solid #f0f1f3; border-radius: 8px;
      background: #f9fafb; font-size: 0.78rem; color: #374151;
    }
    .stat-chip span:not(.stat-label) { font-weight: 800; }
    .stat-label { color: #9ca3af; }
    .chip-funded { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
    .chip-funded .stat-label { color: #15803d; }

    /* Progress */
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
      .event-card { grid-template-columns: 1fr; }
      .card-right { align-items: flex-start; }
      .stats-row { justify-content: flex-start; }
    }
  `],
})
export class EventsAdminPageComponent implements OnInit {
  private readonly eventsService = inject(EventsService);

  readonly events = signal<AdminEventFull[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly statusTab = signal<StatusTab>('all');
  readonly search = signal('');
  searchVal = '';

  readonly tabs: { label: string; value: StatusTab }[] = [
    { label: 'Tous',     value: 'all' },
    { label: 'À venir',  value: 'upcoming' },
    { label: 'Passés',   value: 'past' },
    { label: 'Archivés', value: 'archived' },
  ];

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const tab = this.statusTab();
    const now = new Date();

    return this.events().filter(ev => {
      const matchesSearch = !term ||
        ev.title.toLowerCase().includes(term) ||
        (ev.organizer?.name ?? '').toLowerCase().includes(term) ||
        (ev.organizer?.email ?? '').toLowerCase().includes(term);

      const matchesTab = (() => {
        if (tab === 'archived') return ev.isArchived;
        if (ev.isArchived) return false;
        if (tab === 'upcoming') return new Date(ev.eventDate) >= now;
        if (tab === 'past')     return new Date(ev.eventDate) < now;
        return true;
      })();

      return matchesSearch && matchesTab;
    });
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.eventsService.getAdminEventsList().subscribe({
      next: evs => { this.events.set(evs); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'Erreur chargement'); this.loading.set(false); },
    });
  }

  getTabCount(tab: StatusTab): number {
    const now = new Date();
    return this.events().filter(ev => {
      if (tab === 'all')      return true;
      if (tab === 'archived') return ev.isArchived;
      if (ev.isArchived)      return false;
      if (tab === 'upcoming') return new Date(ev.eventDate) >= now;
      if (tab === 'past')     return new Date(ev.eventDate) < now;
      return true;
    }).length;
  }

  getStatusLabel(ev: AdminEventFull): string {
    if (ev.isArchived) return 'Archivé';
    return new Date(ev.eventDate) >= new Date() ? 'À venir' : 'Passé';
  }

  getStatusClass(ev: AdminEventFull): string {
    if (ev.isArchived) return 'status-badge badge-archived';
    return new Date(ev.eventDate) >= new Date() ? 'status-badge badge-upcoming' : 'status-badge badge-past';
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
