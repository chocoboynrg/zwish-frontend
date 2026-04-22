import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserEventView } from '../../../events/services/events.service';
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
    <div class="modal-backdrop" *ngIf="show" (click)="closeIfAllowed()"></div>

    <section class="request-modal contribution-modal" *ngIf="show && item">
      <div class="request-modal-card contribution-modal-card contribution-modal-card-compact" (click)="$event.stopPropagation()">
        <div class="request-modal-header contribution-modal-header">
          <div>
            <div class="section-kicker">Contribution</div>
            <h2>{{ item.name }}</h2>
            <p class="section-description">
              Reste à financer : <strong>{{ formatAmount(item.remainingAmount) }}</strong>
            </p>
          </div>

          <button
            type="button"
            class="modal-close-btn"
            (click)="closeIfAllowed()"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div *ngIf="contributionError" class="state-card error compact-state">
          {{ contributionError }}
        </div>

        <div class="contribution-modal-main contribution-modal-main-compact">
          <div class="step-panel">
            <h3 class="step-title">Choisissez votre contribution</h3>
            <p class="step-text">
              Sélectionnez un montant rapide ou saisissez votre propre montant.
            </p>

            <div class="suggested-amounts" *ngIf="getSuggestedAmounts(item).length > 0">
              <button
                type="button"
                class="suggested-chip"
                *ngFor="let amount of getSuggestedAmounts(item)"
                [class.active]="contributionAmount === amount"
                (click)="contributionAmountChange.emit(amount)"
              >
                {{ formatAmount(amount) }}
              </button>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Montant</label>
                <input
                  type="number"
                  min="1"
                  [ngModel]="contributionAmount"
                  (ngModelChange)="contributionAmountChange.emit($event)"
                />
                <small>
                  Min : 1 XOF · Max conseillé : {{ formatAmount(item.remainingAmount) }}
                </small>
              </div>

              <div class="form-group full">
                <label>Message</label>
                <textarea
                  rows="4"
                  [ngModel]="contributionMessage"
                  (ngModelChange)="contributionMessageChange.emit($event)"
                  placeholder="Ajoutez un petit mot pour l’organisateur..."
                ></textarea>
              </div>
            </div>

            <label class="checkbox-row">
              <input
                type="checkbox"
                [ngModel]="contributionAnonymous"
                (ngModelChange)="contributionAnonymousChange.emit($event)"
              />
              Contribuer anonymement
            </label>

            <div class="contribution-summary-card">
              <div class="summary-line">
                <span>Item</span>
                <strong>{{ item.name }}</strong>
              </div>
              <div class="summary-line">
                <span>Montant choisi</span>
                <strong>{{ formatAmount(contributionAmount) }}</strong>
              </div>
              <div class="summary-line">
                <span>Visibilité</span>
                <strong>{{ contributionAnonymous ? 'Anonyme' : 'Visible' }}</strong>
              </div>
              <div class="summary-line">
                <span>Reste avant contribution</span>
                <strong>{{ formatAmount(item.remainingAmount) }}</strong>
              </div>
              <div class="summary-line muted-line">
                <span>Reste après votre contribution</span>
                <strong>{{ formatAmount(getRemainingAfterContribution(item)) }}</strong>
              </div>
              <div class="summary-line" *ngIf="contributionMessage?.trim()">
                <span>Message</span>
                <strong class="summary-message">{{ contributionMessage }}</strong>
              </div>
            </div>

            <div class="form-actions contribution-actions">
              <button
                type="button"
                class="btn btn-secondary"
                [disabled]="contributionLoading"
                (click)="closeIfAllowed()"
              >
                Annuler
              </button>

              <button
                type="button"
                class="btn btn-primary btn-amazon"
                [disabled]="contributionLoading"
                (click)="submitIfValid(item.id)"
              >
                {{ contributionLoading ? 'Envoi...' : 'Payer maintenant' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.45);
      z-index: 80;
    }

    .request-modal {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 16px;
      z-index: 90;
    }

    .request-modal-card {
      width: min(620px, 100%);
      max-height: min(88vh, 900px);
      overflow: auto;
      padding: 22px;
      background: #ffffff;
      border: 1px solid #f3e8e2;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .request-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }

    .section-kicker {
      color: #ea580c;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .section-description {
      margin: 0;
      color: #4b5563;
      line-height: 1.7;
    }

    .modal-close-btn {
      width: 42px;
      height: 42px;
      border: none;
      border-radius: 12px;
      background: #f3f4f6;
      cursor: pointer;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .compact-state {
      padding: 14px 16px;
      margin-bottom: 12px;
      border-radius: 16px;
    }

    .state-card.error {
      color: #b91c1c;
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .step-title {
      margin: 0 0 6px;
      font-size: 1.08rem;
      color: #111827;
    }

    .step-text {
      margin: 0 0 16px;
      color: #6b7280;
      line-height: 1.6;
    }

    .suggested-amounts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }

    .suggested-chip {
      border: 1px solid #f3dfd4;
      background: #ffffff;
      color: #7c2d12;
      border-radius: 999px;
      padding: 10px 14px;
      cursor: pointer;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 700;
    }

    .suggested-chip.active {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: #ffffff;
      border-color: transparent;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .form-grid .full {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #e5d7cf;
      border-radius: 14px;
      padding: 11px 13px;
      font: inherit;
      background: white;
      color: #111827;
    }

    .form-group small {
      color: #6b7280;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      color: #374151;
    }

    .contribution-summary-card {
      margin-top: 4px;
      margin-bottom: 14px;
      padding: 18px;
      border-radius: 16px;
      border: 1px solid #f3dfd4;
      background: linear-gradient(180deg, #fffaf7 0%, #ffffff 100%);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      color: #111827;
    }

    .summary-message {
      max-width: 280px;
      text-align: right;
      word-break: break-word;
      line-height: 1.5;
    }

    .muted-line {
      color: #6b7280;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }

    .contribution-actions {
      justify-content: space-between;
    }

    .btn {
      border: 0;
      border-radius: 14px;
      padding: 11px 16px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
    }

    .btn-secondary {
      background: #fff7f3;
      color: #9a3412;
      border: 1px solid #f3dfd4;
    }

    .btn-amazon {
      min-height: 46px;
      border-radius: 999px;
      padding: 12px 18px;
    }

    @media (max-width: 960px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .summary-line,
      .contribution-actions,
      .request-modal-header {
        flex-direction: column;
        align-items: stretch;
      }
    }
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

  closeIfAllowed(): void {
    if (this.contributionLoading) return;
    this.close.emit();
  }

  submitIfValid(itemId: number): void {
    if (!this.contributionAmount || this.contributionAmount <= 0) return;
    this.submit.emit(itemId);
  }

  readonly formatAmount = formatAmount;
  readonly getSuggestedAmounts = getSuggestedAmounts;

  getRemainingAfterContribution(item: WishlistItem): number {
    return getRemainingAfterContribution(item, this.contributionAmount);
  }
}