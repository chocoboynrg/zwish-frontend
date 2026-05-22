import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { JackpotService } from '../services/jackpot.service';
import { Jackpot, PURPOSE_CATEGORIES } from '../models/jackpot.model';
import { JackpotContributeModalComponent } from '../components/jackpot-contribute-modal.component';
import { JackpotOrbitalSummaryComponent } from '../components/jackpot-orbital-summary.component';
import { JackpotSidebarPanelComponent } from '../components/jackpot-sidebar-panel.component';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

const QUICK_AMOUNTS = [500, 1_000, 2_500, 5_000];

@Component({
  selector: 'app-jackpot-public-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, JackpotContributeModalComponent, JackpotOrbitalSummaryComponent, JackpotSidebarPanelComponent],
  template: `
    @if (loading()) {
      <div class="full-screen loading-screen">
        <div class="spin-ring"></div>
        <span>Chargement…</span>
      </div>
    }

    @if (error() && !loading()) {
      <div class="full-screen error-screen">
        <div class="error-emoji">😕</div>
        <h2>{{ error() }}</h2>
        <a routerLink="/" class="btn-back">← Retour à l'accueil</a>
      </div>
    }

    @if (jackpot() && !loading()) {

      <!-- ── ORBITAL HERO ── -->
      <section class="orbital-section">

        <!-- Blurred background -->
        @if (jackpot()!.imageUrl) {
          <img [src]="jackpot()!.imageUrl" class="bg-blur" aria-hidden="true" />
        }
        <div class="bg-overlay"></div>
        <div class="bg-grid"></div>

        <!-- Desktop orbital stage -->
        <div class="orbital-stage">

          <!-- Decorative rotating rings -->
          <div class="deco-ring r1"></div>
          <div class="deco-ring r2"></div>
          <div class="deco-ring r3"></div>

          <!-- CENTER ORB -->
          <div class="center-orb">
            <div class="orb-halo"></div>
            <svg class="orb-svg" viewBox="0 0 260 260" aria-hidden="true">
              <defs>
                <linearGradient id="arcGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ffd700"/>
                  <stop offset="100%" stop-color="#ff7c00"/>
                </linearGradient>
              </defs>
              <circle cx="130" cy="130" r="118"
                fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="10"/>
              <circle cx="130" cy="130" r="118"
                fill="none" stroke="url(#arcGold)" stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray="741.4"
                [attr.stroke-dashoffset]="progressOffset()"
                transform="rotate(-90 130 130)"
                class="arc-progress"/>
            </svg>
            <div class="orb-inner">
              <div class="orb-emoji">{{ categoryMeta()?.emoji ?? '💰' }}</div>
              <div class="orb-title">{{ jackpot()!.title }}</div>
              <div class="orb-amount">{{ jackpot()!.collectedAmount | number:'1.0-0' }}</div>
              <div class="orb-currency">{{ jackpot()!.currencyCode }}</div>
              <div class="orb-pct" [class.pct-done]="getPercent() >= 100">
                {{ getPercent() }}% atteint
              </div>
              @if (daysRemaining() !== null && daysRemaining()! <= 5) {
                <div class="orb-urgent">
                  {{ daysRemaining() === 0 ? 'Dernier jour !' : daysRemaining() + 'j restants' }}
                </div>
              }
            </div>
          </div>

          <app-jackpot-orbital-summary
            [jackpot]="jackpot()"
            [categoryMeta]="categoryMeta()"
            [daysRemaining]="daysRemaining()"
            [percent]="getPercent()"
            [remaining]="remaining()"
            [trunc]="trunc.bind(this)"
          />

        </div> <!-- /orbital-stage -->

        <!-- Bottom progress bar (always visible) -->
        <div class="orbital-bottom">
          <div class="ob-inner">
            <div class="ob-stat">
              <span class="ob-amount">{{ jackpot()!.collectedAmount | number:'1.0-0' }}</span>
              <span class="ob-currency">{{ jackpot()!.currencyCode }}</span>
              <span class="ob-lbl">collectés</span>
            </div>
            <div class="ob-bar-col">
              <div class="ob-track">
                <div class="ob-fill" [style.width]="getPercent() + '%'"></div>
              </div>
              <div class="ob-pct-row">
                <span class="ob-pct">{{ getPercent() }}%</span>
                <span class="ob-sub">{{ remaining() | number:'1.0-0' }} {{ jackpot()!.currencyCode }} manquants</span>
              </div>
            </div>
            <div class="ob-stat ob-stat-right">
              <span class="ob-lbl">objectif</span>
              <span class="ob-amount">{{ jackpot()!.targetAmount | number:'1.0-0' }}</span>
              <span class="ob-currency">{{ jackpot()!.currencyCode }}</span>
            </div>
          </div>
        </div>

      </section>

      <!-- ── BODY ── -->
      <div class="page-body">
        <div class="body-wrap">

          <div class="col-left">

            @if (jackpot()!.status === 'CLOSED') {
              <div class="notice closed-notice">
                <div class="notice-icon">🔒</div>
                <div>
                  <div class="notice-title">Cagnotte clôturée</div>
                  <div class="notice-sub">Merci à tous les contributeurs pour leur soutien !</div>
                </div>
              </div>
            }

            @if (jackpot()!.contributorMessage && jackpot()!.status === 'APPROVED') {
              <div class="creator-message">
                <div class="cm-header">
                  <div class="cm-avatar">{{ jackpot()!.owner.name.charAt(0).toUpperCase() }}</div>
                  <div>
                    <div class="cm-name">{{ jackpot()!.owner.name }}</div>
                    <div class="cm-role">Créateur de la cagnotte</div>
                  </div>
                </div>
                <blockquote class="cm-text">{{ jackpot()!.contributorMessage }}</blockquote>
              </div>
            }

            @if (!jackpot()!.contributorMessage && jackpot()!.status === 'APPROVED') {
              <div class="empty-left">
                <div class="el-icon">🎯</div>
                <div class="el-title">Soyez le premier à contribuer !</div>
                <div class="el-sub">Chaque contribution rapproche de l'objectif. Partagez la cagnotte !</div>
              </div>
            }

          </div>

          <div class="col-right">
            <app-jackpot-sidebar-panel
              [jackpot]="jackpot()"
              [categoryMeta]="categoryMeta()"
              [quickAmounts]="quickAmounts"
              [shareUrl]="shareUrl()"
              [isOwner]="isOwner()"
              (contributeRequested)="openContrib($event)"
              (closeRequested)="showCloseModal.set(true)"
            />
          </div>
        </div>
      </div>

    }

    <!-- ── MODAL CLÔTURE ── -->
    @if (showCloseModal()) {
      <div class="modal-backdrop" (click)="showCloseModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-icon">🔒</div>
          <h3 class="modal-title">Clôturer la cagnotte ?</h3>
          <p class="modal-body">
            Cette action est <strong>irréversible</strong>. La cagnotte
            <em>"{{ jackpot()?.title }}"</em> sera fermée et les contributions
            ne seront plus acceptées.
          </p>
          <div class="modal-actions">
            <button class="modal-btn-cancel" (click)="showCloseModal.set(false)" [disabled]="closing()">
              Annuler
            </button>
            <button class="modal-btn-confirm" (click)="doClose()" [disabled]="closing()">
              @if (closing()) { <span class="btn-spinner"></span> }
              Confirmer la clôture
            </button>
          </div>
        </div>
      </div>
    }

    <app-jackpot-contribute-modal
      [show]="showContribModal()"
      [jackpot]="jackpot()"
      [initialAmount]="prefilledAmount()"
      (close)="showContribModal.set(false)"
      (contributed)="onContributed()">
    </app-jackpot-contribute-modal>
  `,
  styles: [`
    :host { display: block; padding-top: 64px; background: #07080d; }

    /* ── LOADING / ERROR ── */
    .full-screen {
      min-height: calc(100vh - 64px);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; text-align: center; padding: 24px;
    }
    .loading-screen { background: #07080d; color: rgba(255,255,255,0.4); }
    .spin-ring {
      width: 42px; height: 42px;
      border: 3px solid rgba(255,255,255,0.05);
      border-top-color: #ffd700;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-emoji { font-size: 3.5rem; }
    .error-screen h2 { font-size: 1.2rem; color: white; margin: 0; }
    .btn-back {
      background: #ffd700; color: #000;
      padding: 10px 22px; border-radius: 10px;
      text-decoration: none; font-weight: 800; font-size: 0.9rem;
    }

    /* ── ORBITAL SECTION ── */
    .orbital-section {
      position: relative; overflow: hidden;
      background: #07080d;
    }
    .bg-blur {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; filter: blur(32px) brightness(0.2) saturate(1.4);
      transform: scale(1.08); pointer-events: none;
    }
    .bg-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, rgba(7,8,13,0.5) 0%, rgba(7,8,13,0.85) 100%);
    }
    .bg-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
      background-size: 56px 56px;
    }

    /* ── STAGE (desktop orbital) ── */
    .orbital-stage {
      position: relative; z-index: 1;
      height: 660px;
      display: flex; align-items: center; justify-content: center;
      max-width: 1300px; margin: 0 auto;
    }

    /* Deco rings */
    .deco-ring {
      position: absolute; border-radius: 50%;
      top: 50%; left: 50%; transform: translate(-50%,-50%);
    }
    .r1 { width: 380px; height: 380px; border: 1px dashed rgba(255,215,0,0.07); animation: ringRotate 35s linear infinite; }
    .r2 { width: 520px; height: 520px; border: 1px dotted rgba(255,215,0,0.04); animation: ringRotate 55s linear infinite reverse; }
    .r3 { width: 660px; height: 660px; border: 1px dashed rgba(255,255,255,0.025); animation: ringRotate 80s linear infinite; }
    @keyframes ringRotate { to { transform: translate(-50%,-50%) rotate(360deg); } }

    /* ── CENTER ORB ── */
    .center-orb {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      width: 260px; height: 260px;
      z-index: 10;
    }
    .orb-halo {
      position: absolute; inset: -30px; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%);
      animation: haloPulse 4s ease-in-out infinite;
    }
    @keyframes haloPulse { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
    .orb-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .arc-progress { transition: stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1); }

    .orb-inner {
      position: absolute; inset: 18px; border-radius: 50%;
      background: radial-gradient(circle at 40% 35%, rgba(20,22,35,0.97) 0%, rgba(7,8,13,0.99) 100%);
      border: 1px solid rgba(255,215,0,0.08);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 2px; padding: 18px; text-align: center;
    }
    .orb-emoji { font-size: 1.8rem; line-height: 1; margin-bottom: 4px; }
    .orb-title {
      font-size: 0.77rem; font-weight: 800; color: rgba(255,255,255,0.85); line-height: 1.25;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .orb-amount { font-size: 1.25rem; font-weight: 900; color: #ffd700; line-height: 1.1; margin-top: 6px; }
    .orb-currency { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.3); }
    .orb-pct {
      font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.45);
      padding: 2px 9px; border-radius: 999px; background: rgba(255,215,0,0.08); margin-top: 3px;
    }
    .pct-done { background: rgba(34,197,94,0.12); color: #86efac; }
    .orb-urgent {
      font-size: 0.64rem; font-weight: 800; color: #f87171;
      padding: 2px 8px; border-radius: 999px; background: rgba(248,113,113,0.1);
      animation: urgentBlink 1.5s ease-in-out infinite;
    }
    @keyframes urgentBlink { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

    /* ── ORBITAL BOTTOM PROGRESS BAR ── */
    .orbital-bottom {
      position: relative; z-index: 1;
      background: rgba(0,0,0,0.45); backdrop-filter: blur(8px);
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .ob-inner {
      max-width: 960px; margin: 0 auto; padding: 20px 24px;
      display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 24px;
    }
    .ob-stat { display: flex; flex-direction: column; gap: 1px; white-space: nowrap; }
    .ob-stat-right { text-align: right; }
    .ob-amount { font-size: 1.4rem; font-weight: 900; color: white; line-height: 1; }
    .ob-currency { font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.35); }
    .ob-lbl { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); }
    .ob-bar-col { display: flex; flex-direction: column; gap: 8px; }
    .ob-track { height: 8px; background: rgba(255,255,255,0.07); border-radius: 999px; overflow: hidden; }
    .ob-fill { height: 100%; background: linear-gradient(90deg, #ffd700, #ff9500); border-radius: 999px; transition: width 1.2s ease; max-width: 100%; }
    .ob-pct-row { display: flex; align-items: center; justify-content: space-between; }
    .ob-pct { font-size: 0.78rem; font-weight: 800; color: #ffd700; }
    .ob-sub { font-size: 0.7rem; color: rgba(255,255,255,0.3); }

    /* ── BODY SECTION ── */
    .page-body { padding: 36px 0 80px; background: #f8f9fb; }
    .body-wrap {
      max-width: 1100px; margin: 0 auto; padding: 0 24px;
      display: grid; grid-template-columns: 1fr 360px; gap: 28px; align-items: start;
    }

    .col-left { display: flex; flex-direction: column; gap: 20px; }
    .col-right { position: sticky; top: 88px; display: flex; flex-direction: column; gap: 16px; }

    .notice { border-radius: 16px; padding: 20px 24px; display: flex; align-items: flex-start; gap: 16px; }
    .notice-icon { font-size: 1.8rem; flex-shrink: 0; }
    .notice-title { font-size: 0.95rem; font-weight: 800; color: #111; margin-bottom: 3px; }
    .notice-sub { font-size: 0.83rem; color: #6b7280; }
    .closed-notice { background: #f3f4f6; border: 1.5px solid #e5e7eb; }

    .creator-message {
      background: white; border: 1.5px solid #f0f1f3; border-radius: 18px;
      padding: 22px 24px; display: flex; flex-direction: column; gap: 16px;
    }
    .cm-header { display: flex; align-items: center; gap: 14px; }
    .cm-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #ffd700, #ff9500);
      color: #000; font-size: 1rem; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
    }
    .cm-name { font-size: 0.9rem; font-weight: 800; color: #111; }
    .cm-role { font-size: 0.75rem; color: #9ca3af; }
    blockquote.cm-text {
      margin: 0; padding: 16px 20px; background: #fffbeb;
      border-left: 3px solid #ffd700; border-radius: 0 12px 12px 0;
      font-size: 0.95rem; color: #374151; line-height: 1.75; font-style: italic;
    }

    .empty-left {
      background: white; border: 1.5px dashed #e5e7eb; border-radius: 18px;
      padding: 40px 32px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .el-icon { font-size: 2.5rem; }
    .el-title { font-size: 1rem; font-weight: 800; color: #111; }
    .el-sub { font-size: 0.86rem; color: #6b7280; max-width: 320px; line-height: 1.6; }

    /* Modal clôture */
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal-card {
      background: white; border-radius: 20px; padding: 32px 28px;
      max-width: 420px; width: 100%; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-icon { font-size: 2.8rem; line-height: 1; }
    .modal-title { margin: 0; font-size: 1.2rem; font-weight: 900; color: #111; }
    .modal-body {
      margin: 0; font-size: 0.88rem; color: #6b7280; line-height: 1.65;
      max-width: 320px;
    }
    .modal-body strong { color: #dc2626; }
    .modal-body em { font-style: normal; font-weight: 700; color: #111; }
    .modal-actions { display: flex; gap: 10px; width: 100%; margin-top: 4px; }
    .modal-btn-cancel {
      flex: 1; padding: 11px 16px; border-radius: 11px;
      border: 1.5px solid #e5e7eb; background: white;
      font: inherit; font-size: 0.88rem; font-weight: 700; color: #374151;
      cursor: pointer; transition: 0.15s;
    }
    .modal-btn-cancel:hover:not(:disabled) { background: #f9fafb; }
    .modal-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }
    .modal-btn-confirm {
      flex: 1; padding: 11px 16px; border-radius: 11px; border: none;
      background: #dc2626; color: white;
      font: inherit; font-size: 0.88rem; font-weight: 700;
      cursor: pointer; transition: 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 7px;
    }
    .modal-btn-confirm:hover:not(:disabled) { background: #b91c1c; }
    .modal-btn-confirm:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-spinner {
      width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 820px) {
      /* On small screens: switch to stacked orbital layout */
      .orbital-stage {
        height: auto;
        flex-direction: column;
        padding: 48px 20px 32px;
        gap: 28px;
        overflow: visible;
      }
      /* Center orb: break out of absolute positioning */
      .center-orb {
        position: relative; top: auto; left: auto;
        transform: none; flex-shrink: 0;
        width: 230px; height: 230px;
      }
      .deco-ring { display: none; }
      /* Bottom progress bar */
      .ob-inner { grid-template-columns: 1fr 1fr; gap: 14px; }
      .ob-bar-col { grid-column: 1 / -1; order: -1; }
      .ob-stat-right { text-align: left; }
    }
    @media (max-width: 760px) {
      .body-wrap { grid-template-columns: 1fr; }
      .col-right { position: static; }
    }
    @media (max-width: 480px) {
      .body-wrap { padding: 0 16px; }
      .ob-stat-right { display: none; }
    }
  `],
})
export class JackpotPublicPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(JackpotService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly jackpot = signal<Jackpot | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly closing = signal(false);
  readonly showCloseModal = signal(false);
  readonly showContribModal = signal(false);
  readonly prefilledAmount = signal<number | null>(null);

  readonly isOwner = computed(() => {
    const user = this.auth.getCurrentUserSnapshot();
    const j = this.jackpot();
    return !!user && !!j && user.id === j.owner.id;
  });

  readonly quickAmounts = QUICK_AMOUNTS;

  readonly categoryMeta = computed(() => {
    const cat = this.jackpot()?.purposeCategory;
    if (!cat) return null;
    const found = PURPOSE_CATEGORIES.find(c => c.value === cat);
    if (!found) return { label: cat, emoji: '🎯' };
    const spaceIdx = found.label.indexOf(' ');
    return {
      emoji: found.label.slice(0, spaceIdx),
      label: found.label.slice(spaceIdx + 1),
    };
  });

  readonly daysRemaining = computed(() => {
    const dl = this.jackpot()?.deadlineAt;
    if (!dl) return null;
    const diff = new Date(dl).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  });

  readonly remaining = computed(() => {
    const j = this.jackpot();
    if (!j) return 0;
    return Math.max(0, Number(j.targetAmount) - Number(j.collectedAmount));
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('shareToken');
    if (!token) { this.error.set('Lien invalide.'); this.loading.set(false); return; }
    this.service.getByShareToken(token).subscribe({
      next: j => { this.jackpot.set(j); this.loading.set(false); },
      error: (e: any) => {
        this.error.set(e?.error?.message ?? 'Cagnotte introuvable.');
        this.loading.set(false);
      },
    });
  }

  getPercent(): number {
    const j = this.jackpot();
    if (!j || !j.targetAmount) return 0;
    return Math.min(100, Math.round((Number(j.collectedAmount) / Number(j.targetAmount)) * 100));
  }

  progressOffset(): number {
    const r = 118;
    const circumference = 2 * Math.PI * r;
    return circumference * (1 - this.getPercent() / 100);
  }

  trunc(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  shareUrl(): string {
    return `${window.location.origin}/jackpot/${this.jackpot()?.shareToken}`;
  }

  openContrib(amount: number | null): void {
    this.prefilledAmount.set(amount);
    this.showContribModal.set(true);
  }

  onContributed(): void {
    const token = this.route.snapshot.paramMap.get('shareToken');
    if (!token) return;
    this.service.getByShareToken(token).subscribe({ next: j => this.jackpot.set(j) });
  }

  doClose(): void {
    const j = this.jackpot();
    if (!j) return;
    this.closing.set(true);
    this.service.close(j.id).subscribe({
      next: (updated) => {
        this.jackpot.set(updated);
        this.closing.set(false);
        this.showCloseModal.set(false);
        this.toast.success('Cagnotte clôturée.');
      },
      error: (e: any) => {
        this.closing.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur lors de la clôture.');
      },
    });
  }
}
