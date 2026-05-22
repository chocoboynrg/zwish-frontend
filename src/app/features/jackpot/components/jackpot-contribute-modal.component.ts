import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Jackpot } from '../models/jackpot.model';
import { ToastService } from '../../../core/services/toast.service';

const SUGGESTED = [500, 1_000, 2_500, 5_000, 10_000, 25_000];

interface ApiResp<T> {
  success: boolean;
  data: T;
}

@Component({
  selector: 'app-jackpot-contribute-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    @if (show) {
      <div class="overlay" (click)="tryClose()"></div>
      <div class="modal-wrap" (click)="tryClose()">
        <div class="modal" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div>
              <div class="modal-eyebrow">💰 Cagnotte</div>
              <div class="modal-title">Contribuer à "{{ jackpot?.title }}"</div>
            </div>
            <button class="btn-close" (click)="tryClose()" [disabled]="loading()">
              <lucide-icon name="x" [size]="18" color="currentColor" [strokeWidth]="1.8" />
            </button>
          </div>
          <!-- Progression jackpot -->
          @if (jackpot) {
            <div class="progress-recap">
              <div class="progress-vals">
                <span class="collected"
                  >{{ jackpot.collectedAmount | number: '1.0-0' }} {{ jackpot.currencyCode }}</span
                >
                <span class="sep">collectés sur</span>
                <span class="target"
                  >{{ jackpot.targetAmount | number: '1.0-0' }} {{ jackpot.currencyCode }}</span
                >
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width]="getPct() + '%'"></div>
              </div>
              <div class="progress-pct">{{ getPct() }}%</div>
            </div>
          }
          <!-- Erreur -->
          @if (error()) {
            <div class="modal-error">{{ error() }}</div>
          }
          <form [formGroup]="form" class="modal-body" novalidate>
            <!-- Montant -->
            <div class="field">
              <label class="field-label">Montant <span class="req">*</span></label>
              <div class="amount-chips">
                @for (s of suggested; track s) {
                  <button
                    type="button"
                    class="amt-chip"
                    [class.active]="form.get('amount')?.value === s"
                    (click)="form.patchValue({ amount: s })"
                  >
                    {{ s | number: '1.0-0' }}
                  </button>
                }
              </div>
              <div class="price-wrap">
                <input
                  type="number"
                  formControlName="amount"
                  placeholder="Montant personnalisé"
                  min="500"
                  [class.invalid]="isInvalid('amount')"
                />
                <span class="price-suffix">{{ jackpot?.currencyCode ?? 'XOF' }}</span>
              </div>
              @if (isInvalid('amount')) {
                <span class="field-err">Minimum 500 {{ jackpot?.currencyCode ?? 'XOF' }}.</span>
              }
            </div>
            <!-- Message -->
            <div class="field">
              <label class="field-label">Message <span class="opt">— optionnel</span></label>
              <textarea
                formControlName="message"
                rows="2"
                placeholder="Bravo pour ce beau projet !"
                maxlength="255"
              ></textarea>
              <div class="field-footer">
                <span></span>
                <span class="char-count">{{ form.get('message')?.value?.length ?? 0 }}/255</span>
              </div>
            </div>
            <!-- Anonyme -->
            <label class="anon-toggle" (click)="toggleAnon()">
              <div class="anon-checkbox" [class.checked]="form.get('isAnonymous')?.value">
                @if (form.get('isAnonymous')?.value) {
                  <lucide-icon name="check" [size]="12" color="white" [strokeWidth]="2" />
                }
              </div>
              <span class="anon-label">Contribuer anonymement</span>
            </label>
            <!-- Footer -->
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="tryClose()" [disabled]="loading()">
                Annuler
              </button>
              <button
                type="button"
                class="btn-submit"
                (click)="submit()"
                [disabled]="loading() || form.invalid"
              >
                @if (!loading()) {
                  <lucide-icon name="plus" [size]="15" color="currentColor" [strokeWidth]="2" />
                  Confirmer la contribution
                }
                @if (loading()) {
                  <div class="spinner"></div>
                }
              </button>
            </div>
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
        background: rgba(0, 0, 0, 0.6);
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
        width: min(500px, 100%);
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
      }

      .modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 22px 24px 16px;
        border-bottom: 1px solid #f3f4f6;
      }
      .modal-eyebrow {
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #ffd700;
        margin-bottom: 3px;
      }
      .modal-title {
        font-size: 1rem;
        font-weight: 900;
        color: #111;
        line-height: 1.3;
        max-width: 340px;
      }
      .btn-close {
        width: 34px;
        height: 34px;
        border: 0;
        background: #f3f4f6;
        border-radius: 8px;
        cursor: pointer;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: 0.15s;
      }
      .btn-close:hover:not(:disabled) {
        background: #e5e7eb;
      }

      .progress-recap {
        padding: 14px 24px;
        background: #fffbeb;
        border-bottom: 1px solid #fde68a;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .progress-vals {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: 0.85rem;
      }
      .collected {
        font-weight: 900;
        color: #111;
        font-size: 1rem;
      }
      .sep {
        color: #9ca3af;
      }
      .target {
        color: #6b7280;
        font-weight: 600;
      }
      .progress-track {
        height: 6px;
        background: #fde68a;
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ffd700, #ffa500);
        border-radius: 999px;
        transition: width 0.4s ease;
      }
      .progress-pct {
        font-size: 0.75rem;
        font-weight: 800;
        color: #92400e;
      }

      .modal-error {
        padding: 11px 24px;
        background: #fef2f2;
        border-bottom: 1px solid #fecaca;
        font-size: 0.83rem;
        color: #991b1b;
      }

      .modal-body {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      .field-label {
        font-size: 0.82rem;
        font-weight: 700;
        color: #374151;
      }
      .req {
        color: #ef4444;
      }
      .opt {
        font-weight: 500;
        color: #9ca3af;
      }

      .amount-chips {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 7px;
      }
      .amt-chip {
        padding: 9px 6px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        color: #374151;
        cursor: pointer;
        transition: 0.15s;
        text-align: center;
      }
      .amt-chip:hover {
        border-color: #ffd700;
      }
      .amt-chip.active {
        background: #111;
        border-color: #111;
        color: white;
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
      input[type='number'] {
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
        padding: 10px 14px;
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

      .field-footer {
        display: flex;
        justify-content: flex-end;
      }
      .field-err {
        font-size: 0.75rem;
        color: #ef4444;
      }
      .char-count {
        font-size: 0.68rem;
        color: #9ca3af;
      }

      .anon-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
      }
      .anon-checkbox {
        width: 18px;
        height: 18px;
        border-radius: 5px;
        border: 1.5px solid #d1d5db;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: 0.15s;
      }
      .anon-checkbox.checked {
        background: #111;
        border-color: #111;
      }
      .anon-label {
        font-size: 0.83rem;
        color: #374151;
        font-weight: 600;
      }

      .modal-footer {
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
      .btn-cancel:hover:not(:disabled) {
        border-color: #111;
        color: #111;
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
        min-width: 120px;
        justify-content: center;
      }
      .btn-submit:hover:not(:disabled) {
        background: #ffc000;
      }
      .btn-submit:disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      }
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top-color: #000;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 480px) {
        .amount-chips {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class JackpotContributeModalComponent {
  private _show = false;
  @Input({ required: true })
  set show(val: boolean) {
    this._show = val;
    if (val && this.initialAmount != null) {
      setTimeout(() => this.form.patchValue({ amount: this.initialAmount }), 0);
    }
    if (!val) {
      this.form.reset({ amount: null, message: '', isAnonymous: false });
      this.error.set('');
    }
  }
  get show(): boolean { return this._show; }

  @Input() initialAmount: number | null = null;
  @Input() jackpot: Jackpot | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() contributed = new EventEmitter<void>();

  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly suggested = SUGGESTED;

  readonly form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(500)]],
    message: ['', Validators.maxLength(255)],
    isAnonymous: [false],
  });

  getPct(): number {
    if (!this.jackpot?.targetAmount) return 0;
    return Math.min(
      100,
      Math.round((Number(this.jackpot.collectedAmount) / Number(this.jackpot.targetAmount)) * 100),
    );
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  toggleAnon(): void {
    const current = this.form.get('isAnonymous')?.value;
    this.form.patchValue({ isAnonymous: !current });
  }

  tryClose(): void {
    if (this.loading()) return;
    this.close.emit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.jackpot) return;
    const raw = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');

    this.http
      .post<ApiResp<unknown>>(`${environment.apiBaseUrl}/jackpot/${this.jackpot.id}/contribute`, {
        amount: Number(raw.amount),
        message: raw.message?.trim() || undefined,
        isAnonymous: raw.isAnonymous ?? false,
      })
      .pipe(map((r) => r))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Merci pour votre contribution ! 🎉');
          this.form.reset({ amount: null, message: '', isAnonymous: false });
          this.contributed.emit();
          this.close.emit();
        },
        error: (e: any) => {
          this.loading.set(false);
          this.error.set(e?.error?.message ?? 'Erreur lors de la contribution.');
        },
      });
  }
}
