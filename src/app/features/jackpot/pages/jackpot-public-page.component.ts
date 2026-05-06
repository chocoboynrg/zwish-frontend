import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JackpotService } from '../services/jackpot.service';
import { Jackpot, PURPOSE_CATEGORIES } from '../models/jackpot.model';
import { JackpotContributeModalComponent } from '../components/jackpot-contribute-modal.component';

const QUICK_AMOUNTS = [500, 1_000, 2_500, 5_000];

@Component({
  selector: 'app-jackpot-public-page',
  standalone: true,
  imports: [CommonModule, RouterLink, JackpotContributeModalComponent],
  template: `
    <!-- ── LOADING ── -->
    @if (loading()) {
      <div class="full-screen loading-screen">
        <div class="spin-ring"></div>
        <span>Chargement…</span>
      </div>
    }

    <!-- ── ERROR ── -->
    @if (error() && !loading()) {
      <div class="full-screen error-screen">
        <div class="error-emoji">😕</div>
        <h2>{{ error() }}</h2>
        <a routerLink="/" class="btn-back">← Retour à l'accueil</a>
      </div>
    }

    <!-- ── PAGE ── -->
    @if (jackpot() && !loading()) {

      <!-- HERO -->
      <div class="hero" [class.hero-has-image]="jackpot()!.imageUrl">
        @if (jackpot()!.imageUrl) {
          <div class="hero-bg-img" [style.background-image]="'url(' + jackpot()!.imageUrl + ')'"></div>
          <div class="hero-bg-overlay"></div>
        }
        <div class="hero-grid"></div>
        <div class="hero-glow"></div>

        <div class="hero-body">
          <!-- Avatar / emoji -->
          @if (jackpot()!.imageUrl) {
            <div class="hero-avatar">
              <img [src]="jackpot()!.imageUrl" [alt]="jackpot()!.title" />
            </div>
          } @else {
            <div class="hero-emoji-wrap">
              <span class="hero-emoji">{{ categoryMeta()?.emoji ?? '💰' }}</span>
            </div>
          }

          <!-- Category badge -->
          @if (categoryMeta()) {
            <div class="hero-badge">{{ categoryMeta()!.label }}</div>
          }

          <!-- Title + description -->
          <h1>{{ jackpot()!.title }}</h1>
          @if (jackpot()!.description) {
            <p class="hero-desc">{{ jackpot()!.description }}</p>
          }

          <!-- Meta row -->
          <div class="hero-meta">
            <span>Lancé par <strong>{{ jackpot()!.owner.name }}</strong></span>
            <span class="meta-sep">·</span>
            <span>{{ jackpot()!.createdAt | date:'dd MMM yyyy' }}</span>
            @if (jackpot()!.visibility === 'PUBLIC') {
              <span class="meta-sep">·</span>
              <span>🌍 Publique</span>
            }
            @if (daysRemaining() !== null) {
              <span class="meta-sep">·</span>
              <span class="meta-deadline" [class.urgent]="(daysRemaining() ?? 99) <= 3">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 6v4l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                {{ daysRemaining() === 0 ? 'Dernier jour !' : daysRemaining() + ' j restants' }}
              </span>
            }
          </div>
        </div>

        <!-- Progress strip -->
        <div class="hero-progress">
          <div class="progress-inner">
            <div class="prog-stat">
              <span class="prog-amount">{{ jackpot()!.collectedAmount | number:'1.0-0' }}</span>
              <span class="prog-cur">{{ jackpot()!.currencyCode }}</span>
              <span class="prog-lbl">collectés</span>
            </div>
            <div class="prog-bar-col">
              <div class="prog-track">
                <div class="prog-fill" [style.width]="getPercent() + '%'"></div>
              </div>
              <div class="prog-pct-row">
                <span class="prog-pct">{{ getPercent() }}%</span>
                <span class="prog-remaining">
                  Il manque encore {{ remaining() | number:'1.0-0' }} {{ jackpot()!.currencyCode }}
                </span>
              </div>
            </div>
            <div class="prog-stat prog-stat-right">
              <span class="prog-lbl">objectif</span>
              <span class="prog-amount">{{ jackpot()!.targetAmount | number:'1.0-0' }}</span>
              <span class="prog-cur">{{ jackpot()!.currencyCode }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div class="page-body">
        <div class="body-wrap">

          <!-- LEFT -->
          <div class="col-left">

            <!-- Clôturé -->
            @if (jackpot()!.status === 'CLOSED') {
              <div class="notice closed-notice">
                <div class="notice-icon">🔒</div>
                <div>
                  <div class="notice-title">Cagnotte clôturée</div>
                  <div class="notice-sub">Merci à tous les contributeurs pour leur soutien !</div>
                </div>
              </div>
            }

            <!-- Message du créateur -->
            @if (jackpot()!.contributorMessage) {
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

            <!-- Aucun contenu → encouragement -->
            @if (!jackpot()!.contributorMessage && jackpot()!.status === 'APPROVED') {
              <div class="empty-left">
                <div class="el-icon">🎯</div>
                <div class="el-title">Soyez le premier à contribuer !</div>
                <div class="el-sub">
                  Chaque contribution compte. Partagez cette cagnotte pour atteindre l'objectif plus vite.
                </div>
              </div>
            }
          </div>

          <!-- RIGHT (sticky) -->
          <div class="col-right">

            <!-- CTA contribuer -->
            @if (jackpot()!.status === 'APPROVED') {
              <div class="cta-card">
                <div class="cta-head">
                  <div class="cta-title">Contribuer à cette cagnotte</div>
                  <p class="cta-desc">Votre contribution est directement ajoutée au pot commun.</p>
                </div>

                <div class="quick-grid">
                  @for (amt of quickAmounts; track amt) {
                    <button class="quick-chip" (click)="openContrib(amt)">
                      {{ amt | number:'1.0-0' }}
                    </button>
                  }
                </div>

                <button class="btn-contribute" (click)="openContrib(null)">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  </svg>
                  Contribuer maintenant
                </button>

                <div class="cta-security">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2l7 3v5c0 4-3.5 7-7 8-3.5-1-7-4-7-8V5l7-3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                  </svg>
                  {{ jackpot()!.currencyCode }} · Paiement sécurisé
                </div>
              </div>
            }

            <!-- Partager -->
            <div class="share-card">
              <div class="share-title">Partager cette cagnotte</div>
              <div class="share-link-row">
                <input class="share-input" [value]="shareUrl()" readonly />
                <button class="btn-copy" (click)="copyLink()">
                  @if (copied()) {
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10l5 5 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Copié !
                  } @else {
                    Copier
                  }
                </button>
              </div>
              <div class="share-socials">
                <a [href]="whatsappUrl()" target="_blank" rel="noopener" class="social-btn whatsapp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>

            <!-- Infos -->
            <div class="info-card">
              <div class="info-row">
                <span class="info-lbl">Créé le</span>
                <span class="info-val">{{ jackpot()!.createdAt | date:'dd MMM yyyy' }}</span>
              </div>
              @if (categoryMeta()) {
                <div class="info-row">
                  <span class="info-lbl">Catégorie</span>
                  <span class="info-val">{{ categoryMeta()!.label }}</span>
                </div>
              }
              @if (jackpot()!.deadlineAt) {
                <div class="info-row">
                  <span class="info-lbl">Date limite</span>
                  <span class="info-val">{{ jackpot()!.deadlineAt | date:'dd MMM yyyy' }}</span>
                </div>
              }
              <div class="info-row">
                <span class="info-lbl">Visibilité</span>
                <span class="info-val">{{ jackpot()!.visibility === 'PUBLIC' ? '🌍 Publique' : '🔒 Privée' }}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    }

    <!-- Modal contribution -->
    <app-jackpot-contribute-modal
      [show]="showContribModal()"
      [jackpot]="jackpot()"
      [initialAmount]="prefilledAmount()"
      (close)="showContribModal.set(false)"
      (contributed)="onContributed()"
    ></app-jackpot-contribute-modal>
  `,
  styles: [`
    :host {
      display: block;
      padding-top: 64px;
      background: #f8f9fb;
    }

    /* ── FULL-SCREEN STATES ── */
    .full-screen {
      min-height: calc(100vh - 64px);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; text-align: center; padding: 24px;
    }
    .loading-screen { background: #0a0a0a; color: rgba(255,255,255,0.5); }
    .spin-ring {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.08);
      border-top-color: #ffd700;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-emoji { font-size: 3.5rem; }
    .error-screen h2 { font-size: 1.2rem; color: #111; margin: 0; }
    .btn-back {
      background: #111; color: white;
      padding: 10px 20px; border-radius: 10px;
      text-decoration: none; font-weight: 700; font-size: 0.9rem;
    }

    /* ── HERO ── */
    .hero {
      position: relative;
      background: #0a0a0a;
      overflow: hidden;
    }
    .hero-bg-img {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      filter: blur(20px) brightness(0.4);
      transform: scale(1.05);
    }
    .hero-bg-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%);
    }
    .hero-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 48px 48px;
    }
    .hero-glow {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 50% 60% at 50% 40%, rgba(255,215,0,0.07) 0%, transparent 65%);
    }

    .hero-body {
      position: relative; z-index: 1;
      max-width: 680px; margin: 0 auto;
      padding: 56px 24px 40px;
      text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 0;
    }
    .hero-avatar {
      width: 96px; height: 96px; border-radius: 20px;
      overflow: hidden; border: 2px solid rgba(255,255,255,0.15);
      margin-bottom: 20px; flex-shrink: 0;
    }
    .hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .hero-emoji-wrap {
      width: 88px; height: 88px;
      border-radius: 20px;
      background: rgba(255,215,0,0.1);
      border: 1.5px solid rgba(255,215,0,0.2);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .hero-emoji { font-size: 2.8rem; line-height: 1; }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 14px; border-radius: 999px;
      background: rgba(255,215,0,0.12);
      color: #ffd700;
      border: 1px solid rgba(255,215,0,0.25);
      font-size: 0.76rem; font-weight: 700;
      margin-bottom: 16px;
    }
    .hero-body h1 {
      font-size: clamp(1.9rem, 4.5vw, 3rem);
      font-weight: 900; color: white;
      margin: 0 0 14px; letter-spacing: -0.025em; line-height: 1.1;
    }
    .hero-desc {
      color: rgba(255,255,255,0.5); font-size: 0.97rem;
      line-height: 1.7; margin: 0 0 24px; max-width: 520px;
    }
    .hero-meta {
      display: flex; align-items: center; flex-wrap: wrap;
      justify-content: center; gap: 6px;
      font-size: 0.83rem; color: rgba(255,255,255,0.4);
    }
    .hero-meta strong { color: rgba(255,255,255,0.8); }
    .meta-sep { color: rgba(255,255,255,0.2); }
    .meta-deadline {
      display: inline-flex; align-items: center; gap: 4px;
      color: rgba(255,215,0,0.7);
    }
    .meta-deadline.urgent { color: #f87171; }

    /* Progress strip */
    .hero-progress {
      position: relative; z-index: 1;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.3);
      backdrop-filter: blur(8px);
    }
    .progress-inner {
      max-width: 960px; margin: 0 auto;
      padding: 20px 24px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center; gap: 24px;
    }
    .prog-stat {
      display: flex; flex-direction: column; gap: 2px;
      white-space: nowrap;
    }
    .prog-stat-right { text-align: right; }
    .prog-amount {
      font-size: 1.5rem; font-weight: 900; color: white; line-height: 1;
    }
    .prog-cur {
      font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.4);
    }
    .prog-lbl {
      font-size: 0.7rem; color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .prog-bar-col { display: flex; flex-direction: column; gap: 8px; }
    .prog-track {
      height: 10px; background: rgba(255,255,255,0.1);
      border-radius: 999px; overflow: hidden;
    }
    .prog-fill {
      height: 100%;
      background: linear-gradient(90deg, #ffd700, #ffa500);
      border-radius: 999px;
      transition: width 0.8s ease;
      max-width: 100%;
    }
    .prog-pct-row {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .prog-pct {
      font-size: 0.8rem; font-weight: 800; color: #ffd700;
    }
    .prog-remaining {
      font-size: 0.75rem; color: rgba(255,255,255,0.35); text-align: right;
    }

    /* ── BODY ── */
    .page-body { padding: 36px 0 80px; }
    .body-wrap {
      max-width: 1100px; margin: 0 auto; padding: 0 24px;
      display: grid; grid-template-columns: 1fr 360px;
      gap: 28px; align-items: start;
    }

    /* LEFT */
    .col-left { display: flex; flex-direction: column; gap: 20px; }

    .notice {
      border-radius: 16px; padding: 20px 24px;
      display: flex; align-items: flex-start; gap: 16px;
    }
    .notice-icon { font-size: 1.8rem; flex-shrink: 0; line-height: 1; }
    .notice-title { font-size: 0.95rem; font-weight: 800; color: #111; margin-bottom: 3px; }
    .notice-sub { font-size: 0.83rem; color: #6b7280; }
    .closed-notice { background: #f3f4f6; border: 1.5px solid #e5e7eb; }

    .creator-message {
      background: white; border: 1.5px solid #f0f1f3;
      border-radius: 18px; padding: 22px 24px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .cm-header { display: flex; align-items: center; gap: 14px; }
    .cm-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: #ffd700; color: #000;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; font-weight: 900; flex-shrink: 0;
    }
    .cm-name { font-size: 0.9rem; font-weight: 800; color: #111; }
    .cm-role { font-size: 0.75rem; color: #9ca3af; }
    blockquote.cm-text {
      margin: 0; padding: 16px 20px;
      background: #fffbeb; border-left: 3px solid #ffd700;
      border-radius: 0 12px 12px 0;
      font-size: 0.95rem; color: #374151;
      line-height: 1.75; font-style: italic;
    }

    .empty-left {
      background: white; border: 1.5px dashed #e5e7eb;
      border-radius: 18px; padding: 40px 32px;
      text-align: center; display: flex; flex-direction: column;
      align-items: center; gap: 10px;
    }
    .el-icon { font-size: 2.5rem; }
    .el-title { font-size: 1rem; font-weight: 800; color: #111; }
    .el-sub { font-size: 0.86rem; color: #6b7280; max-width: 320px; line-height: 1.6; }

    /* RIGHT */
    .col-right {
      position: sticky; top: 88px;
      display: flex; flex-direction: column; gap: 16px;
    }

    /* CTA card */
    .cta-card {
      background: #111; border-radius: 20px; padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .cta-head { display: flex; flex-direction: column; gap: 6px; }
    .cta-title { font-size: 1rem; font-weight: 900; color: white; }
    .cta-desc { font-size: 0.82rem; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.55; }

    .quick-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    }
    .quick-chip {
      padding: 10px 4px;
      background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 10px; color: rgba(255,255,255,0.7);
      font: inherit; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; text-align: center;
      transition: 0.15s;
    }
    .quick-chip:hover {
      background: #ffd700; border-color: #ffd700; color: #000;
    }

    .btn-contribute {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 15px; border: 0; border-radius: 12px;
      background: #ffd700; color: #000;
      font: inherit; font-size: 1rem; font-weight: 800;
      cursor: pointer; transition: 0.2s; width: 100%;
    }
    .btn-contribute:hover { background: #ffc000; transform: translateY(-1px); }

    .cta-security {
      display: flex; align-items: center; justify-content: center; gap: 5px;
      font-size: 0.72rem; color: rgba(255,255,255,0.25);
    }

    /* Share card */
    .share-card {
      background: white; border: 1.5px solid #f0f1f3;
      border-radius: 16px; padding: 18px 20px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .share-title { font-size: 0.84rem; font-weight: 800; color: #374151; }
    .share-link-row { display: flex; gap: 8px; }
    .share-input {
      flex: 1; padding: 9px 12px;
      border: 1.5px solid #e5e7eb; border-radius: 9px;
      font-family: monospace; font-size: 0.72rem;
      color: #6b7280; background: #f9fafb;
      outline: 0; min-width: 0;
    }
    .btn-copy {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 9px 14px; border: 0; border-radius: 9px;
      background: #111; color: white;
      font: inherit; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; white-space: nowrap; transition: 0.15s;
      flex-shrink: 0;
    }
    .btn-copy:hover { background: #222; }

    .share-socials { display: flex; gap: 8px; }
    .social-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 8px 14px; border-radius: 9px;
      font: inherit; font-size: 0.78rem; font-weight: 700;
      text-decoration: none; cursor: pointer; transition: 0.15s;
    }
    .whatsapp { background: #25d366; color: white; }
    .whatsapp:hover { background: #1fba57; }

    /* Info card */
    .info-card {
      background: white; border: 1.5px solid #f0f1f3;
      border-radius: 16px; padding: 16px 20px;
      display: flex; flex-direction: column;
    }
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 0; font-size: 0.8rem;
      border-bottom: 1px solid #f9fafb;
    }
    .info-row:last-child { border-bottom: 0; }
    .info-lbl { color: #9ca3af; font-weight: 600; }
    .info-val { color: #111; font-weight: 700; }

    /* ── RESPONSIVE ── */
    @media (max-width: 860px) {
      .progress-inner { grid-template-columns: 1fr 1fr; gap: 16px; }
      .prog-bar-col { grid-column: 1 / -1; order: -1; }
      .prog-stat-right { text-align: left; }
    }
    @media (max-width: 760px) {
      .body-wrap { grid-template-columns: 1fr; }
      .col-right { position: static; }
    }
    @media (max-width: 480px) {
      .hero-body { padding: 40px 16px 28px; }
      .body-wrap { padding: 0 16px; }
      .quick-grid { grid-template-columns: repeat(2, 1fr); }
      .prog-stat-right { display: none; }
    }
  `],
})
export class JackpotPublicPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(JackpotService);

  readonly jackpot = signal<Jackpot | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly copied = signal(false);
  readonly showContribModal = signal(false);
  readonly prefilledAmount = signal<number | null>(null);

  readonly quickAmounts = QUICK_AMOUNTS;

  readonly categoryMeta = computed(() => {
    const cat = this.jackpot()?.purposeCategory;
    if (!cat) return null;
    const found = PURPOSE_CATEGORIES.find(c => c.value === cat);
    if (!found) return { label: cat, emoji: '🎯' };
    // label format is "emoji text", split on first space
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
    if (!token) {
      this.error.set('Lien invalide.');
      this.loading.set(false);
      return;
    }
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

  shareUrl(): string {
    return `${window.location.origin}/jackpot/${this.jackpot()?.shareToken}`;
  }

  whatsappUrl(): string {
    const text = encodeURIComponent(`Je soutiens "${this.jackpot()?.title}" — rejoignez-moi ! ${this.shareUrl()}`);
    return `https://wa.me/?text=${text}`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.shareUrl()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  openContrib(amount: number | null): void {
    this.prefilledAmount.set(amount);
    this.showContribModal.set(true);
  }

  onContributed(): void {
    const token = this.route.snapshot.paramMap.get('shareToken');
    if (!token) return;
    this.service.getByShareToken(token).subscribe({
      next: j => this.jackpot.set(j),
    });
  }
}
