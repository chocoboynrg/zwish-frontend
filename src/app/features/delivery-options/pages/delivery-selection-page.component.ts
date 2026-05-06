import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeliveryOptionsService } from '../services/delivery-options.service';
import { PaymentsService } from '../../payments/services/payments.service';
import {
  CatalogDeliveryOption,
  DeliverySelection,
  DELIVERY_OPTION_TYPE_LABELS,
} from '../models/delivery-option.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-delivery-selection-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-wrap">
      <div class="page-inner">
        <a routerLink="/app" class="back-link">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Mon espace
        </a>

        <div class="page-header">
          <h1>Options de livraison</h1>
          <p class="subtitle">Personnalisez la livraison de votre cadeau</p>
        </div>

        @if (loading()) {
          <div class="spinner-wrap"><div class="spinner"></div></div>
        } @else if (existingSelection()) {
          <div class="already-done">
            @if (existingSelection()!.status === 'CONFIRMED') {
              <div class="done-icon">✅</div>
              <h2>Options confirmées</h2>
              <p>Vos options de livraison ont été sélectionnées et confirmées.</p>
              @if (existingSelection()!.items.length > 0) {
                <div class="selection-summary">
                  @for (item of existingSelection()!.items; track item.id) {
                    <div class="summary-row">
                      <span>{{ item.label }}</span>
                      <span>{{ item.price === 0 ? 'Gratuit' : (item.price | number:'1.0-0') + ' XOF' }}</span>
                    </div>
                    @if (item.textValue) {
                      <div class="summary-text">"{{ item.textValue }}"</div>
                    }
                  }
                  @if (existingSelection()!.totalExtraCost > 0) {
                    <div class="summary-total">
                      Total extra: {{ existingSelection()!.totalExtraCost | number:'1.0-0' }} {{ existingSelection()!.currencyCode }}
                    </div>
                  }
                </div>
              }
            } @else if (existingSelection()!.status === 'SKIPPED') {
              <div class="done-icon">⏭</div>
              <h2>Options ignorées</h2>
              <p>Vous avez choisi de ne pas sélectionner d'options de livraison.</p>
            } @else if (existingSelection()!.status === 'PENDING_PAYMENT') {
              <div class="done-icon">💳</div>
              <h2>En attente de paiement</h2>
              <p>Votre sélection est en attente de paiement.</p>
              <button class="btn-primary" (click)="goToPayment()">
                Finaliser le paiement ({{ existingSelection()!.totalExtraCost | number:'1.0-0' }} {{ existingSelection()!.currencyCode }})
              </button>
            }
          </div>
        } @else if (availableOptions().length === 0) {
          <div class="empty-state">
            <p>Aucune option de livraison disponible pour cet article.</p>
            <a routerLink="/app" class="btn-secondary">Retour</a>
          </div>
        } @else {
          <div class="selection-area">
            <p class="intro">Sélectionnez les options que vous souhaitez ajouter :</p>

            <div class="options-list">
              @for (opt of availableOptions(); track opt.id) {
                <div class="option-row" [class.selected]="isSelected(opt.id)" (click)="toggleOption(opt)">
                  <div class="option-check">
                    <div class="checkbox" [class.checked]="isSelected(opt.id)">
                      @if (isSelected(opt.id)) {
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      }
                    </div>
                  </div>
                  <div class="option-content">
                    <div class="option-top">
                      <span class="option-label">{{ opt.label }}</span>
                      <span class="option-price" [class.free]="opt.price === 0">
                        {{ opt.price === 0 ? 'Gratuit' : '+' + (opt.price | number:'1.0-0') + ' ' + opt.currencyCode }}
                      </span>
                    </div>
                    @if (opt.description) {
                      <div class="option-desc">{{ opt.description }}</div>
                    }
                    <div class="option-type">{{ typeLabel(opt.type) }}</div>

                    @if (opt.hasTextInput && isSelected(opt.id)) {
                      <div class="text-input-wrap" (click)="$event.stopPropagation()">
                        <input
                          type="text"
                          class="text-field"
                          [placeholder]="opt.textInputPlaceholder || 'Votre texte...'"
                          [ngModel]="getTextValue(opt.id)"
                          (ngModelChange)="setTextValue(opt.id, $event)"
                          maxlength="300"
                        />
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="cost-summary" [class.has-cost]="totalCost() > 0">
              <div class="cost-row">
                <span>{{ selectedOptionIds().length }} option(s) sélectionnée(s)</span>
                <span class="cost-total">
                  {{ totalCost() === 0 ? 'Gratuit' : '+' + (totalCost() | number:'1.0-0') + ' XOF' }}
                </span>
              </div>
            </div>

            <div class="actions">
              <button class="btn-skip" (click)="skipOptions()" [disabled]="submitting()">
                Ignorer les options
              </button>
              <button
                class="btn-primary"
                (click)="confirmSelection()"
                [disabled]="submitting() || selectedOptionIds().length === 0"
              >
                @if (submitting()) {
                  Envoi...
                } @else if (totalCost() > 0) {
                  Confirmer et payer ({{ totalCost() | number:'1.0-0' }} XOF)
                } @else {
                  Confirmer la sélection
                }
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Payment modal -->
    @if (showPaymentModal()) {
      <div class="modal-overlay" (click)="closePaymentModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Paiement des options</h2>
            <button class="btn-close" (click)="closePaymentModal()">✕</button>
          </div>
          <div class="modal-body">
            <p>Montant à payer : <strong>{{ pendingPaymentAmount() | number:'1.0-0' }} XOF</strong></p>
            <div class="field">
              <label>Moyen de paiement</label>
              <select [(ngModel)]="paymentMethod">
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Carte bancaire</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closePaymentModal()">Annuler</button>
            <button class="btn-primary" (click)="initiatePayment()" [disabled]="paymentLoading()">
              {{ paymentLoading() ? 'Traitement...' : 'Payer maintenant' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-wrap { min-height: 100vh; background: #f8fafc; padding: 24px 16px 60px; }
    .page-inner { max-width: 640px; margin: 0 auto; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: #6366f1; font-size: 0.88rem; font-weight: 600; text-decoration: none; margin-bottom: 24px; }
    .back-link:hover { text-decoration: underline; }
    .page-header { margin-bottom: 28px; }
    h1 { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0 0 6px; }
    .subtitle { color: #64748b; margin: 0; }

    .spinner-wrap { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .already-done { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 40px 32px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .done-icon { font-size: 3rem; }
    .already-done h2 { font-size: 1.3rem; font-weight: 800; margin: 0; color: #1e293b; }
    .already-done p { color: #64748b; margin: 0; }

    .selection-summary { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; width: 100%; text-align: left; margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 600; color: #374151; }
    .summary-text { font-size: 0.85rem; color: #64748b; font-style: italic; padding-left: 8px; }
    .summary-total { font-weight: 800; font-size: 1rem; color: #6366f1; border-top: 1px solid #e5e7eb; padding-top: 8px; text-align: right; }

    .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }

    .selection-area { display: flex; flex-direction: column; gap: 20px; }
    .intro { color: #64748b; font-size: 0.95rem; margin: 0; }

    .options-list { display: flex; flex-direction: column; gap: 10px; }
    .option-row { display: flex; gap: 14px; background: white; border: 2px solid #e5e7eb; border-radius: 14px; padding: 18px; cursor: pointer; transition: 0.15s; }
    .option-row:hover { border-color: #a5b4fc; }
    .option-row.selected { border-color: #6366f1; background: #fafafe; }

    .option-check { flex-shrink: 0; padding-top: 2px; }
    .checkbox { width: 22px; height: 22px; border: 2px solid #d1d5db; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: 0.15s; }
    .checkbox.checked { background: #6366f1; border-color: #6366f1; }

    .option-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .option-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .option-label { font-weight: 700; font-size: 0.97rem; color: #1e293b; }
    .option-price { font-weight: 700; font-size: 0.9rem; color: #16a34a; white-space: nowrap; }
    .option-price.free { color: #94a3b8; }
    .option-desc { font-size: 0.85rem; color: #64748b; line-height: 1.4; }
    .option-type { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

    .text-input-wrap { margin-top: 10px; }
    .text-field { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 0.9rem; font-family: inherit; outline: none; box-sizing: border-box; }
    .text-field:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

    .cost-summary { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; }
    .cost-summary.has-cost { background: #eff6ff; border-color: #bfdbfe; }
    .cost-row { display: flex; justify-content: space-between; align-items: center; }
    .cost-total { font-weight: 800; font-size: 1rem; color: #6366f1; }

    .actions { display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap; }
    .btn-primary { background: #6366f1; color: white; border: 0; padding: 11px 24px; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: 0.15s; }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: white; color: #374151; border: 1px solid #e5e7eb; padding: 10px 20px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-skip { background: none; color: #94a3b8; border: 0; padding: 10px 16px; font-size: 0.9rem; cursor: pointer; text-decoration: underline; }
    .btn-skip:hover { color: #64748b; }

    /* Payment modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal { background: white; border-radius: 16px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 28px 16px; border-bottom: 1px solid #f1f5f9; }
    .modal-header h2 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
    .btn-close { background: none; border: 0; font-size: 1.1rem; cursor: pointer; color: #94a3b8; }
    .modal-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer { padding: 16px 28px 24px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #f1f5f9; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .field select { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.9rem; font-family: inherit; outline: none; }
  `],
})
export class DeliverySelectionPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly deliverySvc = inject(DeliveryOptionsService);
  private readonly paymentsSvc = inject(PaymentsService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly showPaymentModal = signal(false);
  readonly paymentLoading = signal(false);

  readonly availableOptions = signal<CatalogDeliveryOption[]>([]);
  readonly existingSelection = signal<DeliverySelection | null>(null);
  readonly selectedOptionIds = signal<number[]>([]);
  readonly pendingPaymentAmount = signal(0);

  private readonly textValues = signal<Record<number, string>>({});
  private wishlistItemId = 0;
  paymentMethod = 'MOBILE_MONEY';

  readonly totalCost = computed(() => {
    const opts = this.availableOptions();
    const selected = this.selectedOptionIds();
    return opts
      .filter((o) => selected.includes(o.id))
      .reduce((sum, o) => sum + Number(o.price), 0);
  });

  ngOnInit(): void {
    this.wishlistItemId = Number(this.route.snapshot.paramMap.get('wishlistItemId'));
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.deliverySvc.getItemOptions(this.wishlistItemId).subscribe({
      next: ({ allOptions, enabledOptionIds }) => {
        const enabled = allOptions.filter((o) => enabledOptionIds.includes(o.id) && o.isActive);
        this.availableOptions.set(enabled);
        this.loadSelection();
      },
      error: () => {
        this.toast.error('Erreur chargement des options');
        this.loading.set(false);
      },
    });
  }

  private loadSelection(): void {
    this.deliverySvc.getSelection(this.wishlistItemId).subscribe({
      next: (sel) => {
        this.existingSelection.set(sel);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  typeLabel(type: string): string {
    return DELIVERY_OPTION_TYPE_LABELS[type as keyof typeof DELIVERY_OPTION_TYPE_LABELS] ?? type;
  }

  isSelected(optionId: number): boolean {
    return this.selectedOptionIds().includes(optionId);
  }

  toggleOption(opt: CatalogDeliveryOption): void {
    const current = this.selectedOptionIds();
    if (current.includes(opt.id)) {
      this.selectedOptionIds.set(current.filter((id) => id !== opt.id));
    } else {
      this.selectedOptionIds.set([...current, opt.id]);
    }
  }

  getTextValue(optionId: number): string {
    return this.textValues()[optionId] ?? '';
  }

  setTextValue(optionId: number, value: string): void {
    this.textValues.update((tv) => ({ ...tv, [optionId]: value }));
  }

  confirmSelection(): void {
    const selected = this.selectedOptionIds();
    if (selected.length === 0) return;

    this.submitting.set(true);
    const tv = this.textValues();
    const textVals: Record<number, string> = {};
    for (const id of selected) {
      if (tv[id]) textVals[id] = tv[id];
    }

    this.deliverySvc.createSelection(this.wishlistItemId, selected, textVals).subscribe({
      next: (sel) => {
        this.submitting.set(false);
        if (sel.status === 'CONFIRMED') {
          this.toast.success('Options confirmées !');
          this.existingSelection.set(sel);
        } else if (sel.status === 'PENDING_PAYMENT') {
          this.existingSelection.set(sel);
          this.pendingPaymentAmount.set(Number(sel.totalExtraCost));
          this.showPaymentModal.set(true);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err?.error?.message ?? 'Erreur lors de la sélection');
      },
    });
  }

  skipOptions(): void {
    this.submitting.set(true);
    this.deliverySvc.skipSelection(this.wishlistItemId).subscribe({
      next: (sel) => {
        this.submitting.set(false);
        this.existingSelection.set(sel);
        this.toast.success('Options ignorées');
      },
      error: () => { this.submitting.set(false); this.toast.error('Erreur'); },
    });
  }

  goToPayment(): void {
    this.pendingPaymentAmount.set(Number(this.existingSelection()?.totalExtraCost ?? 0));
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
  }

  initiatePayment(): void {
    const sel = this.existingSelection();
    if (!sel) return;
    this.paymentLoading.set(true);

    this.paymentsSvc.initDeliveryPayment(sel.id, 'MOCK', this.paymentMethod).subscribe({
      next: (payment) => {
        this.paymentLoading.set(false);
        this.closePaymentModal();
        if (payment.paymentUrl) {
          window.location.href = payment.paymentUrl;
        } else {
          this.toast.success('Paiement initié');
          this.router.navigate(['/app/payments', payment.id]);
        }
      },
      error: (err) => {
        this.paymentLoading.set(false);
        this.toast.error(err?.error?.message ?? 'Erreur lors du paiement');
      },
    });
  }
}
