import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  WishlistItem,
  formatAmount,
  getRemainingAfterContribution,
  getSuggestedAmounts,
} from './event-ui.utils';

@Component({
  selector: 'app-event-contribution-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" *ngIf="show" (click)="closeIfAllowed()"></div>

    <div class="modal-wrap" *ngIf="show && item" (click)="closeIfAllowed()">
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-header-left">
            <div class="modal-eyebrow">Contribuer</div>
            <div class="modal-title">{{ item.name }}</div>
          </div>
          <button class="btn-close" (click)="closeIfAllowed()" [disabled]="contributionLoading">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- État financier de l'item -->
        <div class="item-status-bar">
          <div class="status-bar-left">
            <div class="status-collected">{{ formatAmount(item.fundedAmount) }}</div>
            <div class="status-label">collectés</div>
          </div>
          <div class="status-bar-center">
            <div class="status-track">
              <div class="status-fill" [style.width]="getPercent() + '%'" [class.fill-green]="item.fundingStatus === 'FUNDED'"></div>
            </div>
            <div class="status-pct">{{ getPercent() }}%</div>
          </div>
          <div class="status-bar-right">
            <div class="status-remaining">{{ formatAmount(item.remainingAmount) }}</div>
            <div class="status-label">restants</div>
          </div>
        </div>

        <!-- Erreur -->
        <div class="alert-error" *ngIf="contributionError">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          {{ contributionError }}
        </div>

        <div class="modal-body">

          <!-- Montants suggérés -->
          <div class="field-group" *ngIf="getSuggestedAmounts(item).length > 0">
            <div class="field-label">Montant rapide</div>
            <div class="suggested-grid">
              <button
                *ngFor="let amt of getSuggestedAmounts(item)"
                class="chip-amount"
                [class.active]="contributionAmount === amt"
                (click)="contributionAmountChange.emit(amt)"
                type="button"
              >
                {{ formatAmount(amt) }}
              </button>
            </div>
          </div>

          <!-- Montant libre -->
          <div class="field-group">
            <div class="field-label">
              Ou saisissez votre montant
              <span class="field-hint">Max conseillé : {{ formatAmount(item.remainingAmount) }}</span>
            </div>
            <div class="amount-input-wrap">
              <input
                type="number"
                class="amount-input"
                [ngModel]="contributionAmount"
                (ngModelChange)="contributionAmountChange.emit($event)"
                min="1"
                placeholder="Ex : 15 000"
              />
              <span class="amount-currency">XOF</span>
            </div>
            <!-- Preview reste après contribution -->
            <div class="amount-preview" *ngIf="contributionAmount && contributionAmount > 0">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 2l2 6h6l-5 3.5 2 6L10 14l-5 3.5 2-6L2 8h6L10 2z" stroke="currentColor" stroke-width="1.3"/></svg>
              Reste après votre contribution : <strong>{{ formatAmount(getRemaining()) }}</strong>
            </div>
          </div>

          <!-- Message -->
          <div class="field-group">
            <div class="field-label">Message <span class="field-optional">— optionnel</span></div>
            <textarea
              class="message-input"
              rows="3"
              [ngModel]="contributionMessage"
              (ngModelChange)="contributionMessageChange.emit($event)"
              placeholder="Un petit mot pour les organisateurs..."
              maxlength="255"
            ></textarea>
            <div class="char-count">{{ contributionMessage.length }}/255</div>
          </div>

          <!-- Anonyme -->
          <label class="anon-row">
            <div class="anon-toggle" [class.toggled]="contributionAnonymous" (click)="contributionAnonymousChange.emit(!contributionAnonymous)">
              <div class="toggle-knob"></div>
            </div>
            <div class="anon-text">
              <div class="anon-title">Contribuer anonymement</div>
              <div class="anon-desc">Votre nom ne sera pas visible par les autres participants</div>
            </div>
          </label>

          <!-- Récap -->
          <div class="recap-card">
            <div class="recap-row">
              <span>Item</span>
              <strong>{{ item.name }}</strong>
            </div>
            <div class="recap-row recap-amount">
              <span>Votre contribution</span>
              <strong class="recap-amount-val">{{ formatAmount(contributionAmount) }}</strong>
            </div>
            <div class="recap-row" *ngIf="contributionMessage.trim()">
              <span>Message</span>
              <strong class="recap-msg">{{ contributionMessage }}</strong>
            </div>
            <div class="recap-row">
              <span>Visibilité</span>
              <strong>{{ contributionAnonymous ? 'Anonyme 🔒' : 'Visible 👁' }}</strong>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-cancel" [disabled]="contributionLoading" (click)="closeIfAllowed()">
            Annuler
          </button>
          <button
            class="btn-submit"
            [disabled]="contributionLoading || !contributionAmount || contributionAmount <= 0"
            (click)="submitIfValid(item.id)"
          >
            <span *ngIf="!contributionLoading">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Confirmer la contribution
            </span>
            <span *ngIf="contributionLoading" class="loading-dots">
              <span></span><span></span><span></span>
            </span>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 399; }

    .modal-wrap {
      position: fixed; inset: 0; z-index: 400;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }

    .modal {
      background: white; border-radius: 24px; width: min(520px, 100%);
      max-height: 90vh; display: flex; flex-direction: column;
      box-shadow: 0 24px 80px rgba(0,0,0,0.25);
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    /* Header */
    .modal-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 24px 24px 16px; border-bottom: 1px solid #f3f4f6; flex-shrink: 0;
    }
    .modal-eyebrow { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #FFD700; margin-bottom: 4px; }
    .modal-title { font-size: 1.1rem; font-weight: 900; color: #111; line-height: 1.2; max-width: 340px; }
    .btn-close { width: 36px; height: 36px; border: 0; background: #f3f4f6; border-radius: 8px; cursor: pointer; color: #6b7280; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .btn-close:hover:not(:disabled) { background: #e5e7eb; }

    /* Status bar */
    .item-status-bar {
      display: flex; align-items: center; gap: 16px; padding: 16px 24px;
      background: #f9fafb; border-bottom: 1px solid #f3f4f6; flex-shrink: 0;
    }
    .status-bar-left, .status-bar-right { flex-shrink: 0; text-align: center; }
    .status-bar-left { text-align: left; }
    .status-bar-right { text-align: right; }
    .status-collected, .status-remaining { font-size: 0.95rem; font-weight: 800; color: #111; }
    .status-label { font-size: 0.7rem; color: #9ca3af; font-weight: 500; margin-top: 1px; }
    .status-bar-center { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .status-track { height: 5px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .status-fill { height: 100%; background: #FFD700; border-radius: 999px; transition: width 0.3s; }
    .fill-green { background: #22c55e; }
    .status-pct { font-size: 0.72rem; font-weight: 700; color: #6b7280; text-align: center; }

    /* Erreur */
    .alert-error { display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: #fef2f2; color: #991b1b; font-size: 0.85rem; border-bottom: 1px solid #fecaca; flex-shrink: 0; }

    /* Body scrollable */
    .modal-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }

    .field-group { display: flex; flex-direction: column; gap: 8px; }
    .field-label { font-size: 0.82rem; font-weight: 700; color: #374151; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px; }
    .field-hint { font-size: 0.75rem; font-weight: 500; color: #9ca3af; }
    .field-optional { font-weight: 500; color: #9ca3af; }

    /* Chips montants */
    .suggested-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .chip-amount {
      padding: 10px 4px; border: 1.5px solid #e5e7eb; border-radius: 10px;
      background: white; font: inherit; font-size: 0.78rem; font-weight: 700;
      color: #374151; cursor: pointer; transition: 0.15s; text-align: center;
    }
    .chip-amount:hover { border-color: #111; color: #111; }
    .chip-amount.active { background: #111; border-color: #111; color: white; }

    /* Input montant */
    .amount-input-wrap { position: relative; }
    .amount-input {
      width: 100%; box-sizing: border-box; padding: 13px 52px 13px 16px;
      border: 1.5px solid #e5e7eb; border-radius: 12px; font: inherit;
      font-size: 1rem; font-weight: 700; color: #111; outline: 0; transition: 0.2s;
    }
    .amount-input:focus { border-color: #111; }
    .amount-currency { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 0.78rem; font-weight: 700; color: #9ca3af; }
    .amount-preview { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #6b7280; margin-top: 2px; }
    .amount-preview strong { color: #111; }

    /* Textarea */
    .message-input {
      width: 100%; box-sizing: border-box; padding: 12px 14px;
      border: 1.5px solid #e5e7eb; border-radius: 12px; font: inherit;
      font-size: 0.9rem; resize: vertical; outline: 0; transition: 0.2s;
    }
    .message-input:focus { border-color: #111; }
    .char-count { font-size: 0.72rem; color: #9ca3af; text-align: right; }

    /* Toggle anonyme */
    .anon-row { display: flex; align-items: center; gap: 14px; cursor: pointer; user-select: none; }
    .anon-toggle { width: 40px; height: 22px; border-radius: 999px; background: #e5e7eb; position: relative; transition: background 0.2s; flex-shrink: 0; }
    .anon-toggle.toggled { background: #111; }
    .toggle-knob { width: 16px; height: 16px; border-radius: 50%; background: white; position: absolute; top: 3px; left: 3px; transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    .anon-toggle.toggled .toggle-knob { transform: translateX(18px); }
    .anon-title { font-size: 0.88rem; font-weight: 700; color: #111; }
    .anon-desc { font-size: 0.75rem; color: #9ca3af; margin-top: 1px; }

    /* Récap */
    .recap-card {
      background: #f9fafb; border: 1.5px solid #f3f4f6; border-radius: 14px;
      padding: 16px; display: flex; flex-direction: column; gap: 10px;
    }
    .recap-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; font-size: 0.85rem; color: #6b7280; }
    .recap-row strong { color: #111; font-weight: 700; text-align: right; }
    .recap-amount { padding-top: 10px; border-top: 1px solid #f3f4f6; }
    .recap-amount-val { font-size: 1.1rem; font-weight: 900; color: #111; }
    .recap-msg { max-width: 240px; text-align: right; word-break: break-word; line-height: 1.4; }

    /* Footer */
    .modal-footer {
      display: flex; gap: 10px; padding: 16px 24px;
      border-top: 1px solid #f3f4f6; flex-shrink: 0; background: white; border-radius: 0 0 24px 24px;
    }
    .btn-cancel {
      padding: 12px 20px; border: 1.5px solid #e5e7eb; border-radius: 12px;
      background: white; color: #6b7280; font: inherit; font-size: 0.88rem; font-weight: 700;
      cursor: pointer; transition: 0.2s;
    }
    .btn-cancel:hover:not(:disabled) { border-color: #111; color: #111; }
    .btn-cancel:disabled { opacity: 0.5; }
    .btn-submit {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 13px 20px; border: 0; border-radius: 12px;
      background: #FFD700; color: #000; font: inherit; font-size: 0.9rem; font-weight: 800;
      cursor: pointer; transition: 0.2s;
    }
    .btn-submit:hover:not(:disabled) { background: #FFC000; }
    .btn-submit:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
    .loading-dots { display: flex; gap: 5px; }
    .loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: #9ca3af; animation: bounce 1.2s infinite; }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,80%,100%{transform:scale(0.7);opacity:0.5}40%{transform:scale(1.1);opacity:1} }
  `],
})
export class EventContributionModalComponent {
  @Input() show = false;
  @Input() item: WishlistItem | null = null;
  @Input() contributionAmount: number | null = null;
  @Input() contributionMessage = '';
  @Input() contributionAnonymous = false;
  @Input() contributionLoading = false;
  @Input() contributionError = '';

  @Output() close = new EventEmitter<void>();
  @Output() contributionAmountChange = new EventEmitter<number | null>();
  @Output() contributionMessageChange = new EventEmitter<string>();
  @Output() contributionAnonymousChange = new EventEmitter<boolean>();
  @Output() submit = new EventEmitter<number>();

  readonly formatAmount = formatAmount;
  readonly getSuggestedAmounts = getSuggestedAmounts;

  closeIfAllowed(): void {
    if (this.contributionLoading) return;
    this.close.emit();
  }

  submitIfValid(itemId: number): void {
    if (!this.contributionAmount || this.contributionAmount <= 0) return;
    this.submit.emit(itemId);
  }

  getPercent(): number {
    const item = this.item;
    if (!item || !item.targetAmount) return 0;
    return Math.min(100, Math.round((item.fundedAmount / item.targetAmount) * 100));
  }

  getRemaining(): number {
    return getRemainingAfterContribution(this.item!, this.contributionAmount);
  }
}