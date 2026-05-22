// src/app/features/jackpot/components/jackpot-request-modal.component.ts

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { JackpotService } from '../services/jackpot.service';
import { ToastService } from '../../../core/services/toast.service';
import { PURPOSE_CATEGORIES, SUGGESTED_AMOUNTS } from '../models/jackpot.model';

@Component({
  selector: 'app-jackpot-request-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    @if (show) {
      <div class="overlay" (click)="closeIfIdle()"></div>
    }

    @if (show) {
      <div class="modal-wrap" (click)="closeIfIdle()">
        <div class="modal" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div>
              <div class="modal-eyebrow">💰 Cagnotte</div>
              <div class="modal-title">Demander une jackpot</div>
            </div>
            <button class="btn-close" (click)="closeIfIdle()" [disabled]="loading()">
              <lucide-icon name="x" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            </button>
          </div>
          <!-- Info -->
          <div class="modal-info">
            <lucide-icon name="info" [size]="15" color="currentColor" [strokeWidth]="1.8" />
            Votre demande sera examinée par notre équipe sous 24h. Une fois validée, les invités de
            l'événement pourront contribuer librement.
          </div>
          <!-- Erreur -->
          @if (error()) {
            <div class="modal-error">{{ error() }}</div>
          }
          <!-- Stepper -->
          <div class="stepper">
            <div class="step" [class.active]="step() === 1" [class.done]="step() > 1">
              <div class="step-dot">{{ step() > 1 ? '✓' : '1' }}</div>
              <div class="step-label">Objectif</div>
            </div>
            <div class="step-line"></div>
            <div class="step" [class.active]="step() === 2" [class.done]="step() > 2">
              <div class="step-dot">{{ step() > 2 ? '✓' : '2' }}</div>
              <div class="step-label">Montant</div>
            </div>
            <div class="step-line"></div>
            <div class="step" [class.active]="step() === 3">
              <div class="step-dot">3</div>
              <div class="step-label">Détails</div>
            </div>
          </div>
          <form [formGroup]="form" class="modal-body" novalidate>
            <!-- ═══ ÉTAPE 1 : OBJECTIF ═══ -->
            @if (step() === 1) {
              <div class="step-body">
                <div class="step-title">Pour quel objectif cette jackpot ?</div>
                <!-- Visibilité -->
                <div class="field">
                  <label class="field-label">Visibilité</label>
                  <div class="visibility-toggle">
                    <button
                      type="button"
                      class="vis-btn"
                      [class.active]="form.get('visibility')?.value === 'PUBLIC'"
                      (click)="form.patchValue({ visibility: 'PUBLIC' })"
                    >
                      🌍 Public
                      <span class="vis-desc">Visible par tous, sans lien requis</span>
                    </button>
                    <button
                      type="button"
                      class="vis-btn"
                      [class.active]="form.get('visibility')?.value === 'PRIVATE'"
                      (click)="form.patchValue({ visibility: 'PRIVATE' })"
                    >
                      🔒 Privé
                      <span class="vis-desc">Accessible uniquement via lien</span>
                    </button>
                  </div>
                </div>
                <div class="purpose-grid">
                  @for (p of purposes; track p.value) {
                    <button
                      type="button"
                      class="purpose-btn"
                      [class.active]="form.get('purposeCategory')?.value === p.value"
                      (click)="form.patchValue({ purposeCategory: p.value })"
                    >
                      {{ p.label }}
                    </button>
                  }
                </div>
                <div class="field">
                  <label class="field-label">Titre de la jackpot <span class="req">*</span></label>
                  <input
                    type="text"
                    formControlName="title"
                    placeholder="Ex : Voyage de noces à Bali, Opération de Mamadou..."
                    [class.invalid]="isInvalid('title')"
                    maxlength="150"
                  />
                  <div class="field-footer">
                    @if (isInvalid('title')) {
                      <span class="field-err">Obligatoire.</span>
                    }
                    <span class="char-count">{{ form.get('title')?.value?.length ?? 0 }}/150</span>
                  </div>
                </div>
                <div class="field">
                  <label class="field-label"
                    >Description <span class="opt">— optionnel</span></label
                  >
                  <textarea
                    formControlName="description"
                    rows="3"
                    placeholder="Décrivez l'objectif, le contexte, pourquoi vous lancez cette jackpot..."
                    maxlength="500"
                  ></textarea>
                  <div class="field-footer justify-end">
                    <span class="char-count"
                      >{{ form.get('description')?.value?.length ?? 0 }}/500</span
                    >
                  </div>
                </div>
                <div class="step-footer">
                  <button type="button" class="btn-cancel" (click)="closeIfIdle()">Annuler</button>
                  <button
                    type="button"
                    class="btn-next"
                    [disabled]="!form.get('title')?.valid"
                    (click)="step.set(2)"
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            }
            <!-- ═══ ÉTAPE 2 : MONTANT ═══ -->
            @if (step() === 2) {
              <div class="step-body">
                <div class="step-title">Quel est le montant cible ? <span class="req">*</span></div>
                <div class="step-sub">
                  La jackpot se ferme automatiquement une fois ce plafond atteint.
                </div>
                <!-- Suggestions -->
                <div class="amount-suggestions">
                  @for (amt of suggestedAmounts; track amt) {
                    <button
                      type="button"
                      class="amt-chip"
                      [class.active]="form.get('targetAmount')?.value === amt"
                      (click)="form.patchValue({ targetAmount: amt })"
                    >
                      {{ amt | number: '1.0-0' }} XOF
                    </button>
                  }
                </div>
                <!-- Input libre -->
                <div class="field">
                  <label class="field-label">Ou saisissez un montant personnalisé</label>
                  <div class="price-wrap">
                    <input
                      type="number"
                      formControlName="targetAmount"
                      [class.invalid]="isInvalid('targetAmount')"
                      placeholder="Ex : 750 000"
                      min="1000"
                    />
                    <span class="price-suffix">XOF</span>
                  </div>
                  @if (isInvalid('targetAmount')) {
                    <span class="field-err">Montant minimum : 1 000 XOF.</span>
                  }
                  <span class="field-hint">Minimum 1 000 XOF</span>
                </div>
                <!-- Date limite -->
                <div class="field">
                  <label class="field-label">
                    Date limite <span class="opt">— optionnel</span>
                  </label>
                  <input type="date" formControlName="deadlineAt" [min]="minDate()" />
                  <span class="field-hint"
                    >La jackpot sera automatiquement clôturée à cette date.</span
                  >
                </div>
                <div class="step-footer">
                  <button type="button" class="btn-cancel" (click)="step.set(1)">← Retour</button>
                  <button
                    type="button"
                    class="btn-next"
                    [disabled]="!form.get('targetAmount')?.valid"
                    (click)="step.set(3)"
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            }
            <!-- ═══ ÉTAPE 3 : MESSAGE + RÉCAP ═══ -->
            @if (step() === 3) {
              <div class="step-body">
                <div class="step-title">Un message pour vos contributeurs ?</div>
                <div class="field">
                  <label class="field-label"
                    >Message aux contributeurs <span class="opt">— optionnel</span></label
                  >
                  <textarea
                    formControlName="contributorMessage"
                    rows="3"
                    placeholder="Merci de votre soutien ! Chaque contribution compte..."
                    maxlength="500"
                  ></textarea>
                  <div class="field-footer justify-end">
                    <span class="char-count"
                      >{{ form.get('contributorMessage')?.value?.length ?? 0 }}/500</span
                    >
                  </div>
                </div>
                <!-- Récapitulatif -->
                <div class="recap-card">
                  <div class="recap-title">Récapitulatif</div>
                  <div class="recap-row">
                    <span>Titre</span>
                    <strong>{{ form.get('title')?.value }}</strong>
                  </div>
                  @if (form.get('purposeCategory')?.value) {
                    <div class="recap-row">
                      <span>Objectif</span>
                      <strong>{{
                        getPurposeLabel(form.get('purposeCategory')?.value ?? '')
                      }}</strong>
                    </div>
                  }
                  <div class="recap-row">
                    <span>Plafond</span>
                    <strong class="accent"
                      >{{ form.get('targetAmount')?.value | number: '1.0-0' }} XOF</strong
                    >
                  </div>
                  @if (form.get('deadlineAt')?.value) {
                    <div class="recap-row">
                      <span>Date limite</span>
                      <strong>{{ form.get('deadlineAt')?.value | date: 'dd MMM yyyy' }}</strong>
                    </div>
                  }
                  @if (!form.get('deadlineAt')?.value) {
                    <div class="recap-row">
                      <span>Date limite</span>
                      <strong class="muted">Aucune</strong>
                    </div>
                  }
                </div>
                <div class="step-footer">
                  <button type="button" class="btn-cancel" (click)="step.set(2)">← Retour</button>
                  <button
                    type="button"
                    class="btn-submit"
                    [disabled]="loading() || form.invalid"
                    (click)="submit()"
                  >
                    @if (!loading()) {
                      <span>
                        <lucide-icon name="arrow-right" [size]="15" color="currentColor" [strokeWidth]="1.8" />
                        Soumettre la demande
                      </span>
                    }
                    @if (loading()) {
                      <span class="dots"><span></span><span></span><span></span></span>
                    }
                  </button>
                </div>
              </div>
            }
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        z-index: 499;
      }
      .modal-wrap {
        position: fixed;
        inset: 0;
        z-index: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .modal {
        background: white;
        border-radius: 24px;
        width: min(560px, 100%);
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
        animation: slideUp 0.2s ease;
        overflow: hidden;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Header */
      .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 24px 24px 16px;
        border-bottom: 1px solid #f3f4f6;
        flex-shrink: 0;
      }
      .modal-eyebrow {
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #ffd700;
        margin-bottom: 4px;
      }
      .modal-title {
        font-size: 1.1rem;
        font-weight: 900;
        color: #111;
      }
      .btn-close {
        width: 36px;
        height: 36px;
        border: 0;
        background: #f3f4f6;
        border-radius: 8px;
        cursor: pointer;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .btn-close:hover:not(:disabled) {
        background: #e5e7eb;
      }

      /* Info */
      .modal-info {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 12px 24px;
        background: #fffbeb;
        border-bottom: 1px solid #fde68a;
        font-size: 0.82rem;
        color: #92400e;
        line-height: 1.5;
        flex-shrink: 0;
      }
      .modal-error {
        padding: 12px 24px;
        background: #fef2f2;
        border-bottom: 1px solid #fecaca;
        font-size: 0.85rem;
        color: #991b1b;
        flex-shrink: 0;
      }

      /* Stepper */
      .stepper {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #f3f4f6;
        flex-shrink: 0;
        gap: 0;
      }
      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .step-dot {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #f3f4f6;
        color: #9ca3af;
        font-size: 0.78rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s;
      }
      .step.active .step-dot {
        background: #ffd700;
        color: #000;
      }
      .step.done .step-dot {
        background: #22c55e;
        color: white;
      }
      .step-label {
        font-size: 0.68rem;
        font-weight: 600;
        color: #9ca3af;
        white-space: nowrap;
      }
      .step.active .step-label {
        color: #111;
      }
      .step-line {
        flex: 1;
        height: 2px;
        background: #f3f4f6;
        margin: 0 8px;
        margin-bottom: 16px;
      }

      /* Body scrollable */
      .modal-body {
        flex: 1;
        overflow-y: auto;
      }
      .step-body {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .step-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111;
      }
      .step-sub {
        font-size: 0.82rem;
        color: #6b7280;
        margin-top: -10px;
      }

      /* Visibility toggle */
      .visibility-toggle {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .vis-btn {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        padding: 10px 14px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        color: #374151;
        cursor: pointer;
        transition: 0.15s;
        text-align: left;
      }
      .vis-btn:hover {
        border-color: #ffd700;
      }
      .vis-btn.active {
        background: #fffbeb;
        border-color: #ffd700;
        color: #92400e;
      }
      .vis-desc {
        font-size: 0.7rem;
        font-weight: 500;
        color: #9ca3af;
      }
      .vis-btn.active .vis-desc {
        color: #92400e;
        opacity: 0.8;
      }

      /* Purpose grid */
      .purpose-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .purpose-btn {
        padding: 10px 12px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        color: #374151;
        cursor: pointer;
        transition: 0.15s;
        text-align: left;
      }
      .purpose-btn:hover {
        border-color: #ffd700;
      }
      .purpose-btn.active {
        background: #fffbeb;
        border-color: #ffd700;
        color: #92400e;
      }

      /* Amount chips */
      .amount-suggestions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .amt-chip {
        padding: 10px 8px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        color: #374151;
        cursor: pointer;
        transition: 0.15s;
        text-align: center;
      }
      .amt-chip:hover {
        border-color: #111;
      }
      .amt-chip.active {
        background: #111;
        border-color: #111;
        color: white;
      }

      /* Fields */
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .field-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .req {
        color: #ef4444;
      }
      .opt {
        font-weight: 500;
        color: #9ca3af;
      }
      input[type='text'],
      input[type='number'],
      input[type='date'] {
        padding: 11px 14px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        font: inherit;
        font-size: 0.9rem;
        outline: 0;
        transition: 0.2s;
        background: #f9fafb;
        box-sizing: border-box;
        width: 100%;
      }
      input:focus {
        border-color: #ffd700;
        background: white;
      }
      input.invalid {
        border-color: #ef4444;
      }
      textarea {
        padding: 11px 14px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        font: inherit;
        font-size: 0.88rem;
        resize: vertical;
        outline: 0;
        transition: 0.2s;
        background: #f9fafb;
        box-sizing: border-box;
        width: 100%;
      }
      textarea:focus {
        border-color: #ffd700;
        background: white;
      }
      .price-wrap {
        position: relative;
      }
      .price-wrap input {
        padding-right: 52px;
      }
      .price-suffix {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.75rem;
        font-weight: 700;
        color: #9ca3af;
        pointer-events: none;
      }
      .field-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .justify-end {
        justify-content: flex-end;
      }
      .field-err {
        font-size: 0.75rem;
        color: #ef4444;
      }
      .field-hint {
        font-size: 0.72rem;
        color: #9ca3af;
      }
      .char-count {
        font-size: 0.68rem;
        color: #9ca3af;
      }

      /* Recap */
      .recap-card {
        background: #f9fafb;
        border: 1.5px solid #f3f4f6;
        border-radius: 14px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .recap-title {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #9ca3af;
      }
      .recap-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        font-size: 0.85rem;
        color: #6b7280;
      }
      .recap-row strong {
        color: #111;
        font-weight: 700;
        text-align: right;
      }
      .recap-row strong.accent {
        color: #111;
        font-size: 1rem;
        font-weight: 900;
      }
      .recap-row strong.muted {
        color: #9ca3af;
      }

      /* Step footer */
      .step-footer {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding-top: 4px;
        border-top: 1px solid #f3f4f6;
      }
      .btn-cancel {
        padding: 10px 18px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        color: #6b7280;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.15s;
      }
      .btn-cancel:hover {
        border-color: #111;
        color: #111;
      }
      .btn-next {
        padding: 10px 22px;
        border: 0;
        border-radius: 10px;
        background: #111;
        color: white;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 800;
        cursor: pointer;
        transition: 0.15s;
      }
      .btn-next:hover:not(:disabled) {
        background: #000;
      }
      .btn-next:disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      }
      .btn-submit {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 11px 22px;
        border: 0;
        border-radius: 10px;
        background: #ffd700;
        color: #000;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 800;
        cursor: pointer;
        transition: 0.15s;
      }
      .btn-submit:hover:not(:disabled) {
        background: #ffc000;
      }
      .btn-submit:disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      }
      .dots {
        display: flex;
        gap: 4px;
      }
      .dots span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #9ca3af;
        animation: bounce 1.2s infinite;
      }
      .dots span:nth-child(2) {
        animation-delay: 0.2s;
      }
      .dots span:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes bounce {
        0%,
        80%,
        100% {
          transform: scale(0.7);
          opacity: 0.4;
        }
        40% {
          transform: scale(1.1);
          opacity: 1;
        }
      }

      @media (max-width: 640px) {
        .purpose-grid {
          grid-template-columns: 1fr;
        }
        .amount-suggestions {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class JackpotRequestModalComponent {
  @Input({ required: true }) show = false;
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  private readonly service = inject(JackpotService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly step = signal(1);

  readonly purposes = PURPOSE_CATEGORIES;
  readonly suggestedAmounts = SUGGESTED_AMOUNTS;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(500)]],
    purposeCategory: [''],
    visibility: ['PUBLIC'],
    contributorMessage: ['', [Validators.maxLength(500)]],
    targetAmount: [null as number | null, [Validators.required, Validators.min(1000)]],
    deadlineAt: [''],
  });

  closeIfIdle(): void {
    if (this.loading()) return;
    this.error.set('');
    this.step.set(1);
    this.form.reset();
    this.close.emit();
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  getPurposeLabel(value: string): string {
    return PURPOSE_CATEGORIES.find((p) => p.value === value)?.label ?? value;
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.service
      .create({
        title: raw.title!.trim(),
        description: raw.description?.trim() || undefined,
        purposeCategory: raw.purposeCategory?.trim() || undefined,
        contributorMessage: raw.contributorMessage?.trim() || undefined,
        targetAmount: Number(raw.targetAmount),
        currencyCode: 'XOF',
        deadlineAt: raw.deadlineAt || undefined,
        visibility: (raw.visibility as 'PUBLIC' | 'PRIVATE') ?? 'PUBLIC',
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success(
            "Demande de jackpot soumise ! Vous serez notifié(e) dès qu'elle sera validée.",
          );
          this.step.set(1);
          this.form.reset();
          this.submitted.emit();
          this.close.emit();
        },
        error: (err: any) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'Erreur lors de la soumission.');
        },
      });
  }
}
