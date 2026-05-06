import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PromotionsService, Promotion, PromotionStatus } from '../services/promotions.service';
import { CatalogService } from '../../catalog/services/catalog.service';
import { CatalogProduct } from '../../catalog/models/catalog-product.model';
import { ToastService } from '../../../core/services/toast.service';

const STATUS_META: Record<PromotionStatus, { label: string; color: string; bg: string }> = {
  UPCOMING:  { label: 'À venir',  color: '#1d4ed8', bg: '#dbeafe' },
  ACTIVE:    { label: 'Active',   color: '#166534', bg: '#dcfce7' },
  ENDED:     { label: 'Terminée', color: '#6b7280', bg: '#f3f4f6' },
  CANCELLED: { label: 'Annulée',  color: '#991b1b', bg: '#fee2e2' },
};

@Component({
  selector: 'app-promotions-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Promotions</h1>
          <p class="subtitle">{{ activeCount() }} active(s) · {{ upcomingCount() }} à venir · {{ total() }} total</p>
        </div>
        <button class="btn-create" (click)="toggleForm()">
          @if (!showForm()) {
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Nouvelle campagne
          } @else {
            ✕ Annuler
          }
        </button>
      </div>

      <!-- ===== WIZARD ===== -->
      @if (showForm()) {
        <div class="wizard-card">

          <!-- Steps indicator -->
          <div class="wizard-steps">
            <div class="wstep" [class.active]="step() === 1" [class.done]="step() > 1">
              <span class="wstep-num">{{ step() > 1 ? '✓' : '1' }}</span>
              <span class="wstep-label">Sélection produits</span>
            </div>
            <div class="wstep-line"></div>
            <div class="wstep" [class.active]="step() === 2">
              <span class="wstep-num">2</span>
              <span class="wstep-label">Configuration</span>
            </div>
          </div>

          <!-- ===== STEP 1: Product selection ===== -->
          @if (step() === 1) {
            <div class="wizard-step">
              <input
                class="wizard-search"
                type="text"
                placeholder="Rechercher un produit..."
                [value]="wizardSearch()"
                (input)="wizardSearch.set(getInputVal($event))"
              />

              @if (productsLoading()) {
                <div class="wiz-loading"><div class="spinner"></div></div>
              } @else if (wizardProducts().length === 0) {
                <div class="wiz-empty">Aucun produit actif trouvé.</div>
              } @else {
                <div class="product-select-grid">
                  @for (p of wizardProducts(); track p.id) {
                    <div
                      class="psc"
                      [class.psc-selected]="isSelected(p.id)"
                      (click)="toggleProduct(p.id)"
                    >
                      <div class="psc-check-wrap">
                        <div class="psc-check" [class.checked]="isSelected(p.id)">
                          @if (isSelected(p.id)) {
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          }
                        </div>
                      </div>
                      @if (p.mainImageUrl) {
                        <img [src]="p.mainImageUrl" class="psc-img" [alt]="p.name" (error)="onImgError($event)" />
                      } @else {
                        <div class="psc-img-ph">🛍️</div>
                      }
                      <div class="psc-info">
                        <div class="psc-name">{{ p.name }}</div>
                        <div class="psc-price">{{ (p.sellingPrice ?? p.estimatedPrice) | number }} <span class="psc-curr">{{ p.currencyCode }}</span></div>
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="step-footer">
                <span class="sel-count">
                  @if (selectedProductIds().size > 0) {
                    {{ selectedProductIds().size }} produit(s) sélectionné(s)
                  } @else {
                    Sélectionnez au moins un produit
                  }
                </span>
                <button class="btn-next" [disabled]="selectedProductIds().size === 0" (click)="goToStep2()">
                  Continuer →
                </button>
              </div>
            </div>
          }

          <!-- ===== STEP 2: Configure discount ===== -->
          @if (step() === 2) {
            <div class="wizard-step">
              @if (createError()) {
                <div class="alert-error">{{ createError() }}</div>
              }

              <!-- Discount type -->
              <div class="field">
                <label class="field-label">Type de remise</label>
                <div class="discount-type-btns">
                  <button
                    type="button"
                    class="discount-type-btn"
                    [class.active]="discountType() === 'percent'"
                    (click)="discountType.set('percent')"
                  >% Pourcentage</button>
                  <button
                    type="button"
                    class="discount-type-btn"
                    [class.active]="discountType() === 'fixed'"
                    (click)="discountType.set('fixed')"
                  >Montant fixe</button>
                </div>
              </div>

              <!-- Discount value -->
              <div class="field">
                <label class="field-label">
                  {{ discountType() === 'percent' ? 'Remise (%)' : 'Remise (XOF)' }}
                  <span class="req">*</span>
                </label>
                <div class="price-wrap">
                  <input
                    type="number"
                    class="field-input"
                    min="0"
                    placeholder="0"
                    [value]="discountValue()"
                    (input)="discountValue.set(getNumVal($event))"
                  />
                  <span class="price-sfx">{{ discountType() === 'percent' ? '%' : 'XOF' }}</span>
                </div>
              </div>

              <!-- Preview table -->
              @if (selectedProducts().length > 0 && discountValue() > 0) {
                <div class="preview-wrap">
                  <div class="preview-title">Aperçu des remises</div>
                  <table class="preview-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th class="num">Prix normal</th>
                        <th class="num">Prix promo</th>
                        <th class="num">Économie</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of selectedProducts(); track p.id) {
                        <tr>
                          <td class="pt-name">{{ p.name }}</td>
                          <td class="num">{{ (p.sellingPrice ?? p.estimatedPrice) | number }} {{ p.currencyCode }}</td>
                          <td class="num promo-val">{{ calcPromoPrice(+(p.sellingPrice ?? p.estimatedPrice)) | number }}</td>
                          <td class="num saving-val">
                            -{{ ((+(p.sellingPrice ?? p.estimatedPrice)) - calcPromoPrice(+(p.sellingPrice ?? p.estimatedPrice))) | number }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- Dates + note -->
              <form [formGroup]="step2Form" (ngSubmit)="submit()">
                <div class="form-row">
                  <div class="field">
                    <label class="field-label">Début <span class="req">*</span></label>
                    <input type="datetime-local" class="field-input" formControlName="startsAt" />
                  </div>
                  <div class="field">
                    <label class="field-label">Fin <span class="req">*</span></label>
                    <input type="datetime-local" class="field-input" formControlName="endsAt" />
                  </div>
                </div>
                <div class="field">
                  <label class="field-label">Note <span class="opt">— optionnelle</span></label>
                  <input type="text" class="field-input" formControlName="note" placeholder="Ex: Black Friday, Soldes..." />
                </div>
                <div class="step-footer">
                  <button type="button" class="btn-back" (click)="step.set(1)">← Retour</button>
                  <button
                    type="submit"
                    class="btn-submit"
                    [disabled]="step2Form.invalid || creating() || discountValue() <= 0"
                  >
                    {{ creating() ? 'Création...' : 'Créer ' + selectedProductIds().size + ' promotion(s)' }}
                  </button>
                </div>
              </form>
            </div>
          }
        </div>
      }

      <!-- Filters -->
      <div class="filter-row">
        @for (f of filters; track f.value) {
          <button class="filter-btn" [class.active]="statusFilter() === f.value" (click)="statusFilter.set(f.value); load()">
            {{ f.label }}
            @if (getCount(f.value) > 0) { <span class="fc">{{ getCount(f.value) }}</span> }
          </button>
        }
      </div>

      <!-- List -->
      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div> Chargement...</div>
      }
      @if (!loading() && filtered().length === 0) {
        <div class="empty-state">
          <div style="font-size:2.5rem">🏷️</div>
          <div>Aucune promotion{{ statusFilter() ? ' avec ce statut' : '' }}.</div>
        </div>
      }

      <div class="promo-list">
        @for (promo of filtered(); track promo.id) {
          <div class="promo-card" [class.promo-active]="promo.status === 'ACTIVE'" [class.promo-upcoming]="promo.status === 'UPCOMING'">
            <div class="promo-product">
              <div class="promo-product-img">
                @if (promo.catalogProduct.mainImageUrl) {
                  <img [src]="promo.catalogProduct.mainImageUrl" [alt]="promo.catalogProduct.name" (error)="onImgError($event)" />
                } @else {
                  <span>🛍️</span>
                }
              </div>
              <div class="promo-product-info">
                <div class="promo-product-name">{{ promo.catalogProduct.name }}</div>
                <div class="promo-prices">
                  <span class="promo-price-val">{{ promo.promoPrice | number }} {{ promo.catalogProduct.currencyCode }}</span>
                  <span class="promo-original">au lieu de {{ (promo.catalogProduct.sellingPrice ?? promo.catalogProduct.estimatedPrice) | number }}</span>
                  <span class="promo-discount">
                    -{{ (((promo.catalogProduct.sellingPrice ?? promo.catalogProduct.estimatedPrice) - promo.promoPrice) / ((promo.catalogProduct.sellingPrice ?? promo.catalogProduct.estimatedPrice) || 1) * 100) | number:'1.0-0' }}%
                  </span>
                </div>
                @if (promo.note) {
                  <div class="promo-note">{{ promo.note }}</div>
                }
              </div>
            </div>

            <div class="promo-dates">
              <div class="date-row">
                <span class="date-label">Début</span>
                <span class="date-val">{{ promo.startsAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="date-row">
                <span class="date-label">Fin</span>
                <span class="date-val">{{ promo.endsAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              @if (promo.status === 'ACTIVE') {
                <div class="countdown">Expire {{ promo.endsAt | date:'dd/MM à HH:mm' }}</div>
              }
            </div>

            <div class="promo-right">
              <span class="status-badge"
                [style.background]="getMeta(promo.status).bg"
                [style.color]="getMeta(promo.status).color">
                {{ getMeta(promo.status).label }}
              </span>
              @if (promo.status === 'ACTIVE' || promo.status === 'UPCOMING') {
                <button class="btn-end" (click)="endPromo(promo)" [disabled]="endingId() === promo.id">
                  {{ endingId() === promo.id ? '...' : 'Terminer' }}
                </button>
              }
              <div class="promo-created">Créée {{ promo.createdAt | date:'dd/MM/yyyy' }}</div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 1200px; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    h1 { font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 0.88rem; margin: 0; }

    .btn-create {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; border: 0; border-radius: 10px;
      background: #6366f1; color: white;
      font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: 0.15s;
    }
    .btn-create:hover { background: #4f46e5; }

    /* === Wizard === */
    .wizard-card {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 16px;
      padding: 22px; display: flex; flex-direction: column; gap: 20px;
    }

    /* Steps indicator */
    .wizard-steps { display: flex; align-items: center; gap: 0; }
    .wstep { display: flex; align-items: center; gap: 8px; }
    .wstep-num {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800;
      background: #f1f5f9; color: #94a3b8; transition: 0.2s;
    }
    .wstep.active .wstep-num { background: #6366f1; color: white; }
    .wstep.done .wstep-num { background: #22c55e; color: white; }
    .wstep-label { font-size: 0.82rem; font-weight: 700; color: #94a3b8; }
    .wstep.active .wstep-label { color: #0f172a; }
    .wstep.done .wstep-label { color: #166534; }
    .wstep-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 12px; min-width: 40px; }

    .wizard-step { display: flex; flex-direction: column; gap: 14px; }
    .wizard-search {
      padding: 9px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font: inherit; font-size: 0.88rem; outline: 0; width: 100%; box-sizing: border-box;
    }
    .wizard-search:focus { border-color: #6366f1; }

    .wiz-loading { display: flex; justify-content: center; padding: 24px; }
    .wiz-empty { text-align: center; color: #94a3b8; padding: 24px; font-size: 0.88rem; }

    /* Product select grid */
    .product-select-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;
      max-height: 360px; overflow-y: auto; padding-right: 4px;
    }
    .psc {
      border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px;
      cursor: pointer; transition: 0.15s; display: flex; flex-direction: column; gap: 8px;
      position: relative; background: white;
    }
    .psc:hover { border-color: #a5b4fc; }
    .psc-selected { border-color: #6366f1; background: #f5f3ff; }
    .psc-check-wrap { position: absolute; top: 8px; right: 8px; }
    .psc-check {
      width: 18px; height: 18px; border-radius: 5px; border: 2px solid #d1d5db;
      display: flex; align-items: center; justify-content: center; background: white; transition: 0.15s;
    }
    .psc-check.checked { background: #6366f1; border-color: #6366f1; }
    .psc-img { width: 100%; height: 80px; object-fit: cover; border-radius: 8px; }
    .psc-img-ph { height: 80px; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: #f8fafc; border-radius: 8px; }
    .psc-info { display: flex; flex-direction: column; gap: 2px; }
    .psc-name { font-size: 0.78rem; font-weight: 700; color: #0f172a; line-height: 1.3; }
    .psc-price { font-size: 0.82rem; font-weight: 800; color: #374151; }
    .psc-curr { font-size: 0.68rem; color: #94a3b8; }

    /* Step footer */
    .step-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 4px; }
    .sel-count { font-size: 0.8rem; color: #64748b; font-weight: 600; }
    .btn-next {
      padding: 9px 20px; border: 0; border-radius: 10px;
      background: #6366f1; color: white;
      font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: 0.15s;
    }
    .btn-next:hover:not(:disabled) { background: #4f46e5; }
    .btn-next:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

    /* Step 2 */
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-label { font-size: 0.78rem; font-weight: 700; color: #374151; }
    .req { color: #ef4444; }
    .opt { font-weight: 500; color: #94a3b8; }
    .field-input, input[type='text'], input[type='number'], input[type='datetime-local'] {
      padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px;
      font: inherit; font-size: 0.88rem; outline: 0; transition: 0.2s;
      background: #f8fafc; box-sizing: border-box; width: 100%;
    }
    .field-input:focus, input:focus { border-color: #6366f1; background: white; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .discount-type-btns { display: flex; gap: 8px; }
    .discount-type-btn {
      padding: 8px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      background: white; font: inherit; font-size: 0.82rem; font-weight: 700;
      color: #64748b; cursor: pointer; transition: 0.15s;
    }
    .discount-type-btn.active { background: #6366f1; border-color: #6366f1; color: white; }

    .price-wrap { position: relative; }
    .price-wrap .field-input, .price-wrap input { padding-right: 52px; }
    .price-sfx {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      font-size: 0.72rem; font-weight: 700; color: #94a3b8; pointer-events: none;
    }

    /* Preview table */
    .preview-wrap { display: flex; flex-direction: column; gap: 8px; }
    .preview-title { font-size: 0.78rem; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
    .preview-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .preview-table th { padding: 6px 10px; background: #f8fafc; font-weight: 700; color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .preview-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #374151; }
    .preview-table th.num, .preview-table td.num { text-align: right; }
    .pt-name { font-weight: 600; max-width: 180px; }
    .promo-val { font-weight: 800; color: #dc2626; }
    .saving-val { color: #166534; font-weight: 700; }

    .btn-back {
      padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      background: white; font: inherit; font-size: 0.88rem; font-weight: 600;
      color: #64748b; cursor: pointer; transition: 0.15s;
    }
    .btn-back:hover { background: #f8fafc; }
    .btn-submit {
      padding: 10px 24px; border: 0; border-radius: 10px;
      background: #6366f1; color: white;
      font: inherit; font-size: 0.9rem; font-weight: 800; cursor: pointer; transition: 0.15s;
    }
    .btn-submit:hover:not(:disabled) { background: #4f46e5; }
    .btn-submit:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

    .alert-error {
      padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 9px; font-size: 0.82rem; color: #991b1b;
    }

    /* Filters */
    .filter-row { display: flex; gap: 7px; flex-wrap: wrap; }
    .filter-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border: 1.5px solid #e2e8f0; border-radius: 999px;
      background: white; font: inherit; font-size: 0.8rem; font-weight: 600;
      color: #64748b; cursor: pointer; transition: 0.15s;
    }
    .filter-btn:hover { border-color: #6366f1; color: #6366f1; }
    .filter-btn.active { background: #6366f1; border-color: #6366f1; color: white; }
    .fc { background: rgba(255,255,255,0.25); padding: 1px 6px; border-radius: 999px; font-size: 0.68rem; font-weight: 800; }
    .filter-btn:not(.active) .fc { background: #f1f5f9; color: #64748b; }

    /* Loading / empty */
    .loading-state, .empty-state {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 48px; color: #94a3b8; font-size: 0.9rem; flex-direction: column;
    }
    .spinner {
      width: 20px; height: 20px; border: 2px solid #f1f5f9; border-top-color: #6366f1;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Promo list */
    .promo-list { display: flex; flex-direction: column; gap: 10px; }
    .promo-card {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 14px;
      padding: 16px 20px; display: grid; grid-template-columns: 1fr auto auto;
      gap: 20px; align-items: center; transition: 0.15s;
    }
    .promo-card:hover { border-color: #c7d2fe; }
    .promo-active { border-color: #86efac; background: #f0fdf4; }
    .promo-upcoming { border-color: #93c5fd; background: #eff6ff; }

    .promo-product { display: flex; align-items: center; gap: 14px; }
    .promo-product-img {
      width: 52px; height: 52px; border-radius: 10px;
      background: #f1f5f9; display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; flex-shrink: 0; overflow: hidden;
    }
    .promo-product-img img { width: 100%; height: 100%; object-fit: cover; }
    .promo-product-name { font-size: 0.9rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .promo-prices { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .promo-price-val { font-size: 1rem; font-weight: 900; color: #dc2626; }
    .promo-original { font-size: 0.75rem; color: #94a3b8; text-decoration: line-through; }
    .promo-discount {
      background: #dc2626; color: white; font-size: 0.68rem; font-weight: 800;
      padding: 2px 7px; border-radius: 999px;
    }
    .promo-note { font-size: 0.75rem; color: #64748b; margin-top: 4px; font-style: italic; }

    .promo-dates { display: flex; flex-direction: column; gap: 4px; min-width: 160px; }
    .date-row { display: flex; gap: 8px; align-items: center; }
    .date-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; width: 36px; flex-shrink: 0; }
    .date-val { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .countdown { font-size: 0.72rem; color: #166534; font-weight: 700; margin-top: 4px; }

    .promo-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
    .status-badge { padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
    .btn-end {
      padding: 6px 14px; border: 1.5px solid #fecaca; border-radius: 8px;
      background: white; color: #dc2626; font: inherit; font-size: 0.78rem; font-weight: 700;
      cursor: pointer; transition: 0.15s;
    }
    .btn-end:hover:not(:disabled) { background: #fef2f2; }
    .btn-end:disabled { opacity: 0.5; cursor: not-allowed; }
    .promo-created { font-size: 0.7rem; color: #94a3b8; }

    @media (max-width: 900px) {
      .promo-card { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .promo-right { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
      .product-select-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
    }
  `],
})
export class PromotionsAdminPageComponent implements OnInit {
  private readonly service = inject(PromotionsService);
  private readonly catalogService = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly promotions = signal<Promotion[]>([]);
  readonly products = signal<CatalogProduct[]>([]);
  readonly loading = signal(false);
  readonly productsLoading = signal(false);
  readonly showForm = signal(false);
  readonly creating = signal(false);
  readonly endingId = signal<number | null>(null);
  readonly statusFilter = signal<PromotionStatus | ''>('');
  readonly createError = signal('');

  // Wizard state
  readonly step = signal<1 | 2>(1);
  readonly wizardSearch = signal('');
  readonly selectedProductIds = signal<Set<number>>(new Set());
  readonly discountType = signal<'percent' | 'fixed'>('percent');
  readonly discountValue = signal<number>(0);

  readonly wizardProducts = computed(() => {
    const s = this.wizardSearch().toLowerCase().trim();
    if (!s) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(s) || (p.brand ?? '').toLowerCase().includes(s)
    );
  });

  readonly selectedProducts = computed(() =>
    this.products().filter(p => this.selectedProductIds().has(p.id))
  );

  readonly filters = [
    { label: 'Toutes', value: '' as const },
    { label: 'Actives', value: 'ACTIVE' as PromotionStatus },
    { label: 'À venir', value: 'UPCOMING' as PromotionStatus },
    { label: 'Terminées', value: 'ENDED' as PromotionStatus },
    { label: 'Annulées', value: 'CANCELLED' as PromotionStatus },
  ];

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    if (!f) return this.promotions();
    return this.promotions().filter(p => p.status === f);
  });

  readonly total = computed(() => this.promotions().length);
  readonly activeCount = computed(() => this.promotions().filter(p => p.status === 'ACTIVE').length);
  readonly upcomingCount = computed(() => this.promotions().filter(p => p.status === 'UPCOMING').length);

  getCount(value: string): number {
    if (!value) return this.promotions().length;
    return this.promotions().filter(p => p.status === value).length;
  }

  getMeta(status: PromotionStatus) {
    return STATUS_META[status] ?? STATUS_META['ENDED'];
  }

  readonly step2Form = this.fb.group({
    startsAt: ['', [Validators.required]],
    endsAt: ['', [Validators.required]],
    note: [''],
  });

  ngOnInit(): void {
    this.load();
    this.productsLoading.set(true);
    this.catalogService.getProducts(undefined, 'ACTIVE').subscribe({
      next: products => { this.products.set(products); this.productsLoading.set(false); },
      error: () => this.productsLoading.set(false),
    });
  }

  load(): void {
    this.loading.set(true);
    const status = this.statusFilter() as PromotionStatus | undefined;
    this.service.getAll(status || undefined).subscribe({
      next: promos => { this.promotions.set(promos); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleProduct(id: number): void {
    const s = new Set(this.selectedProductIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedProductIds.set(s);
  }

  isSelected(id: number): boolean {
    return this.selectedProductIds().has(id);
  }

  calcPromoPrice(normalPrice: number): number {
    const v = Number(this.discountValue());
    if (this.discountType() === 'percent') {
      return Math.max(0, Math.round(normalPrice * (1 - v / 100)));
    }
    return Math.max(0, Math.round(normalPrice - v));
  }

  goToStep2(): void {
    if (this.selectedProductIds().size === 0) return;
    this.step.set(2);
  }

  resetWizard(): void {
    this.step.set(1);
    this.wizardSearch.set('');
    this.selectedProductIds.set(new Set());
    this.discountType.set('percent');
    this.discountValue.set(0);
    this.step2Form.reset();
    this.createError.set('');
  }

  toggleForm(): void {
    if (this.showForm()) {
      this.showForm.set(false);
      this.resetWizard();
    } else {
      this.showForm.set(true);
    }
  }

  submit(): void {
    if (this.step2Form.invalid || this.creating() || this.selectedProducts().length === 0) return;
    this.creating.set(true);
    this.createError.set('');
    const raw = this.step2Form.getRawValue();
    const requests = this.selectedProducts().map(product => {
      const normalPrice = Number(product.sellingPrice ?? product.estimatedPrice);
      return this.service.create({
        catalogProductId: product.id,
        promoPrice: this.calcPromoPrice(normalPrice),
        startsAt: raw.startsAt!,
        endsAt: raw.endsAt!,
        note: raw.note || undefined,
      });
    });
    forkJoin(requests).subscribe({
      next: () => {
        this.creating.set(false);
        this.showForm.set(false);
        this.resetWizard();
        this.toast.success(`${requests.length} promotion(s) créée(s) avec succès.`);
        this.load();
      },
      error: (e: any) => {
        this.creating.set(false);
        this.createError.set(e?.error?.message ?? 'Erreur lors de la création');
      },
    });
  }

  endPromo(promo: Promotion): void {
    this.endingId.set(promo.id);
    this.service.end(promo.id).subscribe({
      next: () => {
        this.endingId.set(null);
        this.toast.success('Promotion terminée.');
        this.load();
      },
      error: (e: any) => {
        this.endingId.set(null);
        this.toast.error(e?.error?.message ?? 'Erreur');
      },
    });
  }

  getInputVal(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  getNumVal(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
