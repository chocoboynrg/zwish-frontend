import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import type { CatalogAdminPageComponent } from '../pages/catalog-admin-page.component';

@Component({
  selector: 'app-catalog-product-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    @if (host.productDrawerOpen()) {
      <div class="drawer-overlay" (click)="host.closeProductDrawer()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>{{ host.editingProduct() ? 'Modifier le produit' : 'Nouveau produit' }}</h2>
            <button class="btn-close" (click)="host.closeProductDrawer()">✕</button>
          </div>
          <div class="drawer-body">
            <form [formGroup]="host.productForm" (ngSubmit)="host.submitProduct()">
              <div class="form-section">
                <div class="image-upload-area" (click)="imageInput.click()">
                  @if (host.productImagePreview()) {
                    <img [src]="host.productImagePreview()!" class="image-preview" alt="Aperçu" />
                  }
                  @if (!host.productImagePreview()) {
                    <div class="image-placeholder">
                      <lucide-icon name="image" [size]="28" color="currentColor" [strokeWidth]="1.8" />
                      <span>Cliquer pour ajouter une image</span>
                    </div>
                  }
                </div>
                <input
                  #imageInput
                  type="file"
                  accept="image/*"
                  style="display:none"
                  (change)="host.onImageSelected($event)"
                />
                <div class="or-separator">ou</div>
                <input
                  type="text"
                  formControlName="mainImageUrl"
                  placeholder="URL de l'image (https://...)"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Nom <span class="required">*</span></label>
                <input
                  type="text"
                  formControlName="name"
                  class="form-input"
                  placeholder="Ex: iPhone 15 Pro"
                  (input)="host.autoSlugProduct()"
                  [class.invalid]="host.isInvalid('product', 'name')"
                />
                @if (host.isInvalid('product', 'name')) {
                  <span class="field-error">Nom requis.</span>
                }
              </div>

              <div class="form-group">
                <label>Slug <span class="required">*</span></label>
                <input
                  type="text"
                  formControlName="slug"
                  class="form-input mono"
                  placeholder="iphone-15-pro"
                  [class.invalid]="host.isInvalid('product', 'slug')"
                />
                @if (host.isInvalid('product', 'slug')) {
                  <span class="field-error">Slug requis.</span>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Catégorie <span class="required">*</span></label>
                  <select
                    formControlName="categoryId"
                    class="form-input"
                    [class.invalid]="host.isInvalid('product', 'categoryId')"
                  >
                    <option [ngValue]="null" disabled>Choisir...</option>
                    @for (c of host.categories(); track c.id) {
                      <option [ngValue]="c.id">{{ c.name }}</option>
                    }
                  </select>
                  @if (host.isInvalid('product', 'categoryId')) {
                    <span class="field-error">Catégorie requise.</span>
                  }
                </div>
                <div class="form-group">
                  <label>Statut</label>
                  <select formControlName="status" class="form-input">
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                    <option value="DRAFT">Brouillon</option>
                    <option value="ARCHIVED">Archivé</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Prix réel <span class="price-hint">(coût)</span></label>
                  <div class="price-input-wrap">
                    <input
                      type="number"
                      formControlName="realPrice"
                      class="form-input"
                      min="0"
                      placeholder="0"
                    />
                    <span class="currency-badge">{{ host.productForm.get('currencyCode')?.value || 'XOF' }}</span>
                  </div>
                </div>
                <div class="form-group">
                  <label>Prix de vente <span class="price-hint">(affiché)</span></label>
                  <div class="price-input-wrap">
                    <input
                      type="number"
                      formControlName="sellingPrice"
                      class="form-input"
                      min="0"
                      placeholder="0"
                    />
                    <span class="currency-badge">{{ host.productForm.get('currencyCode')?.value || 'XOF' }}</span>
                  </div>
                </div>
              </div>

              @if ((host.productForm.get('realPrice')?.value || 0) > 0 && (host.productForm.get('sellingPrice')?.value || 0) > 0) {
                <div class="margin-hint">
                  Marge :
                  <strong
                    >{{ ((host.productForm.get('sellingPrice')?.value || 0) - (host.productForm.get('realPrice')?.value || 0)) | number }}
                    {{ host.productForm.get('currencyCode')?.value }}</strong
                  >
                  ({{ (((host.productForm.get('sellingPrice')?.value || 0) - (host.productForm.get('realPrice')?.value || 0)) / (host.productForm.get('realPrice')?.value || 1) * 100) | number:'1.0-1' }}%)
                </div>
              }

              @if (host.editingProduct()) {
                <div class="promo-section">
                  <div class="promo-section-title">
                    <lucide-icon name="home" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    Promotion
                  </div>
                  @if (host.promoLoading()) {
                    <div class="promo-load-hint">Chargement...</div>
                  } @else if (host.drawerActivePromo()) {
                    <div class="promo-active-display">
                      <div class="pad-row">
                        <span class="pad-price">{{ host.drawerActivePromo()!.promoPrice | number }}</span>
                        <span class="pad-curr">{{ host.editingProduct()?.currencyCode || 'XOF' }}</span>
                        <span class="pad-orig">au lieu de {{ (host.editingProduct()!.sellingPrice ?? host.editingProduct()!.estimatedPrice) | number }}</span>
                        <span class="pad-pct">
                          -{{ (((host.editingProduct()!.sellingPrice ?? host.editingProduct()!.estimatedPrice) - host.drawerActivePromo()!.promoPrice) / ((host.editingProduct()!.sellingPrice ?? host.editingProduct()!.estimatedPrice) || 1) * 100) | number:'1.0-0' }}%
                        </span>
                      </div>
                      <div class="pad-dates">Expire le {{ host.drawerActivePromo()!.endsAt | date:'dd/MM/yyyy à HH:mm' }}</div>
                      @if (host.drawerActivePromo()!.note) {
                        <div class="pad-note">{{ host.drawerActivePromo()!.note }}</div>
                      }
                      <button type="button" class="btn-end-promo" (click)="host.endDrawerPromo()" [disabled]="host.promoEndLoading()">
                        {{ host.promoEndLoading() ? '...' : 'Terminer la promotion' }}
                      </button>
                    </div>
                  } @else {
                    <div class="promo-none">
                      <span class="promo-none-text">Aucune promotion active</span>
                      @if (!host.showQuickPromoForm()) {
                        <button type="button" class="btn-add-promo" (click)="host.openQuickPromoForm()">
                          + Mettre en promo
                        </button>
                      }
                    </div>
                    @if (host.showQuickPromoForm()) {
                      <div class="quick-promo-form">
                        @if (host.quickPromoError()) {
                          <div class="qpf-error">{{ host.quickPromoError() }}</div>
                        }
                        <div class="form-row">
                          <div class="form-group">
                            <label>Prix promo <span class="required">*</span></label>
                            <div class="price-input-wrap">
                              <input
                                type="number"
                                class="form-input"
                                min="1"
                                placeholder="0"
                                [value]="host.quickPromoPrice() ?? ''"
                                (input)="host.quickPromoPrice.set(host.getNumOrNull($event))"
                              />
                              <span class="currency-badge">{{ host.productForm.get('currencyCode')?.value || 'XOF' }}</span>
                            </div>
                          </div>
                          <div class="form-group">
                            <label>Fin <span class="required">*</span></label>
                            <input
                              type="datetime-local"
                              class="form-input"
                              [value]="host.quickPromoEndsAt()"
                              (input)="host.quickPromoEndsAt.set(host.getInputVal($event))"
                            />
                          </div>
                        </div>
                        @if ((host.quickPromoPrice() ?? 0) > 0 && (host.productForm.get('sellingPrice')?.value || 0) > 0) {
                          <div class="promo-discount-hint">
                            Réduction :
                            <strong>{{ ((host.productForm.get('sellingPrice')?.value || 0) - (host.quickPromoPrice() ?? 0)) | number }} {{ host.productForm.get('currencyCode')?.value || 'XOF' }}</strong>
                            ({{ (((host.productForm.get('sellingPrice')?.value || 0) - (host.quickPromoPrice() ?? 0)) / (host.productForm.get('sellingPrice')?.value || 1) * 100) | number:'1.0-0' }}% de remise)
                          </div>
                        }
                        <div class="form-group">
                          <label>Note <span class="price-hint">— optionnelle</span></label>
                          <input
                            type="text"
                            class="form-input"
                            placeholder="Black Friday, Soldes..."
                            [value]="host.quickPromoNote()"
                            (input)="host.quickPromoNote.set(host.getInputVal($event))"
                          />
                        </div>
                        <div class="qpf-actions">
                          <button type="button" class="btn-cancel" (click)="host.showQuickPromoForm.set(false)">Annuler</button>
                          <button
                            type="button"
                            class="btn-primary"
                            (click)="host.submitQuickPromo()"
                            [disabled]="!host.quickPromoPrice() || (host.quickPromoPrice() ?? 0) <= 0 || !host.quickPromoEndsAt() || host.quickPromoLoading()"
                          >
                            {{ host.quickPromoLoading() ? 'Création...' : 'Créer la promotion' }}
                          </button>
                        </div>
                      </div>
                    }
                  }
                </div>
              }

              <div class="form-row">
                <div class="form-group">
                  <label>Marque</label>
                  <input
                    type="text"
                    formControlName="brand"
                    class="form-input"
                    placeholder="Ex: Apple"
                  />
                </div>
                <div class="form-group">
                  <label>Prix estimé</label>
                  <div class="price-input-wrap">
                    <input
                      type="number"
                      formControlName="estimatedPrice"
                      class="form-input"
                      min="0"
                      placeholder="0"
                    />
                    <select formControlName="currencyCode" class="currency-select">
                      <option value="XOF">XOF</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea
                  formControlName="description"
                  class="form-input"
                  rows="3"
                  placeholder="Description du produit..."
                ></textarea>
              </div>

              <div class="form-group">
                <label>Lien de référence</label>
                <input
                  type="url"
                  formControlName="referenceUrl"
                  class="form-input"
                  placeholder="https://..."
                />
              </div>

              @if (host.themes().length > 0) {
                <div class="form-group">
                  <label>Thèmes</label>
                  <div class="theme-chips">
                    @for (t of host.themes(); track t.id) {
                      <button
                        type="button"
                        class="theme-chip"
                        [class.selected]="host.selectedThemeIds().has(t.id)"
                        [style.--chip-color]="t.color || '#6b7280'"
                        (click)="host.toggleThemeSelection(t.id)"
                      >
                        {{ t.emoji || '' }} {{ t.name }}
                      </button>
                    }
                  </div>
                </div>
              }

              @if (host.allDeliveryOptions().length > 0) {
                <div class="form-group">
                  <label>Options de livraison</label>
                  <p class="field-hint">Ces options seront automatiquement proposées quand ce produit est ajouté à une wishlist.</p>
                  <div class="delivery-opts-list">
                    @if (host.deliveryOptionsLoading()) {
                      <span class="hint-text">Chargement…</span>
                    } @else {
                      @for (opt of host.allDeliveryOptions(); track opt.id) {
                        <label class="delivery-opt-row">
                          <input
                            type="checkbox"
                            [checked]="host.selectedDeliveryOptionIds().has(opt.id)"
                            (change)="host.toggleDeliveryOption(opt.id)"
                          />
                          <span class="delivery-opt-label">{{ opt.label }}</span>
                          @if (opt.price > 0) {
                            <span class="delivery-opt-price">+{{ opt.price | number:'1.0-0' }} XOF</span>
                          } @else {
                            <span class="delivery-opt-free">Gratuit</span>
                          }
                        </label>
                      }
                    }
                  </div>
                </div>
              }

              <div class="drawer-actions">
                <button type="button" class="btn-cancel" (click)="host.closeProductDrawer()">
                  Annuler
                </button>
                @if (host.editingProduct()) {
                  <button
                    type="button"
                    class="btn-danger-outline"
                    (click)="host.confirmDeleteProduct(host.editingProduct()!); host.closeProductDrawer()"
                  >
                    Supprimer
                  </button>
                }
                <button type="submit" class="btn-primary" [disabled]="host.productLoading()">
                  {{
                    host.productLoading()
                      ? 'Enregistrement...'
                      : host.editingProduct()
                        ? 'Mettre à jour'
                        : 'Créer le produit'
                  }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.42);
        z-index: 60;
      }
      .drawer {
        position: fixed;
        right: 0;
        top: 0;
        width: min(780px, 100vw);
        height: 100vh;
        background: #fff;
        display: flex;
        flex-direction: column;
        box-shadow: -20px 0 50px rgba(15, 23, 42, 0.2);
      }
      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid #eef2f7;
      }
      .drawer-header h2 {
        margin: 0;
        font-size: 1.02rem;
        font-weight: 800;
        color: #0f172a;
      }
      .btn-close {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #fff;
        width: 38px;
        height: 38px;
        cursor: pointer;
      }
      .drawer-body {
        padding: 18px 20px 24px;
        overflow: auto;
      }
      .form-section,
      .form-group {
        margin-bottom: 14px;
      }
      .image-upload-area {
        border: 1px dashed #cbd5e1;
        border-radius: 14px;
        padding: 16px;
        cursor: pointer;
        background: #f8fafc;
      }
      .image-preview {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 10px;
      }
      .image-placeholder {
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #64748b;
      }
      .or-separator,
      .required,
      .price-hint {
        color: #94a3b8;
      }
      .form-row,
      .qpf-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .form-input,
      .currency-select,
      textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #dbe3ec;
        border-radius: 10px;
        font: inherit;
        box-sizing: border-box;
      }
      .price-input-wrap {
        position: relative;
      }
      .currency-badge {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .margin-hint,
      .promo-discount-hint,
      .field-hint,
      .qpf-error,
      .promo-load-hint {
        font-size: 0.82rem;
        color: #475569;
      }
      .promo-section {
        border: 1px solid #eef2ff;
        border-radius: 12px;
        padding: 12px;
        background: #fafbff;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .promo-section-title {
        font-size: 0.76rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .promo-active-display,
      .quick-promo-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .promo-none {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }
      .btn-primary,
      .btn-cancel,
      .btn-danger-outline,
      .btn-add-promo,
      .btn-end-promo {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary,
      .btn-add-promo,
      .btn-end-promo {
        background: #6366f1;
        color: white;
      }
      .btn-cancel {
        background: #f8fafc;
        color: #334155;
      }
      .btn-danger-outline {
        background: #fff;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
      .theme-chips,
      .delivery-opts-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .theme-chip,
      .delivery-opt-row {
        border: 1px solid #dbe3ec;
        border-radius: 999px;
        background: #fff;
        padding: 8px 12px;
      }
      .theme-chip.selected {
        border-color: var(--chip-color, #6366f1);
        color: var(--chip-color, #6366f1);
      }
      .delivery-opt-row {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .drawer-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 8px;
      }
      @media (max-width: 900px) {
        .drawer {
          width: 100vw;
        }
        .form-row,
        .qpf-actions {
          grid-template-columns: 1fr;
        }
        .drawer-actions {
          flex-direction: column;
        }
        .promo-none {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class CatalogProductDrawerComponent {
  @Input({ required: true }) host!: CatalogAdminPageComponent;
}
