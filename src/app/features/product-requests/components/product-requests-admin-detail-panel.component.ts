import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CatalogCategory } from '../../catalog/models/catalog-category.model';
import { ProductRequest, ProductRequestReviewer } from '../models/product-request.model';
import {
  PRODUCT_REQUEST_STATUS_META,
  ProductRequestActionMode,
} from '../models/product-request-admin.types';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-product-requests-admin-detail-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="detail-panel">
      @if (!request) {
        <div class="detail-placeholder">
          <div>📋</div>
          <div>Sélectionnez une demande pour la traiter</div>
        </div>
      }

      @if (request; as r) {
        <div class="detail-head">
          <div class="detail-head-left">
            <div class="detail-name">{{ r.name }}</div>
            <div class="detail-meta">
              <span>{{ r.requestedBy.name }}</span>
              <span>·</span>
              <span>{{ r.event.title }}</span>
              <span>·</span>
              <span>{{ r.createdAt | date: 'dd MMM yyyy' }}</span>
            </div>
          </div>
          <span class="detail-badge" [style.background]="meta(r.status).bg" [style.color]="meta(r.status).color">
            {{ meta(r.status).emoji }} {{ meta(r.status).label }}
          </span>
        </div>

        @if (r.status === 'UNDER_REVIEW') {
          <div class="lock-banner">
            <lucide-icon name="lock" [size]="16" color="currentColor" [strokeWidth]="1.8" />
            <span>En cours d'examen</span>
            @if (r.reviewedBy) {
              <span class="lock-by">· pris en charge par <strong>{{ r.reviewedBy.name }}</strong></span>
            }
          </div>

          @if (isSuperAdmin) {
            @if (!showReassign()) {
              <div class="reassign-bar">
                <span class="reassign-hint">Vous pouvez réaffecter cette demande à un autre admin.</span>
                <button type="button" class="btn-reassign" (click)="showReassign.set(true)">
                  ↪ Réaffecter
                </button>
              </div>
            }
            @if (showReassign()) {
              <div class="reassign-form">
                <span class="reassign-form-label">Choisir le nouvel admin :</span>
                <select class="reassign-select" [value]="reassignAdminId() ?? ''" (change)="onReassignChange($event)">
                  <option value="">— sélectionner —</option>
                  @for (a of adminsList; track a.id) {
                    <option [value]="a.id">
                      {{ a.name }}
                      @if (a.id === r.reviewedBy?.id) { (actuel) }
                      · {{ a.platformRole }}
                    </option>
                  }
                </select>
                <div class="reassign-actions">
                  <button
                    type="button"
                    class="btn-confirm-reassign"
                      [disabled]="!reassignAdminId() || reassignLoading"
                      (click)="submitReassign()"
                  >
                    {{ reassignLoading ? '...' : 'Confirmer' }}
                  </button>
                  <button type="button" class="btn-cancel-reassign" (click)="cancelReassign()">
                    Annuler
                  </button>
                </div>
              </div>
            }
          }
        }

        @if (r.status === 'SUBMITTED') {
          <div class="take-over-bar">
            <div class="take-over-text">
              <lucide-icon name="info" [size]="15" color="currentColor" [strokeWidth]="1.8" />
              Commencez par prendre en charge cette demande pour signaler aux autres admins que vous la traitez.
            </div>
            <button type="button" class="btn-take-over" [disabled]="actionLoading" (click)="takeOver.emit(r)">
              {{ actionLoading ? '...' : '🔍 Prendre en charge' }}
            </button>
          </div>
        }

        <div class="detail-section">
          <div class="ds-title">Informations produit</div>
          @if (r.imageUrl) {
            <div class="detail-img-wrap">
              <img [src]="r.imageUrl" [alt]="r.name" (error)="onImgError($event)" />
            </div>
          }
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Prix estimé</span>
              <span class="info-val">{{ r.estimatedPrice | number: '1.0-0' }} {{ r.currencyCode }}</span>
            </div>
            @if (r.description) {
              <div class="info-row">
                <span class="info-label">Description</span>
                <span class="info-val">{{ r.description }}</span>
              </div>
            }
            @if (r.referenceUrl) {
              <div class="info-row">
                <span class="info-label">Lien référence</span>
                <a [href]="r.referenceUrl" target="_blank" class="info-link">Voir →</a>
              </div>
            }
            <div class="info-row">
              <span class="info-label">Demandé par</span>
              <span class="info-val">{{ r.requestedBy.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Événement</span>
              <span class="info-val">{{ r.event.title }}</span>
            </div>
            @if (r.reviewComment) {
              <div class="info-row">
                <span class="info-label">Commentaire précédent</span>
                <span class="info-val italic">{{ r.reviewComment }}</span>
              </div>
            }
          </div>
        </div>

        @if (r.status === 'UNDER_REVIEW') {
          <div class="detail-section">
            @if (actionMode() === null) {
              <div class="action-btns">
                <button type="button" class="btn-action btn-approve" (click)="actionMode.set('approve')">
                  <lucide-icon name="check" [size]="15" color="currentColor" [strokeWidth]="1.8" />
                  Approuver et publier
                </button>
                <button type="button" class="btn-action btn-reject" (click)="actionMode.set('reject')">
                  <lucide-icon name="x" [size]="15" color="currentColor" [strokeWidth]="1.8" />
                  Refuser
                </button>
              </div>
            }

            @if (actionMode() === 'approve') {
              <div class="approve-header">
                <span class="approve-title">Approuver et publier</span>
                <button type="button" class="btn-cancel-mode" (click)="actionMode.set(null)">Annuler</button>
              </div>
              @if (reviewError) {
                <div class="alert-error">{{ reviewError }}</div>
              }
              <form [formGroup]="approveForm" (ngSubmit)="approveSubmit.emit()" class="approve-form">
                <div class="field">
                  <label class="field-label">Prix réel estimé</label>
                  <input type="number" formControlName="realPrice" min="0" />
                </div>
                <div class="field">
                  <label class="field-label">Prix de vente</label>
                  <input type="number" formControlName="sellingPrice" min="0" />
                </div>
                @if ((approveForm.get('realPrice')?.value || 0) > 0 && (approveForm.get('sellingPrice')?.value || 0) > 0) {
                  <div class="margin-box">
                    Marge : <strong>{{ ((approveForm.get('sellingPrice')?.value || 0) - (approveForm.get('realPrice')?.value || 0)) | number }} XOF</strong>
                    ({{ (((approveForm.get('sellingPrice')?.value || 0) - (approveForm.get('realPrice')?.value || 0)) / (approveForm.get('sellingPrice')?.value || 1) * 100) | number:'1.0-1' }}%)
                  </div>
                }

                <div class="catalog-fields">
                  <div class="prices-card-title">
                    <lucide-icon name="shopping-cart" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                    Catalogue
                  </div>
                  <div class="field">
                    <label class="field-label">Catégorie <span class="req">*</span></label>
                    <select formControlName="categoryId">
                      <option [ngValue]="null">Choisir une catégorie</option>
                      @for (c of categories; track c.id) {
                        <option [ngValue]="c.id">{{ c.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="pub-row">
                    <div class="field">
                      <label class="field-label">Nom produit</label>
                      <input type="text" formControlName="approvedProductName" />
                    </div>
                    <div class="field">
                      <label class="field-label">Slug <span class="req">*</span></label>
                      <input type="text" formControlName="approvedProductSlug" placeholder="ex: playstation-5" />
                    </div>
                  </div>
                </div>

                <div class="catalog-fields">
                  <div class="prices-card-title">
                    <lucide-icon name="calendar" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                    Item wishlist
                  </div>
                  <div class="pub-row">
                    <div class="field">
                      <label class="field-label">Prix de l'item <span class="req">*</span></label>
                      <div class="price-wrap">
                        <input type="number" formControlName="itemPrice" min="0" />
                        <span class="price-suffix">XOF</span>
                      </div>
                    </div>
                    <div class="field">
                      <label class="field-label">Quantité</label>
                      <input type="number" formControlName="itemQuantity" min="1" />
                    </div>
                  </div>
                </div>

                <div class="field">
                  <label class="field-label">Commentaire <span class="opt">— optionnel</span></label>
                  <textarea formControlName="reviewComment" rows="2" placeholder="Remarques pour l'organisateur..."></textarea>
                </div>

                <button type="submit" class="btn-publish" [disabled]="reviewLoading || approveForm.invalid">
                  {{ reviewLoading ? 'Validation...' : '✅ Valider et publier dans la wishlist' }}
                </button>
              </form>
            }

            @if (actionMode() === 'reject') {
              <div class="approve-header">
                <span class="reject-title">Refuser la demande</span>
                <button type="button" class="btn-cancel-mode" (click)="actionMode.set(null)">Annuler</button>
              </div>
              @if (reviewError) {
                <div class="alert-error">{{ reviewError }}</div>
              }
              <form [formGroup]="rejectForm" (ngSubmit)="rejectSubmit.emit()" class="approve-form">
                <div class="field">
                  <label class="field-label">Motif du refus <span class="opt">— optionnel</span></label>
                  <textarea formControlName="reviewComment" rows="3" placeholder="Expliquer pourquoi la demande est refusée..."></textarea>
                </div>
                <button type="submit" class="btn-submit-reject" [disabled]="reviewLoading">
                  {{ reviewLoading ? 'Enregistrement...' : '❌ Confirmer le refus' }}
                </button>
              </form>
            }
          </div>
        }

        @if (r.status === 'APPROVED') {
          <div class="detail-section publish-section">
            <div class="ds-title">🎯 Publier dans la wishlist</div>
            <div class="publish-desc">Le produit est dans le catalogue. Publiez-le dans la wishlist.</div>
            @if (publishError) {
              <div class="alert-error">{{ publishError }}</div>
            }
            <form [formGroup]="publishForm" (ngSubmit)="publishSubmit.emit()" class="publish-form">
              <div class="field">
                <label class="field-label">Nom de l'item</label>
                <input type="text" formControlName="name" />
              </div>
              <div class="pub-row">
                <div class="field">
                  <label class="field-label">Prix</label>
                  <div class="price-wrap">
                    <input type="number" formControlName="price" min="0" />
                    <span class="price-suffix">XOF</span>
                  </div>
                </div>
                <div class="field">
                  <label class="field-label">Quantité</label>
                  <input type="number" formControlName="quantity" min="1" />
                </div>
              </div>
              <button type="submit" class="btn-publish" [disabled]="publishLoading">
                {{ publishLoading ? 'Publication...' : '🚀 Publier dans la wishlist' }}
              </button>
            </form>
          </div>
        }

        @if (r.status === 'PUBLISHED') {
          <div class="published-notice">
            <div class="published-icon">🎉</div>
            <div>
              <div class="published-title">Demande publiée avec succès</div>
              <div class="published-desc">Le produit a été ajouté à la wishlist de l'organisateur.</div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .detail-panel {
        background: white;
        border: 1px solid #f1f5f9;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .detail-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 56px;
        color: #94a3b8;
        font-size: 0.88rem;
        min-height: 300px;
      }
      .detail-placeholder div:first-child { font-size: 2.5rem; }
      .detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 18px 20px; border-bottom: 1px solid #f1f5f9; }
      .detail-name { font-size: 1.05rem; font-weight: 800; color: #0f172a; }
      .detail-meta { font-size: 0.75rem; color: #94a3b8; margin-top: 3px; display: flex; gap: 6px; flex-wrap: wrap; }
      .detail-badge { padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
      .lock-banner { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #fffbeb; border-bottom: 1px solid #fde68a; font-size: 0.82rem; color: #92400e; font-weight: 600; flex-wrap: wrap; }
      .lock-by { font-weight: 400; }
      .reassign-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 20px; background: #f5f3ff; border-bottom: 1px solid #e0e7ff; flex-wrap: wrap; }
      .reassign-hint { font-size: 0.78rem; color: #5b21b6; flex: 1; }
      .btn-reassign { padding: 7px 14px; border: 1.5px solid #7c3aed; border-radius: 8px; background: white; color: #7c3aed; font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
      .btn-reassign:hover { background: #f5f3ff; }
      .reassign-form { display: flex; flex-direction: column; gap: 10px; padding: 14px 20px; background: #faf5ff; border-bottom: 1px solid #e0e7ff; }
      .reassign-form-label { font-size: 0.78rem; font-weight: 700; color: #5b21b6; }
      .reassign-select { padding: 9px 12px; border: 1.5px solid #c4b5fd; border-radius: 9px; font: inherit; font-size: 0.85rem; background: white; outline: 0; }
      .reassign-select:focus { border-color: #7c3aed; }
      .reassign-actions { display: flex; gap: 8px; }
      .btn-confirm-reassign { padding: 8px 18px; border: 0; border-radius: 8px; background: #7c3aed; color: white; font: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
      .btn-confirm-reassign:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }
      .btn-cancel-reassign { padding: 8px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: white; color: #64748b; font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
      .btn-cancel-reassign:hover { background: #f8fafc; }
      .take-over-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; background: #f0f4ff; border-bottom: 1px solid #e0e7ff; flex-wrap: wrap; }
      .take-over-text { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #3730a3; flex: 1; }
      .btn-take-over { padding: 8px 16px; border: 0; border-radius: 9px; background: #6366f1; color: white; font: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
      .btn-take-over:disabled { opacity: 0.5; cursor: not-allowed; }
      .detail-section { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 14px; }
      .ds-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
      .detail-img-wrap { height: 140px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
      .detail-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
      .info-grid { display: flex; flex-direction: column; gap: 0; }
      .info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
      .info-row:last-child { border-bottom: 0; }
      .info-label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; flex-shrink: 0; }
      .info-val { font-size: 0.82rem; color: #0f172a; font-weight: 600; text-align: right; }
      .info-val.italic { font-style: italic; color: #64748b; }
      .info-link { font-size: 0.82rem; font-weight: 700; color: #6366f1; text-decoration: none; }
      .alert-error { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; font-size: 0.82rem; color: #991b1b; }
      .approve-form, .publish-form { display: flex; flex-direction: column; gap: 14px; }
      .field { display: flex; flex-direction: column; gap: 5px; }
      .field-label { font-size: 0.78rem; font-weight: 700; color: #374151; display: flex; align-items: center; gap: 4px; }
      .req { color: #ef4444; }
      .opt { font-weight: 500; color: #94a3b8; }
      input[type='text'], input[type='number'], select, textarea { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px; font: inherit; outline: 0; transition: 0.2s; background: #f8fafc; box-sizing: border-box; width: 100%; }
      input:focus, select:focus, textarea:focus { border-color: #6366f1; background: white; }
      textarea { resize: vertical; }
      .action-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .btn-action { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 12px 16px; border: 2px solid transparent; border-radius: 12px; font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: 0.15s; }
      .btn-approve { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
      .btn-reject { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
      .approve-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
      .approve-title, .reject-title { font-size: 0.88rem; font-weight: 800; }
      .approve-title { color: #166534; }
      .reject-title { color: #991b1b; }
      .btn-cancel-mode { padding: 5px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: white; font: inherit; cursor: pointer; }
      .margin-box { padding: 10px 12px; border-radius: 10px; background: #f8fafc; color: #334155; font-size: 0.82rem; }
      .prices-card-title { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 8px; }
      .catalog-fields { padding: 12px; border: 1px solid #eef2ff; border-radius: 12px; background: #fafbff; display: flex; flex-direction: column; gap: 10px; }
      .pub-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .price-wrap { position: relative; }
      .price-suffix { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.78rem; font-weight: 700; pointer-events: none; }
      .btn-publish, .btn-submit-reject { padding: 12px 16px; border: 0; border-radius: 12px; font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; }
      .btn-publish { background: #4f46e5; color: white; }
      .btn-submit-reject { background: #991b1b; color: white; }
      .publish-section { background: #fbfbff; }
      .publish-desc { font-size: 0.86rem; color: #64748b; }
      .published-notice { display: flex; align-items: center; gap: 12px; padding: 14px 20px; background: #f0fdf4; color: #166534; }
      .published-icon { font-size: 1.5rem; }
      .published-title { font-weight: 800; }
      .published-desc { font-size: 0.84rem; color: #166534; }
      @media (max-width: 900px) {
        .pub-row { grid-template-columns: 1fr; }
        .action-btns { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class ProductRequestsAdminDetailPanelComponent implements OnChanges {
  @Input({ required: true }) request: ProductRequest | null = null;
  @Input({ required: true }) categories: CatalogCategory[] = [];
  @Input({ required: true }) adminsList: ProductRequestReviewer[] = [];
  @Input({ required: true }) approveForm!: FormGroup;
  @Input({ required: true }) rejectForm!: FormGroup;
  @Input({ required: true }) publishForm!: FormGroup;
  @Input() isSuperAdmin = false;
  @Input() actionLoading = false;
  @Input() reassignLoading = false;
  @Input() reviewLoading = false;
  @Input() reviewError = '';
  @Input() publishLoading = false;
  @Input() publishError = '';

  @Output() takeOver = new EventEmitter<ProductRequest>();
  @Output() approveSubmit = new EventEmitter<void>();
  @Output() rejectSubmit = new EventEmitter<void>();
  @Output() publishSubmit = new EventEmitter<void>();
  @Output() reassignSubmit = new EventEmitter<number>();
  actionMode = signal<ProductRequestActionMode>(null);
  showReassign = signal(false);
  reassignAdminId = signal<number | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['request']) {
      this.actionMode.set(null);
      this.showReassign.set(false);
      this.reassignAdminId.set(null);
    }
  }

  meta(status: ProductRequest['status']) {
    return PRODUCT_REQUEST_STATUS_META[status] ?? PRODUCT_REQUEST_STATUS_META.DRAFT;
  }

  onReassignChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.reassignAdminId.set(value ? Number(value) : null);
  }

  submitReassign(): void {
    const adminId = this.reassignAdminId();
    if (adminId == null) return;
    this.reassignSubmit.emit(adminId);
  }

  cancelReassign(): void {
    this.showReassign.set(false);
    this.reassignAdminId.set(null);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
