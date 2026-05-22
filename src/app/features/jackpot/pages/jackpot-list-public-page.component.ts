import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { JackpotService } from '../services/jackpot.service';
import { Jackpot, PURPOSE_CATEGORIES } from '../models/jackpot.model';

const CAT_GRADIENTS: Record<string, string> = {
  voyage:     'linear-gradient(145deg,#0a1628,#1a3a5c,#0d2040)',
  sante:      'linear-gradient(145deg,#1a0812,#3d0f28,#260a1a)',
  etudes:     'linear-gradient(145deg,#0a1a0a,#1a3d12,#0d2010)',
  maison:     'linear-gradient(145deg,#1a1205,#3d2a0a,#261800)',
  bebe:       'linear-gradient(145deg,#12051a,#2d0d3d,#1a0828)',
  projet:     'linear-gradient(145deg,#0a0d1a,#1a2040,#0d1230)',
  solidarite: 'linear-gradient(145deg,#0d1a15,#1a3d2c,#0a2018)',
  autre:      'linear-gradient(145deg,#111118,#1c1c2e,#111118)',
};

@Component({
  selector: 'app-jackpot-list-public-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="page">

      <!-- HERO -->
      <div class="hero">
        <div class="hero-inner">
          <div class="eyebrow">
            <span class="eyebrow-dot"></span>
            Cagnottes actives
          </div>
          <h1>
            <span class="h1-line1">Soutenez</span>
            <span class="h1-line2">des projets</span>
          </h1>
          <p class="hero-sub">Chaque contribution rapproche d'un rêve. Rejoignez une collecte ou lancez la vôtre.</p>
          @if (!loading() && jackpots().length > 0) {
            <div class="hero-count">{{ jackpots().length }} cagnotte{{ jackpots().length > 1 ? 's' : '' }} en cours</div>
          }
        </div>
        <div class="hero-deco">
          <div class="deco-ring r1"></div>
          <div class="deco-ring r2"></div>
          <div class="deco-coin">💰</div>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="content">

        @if (loading()) {
          <div class="skeleton-grid">
            @for (_ of [1,2,3,4,5,6]; track $index) {
              <div class="skeleton-card" [class.sk-wide]="$index === 0"></div>
            }
          </div>
        }

        @if (!loading() && jackpots().length === 0) {
          <div class="empty-block">
            <div class="empty-icon">💰</div>
            <div class="empty-title">Aucune cagnotte active</div>
            <div class="empty-desc">Soyez le premier à lancer une collecte pour votre projet.</div>
            <a routerLink="/register" class="empty-cta">Créer une cagnotte →</a>
          </div>
        }

        @if (!loading() && jackpots().length > 0) {
          <div class="cards-grid">
            @for (j of jackpots(); track j.id; let i = $index) {
              <a [routerLink]="['/jackpot', j.shareToken]" class="card" [class.card-wide]="i === 0">

                <!-- Visual -->
                <div class="card-visual">
                  @if (j.imageUrl) {
                    <img [src]="j.imageUrl" [alt]="j.title" class="card-img" />
                  } @else {
                    <div class="card-grad" [style.background]="catGrad(j.purposeCategory)"></div>
                    <div class="card-emoji-bg">{{ catEmoji(j.purposeCategory) }}</div>
                  }
                  <div class="card-overlay"></div>

                  @if (j.purposeCategory) {
                    <div class="card-cat">{{ catEmoji(j.purposeCategory) }} {{ catLabel(j.purposeCategory) }}</div>
                  }

                  <div class="card-pct-badge" [class.pct-full]="getPct(j) >= 100">
                    {{ getPct(j) }}%
                  </div>
                </div>

                <!-- Content -->
                <div class="card-body">
                  <div class="card-title">{{ j.title }}</div>
                  <div class="card-owner">par {{ j.owner.name }}</div>

                  <div class="card-progress">
                    <div class="prog-track">
                      <div class="prog-fill" [style.width]="getPct(j) + '%'"></div>
                    </div>
                    <div class="prog-info">
                      <span class="prog-collected">{{ j.collectedAmount | number:'1.0-0' }}</span>
                      <span class="prog-sep">/</span>
                      <span class="prog-target">{{ j.targetAmount | number:'1.0-0' }} {{ j.currencyCode }}</span>
                    </div>
                  </div>

                  <div class="card-arrow">
                    <span>Participer</span>
                    <lucide-icon name="arrow-right" [size]="14" color="currentColor" [strokeWidth]="2" />
                  </div>
                </div>

              </a>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #07080d; min-height: 100vh; padding-top: 64px; }

    /* ── HERO ── */
    .hero {
      position: relative; overflow: hidden;
      padding: 64px 24px 56px;
      background: linear-gradient(160deg, #0a0c14 0%, #07080d 60%);
      border-bottom: 1px solid rgba(255,215,0,0.06);
      display: flex; align-items: center; justify-content: space-between;
      max-width: 1280px; margin: 0 auto;
    }
    .hero-inner { flex: 1; max-width: 560px; }
    .eyebrow {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 0.7rem; font-weight: 800; letter-spacing: 0.18em;
      text-transform: uppercase; color: #ffd700; margin-bottom: 20px;
    }
    .eyebrow-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #ffd700;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
    h1 { margin: 0 0 18px; line-height: 0.92; }
    .h1-line1 {
      display: block;
      font-size: clamp(2.8rem, 5.5vw, 5.5rem);
      font-weight: 900; color: rgba(255,255,255,0.9);
      letter-spacing: -0.03em;
    }
    .h1-line2 {
      display: block;
      font-size: clamp(2.8rem, 5.5vw, 5.5rem);
      font-weight: 900; letter-spacing: -0.03em;
      background: linear-gradient(90deg, #ffd700, #ff9500);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .hero-sub { color: rgba(255,255,255,0.38); font-size: 1rem; line-height: 1.65; margin: 0 0 20px; max-width: 400px; }
    .hero-count { display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(255,215,0,0.08); border: 1px solid rgba(255,215,0,0.15); color: rgba(255,215,0,0.8); font-size: 0.78rem; font-weight: 700; }

    .hero-deco { position: relative; width: 220px; height: 220px; flex-shrink: 0; display: none; }
    @media (min-width: 900px) { .hero-deco { display: block; } }
    .deco-ring {
      position: absolute; border-radius: 50%;
      border: 1px dashed rgba(255,215,0,0.1);
      top: 50%; left: 50%; transform: translate(-50%,-50%);
      animation: spinRing 25s linear infinite;
    }
    .r1 { width: 180px; height: 180px; }
    .r2 { width: 140px; height: 140px; border-style: dotted; animation-direction: reverse; animation-duration: 18s; }
    @keyframes spinRing { to { transform: translate(-50%,-50%) rotate(360deg); } }
    .deco-coin {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      font-size: 3.5rem; animation: coinFloat 4s ease-in-out infinite;
    }
    @keyframes coinFloat { 0%,100% { transform:translate(-50%,-50%) translateY(0); } 50% { transform:translate(-50%,-50%) translateY(-12px); } }

    /* ── CONTENT ── */
    .content { max-width: 1280px; margin: 0 auto; padding: 40px 24px 80px; }

    /* Skeleton */
    .skeleton-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 1100px) { .skeleton-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .skeleton-grid { grid-template-columns: 1fr; } }
    .skeleton-card {
      height: 340px; border-radius: 20px;
      background: linear-gradient(90deg, #111118 25%, #1a1a24 50%, #111118 75%);
      background-size: 200%;
      animation: skelShimmer 1.5s infinite;
    }
    .sk-wide { grid-column: span 2; height: 380px; }
    @media (max-width: 640px) { .sk-wide { grid-column: span 1; height: 340px; } }
    @keyframes skelShimmer { 0% { background-position: -200%; } 100% { background-position: 200%; } }

    /* Empty */
    .empty-block { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 80px 24px; text-align: center; }
    .empty-icon { font-size: 3.5rem; }
    .empty-title { font-size: 1.1rem; font-weight: 800; color: white; }
    .empty-desc { color: rgba(255,255,255,0.35); font-size: 0.9rem; }
    .empty-cta {
      margin-top: 8px; padding: 12px 28px; background: #ffd700; color: #000;
      font-weight: 800; font-size: 0.9rem; border-radius: 999px; text-decoration: none; transition: 0.15s;
    }
    .empty-cta:hover { background: #ffc000; transform: translateY(-2px); }

    /* ── GRID ── */
    .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .cards-grid { grid-template-columns: 1fr; } }

    /* ── CARD ── */
    .card {
      display: flex; flex-direction: column;
      border-radius: 20px; overflow: hidden; text-decoration: none;
      background: #0f1018; border: 1px solid rgba(255,255,255,0.05);
      transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
      cursor: pointer;
    }
    .card:hover {
      transform: translateY(-6px);
      box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.18);
      border-color: rgba(255,215,0,0.18);
    }
    .card-wide { grid-column: span 2; }
    @media (max-width: 640px) { .card-wide { grid-column: span 1; } }

    /* Card visual */
    .card-visual {
      position: relative; flex-shrink: 0;
      height: 220px; overflow: hidden;
    }
    .card-wide .card-visual { height: 260px; }
    .card-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .card:hover .card-img { transform: scale(1.05); }
    .card-grad { position: absolute; inset: 0; }
    .card-emoji-bg {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      font-size: 5rem; opacity: 0.25; filter: blur(2px);
    }
    .card-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.8) 100%);
    }
    .card-cat {
      position: absolute; top: 14px; left: 14px;
      padding: 4px 12px; border-radius: 999px;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
      color: rgba(255,255,255,0.85); font-size: 0.7rem; font-weight: 700;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .card-pct-badge {
      position: absolute; bottom: 14px; right: 14px;
      padding: 4px 10px; border-radius: 999px;
      background: rgba(255,215,0,0.15); backdrop-filter: blur(6px);
      border: 1px solid rgba(255,215,0,0.3);
      color: #ffd700; font-size: 0.72rem; font-weight: 800;
    }
    .pct-full { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); color: #86efac; }

    /* Card body */
    .card-body {
      padding: 18px 20px 20px;
      display: flex; flex-direction: column; gap: 8px;
      flex: 1;
    }
    .card-title { font-size: 1rem; font-weight: 800; color: white; line-height: 1.3; }
    .card-owner { font-size: 0.75rem; color: rgba(255,255,255,0.35); }

    .card-progress { display: flex; flex-direction: column; gap: 6px; margin-top: auto; padding-top: 6px; }
    .prog-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
    .prog-fill { height: 100%; background: linear-gradient(90deg, #ffd700, #ff9500); border-radius: 999px; transition: width 0.8s ease; }
    .prog-info { display: flex; align-items: baseline; gap: 5px; font-size: 0.75rem; }
    .prog-collected { font-weight: 800; color: rgba(255,255,255,0.8); }
    .prog-sep { color: rgba(255,255,255,0.2); }
    .prog-target { color: rgba(255,255,255,0.3); }

    .card-arrow {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 4px;
      font-size: 0.78rem; font-weight: 700; color: rgba(255,215,0,0.7);
      transition: gap 0.2s, color 0.2s;
    }
    .card:hover .card-arrow { gap: 10px; color: #ffd700; }
  `],
})
export class JackpotListPublicPageComponent implements OnInit {
  private readonly service = inject(JackpotService);
  readonly jackpots = signal<Jackpot[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.service.getPublicActive().subscribe({
      next: js => { this.jackpots.set(js); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getPct(j: Jackpot): number {
    if (!j.targetAmount) return 0;
    return Math.min(100, Math.round((Number(j.collectedAmount) / Number(j.targetAmount)) * 100));
  }

  catEmoji(cat: string | null): string {
    if (!cat) return '💰';
    const found = PURPOSE_CATEGORIES.find(c => c.value === cat);
    return found ? found.label.split(' ')[0] : '🎯';
  }

  catLabel(cat: string | null): string {
    if (!cat) return '';
    const found = PURPOSE_CATEGORIES.find(c => c.value === cat);
    return found ? found.label.split(' ').slice(1).join(' ') : cat;
  }

  catGrad(cat: string | null): string {
    return CAT_GRADIENTS[cat ?? ''] ?? 'linear-gradient(145deg,#111118,#1c1c2e)';
  }
}
