import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Jackpot } from '../models/jackpot.model';

@Component({
  selector: 'app-jackpot-orbital-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="floating-summary">
      <div class="float-card fc-nw" role="complementary">
        <div class="fc-label">Motivation</div>
        <div class="fc-quote">"</div>
        <p class="fc-text">{{ trunc(jackpot?.description || 'Participez à cette belle aventure et soutenez un projet qui nous tient à cœur !', 95) }}</p>
      </div>

      <div class="float-card fc-ne" role="complementary">
        @if (jackpot?.imageUrl) {
          <img [src]="jackpot?.imageUrl" [alt]="jackpot?.title" class="fc-img" />
        } @else {
          <div class="fc-emoji-wrap">
            <span class="fc-emoji-big">{{ categoryMeta?.emoji ?? '💰' }}</span>
          </div>
        }
        @if (categoryMeta) {
          <div class="fc-cat-label">{{ categoryMeta.emoji }} {{ categoryMeta.label }}</div>
        }
      </div>

      <div class="float-card fc-sw" role="complementary">
        <div class="fc-from">
          <div class="fc-avatar">{{ jackpot?.owner?.name?.charAt(0)?.toUpperCase() ?? 'Z' }}</div>
          <div>
            <div class="fc-from-name">{{ jackpot?.owner?.name }}</div>
            <div class="fc-from-role">Créateur</div>
          </div>
        </div>
        <p class="fc-text">
          {{ trunc(jackpot?.contributorMessage || 'Merci de soutenir ce projet. Chaque contribution compte !', 80) }}
        </p>
      </div>

      <div class="float-card fc-se" role="complementary">
        @if (daysRemaining !== null) {
          <div class="fc-days" [class.urgent]="daysRemaining <= 3">
            <span class="days-num">{{ daysRemaining }}</span>
            <span class="days-lbl">jour{{ daysRemaining > 1 ? 's' : '' }} restants</span>
          </div>
        } @else {
          <div class="fc-no-deadline">
            <lucide-icon name="clock" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            Pas de limite
          </div>
        }
        <div class="fc-remaining-wrap">
          <div class="fc-remaining-lbl">Il manque encore</div>
          <div class="fc-remaining-val">{{ remaining | number:'1.0-0' }} {{ jackpot?.currencyCode }}</div>
        </div>
      </div>

      <div class="mobile-info-grid">
        <div class="mi-card">
          <div class="mi-emoji">{{ categoryMeta?.emoji ?? '💰' }}</div>
          <div class="mi-label">{{ categoryMeta?.label ?? 'Cagnotte' }}</div>
        </div>
        <div class="mi-card">
          <div class="mi-val">{{ percent }}%</div>
          <div class="mi-label">atteint</div>
        </div>
        <div class="mi-card">
          <div class="mi-val" [class.urgent-val]="(daysRemaining ?? 99) <= 3">
            {{ daysRemaining !== null ? daysRemaining + 'j' : '∞' }}
          </div>
          <div class="mi-label">restants</div>
        </div>
        <div class="mi-card">
          <div class="mi-val small">{{ ownerFirstName() }}</div>
          <div class="mi-label">créateur</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .floating-summary {
        position: absolute;
        inset: 0;
      }
      .float-card {
        position: absolute;
        z-index: 2;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(18px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 18px;
        padding: 16px 18px;
        color: white;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
        max-width: 240px;
      }
      .fc-nw {
        top: 70px;
        left: 40px;
      }
      .fc-ne {
        top: 90px;
        right: 50px;
      }
      .fc-sw {
        bottom: 120px;
        left: 50px;
      }
      .fc-se {
        bottom: 120px;
        right: 50px;
      }
      .fc-label {
        font-size: 0.65rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.42);
        margin-bottom: 8px;
      }
      .fc-quote {
        font-size: 2rem;
        line-height: 1;
        color: rgba(255, 215, 0, 0.45);
        margin-bottom: 6px;
      }
      .fc-text {
        margin: 0;
        font-size: 0.86rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.75);
      }
      .fc-img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 14px;
        margin-bottom: 10px;
      }
      .fc-emoji-wrap {
        width: 140px;
        height: 140px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.05);
        margin-bottom: 10px;
      }
      .fc-emoji-big {
        font-size: 3rem;
      }
      .fc-cat-label {
        font-size: 0.78rem;
        font-weight: 800;
        color: #ffd700;
      }
      .fc-from {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .fc-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255, 215, 0, 0.18);
        display: grid;
        place-items: center;
        color: #ffd700;
        font-weight: 900;
      }
      .fc-from-name {
        font-weight: 800;
        font-size: 0.86rem;
      }
      .fc-from-role {
        font-size: 0.68rem;
        color: rgba(255, 255, 255, 0.45);
      }
      .fc-days {
        display: flex;
        align-items: baseline;
        gap: 5px;
        margin-bottom: 10px;
      }
      .days-num {
        font-size: 2rem;
        font-weight: 900;
        line-height: 1;
        color: #ffd700;
      }
      .days-lbl {
        font-size: 0.82rem;
        color: rgba(255, 255, 255, 0.75);
        font-weight: 700;
      }
      .fc-no-deadline {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 0.82rem;
        color: rgba(255, 255, 255, 0.7);
      }
      .fc-remaining-lbl {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 4px;
      }
      .fc-remaining-val {
        font-size: 1.2rem;
        font-weight: 900;
        color: white;
      }
      .mobile-info-grid {
        display: none;
      }
      .mi-card {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 12px 10px;
        text-align: center;
        color: white;
      }
      .mi-emoji {
        font-size: 1.2rem;
        margin-bottom: 4px;
      }
      .mi-val {
        font-size: 1rem;
        font-weight: 900;
        line-height: 1.1;
      }
      .mi-val.small {
        font-size: 0.9rem;
      }
      .mi-label {
        font-size: 0.64rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.45);
      }
      .urgent {
        color: #fb923c;
      }
      .urgent-val {
        color: #fb923c;
      }
      @media (max-width: 860px) {
        .float-card {
          display: none;
        }
        .mobile-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          position: absolute;
          left: 24px;
          right: 24px;
          bottom: 28px;
          z-index: 2;
        }
      }
    `,
  ],
})
export class JackpotOrbitalSummaryComponent {
  @Input() jackpot: Jackpot | null = null;
  @Input() categoryMeta: { emoji: string; label: string } | null = null;
  @Input() daysRemaining: number | null = null;
  @Input() percent = 0;
  @Input() remaining = 0;
  @Input() trunc!: (text: string, max: number) => string;

  ownerFirstName(): string {
    const name = this.jackpot?.owner?.name?.trim();
    if (!name) return 'Z';
    return name.split(/\s+/)[0] ?? 'Z';
  }
}
