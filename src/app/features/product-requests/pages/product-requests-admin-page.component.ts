import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductRequestsService } from '../services/product-requests.service';
import { ProductRequest, ProductRequestReviewer, ProductRequestStatus } from '../models/product-request.model';
import { CatalogService } from '../../catalog/services/catalog.service';
import { CatalogCategory } from '../../catalog/models/catalog-category.model';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

type ActionMode = 'approve' | 'reject' | null;

const STATUS_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  DRAFT: { label: 'Brouillon', emoji: '✏️', color: '#6b7280', bg: '#f3f4f6' },
  SUBMITTED: { label: 'En attente', emoji: '📬', color: '#1d4ed8', bg: '#dbeafe' },
  UNDER_REVIEW: { label: "En cours d'examen", emoji: '🔍', color: '#92400e', bg: '#fef3c7' },
  APPROVED: { label: 'Approuvée', emoji: '✅', color: '#166534', bg: '#dcfce7' },
  REJECTED: { label: 'Refusée', emoji: '❌', color: '#991b1b', bg: '#fee2e2' },
  PUBLISHED: { label: 'Publiée', emoji: '🎉', color: '#6d28d9', bg: '#ede9fe' },
};

@Component({
  selector: 'app-product-requests-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Demandes produit</h1>
          <p class="subtitle">{{ pending() }} en attente · {{ total() }} total</p>
        </div>
        <button class="btn-refresh" (click)="loadRequests()">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10a6 6 0 016-6 6 6 0 015.66 4M16 4v4h-4M16 10a6 6 0 01-6 6 6 6 0 01-5.66-4M4 16v-4h4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          Actualiser
        </button>
      </div>

      <!-- Filtres -->
      <div class="filter-row">
        @for (f of filters; track f.value) {
          <button
            class="filter-btn"
            [class.active]="statusFilter() === f.value"
            (click)="statusFilter.set(f.value); loadRequests()"
          >
            {{ f.label }}
            @if (getCount(f.value) > 0) {
              <span class="fc">{{ getCount(f.value) }}</span>
            }
          </button>
        }
      </div>

      <!-- Layout master-detail -->
      <div class="two-col">
        <!-- LISTE -->
        <div class="list-panel">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              Chargement...
            </div>
          }
          @if (loadError()) {
            <div class="error-state">{{ loadError() }}</div>
          }

          @if (!loading() && filtered().length === 0) {
            <div class="empty-state">
              <div>📦</div>
              <span>Aucune demande{{ statusFilter() ? ' avec ce statut' : '' }}.</span>
            </div>
          }

          @for (r of filtered(); track r.id) {
            <button
              class="req-item"
              [class.active]="selected()?.id === r.id"
              [class.locked]="r.status === 'UNDER_REVIEW'"
              (click)="select(r)"
            >
              <div class="req-item-img">
                @if (r.imageUrl) {
                  <img [src]="r.imageUrl" [alt]="r.name" (error)="onImgError($event)" />
                }
                @if (!r.imageUrl) {
                  <span>🛍️</span>
                }
              </div>
              <div class="req-item-info">
                <div class="req-item-name">{{ r.name }}</div>
                <div class="req-item-user">{{ r.requestedBy?.name ?? '—' }}</div>
                <div class="req-item-event">{{ r.event?.title ?? '—' }}</div>
              </div>
              <div class="req-item-right">
                <span
                  class="req-badge"
                  [style.background]="getMeta(r.status).bg"
                  [style.color]="getMeta(r.status).color"
                >
                  {{ getMeta(r.status).emoji }} {{ getMeta(r.status).label }}
                </span>
                @if (r.reviewedBy) {
                  <span class="req-reviewer">👤 {{ r.reviewedBy.name }}</span>
                }
                @if (r.estimatedPrice) {
                  <span class="req-price">{{ r.estimatedPrice | number: '1.0-0' }} XOF</span>
                }
              </div>
            </button>
          }
        </div>

        <!-- DÉTAIL + ACTIONS -->
        <div class="detail-panel">
          <!-- Placeholder -->
          @if (!selected()) {
            <div class="detail-placeholder">
              <div>📋</div>
              <div>Sélectionnez une demande pour la traiter</div>
            </div>
          }

          @if (selected(); as r) {
            <!-- Header détail -->
            <div class="detail-head">
              <div class="detail-head-left">
                <div class="detail-name">{{ r.name }}</div>
                <div class="detail-meta">
                  <span>{{ r.requestedBy?.name ?? '—' }}</span>
                  <span>·</span>
                  <span>{{ r.event?.title ?? '—' }}</span>
                  <span>·</span>
                  <span>{{ r.createdAt | date: 'dd MMM yyyy' }}</span>
                </div>
              </div>
              <span
                class="detail-badge"
                [style.background]="getMeta(r.status).bg"
                [style.color]="getMeta(r.status).color"
              >
                {{ getMeta(r.status).emoji }} {{ getMeta(r.status).label }}
              </span>
            </div>
            <!-- VERROU ANTI-DOUBLE : UNDER_REVIEW -->
            @if (r.status === 'UNDER_REVIEW') {
              <div class="lock-banner">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="9" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M6 9V7a4 4 0 018 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>En cours d'examen</span>
                @if (r.reviewedBy) {
                  <span class="lock-by">· pris en charge par <strong>{{ r.reviewedBy.name }}</strong></span>
                }
              </div>

              <!-- Réaffectation (super_admin uniquement) -->
              @if (isSuperAdmin()) {
                @if (!showReassign()) {
                  <div class="reassign-bar">
                    <span class="reassign-hint">Vous pouvez réaffecter cette demande à un autre admin.</span>
                    <button class="btn-reassign" (click)="showReassign.set(true)">
                      ↪ Réaffecter
                    </button>
                  </div>
                }
                @if (showReassign()) {
                  <div class="reassign-form">
                    <span class="reassign-form-label">Choisir le nouvel admin :</span>
                    <select
                      class="reassign-select"
                      (change)="reassignAdminId.set(+$any($event.target).value || null)"
                    >
                      <option value="">— sélectionner —</option>
                      @for (a of adminsList(); track a.id) {
                        <option [value]="a.id">
                          {{ a.name }}
                          @if (a.id === r.reviewedBy?.id) { (actuel) }
                          · {{ a.platformRole }}
                        </option>
                      }
                    </select>
                    <div class="reassign-actions">
                      <button
                        class="btn-confirm-reassign"
                        [disabled]="!reassignAdminId() || reassignLoading()"
                        (click)="doReassign(r)"
                      >
                        {{ reassignLoading() ? '...' : 'Confirmer' }}
                      </button>
                      <button class="btn-cancel-reassign" (click)="showReassign.set(false); reassignAdminId.set(null)">
                        Annuler
                      </button>
                    </div>
                  </div>
                }
              }
            }
            <!-- Bouton "Prendre en charge" si SUBMITTED -->
            @if (r.status === 'SUBMITTED') {
              <div class="take-over-bar">
                <div class="take-over-text">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4" />
                    <path
                      d="M10 6v5M10 13.5v.5"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                    />
                  </svg>
                  Commencez par prendre en charge cette demande pour signaler aux autres admins que
                  vous la traitez.
                </div>
                <button class="btn-take-over" [disabled]="actionLoading()" (click)="takeOver(r)">
                  {{ actionLoading() ? '...' : '🔍 Prendre en charge' }}
                </button>
              </div>
            }
            <!-- Infos produit -->
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
                  <span class="info-val"
                    >{{ r.estimatedPrice | number: '1.0-0' }} {{ r.currencyCode }}</span
                  >
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
                @if (r.requestedBy) {
                  <div class="info-row">
                    <span class="info-label">Demandé par</span>
                    <span class="info-val">{{ r.requestedBy.name }}</span>
                  </div>
                }
                @if (r.event) {
                  <div class="info-row">
                    <span class="info-label">Événement</span>
                    <span class="info-val">{{ r.event.title }}</span>
                  </div>
                }
                @if (r.reviewComment) {
                  <div class="info-row">
                    <span class="info-label">Commentaire précédent</span>
                    <span class="info-val italic">{{ r.reviewComment }}</span>
                  </div>
                }
              </div>
            </div>
            <!-- ACTIONS : uniquement après prise en charge -->
            @if (r.status === 'UNDER_REVIEW') {
              <div class="detail-section">
                <!-- Sélecteur d'action -->
                @if (actionMode() === null) {
                  <div class="action-btns">
                    <button class="btn-action btn-approve" (click)="actionMode.set('approve')">
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                        <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Approuver et publier
                    </button>
                    <button class="btn-action btn-reject" (click)="actionMode.set('reject')">
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      Refuser
                    </button>
                  </div>
                }

                <!-- FORMULAIRE APPROBATION -->
                @if (actionMode() === 'approve') {
                  <div class="approve-header">
                    <span class="approve-title">Valider la demande</span>
                    <button class="btn-cancel-mode" type="button" (click)="actionMode.set(null)">Annuler</button>
                  </div>
                  @if (reviewError) {
                    <div class="alert-error">{{ reviewError }}</div>
                  }
                  <form [formGroup]="approveForm" (ngSubmit)="submitApprove()" class="approve-form">

                    <!-- Prix - Section mise en avant -->
                    <div class="prices-card">
                      <div class="prices-card-title">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <rect x="1" y="5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/>
                          <path d="M1 9h18" stroke="currentColor" stroke-width="1.6"/>
                          <path d="M5 13h3M13 13h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                        </svg>
                        Tarification
                      </div>
                      <div class="price-row">
                        <div class="field">
                          <label class="field-label">Prix réel <span class="field-hint-inline">coût d'achat</span></label>
                          <div class="price-wrap">
                            <input type="number" formControlName="realPrice" min="0" placeholder="0" />
                            <span class="price-suffix">XOF</span>
                          </div>
                        </div>
                        <div class="field">
                          <label class="field-label">Prix de vente <span class="field-hint-inline">prix affiché</span></label>
                          <div class="price-wrap">
                            <input type="number" formControlName="sellingPrice" min="0" placeholder="0" />
                            <span class="price-suffix">XOF</span>
                          </div>
                        </div>
                      </div>
                      @if ((approveForm.get('realPrice')?.value || 0) > 0 && (approveForm.get('sellingPrice')?.value || 0) > 0) {
                        <div class="margin-preview">
                          Marge : <strong>{{ ((approveForm.get('sellingPrice')?.value || 0) - (approveForm.get('realPrice')?.value || 0)) | number }} XOF</strong>
                          ({{ (((approveForm.get('sellingPrice')?.value || 0) - (approveForm.get('realPrice')?.value || 0)) / (approveForm.get('sellingPrice')?.value || 1) * 100) | number:'1.0-1' }}%)
                        </div>
                      }
                    </div>

                    <!-- Infos catalogue -->
                    <div class="catalog-fields">
                      <div class="prices-card-title">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Catalogue
                      </div>
                      <div class="field">
                        <label class="field-label">Catégorie <span class="req">*</span></label>
                        <select formControlName="categoryId">
                          <option [ngValue]="null">Choisir une catégorie</option>
                          @for (c of categories(); track c.id) {
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

                    <!-- Infos item wishlist -->
                    <div class="catalog-fields">
                      <div class="prices-card-title">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                          <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/>
                          <path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                        </svg>
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

                <!-- FORMULAIRE REFUS -->
                @if (actionMode() === 'reject') {
                  <div class="approve-header">
                    <span class="reject-title">Refuser la demande</span>
                    <button class="btn-cancel-mode" type="button" (click)="actionMode.set(null)">Annuler</button>
                  </div>
                  @if (reviewError) {
                    <div class="alert-error">{{ reviewError }}</div>
                  }
                  <form [formGroup]="rejectForm" (ngSubmit)="submitReject()" class="approve-form">
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

            <!-- Déjà approuvé sans publication (ancien flux) -->
            @if (r.status === 'APPROVED') {
              <div class="detail-section publish-section">
                <div class="ds-title">🎯 Publier dans la wishlist</div>
                <div class="publish-desc">Le produit est dans le catalogue. Publiez-le dans la wishlist.</div>
                @if (publishError) {
                  <div class="alert-error">{{ publishError }}</div>
                }
                <form [formGroup]="publishForm" (ngSubmit)="submitPublish()" class="publish-form">
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
            <!-- Déjà publié -->
            @if (r.status === 'PUBLISHED') {
              <div class="published-notice">
                <div class="published-icon">🎉</div>
                <div>
                  <div class="published-title">Demande publiée avec succès</div>
                  <div class="published-desc">
                    Le produit a été ajouté à la wishlist de l'organisateur.
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 28px 32px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 1400px;
      }
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 900;
        color: #0f172a;
        margin: 0 0 4px;
      }
      .subtitle {
        color: #64748b;
        font-size: 0.88rem;
        margin: 0;
      }
      .btn-refresh {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 9px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 9px;
        background: white;
        color: #374151;
        font: inherit;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-refresh:hover {
        background: #f8fafc;
      }

      /* Filtres */
      .filter-row {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
      }
      .filter-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 999px;
        background: white;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: 0.15s;
      }
      .filter-btn:hover {
        border-color: #6366f1;
        color: #6366f1;
      }
      .filter-btn.active {
        background: #6366f1;
        border-color: #6366f1;
        color: white;
      }
      .fc {
        background: rgba(255, 255, 255, 0.25);
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 800;
      }
      .filter-btn:not(.active) .fc {
        background: #f1f5f9;
        color: #64748b;
      }

      /* Layout */
      .two-col {
        display: grid;
        grid-template-columns: 380px 1fr;
        gap: 16px;
        align-items: start;
        min-height: 500px;
      }

      /* Liste */
      .list-panel {
        background: white;
        border: 1px solid #f1f5f9;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .loading-state,
      .error-state,
      .empty-state {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        padding: 40px;
        color: #94a3b8;
        font-size: 0.9rem;
        flex-direction: column;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f1f5f9;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .error-state {
        color: #ef4444;
      }
      .empty-state div:first-child {
        font-size: 2rem;
      }

      .req-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border: 0;
        background: white;
        cursor: pointer;
        text-align: left;
        border-bottom: 1px solid #f8fafc;
        transition: 0.15s;
        width: 100%;
      }
      .req-item:hover {
        background: #f8fafc;
      }
      .req-item.active {
        background: #f0f0ff;
        border-left: 3px solid #6366f1;
      }
      .req-item.locked {
        background: #fffbeb;
      }
      .req-item-img {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        flex-shrink: 0;
        overflow: hidden;
      }
      .req-item-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .req-item-info {
        flex: 1;
        min-width: 0;
      }
      .req-item-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .req-item-user {
        font-size: 0.72rem;
        color: #94a3b8;
        margin-top: 1px;
      }
      .req-item-event {
        font-size: 0.72rem;
        color: #cbd5e1;
      }
      .req-item-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
      }
      .req-badge {
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        white-space: nowrap;
      }
      .req-price {
        font-size: 0.72rem;
        color: #64748b;
        font-weight: 600;
      }

      /* Détail */
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
      .detail-placeholder div:first-child {
        font-size: 2.5rem;
      }

      .detail-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 18px 20px;
        border-bottom: 1px solid #f1f5f9;
      }
      .detail-name {
        font-size: 1.05rem;
        font-weight: 800;
        color: #0f172a;
      }
      .detail-meta {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 3px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .detail-badge {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .req-reviewer {
        font-size: 0.68rem;
        color: #6366f1;
        font-weight: 600;
        white-space: nowrap;
      }

      /* Verrou UNDER_REVIEW */
      .lock-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: #fffbeb;
        border-bottom: 1px solid #fde68a;
        font-size: 0.82rem;
        color: #92400e;
        font-weight: 600;
        flex-wrap: wrap;
      }
      .lock-by { font-weight: 400; }

      /* Réaffectation */
      .reassign-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 20px;
        background: #f5f3ff;
        border-bottom: 1px solid #e0e7ff;
        flex-wrap: wrap;
      }
      .reassign-hint { font-size: 0.78rem; color: #5b21b6; flex: 1; }
      .btn-reassign {
        padding: 7px 14px;
        border: 1.5px solid #7c3aed;
        border-radius: 8px;
        background: white;
        color: #7c3aed;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-reassign:hover { background: #f5f3ff; }
      .reassign-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px 20px;
        background: #faf5ff;
        border-bottom: 1px solid #e0e7ff;
      }
      .reassign-form-label { font-size: 0.78rem; font-weight: 700; color: #5b21b6; }
      .reassign-select {
        padding: 9px 12px;
        border: 1.5px solid #c4b5fd;
        border-radius: 9px;
        font: inherit;
        font-size: 0.85rem;
        background: white;
        outline: 0;
      }
      .reassign-select:focus { border-color: #7c3aed; }
      .reassign-actions { display: flex; gap: 8px; }
      .btn-confirm-reassign {
        padding: 8px 18px;
        border: 0;
        border-radius: 8px;
        background: #7c3aed;
        color: white;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-confirm-reassign:hover:not(:disabled) { background: #6d28d9; }
      .btn-confirm-reassign:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }
      .btn-cancel-reassign {
        padding: 8px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        color: #64748b;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-cancel-reassign:hover { background: #f8fafc; }

      /* Take over bar */
      .take-over-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 20px;
        background: #f0f4ff;
        border-bottom: 1px solid #e0e7ff;
        flex-wrap: wrap;
      }
      .take-over-text {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        color: #3730a3;
        flex: 1;
      }
      .btn-take-over {
        padding: 8px 16px;
        border: 0;
        border-radius: 9px;
        background: #6366f1;
        color: white;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .btn-take-over:hover:not(:disabled) {
        background: #4f46e5;
      }
      .btn-take-over:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Sections */
      .detail-section {
        padding: 18px 20px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .ds-title {
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
      }
      .detail-img-wrap {
        height: 140px;
        background: #f1f5f9;
        border-radius: 10px;
        overflow: hidden;
      }
      .detail-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .info-grid {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #f8fafc;
      }
      .info-row:last-child {
        border-bottom: 0;
      }
      .info-label {
        font-size: 0.75rem;
        color: #94a3b8;
        font-weight: 600;
        flex-shrink: 0;
      }
      .info-val {
        font-size: 0.82rem;
        color: #0f172a;
        font-weight: 600;
        text-align: right;
      }
      .info-val.italic {
        font-style: italic;
        color: #64748b;
      }
      .info-link {
        font-size: 0.82rem;
        font-weight: 700;
        color: #6366f1;
        text-decoration: none;
      }

      /* Forms */
      .alert-error {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 9px;
        font-size: 0.82rem;
        color: #991b1b;
      }
      .approve-form,
      .publish-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .field-label {
        font-size: 0.78rem;
        font-weight: 700;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .req { color: #ef4444; }
      .opt { font-weight: 500; color: #94a3b8; }
      .field-hint-inline {
        font-weight: 400;
        color: #94a3b8;
        font-size: 0.72rem;
      }
      input[type='text'],
      input[type='number'],
      select {
        padding: 9px 12px;
        border: 1.5px solid #e2e8f0;
        border-radius: 9px;
        font: inherit;
        font-size: 0.88rem;
        outline: 0;
        transition: 0.2s;
        background: #f8fafc;
        box-sizing: border-box;
        width: 100%;
      }
      input:focus,
      select:focus {
        border-color: #6366f1;
        background: white;
      }
      textarea {
        padding: 9px 12px;
        border: 1.5px solid #e2e8f0;
        border-radius: 9px;
        font: inherit;
        font-size: 0.85rem;
        resize: vertical;
        outline: 0;
        transition: 0.2s;
        background: #f8fafc;
        box-sizing: border-box;
        width: 100%;
      }
      textarea:focus { border-color: #6366f1; background: white; }

      /* Action buttons */
      .action-btns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .btn-action {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 12px 16px;
        border: 2px solid transparent;
        border-radius: 12px;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.15s;
      }
      .btn-approve {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #166534;
      }
      .btn-approve:hover {
        background: #dcfce7;
        border-color: #86efac;
      }
      .btn-reject {
        background: #fef2f2;
        border-color: #fecaca;
        color: #991b1b;
      }
      .btn-reject:hover {
        background: #fee2e2;
        border-color: #fca5a5;
      }

      /* Approve form header */
      .approve-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .approve-title {
        font-size: 0.88rem;
        font-weight: 800;
        color: #166534;
      }
      .reject-title {
        font-size: 0.88rem;
        font-weight: 800;
        color: #991b1b;
      }
      .btn-cancel-mode {
        padding: 5px 12px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
      }
      .btn-cancel-mode:hover { background: #f8fafc; }

      /* Prices card */
      .prices-card {
        background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
        border: 1.5px solid #bbf7d0;
        border-radius: 12px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .catalog-fields {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .prices-card-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: #64748b;
      }
      .price-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .price-wrap { position: relative; }
      .price-wrap input { padding-right: 50px; }
      .price-suffix {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.72rem;
        font-weight: 700;
        color: #94a3b8;
        pointer-events: none;
      }
      .margin-preview {
        background: white;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 7px 12px;
        font-size: 0.82rem;
        color: #166534;
      }
      .pub-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .btn-publish {
        padding: 12px 24px;
        border: 0;
        border-radius: 10px;
        background: #22c55e;
        color: white;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-publish:hover:not(:disabled) { background: #16a34a; }
      .btn-publish:disabled {
        background: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
      }
      .btn-submit-reject {
        padding: 11px 20px;
        border: 0;
        border-radius: 10px;
        background: #ef4444;
        color: white;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
        align-self: flex-start;
      }
      .btn-submit-reject:hover:not(:disabled) { background: #dc2626; }
      .btn-submit-reject:disabled {
        background: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
      }

      /* Publish section (ancien flux APPROVED) */
      .publish-section {
        background: #f0fdf4;
        border-top: 2px solid #bbf7d0;
      }
      .publish-desc {
        font-size: 0.82rem;
        color: #166534;
      }

      /* Published notice */
      .published-notice {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: #f0fdf4;
      }
      .published-icon {
        font-size: 2rem;
      }
      .published-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #166534;
      }
      .published-desc {
        font-size: 0.82rem;
        color: #15803d;
        margin-top: 2px;
      }

      @media (max-width: 1100px) {
        .two-col {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProductRequestsAdminPageComponent implements OnInit {
  private readonly service = inject(ProductRequestsService);
  private readonly catalogService = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly requests = signal<ProductRequest[]>([]);
  readonly categories = signal<CatalogCategory[]>([]);
  readonly adminsList = signal<ProductRequestReviewer[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly actionLoading = signal(false);
  readonly reassignLoading = signal(false);
  readonly selected = signal<ProductRequest | null>(null);
  readonly statusFilter = signal('');
  readonly actionMode = signal<ActionMode>(null);
  readonly showReassign = signal(false);
  readonly reassignAdminId = signal<number | null>(null);

  readonly isSuperAdmin = computed(
    () => this.authService.getCurrentUserSnapshot()?.platformRole === 'SUPER_ADMIN',
  );

  reviewLoading = false;
  reviewError = '';
  publishLoading = false;
  publishError = '';

  readonly filters = [
    { label: 'Toutes', value: '' },
    { label: 'En attente', value: 'SUBMITTED' },
    { label: 'En cours', value: 'UNDER_REVIEW' },
    { label: 'Approuvées', value: 'APPROVED' },
    { label: 'Refusées', value: 'REJECTED' },
    { label: 'Publiées', value: 'PUBLISHED' },
  ];

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    if (!f) return this.requests();
    return this.requests().filter((r) => r.status === f);
  });

  readonly total = computed(() => this.requests().length);
  readonly pending = computed(
    () =>
      this.requests().filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length,
  );

  getCount(value: string): number {
    if (!value) return this.requests().length;
    return this.requests().filter((r) => r.status === value).length;
  }

  readonly approveForm = this.fb.group({
    reviewComment: [''],
    categoryId: [null as number | null, [Validators.required]],
    approvedProductName: [''],
    approvedProductSlug: ['', [Validators.required]],
    realPrice: [null as number | null, [Validators.min(0)]],
    sellingPrice: [null as number | null, [Validators.min(0)]],
    itemPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    itemQuantity: [1, [Validators.required, Validators.min(1)]],
  });

  readonly rejectForm = this.fb.group({
    reviewComment: [''],
  });

  readonly publishForm = this.fb.group({
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadRequests();
    this.loadCategories();
    if (this.isSuperAdmin()) this.loadAdminsList();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.loadError.set('');
    const status = this.statusFilter() ? (this.statusFilter() as ProductRequestStatus) : undefined;
    this.service.getAll(status).subscribe({
      next: (rs) => {
        this.requests.set(rs);
        this.loading.set(false);
      },
      error: (e) => {
        this.loadError.set(e?.error?.message ?? 'Erreur');
        this.loading.set(false);
      },
    });
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (cs) => this.categories.set(cs),
    });
  }

  loadAdminsList(): void {
    this.service.getAdminsList().subscribe({
      next: (admins) => this.adminsList.set(admins),
    });
  }

  select(r: ProductRequest): void {
    this.selected.set(r);
    this.actionMode.set(null);
    this.showReassign.set(false);
    this.reassignAdminId.set(null);
    this.reviewError = '';
    this.publishError = '';
    this.approveForm.reset({
      reviewComment: '',
      categoryId: r.category?.id ?? null,
      approvedProductName: r.name,
      approvedProductSlug: this.slugify(r.name),
      realPrice: null,
      sellingPrice: null,
      itemPrice: Number(r.estimatedPrice ?? 0) || null,
      itemQuantity: 1,
    });
    this.rejectForm.reset({ reviewComment: '' });
    this.publishForm.reset({ name: r.name, price: Number(r.estimatedPrice ?? 0), quantity: 1 });
  }

  takeOver(r: ProductRequest): void {
    this.actionLoading.set(true);
    this.service.review(r.id, { status: 'UNDER_REVIEW' as ProductRequestStatus }).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.toast.success("Demande prise en charge.");
        this.updateRequest(updated);
        this.selected.set(updated);
      },
      error: (e: any) => {
        this.actionLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur');
      },
    });
  }

  submitApprove(): void {
    const r = this.selected();
    if (!r || this.reviewLoading || this.approveForm.invalid) return;
    this.reviewLoading = true;
    this.reviewError = '';
    const raw = this.approveForm.getRawValue();
    const payload: any = {
      status: 'APPROVED' as ProductRequestStatus,
      categoryId: Number(raw.categoryId),
      approvedProductName: raw.approvedProductName || r.name,
      approvedProductSlug: raw.approvedProductSlug,
      itemPrice: Number(raw.itemPrice),
      itemQuantity: Number(raw.itemQuantity ?? 1),
    };
    if (raw.reviewComment) payload.reviewComment = raw.reviewComment;
    if (raw.realPrice != null) payload.realPrice = Number(raw.realPrice);
    if (raw.sellingPrice != null) payload.sellingPrice = Number(raw.sellingPrice);

    this.service.review(r.id, payload).subscribe({
      next: () => {
        this.reviewLoading = false;
        this.toast.success('Demande validée et publiée dans la wishlist !');
        this.loadRequests();
        this.selected.set(null);
        this.actionMode.set(null);
      },
      error: (e: any) => {
        this.reviewLoading = false;
        this.reviewError = e?.error?.message ?? 'Erreur';
      },
    });
  }

  submitReject(): void {
    const r = this.selected();
    if (!r || this.reviewLoading) return;
    this.reviewLoading = true;
    this.reviewError = '';
    const raw = this.rejectForm.getRawValue();
    this.service.review(r.id, {
      status: 'REJECTED' as ProductRequestStatus,
      reviewComment: raw.reviewComment || undefined,
    }).subscribe({
      next: (updated) => {
        this.reviewLoading = false;
        this.toast.success('Demande refusée.');
        this.updateRequest(updated);
        this.selected.set(updated);
        this.actionMode.set(null);
      },
      error: (e: any) => {
        this.reviewLoading = false;
        this.reviewError = e?.error?.message ?? 'Erreur';
      },
    });
  }

  submitPublish(): void {
    const r = this.selected();
    if (!r || this.publishLoading) return;
    this.publishLoading = true;
    this.publishError = '';
    const raw = this.publishForm.getRawValue();
    this.service
      .publish(r.id, { name: raw.name!, price: Number(raw.price), quantity: Number(raw.quantity) })
      .subscribe({
        next: () => {
          this.publishLoading = false;
          this.toast.success('Publié dans la wishlist !');
          this.loadRequests();
          this.selected.set(null);
        },
        error: (e: any) => {
          this.publishLoading = false;
          this.publishError = e?.error?.message ?? 'Erreur';
        },
      });
  }

  doReassign(r: ProductRequest): void {
    const adminId = this.reassignAdminId();
    if (!adminId) return;
    this.reassignLoading.set(true);
    this.service.reassign(r.id, adminId).subscribe({
      next: (updated) => {
        this.reassignLoading.set(false);
        this.showReassign.set(false);
        this.reassignAdminId.set(null);
        this.toast.success('Demande réaffectée.');
        this.updateRequest(updated);
        this.selected.set(updated);
      },
      error: (e: any) => {
        this.reassignLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur lors de la réaffectation');
      },
    });
  }

  getMeta(status: string) {
    return STATUS_META[status] ?? STATUS_META['DRAFT'];
  }

  private updateRequest(updated: ProductRequest): void {
    this.requests.update((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
