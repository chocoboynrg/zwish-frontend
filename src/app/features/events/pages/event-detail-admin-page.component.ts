import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EventsService,
  type AdminEventDetail,
  type AdminEventDetailItem,
} from '../services/events.service';

@Component({
  selector: 'app-event-detail-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <a routerLink="/admin/events" class="back-link">← Retour événements</a>
          <h1 class="page-title">
            @if (detail()) { {{ detail()!.event.title }} }
            @else { Détail événement }
          </h1>
          @if (detail()?.event?.isArchived) {
            <span class="badge badge-archived">Archivé</span>
          }
        </div>
        <button type="button" class="btn-refresh" (click)="load()">Actualiser</button>
      </div>

      @if (errorMessage()) {
        <p class="error-msg">{{ errorMessage() }}</p>
      }

      @if (loading()) {
        <div class="skeleton-wrap">
          <div class="skeleton sk-card"></div>
          <div class="skeleton sk-stats"></div>
          <div class="skeleton sk-card"></div>
        </div>
      }

      @if (!loading() && detail(); as d) {
        <!-- Organizer contact card -->
        <section class="organizer-card">
          <div class="org-avatar">{{ initials(d.event.organizer?.name) }}</div>
          <div class="org-info">
            <div class="org-name">{{ d.event.organizer?.name || '—' }}</div>
            <div class="org-label">Organisateur</div>
            @if (d.event.organizer?.email) {
              <a [href]="'mailto:' + d.event.organizer!.email" class="org-contact org-email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 7l10 7 10-7" stroke="currentColor" stroke-width="1.5"/></svg>
                {{ d.event.organizer!.email }}
              </a>
            }
            @if (d.event.organizer?.phoneNumber) {
              <a [href]="'tel:' + d.event.organizer!.phoneNumber" class="org-contact org-phone">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6.5 3h2.8l1.2 4-1.8 1.1a11 11 0 0 0 4.7 4.7l1.1-1.8 4 1.2v2.8A2 2 0 0 1 16.5 17C9.6 17 3.5 10.9 3.5 4a2 2 0 0 1 2-2l1 1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                {{ d.event.organizer!.phoneNumber }}
              </a>
            }
            @if (!d.event.organizer?.email && !d.event.organizer?.phoneNumber) {
              <span class="org-no-contact">Aucune coordonnée disponible</span>
            }
          </div>
          <div class="org-event-meta">
            <div class="org-meta-item">
              <span class="org-meta-label">Date de l'événement</span>
              <span class="org-meta-val">{{ d.event.eventDate | date:'dd MMM yyyy' }}</span>
            </div>
            @if (d.event.description) {
              <div class="org-meta-item">
                <span class="org-meta-label">Description</span>
                <span class="org-meta-val org-desc">{{ d.event.description }}</span>
              </div>
            }
          </div>
        </section>

        <!-- Summary stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div class="stat-body">
              <div class="stat-val">{{ d.summary.participantsCount }}</div>
              <div class="stat-label">Participants</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-purple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div class="stat-body">
              <div class="stat-val">{{ d.summary.itemsCount }}</div>
              <div class="stat-label">Items wishlist</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
            <div class="stat-body">
              <div class="stat-val">{{ d.summary.fundedItemsCount }}</div>
              <div class="stat-label">Items financés</div>
            </div>
          </div>
          <div class="stat-card stat-card-wide">
            <div class="stat-progress-header">
              <span class="stat-label">Progression globale</span>
              <span class="stat-pct">{{ d.summary.progressPercent }}%</span>
            </div>
            <div class="stat-progress-bar">
              <div class="stat-progress-fill" [style.width.%]="d.summary.progressPercent"></div>
            </div>
            <div class="stat-amounts">
              <span class="stat-funded-amt">{{ d.summary.totalFunded | number }} XOF financés</span>
              <span class="stat-sep">·</span>
              <span class="stat-remaining">{{ d.summary.totalRemaining | number }} XOF restants</span>
              <span class="stat-sep">·</span>
              <span class="stat-target">{{ d.summary.totalTarget | number }} XOF cible</span>
            </div>
          </div>
        </div>

        <!-- Wishlist items grouped by status -->
        <section class="card">
          <h2 class="section-title">Wishlist de l'événement</h2>

          @if (fundedItems().length > 0) {
            <div class="wl-group">
              <div class="wl-group-header wl-group-funded">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/></svg>
                Financés ({{ fundedItems().length }})
              </div>
              <div class="wl-items">
                @for (item of fundedItems(); track item.id) {
                  <ng-container *ngTemplateOutlet="wishlistItem; context: { $implicit: item }"></ng-container>
                }
              </div>
            </div>
          }

          @if (partialItems().length > 0) {
            <div class="wl-group">
              <div class="wl-group-header wl-group-partial">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Partiellement financés ({{ partialItems().length }})
              </div>
              <div class="wl-items">
                @for (item of partialItems(); track item.id) {
                  <ng-container *ngTemplateOutlet="wishlistItem; context: { $implicit: item }"></ng-container>
                }
              </div>
            </div>
          }

          @if (notFundedItems().length > 0) {
            <div class="wl-group">
              <div class="wl-group-header wl-group-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Non financés ({{ notFundedItems().length }})
              </div>
              <div class="wl-items">
                @for (item of notFundedItems(); track item.id) {
                  <ng-container *ngTemplateOutlet="wishlistItem; context: { $implicit: item }"></ng-container>
                }
              </div>
            </div>
          }

          @if (d.wishlistItems.length === 0) {
            <p class="empty-msg">Aucun item dans la wishlist.</p>
          }
        </section>

        <!-- Item template -->
        <ng-template #wishlistItem let-item>
          <div class="wl-item" [class.wl-funded]="item.fundingStatus === 'FUNDED'" [class.wl-partial]="item.fundingStatus === 'PARTIALLY_FUNDED'">
            <div class="wl-item-main">
              @if (item.imageUrl) {
                <img class="wl-img" [src]="item.imageUrl" [alt]="item.name" />
              } @else {
                <div class="wl-img-ph">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#d1d5db" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="#d1d5db"/><path d="M21 15l-5-5L5 21" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"/></svg>
                </div>
              }
              <div class="wl-info">
                <div class="wl-name">{{ item.name }}</div>
                <div class="wl-meta">Qté {{ item.quantity }}</div>
              </div>
              <span class="wl-badge" [class.badge-funded]="item.fundingStatus === 'FUNDED'" [class.badge-partial]="item.fundingStatus === 'PARTIALLY_FUNDED'" [class.badge-none]="item.fundingStatus === 'NOT_FUNDED'">
                {{ fundingLabel(item.fundingStatus) }}
              </span>
            </div>
            <div class="wl-amounts">
              <div class="wl-amount-row">
                <span class="wl-funded-amt">{{ item.fundedAmount | number }} XOF</span>
                <span class="wl-sep">/</span>
                <span class="wl-target">{{ item.targetAmount | number }} XOF</span>
                <span class="wl-pct">{{ item.progressPercent }}%</span>
              </div>
              <div class="wl-bar">
                <div class="wl-bar-fill" [style.width.%]="item.progressPercent" [class.fill-funded]="item.fundingStatus === 'FUNDED'" [class.fill-partial]="item.fundingStatus === 'PARTIALLY_FUNDED'"></div>
              </div>
              @if (item.remainingAmount > 0) {
                <div class="wl-remaining">{{ item.remainingAmount | number }} XOF restants</div>
              }
            </div>
          </div>
        </ng-template>

        <!-- Participants -->
        <section class="card">
          <h2 class="section-title">Participants ({{ d.participants.length }})</h2>
          @if (d.participants.length === 0) {
            <p class="empty-msg">Aucun participant pour cet événement.</p>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Rejoint le</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of d.participants; track p.id) {
                    <tr>
                      <td>
                        <div class="p-name-cell">
                          <div class="p-avatar">{{ initials(p.user?.name) }}</div>
                          <span>{{ p.user?.name || '—' }}</span>
                        </div>
                      </td>
                      <td>
                        @if (p.user?.email) {
                          <a [href]="'mailto:' + p.user!.email" class="tbl-link-email">{{ p.user!.email }}</a>
                        } @else { — }
                      </td>
                      <td>
                        @if (p.user?.phoneNumber) {
                          <a [href]="'tel:' + p.user!.phoneNumber" class="tbl-link-phone">{{ p.user!.phoneNumber }}</a>
                        } @else { — }
                      </td>
                      <td><span class="role-chip role-{{ p.role | lowercase }}">{{ roleLabel(p.role) }}</span></td>
                      <td><span class="status-chip status-{{ p.status | lowercase }}">{{ p.status }}</span></td>
                      <td class="muted">{{ p.joinedAt ? (p.joinedAt | date:'dd/MM/yyyy') : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .back-link { color: #1d4ed8; text-decoration: none; font-weight: 600; font-size: 0.875rem; }
    .page-title { margin: 8px 0 4px; font-size: 1.5rem; font-weight: 800; color: #111827; }
    .badge { display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .badge-archived { background: #fef3c7; color: #92400e; }
    .btn-refresh { border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 10px; padding: 9px 16px; font: inherit; cursor: pointer; font-size: 0.875rem; }
    .btn-refresh:hover { background: #f9fafb; }
    .error-msg { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; margin: 0; }

    /* Skeleton */
    .skeleton-wrap { display: flex; flex-direction: column; gap: 20px; }
    .skeleton { border-radius: 16px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    .sk-card { height: 130px; }
    .sk-stats { height: 80px; }
    @keyframes shimmer { 0% { background-position: 200%; } 100% { background-position: -200%; } }

    /* Organizer card */
    .organizer-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); display: flex; align-items: flex-start; gap: 20px; }
    .org-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-weight: 800; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .org-info { flex: 1; min-width: 0; }
    .org-name { font-weight: 800; font-size: 1.1rem; color: #111827; }
    .org-label { font-size: 0.75rem; color: #6b7280; margin: 2px 0 10px; }
    .org-contact { display: inline-flex; align-items: center; gap: 6px; font-size: 0.875rem; text-decoration: none; padding: 5px 10px; border-radius: 8px; font-weight: 500; margin-right: 8px; margin-bottom: 6px; }
    .org-email { background: #eff6ff; color: #1d4ed8; }
    .org-email:hover { background: #dbeafe; }
    .org-phone { background: #f0fdf4; color: #166534; }
    .org-phone:hover { background: #dcfce7; }
    .org-no-contact { font-size: 0.8rem; color: #9ca3af; font-style: italic; }
    .org-event-meta { display: flex; flex-direction: column; gap: 8px; min-width: 200px; }
    .org-meta-item { display: flex; flex-direction: column; gap: 2px; }
    .org-meta-label { font-size: 0.72rem; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .org-meta-val { font-size: 0.875rem; color: #374151; font-weight: 600; }
    .org-desc { font-weight: 400; max-width: 280px; line-height: 1.4; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr) 2fr; gap: 16px; }
    .stat-card { background: white; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 14px; }
    .stat-card-wide { grid-column: span 1; flex-direction: column; align-items: stretch; gap: 10px; }
    .stat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon-blue { background: #eff6ff; color: #1d4ed8; }
    .stat-icon-purple { background: #f5f3ff; color: #7c3aed; }
    .stat-icon-green { background: #f0fdf4; color: #166534; }
    .stat-body { min-width: 0; }
    .stat-val { font-size: 1.75rem; font-weight: 800; color: #111827; line-height: 1; }
    .stat-label { font-size: 0.78rem; color: #6b7280; margin-top: 4px; }
    .stat-progress-header { display: flex; justify-content: space-between; align-items: center; }
    .stat-pct { font-size: 1.4rem; font-weight: 800; color: #6366f1; }
    .stat-progress-bar { height: 10px; background: #f3f4f6; border-radius: 5px; overflow: hidden; }
    .stat-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 5px; transition: width 0.5s; }
    .stat-amounts { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 0.78rem; }
    .stat-funded-amt { color: #166534; font-weight: 700; }
    .stat-sep { color: #d1d5db; }
    .stat-remaining { color: #92400e; }
    .stat-target { color: #6b7280; }

    /* Cards */
    .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    .section-title { margin: 0 0 18px; font-size: 1rem; font-weight: 700; color: #111827; }
    .empty-msg { text-align: center; color: #9ca3af; padding: 32px 0; margin: 0; }

    /* Wishlist groups */
    .wl-group { margin-bottom: 20px; }
    .wl-group:last-child { margin-bottom: 0; }
    .wl-group-header { display: flex; align-items: center; gap: 7px; font-size: 0.8rem; font-weight: 700; padding: 7px 12px; border-radius: 10px; margin-bottom: 10px; }
    .wl-group-funded { background: #f0fdf4; color: #166534; }
    .wl-group-partial { background: #fffbeb; color: #92400e; }
    .wl-group-none { background: #f9fafb; color: #6b7280; }
    .wl-items { display: flex; flex-direction: column; gap: 10px; }
    .wl-item { border: 1.5px solid #e5e7eb; border-radius: 14px; padding: 14px; }
    .wl-funded { border-color: #86efac; background: #f0fdf4; }
    .wl-partial { border-color: #fde68a; background: #fffbeb; }
    .wl-item-main { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .wl-img { width: 42px; height: 42px; border-radius: 9px; object-fit: cover; flex-shrink: 0; }
    .wl-img-ph { width: 42px; height: 42px; border-radius: 9px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .wl-info { flex: 1; min-width: 0; }
    .wl-name { font-weight: 700; color: #111827; font-size: 0.9rem; }
    .wl-meta { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
    .wl-badge { display: inline-flex; padding: 3px 9px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }
    .badge-funded { background: #dcfce7; color: #166534; }
    .badge-partial { background: #fef3c7; color: #92400e; }
    .badge-none { background: #f3f4f6; color: #6b7280; }
    .wl-amounts { display: flex; flex-direction: column; gap: 4px; }
    .wl-amount-row { display: flex; align-items: center; gap: 5px; font-size: 0.83rem; }
    .wl-funded-amt { font-weight: 800; color: #111827; }
    .wl-sep { color: #d1d5db; }
    .wl-target { color: #6b7280; }
    .wl-pct { margin-left: auto; font-weight: 700; color: #6366f1; font-size: 0.85rem; }
    .wl-bar { height: 7px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
    .wl-bar-fill { height: 100%; border-radius: 4px; background: #6366f1; transition: width 0.4s; }
    .fill-funded { background: #22c55e; }
    .fill-partial { background: #f59e0b; }
    .wl-remaining { font-size: 0.72rem; color: #9ca3af; }

    /* Participants table */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #f3f4f6; text-align: left; font-size: 0.875rem; vertical-align: middle; }
    th { color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .p-name-cell { display: flex; align-items: center; gap: 9px; }
    .p-avatar { width: 30px; height: 30px; border-radius: 50%; background: #e0e7ff; color: #3730a3; font-weight: 700; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .tbl-link-email { color: #1d4ed8; text-decoration: none; font-size: 0.82rem; }
    .tbl-link-email:hover { text-decoration: underline; }
    .tbl-link-phone { color: #166534; text-decoration: none; font-size: 0.82rem; }
    .tbl-link-phone:hover { text-decoration: underline; }
    .role-chip { display: inline-flex; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
    .role-organizer { background: #ede9fe; color: #5b21b6; }
    .role-co_organizer { background: #dbeafe; color: #1e40af; }
    .role-guest { background: #f3f4f6; color: #374151; }
    .status-chip { display: inline-flex; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 600; background: #f3f4f6; color: #6b7280; }
    .muted { color: #9ca3af; font-size: 0.82rem; }

    @media (max-width: 980px) {
      .organizer-card { flex-direction: column; }
      .org-event-meta { min-width: 0; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .stat-card-wide { grid-column: span 2; }
    }
    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr; }
      .stat-card-wide { grid-column: span 1; }
      .page-header { flex-direction: column; align-items: stretch; }
    }
  `],
})
export class EventDetailAdminPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);

  readonly detail = signal<AdminEventDetail | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly fundedItems = computed(() =>
    this.detail()?.wishlistItems.filter(i => i.fundingStatus === 'FUNDED') ?? [],
  );
  readonly partialItems = computed(() =>
    this.detail()?.wishlistItems.filter(i => i.fundingStatus === 'PARTIALLY_FUNDED') ?? [],
  );
  readonly notFundedItems = computed(() =>
    this.detail()?.wishlistItems.filter(i => i.fundingStatus === 'NOT_FUNDED') ?? [],
  );

  private eventId = 0;

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.eventId || Number.isNaN(this.eventId)) {
      this.errorMessage.set('Identifiant événement invalide');
      return;
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventsService.getAdminEventDetail(this.eventId).subscribe({
      next: (data) => {
        this.detail.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Impossible de charger les données');
        this.loading.set(false);
      },
    });
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  fundingLabel(status: string): string {
    const map: Record<string, string> = {
      FUNDED: 'Financé',
      PARTIALLY_FUNDED: 'Partiel',
      NOT_FUNDED: 'Non financé',
    };
    return map[status] ?? status;
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      ORGANIZER: 'Organisateur',
      CO_ORGANIZER: 'Co-organisateur',
      GUEST: 'Invité',
    };
    return map[role] ?? role;
  }
}
