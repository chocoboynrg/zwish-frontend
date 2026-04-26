import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService, MyDashboardResponse } from '../services/dashboard.service';
import { MyContributionsService, MyContributionItem } from '../services/my-contributions.service';

type MainTab = 'joined' | 'organized';
type OrgTab = 'upcoming' | 'past' | 'archived';

@Component({
  selector: 'app-my-events-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrap">

      <!-- ══════════ HERO ══════════ -->
      <div class="page-hero">
        <div class="page-hero-inner">
          <div>
            <div class="page-eyebrow">Mon espace</div>
            <h1>Mes événements</h1>
            <p>Vos wishlists et contributions en un seul endroit.</p>
          </div>
          <!-- Stats -->
          <div class="hero-kpis" *ngIf="!loading()">
            <div class="kpi">
              <div class="kpi-val">{{ joinedEvents().length }}</div>
              <div class="kpi-label">Événements rejoints</div>
            </div>
            <div class="kpi-sep"></div>
            <div class="kpi">
              <div class="kpi-val">{{ confirmedContribAmount() | number:'1.0-0' }}</div>
              <div class="kpi-label">FCFA contribués</div>
            </div>
            <div class="kpi-sep"></div>
            <div class="kpi">
              <div class="kpi-val">{{ organizedEvents().length }}</div>
              <div class="kpi-label">Événements organisés</div>
            </div>
          </div>
        </div>

        <!-- Onglets principaux -->
        <div class="main-tabs">
          <div class="main-tabs-inner">
            <button class="main-tab" [class.active]="mainTab() === 'joined'" (click)="mainTab.set('joined')">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 11a4 4 0 100-8 4 4 0 000 8zM2 19a8 8 0 0116 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              Je participe
              <span class="tab-pill" *ngIf="joinedEvents().length > 0">{{ joinedEvents().length }}</span>
            </button>
            <button class="main-tab" [class.active]="mainTab() === 'organized'" (click)="mainTab.set('organized')">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.5 4.5H16l-3.7 2.7 1.4 4.3L10 11l-3.7 2.5 1.4-4.3L4 6.5h4.5L10 2z" stroke="currentColor" stroke-width="1.3"/></svg>
              J'organise
              <span class="tab-pill" *ngIf="organizedEvents().length > 0">{{ organizedEvents().length }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ══════════ BODY ══════════ -->
      <div class="page-body">

        <div class="loading-state" *ngIf="loading()">
          <div class="loading-spinner"></div>Chargement...
        </div>

        <!-- ─────────────────────── -->
        <!-- ONGLET : JE PARTICIPE   -->
        <!-- ─────────────────────── -->
        <ng-container *ngIf="!loading() && mainTab() === 'joined'">

          <div class="empty-block" *ngIf="joinedEvents().length === 0">
            <div class="empty-icon">🎊</div>
            <div class="empty-title">Aucun événement rejoint</div>
            <p>Rejoignez un événement via le lien de partage partagé par un organisateur.</p>
          </div>

          <div class="joined-grid" *ngIf="joinedEvents().length > 0">
            <a
              *ngFor="let e of joinedEvents()"
              [routerLink]="['/app/events', e.id]"
              class="joined-card"
              [class.jcard-past]="isPast(e.eventDate)"
            >
              <!-- Bandeau latéral coloré -->
              <div class="jcard-strip" [class.strip-soon]="isSoon(e.eventDate)" [class.strip-past]="isPast(e.eventDate)"></div>

              <div class="jcard-body">
                <!-- Header -->
                <div class="jcard-head">
                  <div class="jcard-avatar">{{ getInitial(e.title) }}</div>
                  <div class="jcard-head-info">
                    <div class="jcard-title">{{ e.title }}</div>
                    <div class="jcard-date">
                      <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                      {{ formatDate(e.eventDate) }}
                    </div>
                  </div>
                  <span class="jcard-tag" [ngClass]="getEventTagClass(e.eventDate)">{{ getEventTagLabel(e.eventDate) }}</span>
                </div>

                <!-- Ma contribution -->
                <div class="jcard-contrib" *ngIf="getContrib(e.id) as c">
                  <div class="jcard-contrib-row">
                    <div class="jcard-contrib-label">Ma contribution</div>
                    <div class="jcard-contrib-amount">
                      {{ c.amount | number:'1.0-0' }} {{ c.currencyCode }}
                    </div>
                  </div>
                  <div class="jcard-contrib-status">
                    <span class="contrib-badge" [ngClass]="getContribClass(c.status)">{{ getContribLabel(c.status) }}</span>
                    <span class="contrib-item" *ngIf="c.wishlistItem?.title">pour « {{ c.wishlistItem!.title | slice:0:30 }}{{ (c.wishlistItem!.title?.length ?? 0) > 30 ? '…' : '' }} »</span>
                  </div>
                </div>

                <!-- Pas encore contribué -->
                <div class="jcard-no-contrib" *ngIf="!getContrib(e.id)">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                  Vous n'avez pas encore contribué à cet événement.
                </div>

                <!-- CTA -->
                <div class="jcard-footer">
                  <span class="jcard-cta">Voir la wishlist →</span>
                </div>
              </div>
            </a>
          </div>
        </ng-container>

        <!-- ─────────────────────── -->
        <!-- ONGLET : J'ORGANISE     -->
        <!-- ─────────────────────── -->
        <ng-container *ngIf="!loading() && mainTab() === 'organized'">

          <!-- Sous-onglets -->
          <div class="org-tabs">
            <button class="org-tab" [class.active]="orgTab() === 'upcoming'" (click)="orgTab.set('upcoming')">
              À venir <span class="org-tab-count" *ngIf="upcomingOrg().length">{{ upcomingOrg().length }}</span>
            </button>
            <button class="org-tab" [class.active]="orgTab() === 'past'" (click)="orgTab.set('past')">
              Passés <span class="org-tab-count" *ngIf="pastOrg().length">{{ pastOrg().length }}</span>
            </button>
            <button class="org-tab" [class.active]="orgTab() === 'archived'" (click)="orgTab.set('archived')">
              Archivés <span class="org-tab-count" *ngIf="archivedOrg().length">{{ archivedOrg().length }}</span>
            </button>
          </div>

          <!-- Empty org -->
          <div class="empty-block" *ngIf="currentOrg().length === 0">
            <div class="empty-icon">{{ orgTab() === 'upcoming' ? '🎉' : orgTab() === 'past' ? '📅' : '📦' }}</div>
            <div class="empty-title">{{ orgEmptyTitle() }}</div>
            <p>{{ orgEmptyDesc() }}</p>
            <a routerLink="/app/events/new" class="btn-yellow" *ngIf="orgTab() === 'upcoming'">Créer un événement</a>
          </div>

          <!-- Grille org -->
          <div class="org-grid" *ngIf="currentOrg().length > 0">
            <a
              *ngFor="let e of currentOrg()"
              [routerLink]="['/app/events', e.id]"
              class="org-card"
              [class.org-card-past]="orgTab() === 'past'"
              [class.org-card-archived]="orgTab() === 'archived'"
              [class.org-card-soon]="isSoon(e.eventDate) && orgTab() === 'upcoming'"
            >
              <div class="org-card-cover">
                <div class="org-cover-initial">{{ getInitial(e.title) }}</div>
                <span class="org-cover-pill" [ngClass]="getCoverPillClass(e.eventDate)">{{ getCoverPillLabel(e.eventDate) }}</span>
              </div>
              <div class="org-card-body">
                <div class="org-card-date">
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  {{ formatDate(e.eventDate) }}
                </div>
                <div class="org-card-title">{{ e.title }}</div>
                <div class="org-card-desc" *ngIf="e.description">{{ e.description | slice:0:70 }}{{ (e.description?.length ?? 0) > 70 ? '…' : '' }}</div>
              </div>
              <div class="org-card-footer">
                <span class="org-card-cta">{{ orgTab() === 'archived' ? 'Voir' : 'Gérer' }} →</span>
              </div>
            </a>
          </div>
        </ng-container>

      </div>

      <!-- FAB créer événement (visible seulement sur onglet J'organise) -->
      <a
        routerLink="/app/events/new"
        class="fab"
        *ngIf="mainTab() === 'organized'"
        title="Créer un événement"
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
      </a>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-wrap { background: #f9fafb; min-height: calc(100vh - 64px); position: relative; }

    /* ── HERO ── */
    .page-hero { background: #000; }
    .page-hero-inner { max-width: 1280px; margin: 0 auto; padding: 36px 24px 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .page-eyebrow { color: #FFD700; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
    h1 { font-size: 2rem; font-weight: 900; color: white; margin: 0 0 6px; letter-spacing: -0.02em; }
    .page-hero p { color: rgba(255,255,255,0.45); margin: 0; font-size: 0.88rem; }

    /* KPIs */
    .hero-kpis { display: flex; align-items: center; gap: 0; }
    .kpi { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .kpi-val { font-size: 1.4rem; font-weight: 900; color: white; line-height: 1; }
    .kpi-label { font-size: 0.68rem; color: rgba(255,255,255,0.35); font-weight: 600; white-space: nowrap; }
    .kpi-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.1); margin: 0 20px; }

    /* Onglets principaux */
    .main-tabs { border-top: 1px solid rgba(255,255,255,0.07); margin-top: 20px; }
    .main-tabs-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; gap: 4px; }
    .main-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 20px; border: 0; background: transparent;
      color: rgba(255,255,255,0.45); font: inherit; font-size: 0.88rem; font-weight: 700;
      cursor: pointer; border-bottom: 2px solid transparent; transition: 0.15s;
      position: relative; bottom: -1px;
    }
    .main-tab:hover { color: rgba(255,255,255,0.8); }
    .main-tab.active { color: white; border-bottom-color: #FFD700; }
    .tab-pill { background: rgba(255,255,255,0.1); padding: 1px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 900; }
    .main-tab.active .tab-pill { background: rgba(255,215,0,0.2); color: #FFD700; }

    /* ── BODY ── */
    .page-body { max-width: 1280px; margin: 0 auto; padding: 28px 24px 80px; display: flex; flex-direction: column; gap: 20px; }

    .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 56px; color: #9ca3af; }
    .loading-spinner { width: 20px; height: 20px; border: 2px solid #f3f4f6; border-top-color: #111; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-block { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; padding: 56px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .empty-icon { font-size: 2.5rem; }
    .empty-title { font-size: 1rem; font-weight: 800; color: #111; }
    .empty-block p { color: #9ca3af; margin: 0; font-size: 0.88rem; }
    .btn-yellow { background: #FFD700; color: #000; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 0.88rem; }

    /* ════════════════════════════ */
    /* CARDS JE PARTICIPE          */
    /* ════════════════════════════ */
    .joined-grid { display: flex; flex-direction: column; gap: 12px; }

    .joined-card {
      background: white; border: 1.5px solid #f3f4f6; border-radius: 18px;
      text-decoration: none; display: flex; overflow: hidden;
      transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
    }
    .joined-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: #e5e7eb; }
    .jcard-past { opacity: 0.75; }
    .jcard-past:hover { opacity: 1; }

    /* Bandeau coloré gauche */
    .jcard-strip { width: 5px; flex-shrink: 0; background: #6d28d9; }
    .strip-soon { background: #FFD700; }
    .strip-past { background: #e5e7eb; }

    .jcard-body { flex: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }

    .jcard-head { display: flex; align-items: flex-start; gap: 12px; }
    .jcard-avatar { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #ede9fe, #c4b5fd); color: #6d28d9; font-weight: 900; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .jcard-head-info { flex: 1; min-width: 0; }
    .jcard-title { font-size: 1rem; font-weight: 800; color: #111; line-height: 1.2; }
    .jcard-date { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; color: #9ca3af; margin-top: 4px; }
    .jcard-tag { padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 800; flex-shrink: 0; }
    .jtag-past { background: #f3f4f6; color: #9ca3af; }
    .jtag-soon { background: #fef3c7; color: #92400e; }
    .jtag-future { background: #f0fdf4; color: #166534; }

    /* Contribution dans la card */
    .jcard-contrib { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
    .jcard-contrib-row { display: flex; align-items: center; justify-content: space-between; }
    .jcard-contrib-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; }
    .jcard-contrib-amount { font-size: 1rem; font-weight: 900; color: #111; }
    .jcard-contrib-status { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .contrib-badge { padding: 3px 9px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
    .cb-confirmed { background: #dcfce7; color: #166534; }
    .cb-awaiting { background: #fef3c7; color: #92400e; }
    .cb-failed { background: #fee2e2; color: #991b1b; }
    .cb-default { background: #f3f4f6; color: #6b7280; }
    .contrib-item { font-size: 0.75rem; color: #6b7280; font-style: italic; }

    .jcard-no-contrib { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #9ca3af; padding: 8px 0; }

    .jcard-footer { border-top: 1px solid #f3f4f6; padding-top: 10px; }
    .jcard-cta { font-size: 0.82rem; font-weight: 700; color: #6b7280; }
    .joined-card:hover .jcard-cta { color: #6d28d9; }

    /* ════════════════════════════ */
    /* SOUS-ONGLETS J'ORGANISE      */
    /* ════════════════════════════ */
    .org-tabs { display: flex; gap: 8px; }
    .org-tab {
      padding: 8px 16px; border: 1.5px solid #e5e7eb; border-radius: 999px;
      background: white; font: inherit; font-size: 0.82rem; font-weight: 600;
      color: #6b7280; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.15s;
    }
    .org-tab:hover { border-color: #111; color: #111; }
    .org-tab.active { background: #111; border-color: #111; color: white; }
    .org-tab-count { background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 999px; font-size: 0.68rem; font-weight: 800; }
    .org-tab:not(.active) .org-tab-count { background: #f3f4f6; color: #6b7280; }

    /* Grille org */
    .org-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .org-card {
      background: white; border: 1.5px solid #f3f4f6; border-radius: 20px;
      text-decoration: none; display: flex; flex-direction: column; overflow: hidden;
      transition: 0.2s;
    }
    .org-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09); transform: translateY(-3px); border-color: #e5e7eb; }
    .org-card-past { opacity: 0.75; } .org-card-past:hover { opacity: 1; }
    .org-card-archived { opacity: 0.65; } .org-card-archived:hover { opacity: 1; }
    .org-card-soon { border-color: rgba(255,215,0,0.3); } .org-card-soon:hover { border-color: #FFD700; }

    .org-card-cover { height: 88px; display: flex; align-items: center; justify-content: center; position: relative; background: linear-gradient(135deg, #0f0f23, #1a1a3e); overflow: hidden; }
    .org-card:nth-child(3n+2) .org-card-cover { background: linear-gradient(135deg, #0d1117, #1c3a4a); }
    .org-card:nth-child(3n+3) .org-card-cover { background: linear-gradient(135deg, #1a1a1a, #2d1b3d); }
    .org-cover-initial { font-size: 2.2rem; font-weight: 900; color: rgba(255,255,255,0.1); user-select: none; }
    .org-cover-pill { position: absolute; top: 8px; left: 10px; padding: 3px 9px; border-radius: 999px; font-size: 0.68rem; font-weight: 800; }
    .pill-soon { background: rgba(255,215,0,0.25); color: #FFD700; }
    .pill-future { background: rgba(34,197,94,0.2); color: #4ade80; }
    .pill-past { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
    .pill-archived { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }

    .org-card-body { padding: 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 5px; }
    .org-card-date { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #9ca3af; }
    .org-card-title { font-size: 0.9rem; font-weight: 800; color: #111; line-height: 1.3; }
    .org-card-desc { font-size: 0.78rem; color: #9ca3af; line-height: 1.5; flex: 1; }
    .org-card-footer { padding: 10px 16px; border-top: 1px solid #f9fafb; }
    .org-card-cta { font-size: 0.78rem; font-weight: 700; color: #9ca3af; }
    .org-card:hover .org-card-cta { color: #111; }

    /* ── FAB ── */
    .fab {
      position: fixed; bottom: 28px; right: 28px; z-index: 50;
      width: 56px; height: 56px; border-radius: 50%;
      background: #FFD700; color: #000;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(255,215,0,0.4);
      text-decoration: none; transition: 0.2s;
    }
    .fab:hover { background: #FFC000; transform: scale(1.08); box-shadow: 0 12px 32px rgba(255,215,0,0.5); }

    @media (max-width: 1100px) { .org-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .hero-kpis { display: none; }
      .org-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class MyEventsPageComponent implements OnInit {
  private readonly dashService = inject(DashboardService);
  private readonly contribService = inject(MyContributionsService);

  readonly data = signal<MyDashboardResponse | null>(null);
  readonly contributions = signal<MyContributionItem[]>([]);
  readonly loading = signal(true);
  readonly mainTab = signal<MainTab>('joined');
  readonly orgTab = signal<OrgTab>('upcoming');

  readonly joinedEvents = computed(() => this.data()?.joinedEvents ?? []);
  readonly organizedEvents = computed(() => this.data()?.organizedEvents ?? []);

  readonly upcomingOrg = computed(() =>
    this.organizedEvents().filter(e => !this.isPast(e.eventDate) && !(e as any).isArchived)
  );
  readonly pastOrg = computed(() =>
    this.organizedEvents().filter(e => this.isPast(e.eventDate) && !(e as any).isArchived)
  );
  readonly archivedOrg = computed(() =>
    this.organizedEvents().filter(e => !!(e as any).isArchived)
  );
  readonly currentOrg = computed(() => {
    if (this.orgTab() === 'upcoming') return this.upcomingOrg();
    if (this.orgTab() === 'past') return this.pastOrg();
    return this.archivedOrg();
  });

  readonly confirmedContribAmount = computed(() =>
    this.contributions().filter(c => c.status === 'CONFIRMED').reduce((s, c) => s + Number(c.amount), 0)
  );

  readonly orgEmptyTitle = computed(() => {
    if (this.orgTab() === 'upcoming') return 'Aucun événement à venir';
    if (this.orgTab() === 'past') return 'Aucun événement passé';
    return 'Aucun événement archivé';
  });
  readonly orgEmptyDesc = computed(() => {
    if (this.orgTab() === 'upcoming') return 'Créez votre premier événement et partagez votre wishlist.';
    if (this.orgTab() === 'past') return 'Vos événements passés apparaîtront ici.';
    return 'Les événements archivés sont conservés ici.';
  });

  // Contribution la plus récente pour un événement donné
  getContrib(eventId: number): MyContributionItem | null {
    return this.contributions()
      .filter(c => c.event?.id === eventId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  }

  ngOnInit(): void {
    this.dashService.getMyDashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.contribService.getMine().subscribe({
      next: (r) => this.contributions.set(r.items),
      error: () => {},
    });
  }

  isPast(dateStr: string): boolean { return new Date(dateStr) < new Date(); }
  isSoon(dateStr: string): boolean {
    const diff = new Date(dateStr).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const diff = d.getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (this.isPast(dateStr)) return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Demain';
    if (days <= 7) return `Dans ${days} jours`;
    if (days <= 30) return `Dans ${Math.ceil(days / 7)} sem.`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getInitial(title: string): string { return title.trim().charAt(0).toUpperCase(); }

  getEventTagClass(dateStr: string): string {
    if (this.isPast(dateStr)) return 'jcard-tag jtag-past';
    if (this.isSoon(dateStr)) return 'jcard-tag jtag-soon';
    return 'jcard-tag jtag-future';
  }
  getEventTagLabel(dateStr: string): string {
    if (this.isPast(dateStr)) return 'Passé';
    if (this.isSoon(dateStr)) return 'Bientôt';
    return 'À venir';
  }

  getContribLabel(s: string): string {
    const m: Record<string,string> = { CONFIRMED: 'Confirmée', AWAITING_PAYMENT: 'En attente', FAILED: 'Échouée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée' };
    return m[s] ?? s;
  }
  getContribClass(s: string): string {
    const m: Record<string,string> = { CONFIRMED: 'contrib-badge cb-confirmed', AWAITING_PAYMENT: 'contrib-badge cb-awaiting', FAILED: 'contrib-badge cb-failed' };
    return m[s] ?? 'contrib-badge cb-default';
  }

  getCoverPillClass(dateStr: string): string {
    if (this.isPast(dateStr)) return 'org-cover-pill pill-past';
    if (this.isSoon(dateStr)) return 'org-cover-pill pill-soon';
    return 'org-cover-pill pill-future';
  }
  getCoverPillLabel(dateStr: string): string {
    if (this.isPast(dateStr)) return 'Passé';
    if (this.isSoon(dateStr)) return 'Bientôt';
    return 'À venir';
  }
}