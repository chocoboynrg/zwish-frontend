import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductRequestsService } from '../services/product-requests.service';
import { ProductRequest, ProductRequestStatus } from '../models/product-request.model';
import { ToastService } from '../../../core/services/toast.service';

const STATUS_META: Record<string, {
  label: string; emoji: string;
  badgeClass: string; bannerClass: string; desc: string;
}> = {
  DRAFT:        { label: 'Brouillon',  emoji: '✏️', badgeClass: 'bs-draft',     bannerClass: 'bn-draft',     desc: '' },
  SUBMITTED:    { label: 'Envoyée',    emoji: '📬', badgeClass: 'bs-submitted', bannerClass: 'bn-submitted', desc: 'En attente d\'examen par notre équipe.' },
  UNDER_REVIEW: { label: 'En cours',   emoji: '🔍', badgeClass: 'bs-review',    bannerClass: 'bn-review',    desc: 'Notre équipe examine votre demande.' },
  APPROVED:     { label: 'Approuvée',  emoji: '✅', badgeClass: 'bs-approved',  bannerClass: 'bn-approved',  desc: 'Approuvée — va bientôt être publiée dans votre wishlist.' },
  REJECTED:     { label: 'Refusée',    emoji: '❌', badgeClass: 'bs-rejected',  bannerClass: 'bn-rejected',  desc: 'Votre demande a été refusée.' },
  PUBLISHED:    { label: 'Publiée',    emoji: '🎉', badgeClass: 'bs-published', bannerClass: 'bn-published', desc: 'Le produit a été ajouté à votre wishlist !' },
};

type Filter = 'ALL' | ProductRequestStatus;

@Component({
  selector: 'app-product-requests-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-wrap">

      <!-- ══ HERO ══ -->
      <div class="page-hero">
        <div class="hero-inner">
          <div class="hero-left">
            <a class="back-link" [routerLink]="eventId ? ['/app/events', eventId] : '/app/events'">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Retour à l'événement
            </a>
            <div class="eyebrow">Wishlist · Demandes produit</div>
            <h1>Proposer un produit</h1>
            <p>Vous ne trouvez pas un produit dans le catalogue ? Proposez-le — notre équipe l'examinera et l'ajoutera à votre wishlist.</p>
          </div>
          <div class="hero-kpis" *ngIf="!loading()">
            <div class="kpi">
              <div class="kpi-val">{{ requests().length }}</div>
              <div class="kpi-label">Total</div>
            </div>
            <div class="kpi-sep"></div>
            <div class="kpi">
              <div class="kpi-val">{{ pendingCount() }}</div>
              <div class="kpi-label">En attente</div>
            </div>
            <div class="kpi-sep"></div>
            <div class="kpi">
              <div class="kpi-val">{{ publishedCount() }}</div>
              <div class="kpi-label">Publiées</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ BODY ══ -->
      <div class="page-body">

        <!-- Pas de wishlist -->
        <div class="alert-error" *ngIf="!wishlistId">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          Ouvrez cette page depuis un événement pour accéder aux demandes produit.
        </div>

        <ng-container *ngIf="wishlistId">

          <!-- ─── LAYOUT 2 COLONNES ─── -->
          <div class="two-col">

            <!-- COLONNE GAUCHE : liste + filtres -->
            <div class="list-col">

              <div class="col-header">
                <div class="col-title">
                  Mes demandes
                  <span class="count-badge" *ngIf="filtered().length > 0">{{ filtered().length }}</span>
                </div>
                <button class="btn-new" (click)="openForm()">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
                  Nouvelle demande
                </button>
              </div>

              <!-- Filtres -->
              <div class="filter-row">
                <button *ngFor="let f of filters"
                  class="filter-btn" [class.active]="activeFilter() === f.value"
                  (click)="activeFilter.set(f.value)"
                >
                  {{ f.label }}
                  <span class="fc" *ngIf="getCount(f.value) > 0">{{ getCount(f.value) }}</span>
                </button>
              </div>

              <!-- Loading -->
              <div class="loading-state" *ngIf="loading()">
                <div class="loading-spinner"></div>Chargement...
              </div>

              <!-- Empty -->
              <div class="empty-list" *ngIf="!loading() && filtered().length === 0">
                <div class="empty-icon">📦</div>
                <div>Aucune demande{{ activeFilter() !== 'ALL' ? ' avec ce statut' : '' }}.</div>
                <button class="btn-empty-new" (click)="openForm()">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
                  Faire ma première demande
                </button>
              </div>

              <!-- Liste -->
              <div class="req-list" *ngIf="!loading() && filtered().length > 0">
                <button
                  class="req-item"
                  *ngFor="let r of filtered()"
                  [class.active]="selected()?.id === r.id"
                  (click)="select(r)"
                >
                  <div class="req-item-img">
                    <img *ngIf="r.imageUrl" [src]="r.imageUrl" [alt]="r.name" (error)="onImgError($event)" />
                    <span *ngIf="!r.imageUrl">🛍️</span>
                  </div>
                  <div class="req-item-info">
                    <div class="req-item-name">{{ r.name }}</div>
                    <div class="req-item-price" *ngIf="r.estimatedPrice">{{ r.estimatedPrice | number:'1.0-0' }} {{ r.currencyCode }}</div>
                    <div class="req-item-date">{{ r.createdAt | date:'dd MMM yyyy' }}</div>
                  </div>
                  <span class="req-badge" [ngClass]="getMeta(r.status).badgeClass">{{ getMeta(r.status).emoji }} {{ getMeta(r.status).label }}</span>
                </button>
              </div>
            </div>

            <!-- COLONNE DROITE : détail ou formulaire -->
            <div class="detail-col">

              <!-- FORMULAIRE -->
              <div class="form-panel" *ngIf="showForm()">
                <div class="panel-header">
                  <div class="panel-title">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
                    Nouvelle demande
                  </div>
                  <button class="panel-close" (click)="closeForm()">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                  </button>
                </div>

                <div class="form-error" *ngIf="submitError()">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                  {{ submitError() }}
                </div>

                <form [formGroup]="form" (ngSubmit)="submit()" class="form-body" novalidate>

                  <div class="field">
                    <label class="field-label">Nom du produit <span class="req">*</span></label>
                    <input type="text" formControlName="name" placeholder="Ex : PlayStation 5" [class.invalid]="isInvalid('name')" maxlength="150" />
                    <div class="field-footer">
                      <span class="field-err" *ngIf="isInvalid('name')">Obligatoire.</span>
                      <span class="char-count">{{ form.get('name')?.value?.length ?? 0 }}/150</span>
                    </div>
                  </div>

                  <div class="field">
                    <label class="field-label">Prix estimé <span class="req">*</span></label>
                    <div class="price-wrap">
                      <input type="number" formControlName="estimatedPrice" placeholder="350 000" min="1" [class.invalid]="isInvalid('estimatedPrice')" />
                      <span class="price-suffix">XOF</span>
                    </div>
                    <span class="field-err" *ngIf="isInvalid('estimatedPrice')">Prix obligatoire (min 1).</span>
                  </div>

                  <div class="field">
                    <label class="field-label">Description <span class="opt">— optionnel</span></label>
                    <textarea formControlName="description" rows="3" placeholder="Couleur, taille, version, caractéristiques..." maxlength="500"></textarea>
                    <div class="field-footer justify-end">
                      <span class="char-count">{{ form.get('description')?.value?.length ?? 0 }}/500</span>
                    </div>
                  </div>

                  <div class="field">
                    <label class="field-label">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                      Lien de référence <span class="opt">— optionnel</span>
                    </label>
                    <input type="url" formControlName="referenceUrl" placeholder="https://jumia.ci/..." />
                    <span class="field-hint">Jumia, Amazon, site officiel...</span>
                  </div>

                  <div class="field">
                    <label class="field-label">URL image <span class="opt">— optionnel</span></label>
                    <input type="url" formControlName="imageUrl" placeholder="https://..." />
                    <div class="img-preview" *ngIf="form.get('imageUrl')?.value?.trim()">
                      <img [src]="form.get('imageUrl')!.value" alt="Aperçu" (error)="onImgError($event)" />
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="btn-cancel" (click)="closeForm()">Annuler</button>
                    <button type="submit" class="btn-submit" [disabled]="submitLoading() || form.invalid">
                      <span *ngIf="!submitLoading()">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                        Envoyer
                      </span>
                      <span *ngIf="submitLoading()" class="dots"><span></span><span></span><span></span></span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- DÉTAIL DEMANDE -->
              <div class="detail-panel" *ngIf="!showForm() && selected() as r">
                <div class="panel-header">
                  <div class="panel-title">Détail de la demande</div>
                  <button class="panel-close" (click)="selected.set(null)">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                  </button>
                </div>

                <!-- Status banner -->
                <div class="status-banner" [ngClass]="getMeta(r.status).bannerClass">
                  <div class="banner-emoji">{{ getMeta(r.status).emoji }}</div>
                  <div>
                    <div class="banner-label">{{ getMeta(r.status).label }}</div>
                    <div class="banner-desc" *ngIf="getMeta(r.status).desc">{{ getMeta(r.status).desc }}</div>
                  </div>
                </div>

                <!-- Image -->
                <div class="detail-img-wrap" *ngIf="r.imageUrl">
                  <img [src]="r.imageUrl" [alt]="r.name" (error)="onImgError($event)" />
                </div>

                <div class="detail-body">
                  <div class="detail-name">{{ r.name }}</div>
                  <div class="detail-price" *ngIf="r.estimatedPrice">{{ r.estimatedPrice | number:'1.0-0' }} {{ r.currencyCode }}</div>

                  <div class="detail-infos">
                    <div class="di-row">
                      <span class="di-label">Envoyée le</span>
                      <span class="di-val">{{ r.createdAt | date:'dd MMM yyyy HH:mm' }}</span>
                    </div>
                    <div class="di-row" *ngIf="r.reviewedAt">
                      <span class="di-label">Traitée le</span>
                      <span class="di-val">{{ r.reviewedAt | date:'dd MMM yyyy HH:mm' }}</span>
                    </div>
                    <div class="di-row" *ngIf="r.category">
                      <span class="di-label">Catégorie</span>
                      <span class="di-val">{{ r.category.name }}</span>
                    </div>
                  </div>

                  <div class="detail-section" *ngIf="r.description">
                    <div class="ds-label">Description</div>
                    <div class="ds-text">{{ r.description }}</div>
                  </div>

                  <div class="detail-section" *ngIf="r.reviewComment">
                    <div class="ds-label">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M17 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10l4 4V3a1 1 0 00-1-1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                      Commentaire de l'équipe
                    </div>
                    <div class="ds-comment">{{ r.reviewComment }}</div>
                  </div>

                  <!-- Produit catalogue lié -->
                  <div class="detail-section" *ngIf="r.approvedCatalogProduct">
                    <div class="ds-label">Produit ajouté au catalogue</div>
                    <div class="approved-product">
                      <img *ngIf="r.approvedCatalogProduct.mainImageUrl" [src]="r.approvedCatalogProduct.mainImageUrl" [alt]="r.approvedCatalogProduct.name" class="ap-img" />
                      <div>
                        <div class="ap-name">{{ r.approvedCatalogProduct.name }}</div>
                        <div class="ap-price">{{ r.approvedCatalogProduct.estimatedPrice | number:'1.0-0' }} {{ r.approvedCatalogProduct.currencyCode }}</div>
                      </div>
                    </div>
                  </div>

                  <a *ngIf="r.referenceUrl" [href]="r.referenceUrl" target="_blank" rel="noopener" class="detail-ref-link">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    Voir la référence produit
                  </a>
                </div>
              </div>

              <!-- PLACEHOLDER si rien sélectionné -->
              <div class="placeholder-panel" *ngIf="!showForm() && !selected()">
                <div class="placeholder-icon">📦</div>
                <div class="placeholder-title">Sélectionnez une demande</div>
                <p>Cliquez sur une demande pour voir son détail, ou créez-en une nouvelle.</p>
                <button class="btn-new-lg" (click)="openForm()">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
                  Faire une demande
                </button>
              </div>

            </div>
          </div>

        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-wrap { background: #f9fafb; min-height: calc(100vh - 64px); }

    /* HERO */
    .page-hero { background: #000; padding: 40px 0; }
    .hero-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.82rem; font-weight: 600; margin-bottom: 12px; transition: 0.2s; }
    .back-link:hover { color: white; }
    .eyebrow { color: #FFD700; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
    h1 { font-size: 2rem; font-weight: 900; color: white; margin: 0 0 8px; letter-spacing: -0.02em; }
    .hero-left p { color: rgba(255,255,255,0.45); margin: 0; font-size: 0.88rem; line-height: 1.6; max-width: 520px; }
    .hero-kpis { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
    .kpi { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .kpi-val { font-size: 1.4rem; font-weight: 900; color: white; }
    .kpi-label { font-size: 0.68rem; color: rgba(255,255,255,0.35); font-weight: 600; }
    .kpi-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.1); margin: 0 20px; }

    /* BODY */
    .page-body { max-width: 1280px; margin: 0 auto; padding: 28px 24px; }
    .alert-error { display: flex; align-items: center; gap: 8px; padding: 14px 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; font-size: 0.88rem; }

    /* LAYOUT 2 COLONNES */
    .two-col { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }

    /* ── COLONNE GAUCHE ── */
    .list-col { background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; }

    .col-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f3f4f6; }
    .col-title { font-size: 0.95rem; font-weight: 800; color: #111; display: flex; align-items: center; gap: 8px; }
    .count-badge { background: #111; color: white; padding: 2px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 900; }
    .btn-new { display: flex; align-items: center; gap: 5px; padding: 7px 13px; border: 0; border-radius: 9px; background: #6d28d9; color: white; font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-new:hover { background: #5b21b6; }

    .filter-row { display: flex; gap: 6px; flex-wrap: wrap; padding: 12px 20px; border-bottom: 1px solid #f9fafb; }
    .filter-btn { padding: 5px 11px; border: 1.5px solid #e5e7eb; border-radius: 999px; background: white; font: inherit; font-size: 0.75rem; font-weight: 600; color: #6b7280; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: 0.15s; }
    .filter-btn:hover { border-color: #111; color: #111; }
    .filter-btn.active { background: #111; border-color: #111; color: white; }
    .fc { background: rgba(255,255,255,0.2); padding: 1px 5px; border-radius: 999px; font-size: 0.65rem; font-weight: 800; }
    .filter-btn:not(.active) .fc { background: #f3f4f6; color: #6b7280; }

    .loading-state { display: flex; align-items: center; gap: 10px; justify-content: center; padding: 40px; color: #9ca3af; font-size: 0.88rem; }
    .loading-spinner { width: 18px; height: 18px; border: 2px solid #f3f4f6; border-top-color: #6d28d9; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-list { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 20px; text-align: center; }
    .empty-icon { font-size: 2rem; }
    .empty-list div { font-size: 0.85rem; color: #9ca3af; }
    .btn-empty-new { display: flex; align-items: center; gap: 5px; padding: 9px 16px; border: 0; border-radius: 9px; background: #111; color: white; font: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; margin-top: 4px; }

    .req-list { display: flex; flex-direction: column; }
    .req-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border: 0; border-bottom: 1px solid #f9fafb; background: white; cursor: pointer; text-align: left; transition: 0.15s; width: 100%; }
    .req-item:last-child { border-bottom: 0; }
    .req-item:hover { background: #f9fafb; }
    .req-item.active { background: #faf5ff; border-left: 3px solid #6d28d9; }
    .req-item-img { width: 42px; height: 42px; border-radius: 8px; overflow: hidden; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .req-item-img img { width: 100%; height: 100%; object-fit: cover; }
    .req-item-info { flex: 1; min-width: 0; }
    .req-item-name { font-size: 0.85rem; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .req-item-price { font-size: 0.72rem; color: #6d28d9; font-weight: 700; margin-top: 2px; }
    .req-item-date { font-size: 0.7rem; color: #9ca3af; }
    .req-badge { padding: 3px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; flex-shrink: 0; white-space: nowrap; }
    .bs-draft { background: #f3f4f6; color: #6b7280; }
    .bs-submitted { background: #dbeafe; color: #1d4ed8; }
    .bs-review { background: #fef3c7; color: #92400e; }
    .bs-approved { background: #dcfce7; color: #166534; }
    .bs-rejected { background: #fee2e2; color: #991b1b; }
    .bs-published { background: #ede9fe; color: #6d28d9; }

    /* ── COLONNE DROITE ── */
    .detail-col { position: sticky; top: 88px; }

    /* Panel header commun */
    .form-panel, .detail-panel, .placeholder-panel {
      background: white; border: 1.5px solid #f3f4f6; border-radius: 20px; overflow: hidden;
    }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f3f4f6; }
    .panel-title { font-size: 0.95rem; font-weight: 800; color: #111; display: flex; align-items: center; gap: 8px; }
    .panel-close { width: 32px; height: 32px; border: 0; background: #f3f4f6; border-radius: 8px; cursor: pointer; color: #6b7280; display: flex; align-items: center; justify-content: center; }
    .panel-close:hover { background: #e5e7eb; color: #111; }

    /* Formulaire */
    .form-error { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: #fef2f2; border-bottom: 1px solid #fecaca; font-size: 0.82rem; color: #991b1b; }
    .form-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-label { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; font-weight: 700; color: #374151; }
    .req { color: #ef4444; }
    .opt { font-weight: 500; color: #9ca3af; }
    input[type=text], input[type=number], input[type=url] { padding: 10px 13px; border: 1.5px solid #e5e7eb; border-radius: 10px; font: inherit; font-size: 0.88rem; outline: 0; transition: 0.2s; background: #f9fafb; box-sizing: border-box; width: 100%; }
    input:focus { border-color: #6d28d9; background: white; }
    input.invalid { border-color: #ef4444; }
    textarea { padding: 10px 13px; border: 1.5px solid #e5e7eb; border-radius: 10px; font: inherit; font-size: 0.85rem; resize: vertical; outline: 0; transition: 0.2s; background: #f9fafb; box-sizing: border-box; width: 100%; }
    textarea:focus { border-color: #6d28d9; background: white; }
    .price-wrap { position: relative; }
    .price-wrap input { padding-right: 50px; }
    .price-suffix { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); font-size: 0.72rem; font-weight: 700; color: #9ca3af; pointer-events: none; }
    .field-footer { display: flex; align-items: center; justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .field-err { font-size: 0.72rem; color: #ef4444; }
    .field-hint { font-size: 0.72rem; color: #9ca3af; }
    .char-count { font-size: 0.68rem; color: #9ca3af; }
    .img-preview { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; margin-top: 4px; }
    .img-preview img { width: 100%; height: 100%; object-fit: cover; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 4px; border-top: 1px solid #f3f4f6; margin-top: 4px; }
    .btn-cancel { padding: 9px 16px; border: 1.5px solid #e5e7eb; border-radius: 9px; background: white; color: #6b7280; font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: 0.15s; }
    .btn-cancel:hover { border-color: #111; color: #111; }
    .btn-submit { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border: 0; border-radius: 9px; background: #6d28d9; color: white; font: inherit; font-size: 0.88rem; font-weight: 800; cursor: pointer; transition: 0.2s; }
    .btn-submit:hover:not(:disabled) { background: #5b21b6; }
    .btn-submit:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
    .dots { display: flex; gap: 4px; }
    .dots span { width: 5px; height: 5px; border-radius: 50%; background: #9ca3af; animation: bounce 1.2s infinite; }
    .dots span:nth-child(2) { animation-delay: 0.2s; }
    .dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,80%,100%{transform:scale(0.7);opacity:0.4}40%{transform:scale(1.1);opacity:1} }

    /* Détail */
    .status-banner { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
    .banner-emoji { font-size: 1.8rem; flex-shrink: 0; }
    .banner-label { font-size: 0.9rem; font-weight: 800; color: #111; }
    .banner-desc { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
    .bn-submitted { background: #eff6ff; } .bn-under_review { background: #fffbeb; }
    .bn-approved { background: #f0fdf4; } .bn-rejected { background: #fef2f2; }
    .bn-published { background: #f5f3ff; } .bn-draft { background: #f9fafb; }
    .detail-img-wrap { aspect-ratio: 16/9; overflow: hidden; background: #f3f4f6; }
    .detail-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .detail-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
    .detail-name { font-size: 1.1rem; font-weight: 900; color: #111; }
    .detail-price { font-size: 0.95rem; font-weight: 700; color: #6d28d9; }
    .detail-infos { display: flex; flex-direction: column; background: #f9fafb; border-radius: 12px; overflow: hidden; }
    .di-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 9px 14px; border-bottom: 1px solid #f3f4f6; }
    .di-row:last-child { border-bottom: 0; }
    .di-label { font-size: 0.72rem; color: #9ca3af; font-weight: 600; }
    .di-val { font-size: 0.82rem; font-weight: 700; color: #111; text-align: right; }
    .detail-section { display: flex; flex-direction: column; gap: 8px; }
    .ds-label { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; }
    .ds-text { font-size: 0.85rem; color: #374151; line-height: 1.6; }
    .ds-comment { font-size: 0.85rem; color: #374151; line-height: 1.6; background: #f9fafb; padding: 12px 14px; border-radius: 10px; font-style: italic; }
    .approved-product { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; }
    .ap-img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
    .ap-name { font-size: 0.85rem; font-weight: 700; color: #111; }
    .ap-price { font-size: 0.75rem; color: #166534; font-weight: 600; margin-top: 2px; }
    .detail-ref-link { display: flex; align-items: center; gap: 6px; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; text-decoration: none; color: #374151; font-size: 0.82rem; font-weight: 700; transition: 0.2s; align-self: flex-start; }
    .detail-ref-link:hover { border-color: #111; color: #111; }

    /* Placeholder */
    .placeholder-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 56px 24px; text-align: center; min-height: 300px; }
    .placeholder-icon { font-size: 3rem; }
    .placeholder-title { font-size: 1rem; font-weight: 800; color: #111; }
    .placeholder-panel p { color: #9ca3af; margin: 0; font-size: 0.85rem; }
    .btn-new-lg { display: flex; align-items: center; gap: 7px; padding: 11px 22px; border: 0; border-radius: 11px; background: #6d28d9; color: white; font: inherit; font-size: 0.9rem; font-weight: 800; cursor: pointer; margin-top: 4px; transition: 0.2s; }
    .btn-new-lg:hover { background: #5b21b6; }

    @media (max-width: 900px) {
      .two-col { grid-template-columns: 1fr; }
      .detail-col { position: static; }
    }
  `],
})
export class ProductRequestsPageComponent implements OnInit {
  private readonly service = inject(ProductRequestsService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  wishlistId: number | null = null;
  eventId: number | null = null;

  readonly loading = signal(false);
  readonly submitLoading = signal(false);
  readonly submitError = signal('');
  readonly requests = signal<ProductRequest[]>([]);
  readonly activeFilter = signal<Filter>('ALL');
  readonly selected = signal<ProductRequest | null>(null);
  readonly showForm = signal(false);

  readonly filters: { label: string; value: Filter }[] = [
    { label: 'Toutes', value: 'ALL' },
    { label: 'Envoyées', value: 'SUBMITTED' },
    { label: 'En cours', value: 'UNDER_REVIEW' },
    { label: 'Approuvées', value: 'APPROVED' },
    { label: 'Publiées', value: 'PUBLISHED' },
    { label: 'Refusées', value: 'REJECTED' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'ALL') return this.requests();
    return this.requests().filter(r => r.status === f);
  });
  readonly pendingCount = computed(() =>
    this.requests().filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length
  );
  readonly publishedCount = computed(() =>
    this.requests().filter(r => r.status === 'PUBLISHED').length
  );

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    estimatedPrice: [null as number | null, [Validators.required, Validators.min(1)]],
    description: ['', [Validators.maxLength(500)]],
    referenceUrl: [''],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const wId = Number(params.get('wishlistId'));
      const eId = Number(params.get('eventId'));
      this.wishlistId = Number.isFinite(wId) && wId > 0 ? wId : null;
      this.eventId = Number.isFinite(eId) && eId > 0 ? eId : null;
      if (this.wishlistId) this.load();
    });
  }

  load(): void {
    if (!this.wishlistId) return;
    this.loading.set(true);
    this.service.getByWishlist(this.wishlistId).subscribe({
      next: (rs) => { this.requests.set(Array.isArray(rs) ? rs : []); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Impossible de charger les demandes.'); },
    });
  }

  openForm(): void { this.showForm.set(true); this.selected.set(null); }
  closeForm(): void { this.showForm.set(false); this.form.reset(); this.submitError.set(''); }
  select(r: ProductRequest): void { this.selected.set(r); this.showForm.set(false); }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  submit(): void {
    if (this.form.invalid || this.submitLoading() || !this.wishlistId) {
      this.form.markAllAsTouched(); return;
    }
    this.submitLoading.set(true);
    this.submitError.set('');
    const raw = this.form.getRawValue();
    this.service.create({
      wishlistId: this.wishlistId,
      name: raw.name!.trim(),
      estimatedPrice: Number(raw.estimatedPrice),
      description: raw.description?.trim() || null,
      referenceUrl: raw.referenceUrl?.trim() || null,
      imageUrl: raw.imageUrl?.trim() || null,
      currencyCode: 'XOF',
    }).subscribe({
      next: (created) => {
        this.submitLoading.set(false);
        this.toast.success('Demande envoyée ! Vous serez notifié(e) dès qu\'elle sera traitée.');
        this.form.reset();
        this.showForm.set(false);
        this.load();
        this.selected.set(created as any);
      },
      error: (err: any) => {
        this.submitLoading.set(false);
        this.submitError.set(err?.error?.message ?? 'Impossible d\'envoyer la demande.');
      },
    });
  }

  getCount(f: Filter): number {
    if (f === 'ALL') return this.requests().length;
    return this.requests().filter(r => r.status === f).length;
  }

  getMeta(status: string) { return STATUS_META[status] ?? STATUS_META['DRAFT']; }
  onImgError(event: Event): void { (event.target as HTMLImageElement).style.display = 'none'; }
}