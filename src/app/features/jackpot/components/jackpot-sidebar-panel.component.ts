import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Jackpot } from '../models/jackpot.model';

@Component({
  selector: 'app-jackpot-sidebar-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (jackpot?.status === 'APPROVED') {
      <div class="cta-card">
        <div class="cta-head">
          <div class="cta-title">Contribuer à cette cagnotte</div>
          <p class="cta-desc">Votre contribution est directement ajoutée au pot commun.</p>
        </div>
        <div class="quick-grid">
          @for (amt of quickAmounts; track amt) {
            <button class="quick-chip" (click)="contributeRequested.emit(amt)">
              {{ amt | number:'1.0-0' }}
            </button>
          }
        </div>
        <button class="btn-contribute" (click)="contributeRequested.emit(null)">
          <lucide-icon name="plus" [size]="16" color="currentColor" [strokeWidth]="2" />
          Contribuer maintenant
        </button>
        <div class="cta-security">
          <lucide-icon name="shield" [size]="12" color="currentColor" [strokeWidth]="1.8" />
          {{ jackpot?.currencyCode }} · Paiement sécurisé
        </div>
      </div>
    }

    <div class="share-card">
      <div class="share-title">Partager cette cagnotte</div>
      <div class="share-link-row">
        <input class="share-input" [value]="shareUrl" readonly />
        <button class="btn-copy" (click)="copyLink()">
          @if (copied()) {
            <lucide-icon name="check" [size]="14" color="currentColor" [strokeWidth]="2" />
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

    <div class="info-card">
      <div class="info-row">
        <span class="info-lbl">Créé le</span>
        <span class="info-val">{{ jackpot?.createdAt | date:'dd MMM yyyy' }}</span>
      </div>
      @if (categoryMeta) {
        <div class="info-row">
          <span class="info-lbl">Catégorie</span>
          <span class="info-val">{{ categoryMeta.emoji }} {{ categoryMeta.label }}</span>
        </div>
      }
      @if (jackpot?.deadlineAt) {
        <div class="info-row">
          <span class="info-lbl">Date limite</span>
          <span class="info-val">{{ jackpot?.deadlineAt | date:'dd MMM yyyy' }}</span>
        </div>
      }
      <div class="info-row">
        <span class="info-lbl">Visibilité</span>
        <span class="info-val">{{ jackpot?.visibility === 'PUBLIC' ? '🌍 Publique' : '🔒 Privée' }}</span>
      </div>
    </div>

    @if (isOwner && jackpot?.status === 'APPROVED') {
      <div class="owner-panel">
        <div class="owner-panel-header">
          <lucide-icon name="shield" [size]="14" color="currentColor" [strokeWidth]="1.8" />
          Gestion de la cagnotte
        </div>
        <p class="owner-panel-hint">Vous êtes le propriétaire de cette cagnotte.</p>
        <button class="btn-close-jack" (click)="closeRequested.emit()">
          🔒 Clôturer la cagnotte
        </button>
      </div>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 16px; }
    .cta-card {
      background: #111; border-radius: 20px; padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .cta-head { display: flex; flex-direction: column; gap: 6px; }
    .cta-title { font-size: 1rem; font-weight: 900; color: white; }
    .cta-desc { font-size: 0.82rem; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.55; }
    .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .quick-chip {
      padding: 10px 4px; background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px;
      color: rgba(255,255,255,0.7); font: inherit; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; text-align: center; transition: 0.15s;
    }
    .quick-chip:hover { background: #ffd700; border-color: #ffd700; color: #000; }
    .btn-contribute {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 15px; border: 0; border-radius: 12px; background: #ffd700; color: #000;
      font: inherit; font-size: 1rem; font-weight: 800; cursor: pointer;
      transition: 0.2s; width: 100%;
    }
    .btn-contribute:hover { background: #ffc000; transform: translateY(-1px); }
    .cta-security {
      display: flex; align-items: center; justify-content: center; gap: 5px;
      font-size: 0.72rem; color: rgba(255,255,255,0.25);
    }
    .share-card {
      background: white; border: 1.5px solid #f0f1f3; border-radius: 16px;
      padding: 18px 20px; display: flex; flex-direction: column; gap: 12px;
    }
    .share-title { font-size: 0.84rem; font-weight: 800; color: #374151; }
    .share-link-row { display: flex; gap: 8px; }
    .share-input {
      flex: 1; padding: 9px 12px; border: 1.5px solid #e5e7eb; border-radius: 9px;
      font-family: monospace; font-size: 0.72rem; color: #6b7280; background: #f9fafb;
      outline: 0; min-width: 0;
    }
    .btn-copy {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 9px 14px; border: 0; border-radius: 9px; background: #111; color: white;
      font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: 0.15s; flex-shrink: 0;
    }
    .btn-copy:hover { background: #222; }
    .share-socials { display: flex; gap: 8px; }
    .social-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 8px 14px; border-radius: 9px; font: inherit; font-size: 0.78rem; font-weight: 700;
      text-decoration: none; cursor: pointer; transition: 0.15s;
    }
    .whatsapp { background: #25d366; color: white; }
    .whatsapp:hover { background: #1fba57; }
    .owner-panel {
      background: #fff8f8; border: 1.5px solid #fecaca; border-radius: 16px;
      padding: 18px 20px; display: flex; flex-direction: column; gap: 10px;
    }
    .owner-panel-header {
      display: flex; align-items: center; gap: 7px;
      font-size: 0.8rem; font-weight: 800; color: #374151;
    }
    .owner-panel-header svg { color: #9ca3af; flex-shrink: 0; }
    .owner-panel-hint { margin: 0; font-size: 0.75rem; color: #9ca3af; line-height: 1.5; }
    .btn-close-jack {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 10px 16px; border-radius: 10px;
      border: 1.5px solid #fecaca; background: white;
      font: inherit; font-size: 0.85rem; font-weight: 700; color: #dc2626;
      cursor: pointer; transition: 0.15s;
    }
    .btn-close-jack:hover { background: #fef2f2; border-color: #f87171; }
    .info-card {
      background: white; border: 1.5px solid #f0f1f3; border-radius: 16px;
      padding: 16px 20px; display: flex; flex-direction: column;
    }
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 0; font-size: 0.8rem; border-bottom: 1px solid #f9fafb;
    }
    .info-row:last-child { border-bottom: 0; }
    .info-lbl { color: #9ca3af; font-weight: 600; }
    .info-val { color: #111; font-weight: 700; }
    @media (max-width: 480px) {
      .quick-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class JackpotSidebarPanelComponent {
  @Input() jackpot: Jackpot | null = null;
  @Input() categoryMeta: { emoji: string; label: string } | null = null;
  @Input() quickAmounts: number[] = [];
  @Input() shareUrl = '';
  @Input() isOwner = false;

  @Output() contributeRequested = new EventEmitter<number | null>();
  @Output() closeRequested = new EventEmitter<void>();

  readonly copied = signal(false);

  copyLink(): void {
    if (!this.shareUrl) return;
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  whatsappUrl(): string {
    const title = this.jackpot?.title ?? 'cette cagnotte';
    const text = encodeURIComponent(`Je soutiens "${title}" — rejoignez-moi ! ${this.shareUrl}`);
    return `https://wa.me/?text=${text}`;
  }
}
