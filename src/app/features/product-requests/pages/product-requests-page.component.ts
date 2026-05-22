import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductRequestsService } from '../services/product-requests.service';
import { ProductRequest, ProductRequestStatus } from '../models/product-request.model';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';
import { ProductRequestFormPanelComponent } from '../components/product-request-form-panel.component';

const STATUS_META: Record<
  string,
  {
    label: string;
    emoji: string;
    badgeClass: string;
    bannerClass: string;
    desc: string;
  }
> = {
  DRAFT: {
    label: 'Brouillon',
    emoji: '✏️',
    badgeClass: 'bs-draft',
    bannerClass: 'bn-draft',
    desc: '',
  },
  SUBMITTED: {
    label: 'Envoyée',
    emoji: '📬',
    badgeClass: 'bs-submitted',
    bannerClass: 'bn-submitted',
    desc: "En attente d'examen par notre équipe.",
  },
  UNDER_REVIEW: {
    label: 'En cours',
    emoji: '🔍',
    badgeClass: 'bs-review',
    bannerClass: 'bn-review',
    desc: 'Notre équipe examine votre demande.',
  },
  APPROVED: {
    label: 'Approuvée',
    emoji: '✅',
    badgeClass: 'bs-approved',
    bannerClass: 'bn-approved',
    desc: 'Approuvée — va bientôt être publiée dans votre wishlist.',
  },
  REJECTED: {
    label: 'Refusée',
    emoji: '❌',
    badgeClass: 'bs-rejected',
    bannerClass: 'bn-rejected',
    desc: 'Votre demande a été refusée.',
  },
  PUBLISHED: {
    label: 'Publiée',
    emoji: '🎉',
    badgeClass: 'bs-published',
    bannerClass: 'bn-published',
    desc: 'Le produit a été ajouté à votre wishlist !',
  },
};

type Filter = 'ALL' | ProductRequestStatus;

@Component({
  selector: 'app-product-requests-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, ProductRequestFormPanelComponent],
  template: `
    <div class="page-wrap">
      <!-- ══ HERO ══ -->
      <div class="page-hero">
        <div class="hero-inner">
          <div class="hero-left">
            <a class="back-link" [routerLink]="eventId ? ['/app/events', eventId] : '/app/events'">
              <lucide-icon name="arrow-left" [size]="15" color="currentColor" [strokeWidth]="1.8" />
              Retour à l'événement
            </a>
            <div class="eyebrow">Wishlist · Demandes produit</div>
            <h1>Proposer un produit</h1>
            <p>
              Vous ne trouvez pas un produit dans le catalogue ? Proposez-le — notre équipe
              l'examinera et l'ajoutera à votre wishlist.
            </p>
          </div>
          @if (!loading()) {
            <div class="hero-kpis">
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
          }
        </div>
      </div>

      <!-- ══ BODY ══ -->
      <div class="page-body">
        <!-- Pas de wishlist -->
        @if (!wishlistId) {
          <div class="alert-info">
            <lucide-icon name="info" [size]="16" color="currentColor" [strokeWidth]="1.8" />
            Ouvrez cette page depuis un événement pour accéder aux demandes produit.
          </div>
        }

        @if (wishlistId) {
          <!-- ─── LAYOUT 2 COLONNES ─── -->
          <div class="two-col">
            <!-- COLONNE GAUCHE : liste + filtres -->
            <div class="list-col">
              <div class="col-header">
                <div class="col-title">
                  Mes demandes
                  @if (filtered().length > 0) {
                    <span class="count-badge">{{ filtered().length }}</span>
                  }
                </div>
                <button class="btn-new" (click)="openForm()">
                  <lucide-icon name="plus" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                  Nouvelle demande
                </button>
              </div>
              <!-- Filtres -->
              <div class="filter-row">
                @for (f of filters; track f.value) {
                  <button
                    class="filter-btn"
                    [class.active]="activeFilter() === f.value"
                    (click)="activeFilter.set(f.value)"
                  >
                    {{ f.label }}
                    @if (getCount(f.value) > 0) {
                      <span class="fc">{{ getCount(f.value) }}</span>
                    }
                  </button>
                }
              </div>
              <!-- Loading -->
              @if (loading()) {
                <div class="loading-state">
                  <div class="loading-spinner"></div>
                  Chargement...
                </div>
              }
              <!-- Empty -->
              @if (!loading() && filtered().length === 0) {
                <div class="empty-list">
                  <div class="empty-icon">📦</div>
                  <div>Aucune demande{{ activeFilter() !== 'ALL' ? ' avec ce statut' : '' }}.</div>
                  <button class="btn-empty-new" (click)="openForm()">
                    <lucide-icon name="plus" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    Faire ma première demande
                  </button>
                </div>
              }
              <!-- Liste -->
              @if (!loading() && filtered().length > 0) {
                <div class="req-list">
                  @for (r of filtered(); track r.id) {
                    <button
                      class="req-item"
                      [class.active]="selected()?.id === r.id"
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
                        @if (r.estimatedPrice) {
                          <div class="req-item-price">
                            {{ r.estimatedPrice | number: '1.0-0' }} {{ r.currencyCode }}
                          </div>
                        }
                        <div class="req-item-date">{{ r.createdAt | date: 'dd MMM yyyy' }}</div>
                      </div>
                      <span class="req-badge" [ngClass]="getMeta(r.status).badgeClass"
                        >{{ getMeta(r.status).emoji }} {{ getMeta(r.status).label }}</span
                      >
                    </button>
                  }
                </div>
              }
            </div>
            <!-- COLONNE DROITE : détail ou formulaire -->
            <div class="detail-col">
              <!-- FORMULAIRE -->
              @if (showForm()) {
                <app-product-request-form-panel
                  [form]="form"
                  [submitLoading]="submitLoading()"
                  [submitError]="submitError()"
                  (closed)="closeForm()"
                  (submitRequested)="submit()"
                />
              }
              <!-- DÉTAIL DEMANDE -->
              @if (!showForm() && selected(); as r) {
                <div class="detail-panel">
                  <div class="panel-header">
                    <div class="panel-title">Détail de la demande</div>
                    <button class="panel-close" (click)="selected.set(null)">
                      <lucide-icon name="x" [size]="16" color="currentColor" [strokeWidth]="1.8" />
                    </button>
                  </div>
                  <!-- Status banner -->
                  <div class="status-banner" [ngClass]="getMeta(r.status).bannerClass">
                    <div class="banner-emoji">{{ getMeta(r.status).emoji }}</div>
                    <div>
                      <div class="banner-label">{{ getMeta(r.status).label }}</div>
                      @if (getMeta(r.status).desc) {
                        <div class="banner-desc">{{ getMeta(r.status).desc }}</div>
                      }
                    </div>
                  </div>
                  <!-- Image -->
                  @if (r.imageUrl) {
                    <div class="detail-img-wrap">
                      <img [src]="r.imageUrl" [alt]="r.name" (error)="onImgError($event)" />
                    </div>
                  }
                  <div class="detail-body">
                    <div class="detail-name">{{ r.name }}</div>
                    @if (r.estimatedPrice) {
                      <div class="detail-price">
                        {{ r.estimatedPrice | number: '1.0-0' }} {{ r.currencyCode }}
                      </div>
                    }
                    <div class="detail-infos">
                      <div class="di-row">
                        <span class="di-label">Envoyée le</span>
                        <span class="di-val">{{ r.createdAt | date: 'dd MMM yyyy HH:mm' }}</span>
                      </div>
                      @if (r.reviewedAt) {
                        <div class="di-row">
                          <span class="di-label">Traitée le</span>
                          <span class="di-val">{{ r.reviewedAt | date: 'dd MMM yyyy HH:mm' }}</span>
                        </div>
                      }
                      @if (r.category) {
                        <div class="di-row">
                          <span class="di-label">Catégorie</span>
                          <span class="di-val">{{ r.category.name }}</span>
                        </div>
                      }
                    </div>
                    @if (r.description) {
                      <div class="detail-section">
                        <div class="ds-label">Description</div>
                        <div class="ds-text">{{ r.description }}</div>
                      </div>
                    }
                    @if (r.reviewComment) {
                      <div class="detail-section">
                        <div class="ds-label">
                          <lucide-icon name="message-square" [size]="12" color="currentColor" [strokeWidth]="1.8" />
                          Commentaire de l'équipe
                        </div>
                        <div class="ds-comment">{{ r.reviewComment }}</div>
                      </div>
                    }
                    <!-- Produit catalogue lié -->
                    @if (r.approvedCatalogProduct) {
                      <div class="detail-section">
                        <div class="ds-label">Produit ajouté au catalogue</div>
                        <div class="approved-product">
                          @if (r.approvedCatalogProduct.mainImageUrl) {
                            <img
                              [src]="r.approvedCatalogProduct.mainImageUrl"
                              [alt]="r.approvedCatalogProduct.name"
                              class="ap-img"
                            />
                          }
                          <div>
                            <div class="ap-name">{{ r.approvedCatalogProduct.name }}</div>
                            <div class="ap-price">
                              {{ r.approvedCatalogProduct.estimatedPrice | number: '1.0-0' }}
                              {{ r.approvedCatalogProduct.currencyCode }}
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                    @if (r.referenceUrl) {
                      <a
                        [href]="r.referenceUrl"
                        target="_blank"
                        rel="noopener"
                        class="detail-ref-link"
                      >
                        <lucide-icon name="link" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                        Voir la référence produit
                      </a>
                    }
                  </div>
                </div>
              }
              <!-- PLACEHOLDER si rien sélectionné -->
              @if (!showForm() && !selected()) {
                <div class="placeholder-panel">
                  <div class="placeholder-icon">📦</div>
                  <div class="placeholder-title">Sélectionnez une demande</div>
                  <p>Cliquez sur une demande pour voir son détail, ou créez-en une nouvelle.</p>
                  <button class="btn-new-lg" (click)="openForm()">
                    <lucide-icon name="plus" [size]="16" color="currentColor" [strokeWidth]="1.8" />
                    Faire une demande
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .page-wrap {
        background: #f9fafb;
        min-height: calc(100vh - 64px);
      }

      .page-hero {
        background: #000;
        padding: 40px 0;
      }
      .hero-inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: rgba(255, 255, 255, 0.5);
        text-decoration: none;
        font-size: 0.82rem;
        font-weight: 600;
        margin-bottom: 12px;
        transition: 0.2s;
      }
      .back-link:hover {
        color: white;
      }
      .eyebrow {
        color: #ffd700;
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 8px;
      }
      h1 {
        font-size: 2rem;
        font-weight: 900;
        color: white;
        margin: 0 0 8px;
        letter-spacing: -0.02em;
      }
      .hero-left p {
        color: rgba(255, 255, 255, 0.45);
        margin: 0;
        font-size: 0.88rem;
        line-height: 1.6;
        max-width: 520px;
      }
      .hero-kpis {
        display: flex;
        align-items: center;
        gap: 0;
        flex-shrink: 0;
      }
      .kpi {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
      }
      .kpi-val {
        font-size: 1.4rem;
        font-weight: 900;
        color: white;
      }
      .kpi-label {
        font-size: 0.68rem;
        color: rgba(255, 255, 255, 0.35);
        font-weight: 600;
      }
      .kpi-sep {
        width: 1px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 20px;
      }

      .page-body {
        max-width: 1280px;
        margin: 0 auto;
        padding: 28px 24px;
      }
      .alert-error {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 18px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 12px;
        color: #991b1b;
        font-size: 0.88rem;
      }
      .alert-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 18px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 12px;
        color: #0369a1;
        font-size: 0.88rem;
      }

      .two-col {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 20px;
        align-items: start;
      }

      .list-col {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .col-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px;
        border-bottom: 1px solid #f3f4f6;
      }
      .col-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .count-badge {
        background: #111;
        color: white;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 900;
      }
      .btn-new {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 7px 13px;
        border: 0;
        border-radius: 9px;
        background: #6d28d9;
        color: white;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-new:hover {
        background: #5b21b6;
      }

      .filter-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        padding: 12px 20px;
        border-bottom: 1px solid #f9fafb;
      }
      .filter-btn {
        padding: 5px 11px;
        border: 1.5px solid #e5e7eb;
        border-radius: 999px;
        background: white;
        font: inherit;
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: 0.15s;
      }
      .filter-btn:hover {
        border-color: #111;
        color: #111;
      }
      .filter-btn.active {
        background: #111;
        border-color: #111;
        color: white;
      }
      .fc {
        background: rgba(255, 255, 255, 0.2);
        padding: 1px 5px;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 800;
      }
      .filter-btn:not(.active) .fc {
        background: #f3f4f6;
        color: #6b7280;
      }

      .loading-state {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        padding: 40px;
        color: #9ca3af;
        font-size: 0.88rem;
      }
      .loading-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid #f3f4f6;
        border-top-color: #6d28d9;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .empty-list {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 40px 20px;
        text-align: center;
      }
      .empty-icon {
        font-size: 2rem;
      }
      .empty-list div {
        font-size: 0.85rem;
        color: #9ca3af;
      }
      .btn-empty-new {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 9px 16px;
        border: 0;
        border-radius: 9px;
        background: #111;
        color: white;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        margin-top: 4px;
      }

      .req-list {
        display: flex;
        flex-direction: column;
      }
      .req-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        border: 0;
        border-bottom: 1px solid #f9fafb;
        background: white;
        cursor: pointer;
        text-align: left;
        transition: 0.15s;
        width: 100%;
      }
      .req-item:last-child {
        border-bottom: 0;
      }
      .req-item:hover {
        background: #f9fafb;
      }
      .req-item.active {
        background: #faf5ff;
        border-left: 3px solid #6d28d9;
      }
      .req-item-img {
        width: 42px;
        height: 42px;
        border-radius: 8px;
        overflow: hidden;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        flex-shrink: 0;
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
        color: #111;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .req-item-price {
        font-size: 0.72rem;
        color: #6d28d9;
        font-weight: 700;
        margin-top: 2px;
      }
      .req-item-date {
        font-size: 0.7rem;
        color: #9ca3af;
      }
      .req-badge {
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .bs-draft {
        background: #f3f4f6;
        color: #6b7280;
      }
      .bs-submitted {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .bs-review {
        background: #fef3c7;
        color: #92400e;
      }
      .bs-approved {
        background: #dcfce7;
        color: #166534;
      }
      .bs-rejected {
        background: #fee2e2;
        color: #991b1b;
      }
      .bs-published {
        background: #ede9fe;
        color: #6d28d9;
      }

      .detail-col {
        position: sticky;
        top: 88px;
      }

      .detail-panel,
      .placeholder-panel {
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

      .status-banner {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        border-bottom: 1px solid #f3f4f6;
      }
      .banner-emoji {
        font-size: 1.8rem;
        flex-shrink: 0;
      }
      .banner-label {
        font-size: 0.9rem;
        font-weight: 800;
        color: #111;
      }
      .banner-desc {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 2px;
      }
      .bn-submitted {
        background: #eff6ff;
      }
      .bn-under_review {
        background: #fffbeb;
      }
      .bn-approved {
        background: #f0fdf4;
      }
      .bn-rejected {
        background: #fef2f2;
      }
      .bn-published {
        background: #f5f3ff;
      }
      .bn-draft {
        background: #f9fafb;
      }
      .detail-img-wrap {
        aspect-ratio: 16/9;
        overflow: hidden;
        background: #f3f4f6;
      }
      .detail-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .detail-body {
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .detail-name {
        font-size: 1.1rem;
        font-weight: 900;
        color: #111;
      }
      .detail-price {
        font-size: 0.95rem;
        font-weight: 700;
        color: #6d28d9;
      }
      .detail-infos {
        display: flex;
        flex-direction: column;
        background: #f9fafb;
        border-radius: 12px;
        overflow: hidden;
      }
      .di-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 9px 14px;
        border-bottom: 1px solid #f3f4f6;
      }
      .di-row:last-child {
        border-bottom: 0;
      }
      .di-label {
        font-size: 0.72rem;
        color: #9ca3af;
        font-weight: 600;
      }
      .di-val {
        font-size: 0.82rem;
        font-weight: 700;
        color: #111;
        text-align: right;
      }
      .detail-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .ds-label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #9ca3af;
      }
      .ds-text {
        font-size: 0.85rem;
        color: #374151;
        line-height: 1.6;
      }
      .ds-comment {
        font-size: 0.85rem;
        color: #374151;
        line-height: 1.6;
        background: #f9fafb;
        padding: 12px 14px;
        border-radius: 10px;
        font-style: italic;
      }
      .approved-product {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 10px;
      }
      .ap-img {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        object-fit: cover;
      }
      .ap-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: #111;
      }
      .ap-price {
        font-size: 0.75rem;
        color: #166534;
        font-weight: 600;
        margin-top: 2px;
      }
      .detail-ref-link {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 14px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        text-decoration: none;
        color: #374151;
        font-size: 0.82rem;
        font-weight: 700;
        transition: 0.2s;
        align-self: flex-start;
      }
      .detail-ref-link:hover {
        border-color: #111;
        color: #111;
      }

      .placeholder-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 56px 24px;
        text-align: center;
        min-height: 300px;
      }
      .placeholder-icon {
        font-size: 3rem;
      }
      .placeholder-title {
        font-size: 1rem;
        font-weight: 800;
        color: #111;
      }
      .placeholder-panel p {
        color: #9ca3af;
        margin: 0;
        font-size: 0.85rem;
      }
      .btn-new-lg {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 11px 22px;
        border: 0;
        border-radius: 11px;
        background: #6d28d9;
        color: white;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 800;
        cursor: pointer;
        margin-top: 4px;
        transition: 0.2s;
      }
      .btn-new-lg:hover {
        background: #5b21b6;
      }

      @media (max-width: 900px) {
        .two-col {
          grid-template-columns: 1fr;
        }
        .detail-col {
          position: static;
        }
      }
    `,
  ],
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
    return this.requests().filter((r) => r.status === f);
  });
  readonly pendingCount = computed(
    () =>
      this.requests().filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length,
  );
  readonly publishedCount = computed(
    () => this.requests().filter((r) => r.status === 'PUBLISHED').length,
  );

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    estimatedPrice: [null as number | null, [Validators.required, Validators.min(1)]],
    description: ['', [Validators.maxLength(500)]],
    referenceUrl: [''],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
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
      next: (rs) => {
        this.requests.set(Array.isArray(rs) ? rs : []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Impossible de charger les demandes.');
      },
    });
  }

  openForm(): void {
    this.showForm.set(true);
    this.selected.set(null);
  }
  closeForm(): void {
    this.showForm.set(false);
    this.form.reset();
    this.submitError.set('');
  }
  select(r: ProductRequest): void {
    this.selected.set(r);
    this.showForm.set(false);
  }

  submit(): void {
    if (this.form.invalid || this.submitLoading() || !this.wishlistId) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitLoading.set(true);
    this.submitError.set('');
    const raw = this.form.getRawValue();
    this.service
      .create({
        wishlistId: this.wishlistId,
        name: raw.name!.trim(),
        estimatedPrice: Number(raw.estimatedPrice),
        description: raw.description?.trim() || null,
        referenceUrl: raw.referenceUrl?.trim() || null,
        imageUrl: raw.imageUrl?.trim() || null,
        currencyCode: 'XOF',
      })
      .subscribe({
        next: (created) => {
          this.submitLoading.set(false);
          this.toast.success("Demande envoyée ! Vous serez notifié(e) dès qu'elle sera traitée.");
          this.form.reset();
          this.showForm.set(false);
          this.load();
          this.selected.set(created);
        },
        error: (err: any) => {
          this.submitLoading.set(false);
          this.submitError.set(err?.error?.message ?? "Impossible d'envoyer la demande.");
        },
      });
  }

  getCount(f: Filter): number {
    if (f === 'ALL') return this.requests().length;
    return this.requests().filter((r) => r.status === f).length;
  }

  getMeta(status: string) {
    return STATUS_META[status] ?? STATUS_META['DRAFT'];
  }
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
