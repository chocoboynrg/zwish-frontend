import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-product-request-form-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="form-panel">
      <div class="panel-header">
        <div class="panel-title">
          <lucide-icon name="plus" [size]="16" color="currentColor" [strokeWidth]="1.8" />
          Nouvelle demande
        </div>
        <button type="button" class="panel-close" (click)="closed.emit()">
          <lucide-icon name="x" [size]="16" color="currentColor" [strokeWidth]="1.8" />
        </button>
      </div>

      @if (submitError) {
        <div class="form-error">
          <lucide-icon name="info" [size]="14" color="currentColor" [strokeWidth]="1.8" />
          {{ submitError }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="submitRequested.emit()" class="form-body" novalidate>
        <div class="field">
          <label class="field-label">Nom du produit <span class="req">*</span></label>
          <input
            type="text"
            formControlName="name"
            placeholder="Ex : PlayStation 5"
            [class.invalid]="isInvalid('name')"
            maxlength="150"
          />
          <div class="field-footer">
            @if (isInvalid('name')) {
              <span class="field-err">Obligatoire.</span>
            }
            <span class="char-count">{{ form.get('name')?.value?.length ?? 0 }}/150</span>
          </div>
        </div>

        <div class="field">
          <label class="field-label">Prix estimé <span class="req">*</span></label>
          <div class="price-wrap">
            <input
              type="number"
              formControlName="estimatedPrice"
              placeholder="350 000"
              min="1"
              [class.invalid]="isInvalid('estimatedPrice')"
            />
            <span class="price-suffix">XOF</span>
          </div>
          @if (isInvalid('estimatedPrice')) {
            <span class="field-err">Prix obligatoire (min 1).</span>
          }
        </div>

        <div class="field">
          <label class="field-label">Description <span class="opt">— optionnel</span></label>
          <textarea
            formControlName="description"
            rows="3"
            placeholder="Couleur, taille, version, caractéristiques..."
            maxlength="500"
          ></textarea>
          <div class="field-footer justify-end">
            <span class="char-count">{{ form.get('description')?.value?.length ?? 0 }}/500</span>
          </div>
        </div>

        <div class="field">
          <label class="field-label">
            <lucide-icon name="link" [size]="12" color="currentColor" [strokeWidth]="1.8" />
            Lien de référence <span class="opt">— optionnel</span>
          </label>
          <input type="url" formControlName="referenceUrl" placeholder="https://jumia.ci/..." />
          <span class="field-hint">Jumia, Amazon, site officiel...</span>
        </div>

        <div class="field">
          <label class="field-label">URL image <span class="opt">— optionnel</span></label>
          <input type="url" formControlName="imageUrl" placeholder="https://..." />
          @if (form.get('imageUrl')?.value?.trim()) {
            <div class="img-preview">
              <img [src]="form.get('imageUrl')!.value" alt="Aperçu" (error)="onImgError($event)" />
            </div>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" (click)="closed.emit()">Annuler</button>
          <button type="submit" class="btn-submit" [disabled]="submitLoading || form.invalid">
            @if (!submitLoading) {
              <span>
                <lucide-icon name="arrow-right" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                Envoyer
              </span>
            }
            @if (submitLoading) {
              <span class="dots"><span></span><span></span><span></span></span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .form-panel {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        overflow: hidden;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px;
        border-bottom: 1px solid #f3f4f6;
      }
      .panel-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .panel-close {
        width: 32px;
        height: 32px;
        border: 0;
        background: #f3f4f6;
        border-radius: 8px;
        cursor: pointer;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .panel-close:hover {
        background: #e5e7eb;
        color: #111;
      }
      .form-error {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: #fef2f2;
        border-bottom: 1px solid #fecaca;
        font-size: 0.82rem;
        color: #991b1b;
      }
      .form-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .field-label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.8rem;
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
      input[type='text'],
      input[type='number'],
      input[type='url'] {
        padding: 10px 13px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        font: inherit;
        font-size: 0.88rem;
        outline: 0;
        transition: 0.2s;
        background: #f9fafb;
        box-sizing: border-box;
        width: 100%;
      }
      input:focus {
        border-color: #6d28d9;
        background: white;
      }
      input.invalid {
        border-color: #ef4444;
      }
      textarea {
        padding: 10px 13px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        font: inherit;
        font-size: 0.85rem;
        resize: vertical;
        outline: 0;
        transition: 0.2s;
        background: #f9fafb;
        box-sizing: border-box;
        width: 100%;
      }
      textarea:focus {
        border-color: #6d28d9;
        background: white;
      }
      .price-wrap {
        position: relative;
      }
      .price-wrap input {
        padding-right: 50px;
      }
      .price-suffix {
        position: absolute;
        right: 11px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.72rem;
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
        font-size: 0.72rem;
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
      .img-preview {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        margin-top: 4px;
      }
      .img-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .form-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 4px;
        border-top: 1px solid #f3f4f6;
        margin-top: 4px;
      }
      .btn-cancel {
        padding: 9px 16px;
        border: 1.5px solid #e5e7eb;
        border-radius: 9px;
        background: white;
        color: #6b7280;
        font: inherit;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.15s;
      }
      .btn-cancel:hover {
        border-color: #111;
        color: #111;
      }
      .btn-submit {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        border: 0;
        border-radius: 9px;
        background: #6d28d9;
        color: white;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-submit:hover:not(:disabled) {
        background: #5b21b6;
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
    `,
  ],
})
export class ProductRequestFormPanelComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() submitLoading = false;
  @Input() submitError = '';

  @Output() closed = new EventEmitter<void>();
  @Output() submitRequested = new EventEmitter<void>();

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
