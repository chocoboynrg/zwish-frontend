import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../services/catalog.service';
import { CatalogCategory } from '../models/catalog-category.model';
import { CatalogProduct, CatalogProductStatus } from '../models/catalog-product.model';
import { CatalogTheme } from '../models/catalog-theme.model';
import { CreateCatalogThemePayload, UpdateCatalogThemePayload } from '../services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { PromotionsService, Promotion } from '../../promotions/services/promotions.service';
import { DeliveryOptionsService } from '../../delivery-options/services/delivery-options.service';
import { CatalogProductDrawerComponent } from '../components/catalog-product-drawer.component';
import { CatalogProductCardComponent } from '../components/catalog-product-card.component';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-catalog-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule, CatalogProductDrawerComponent, CatalogProductCardComponent],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Catalogue</h1>
          <p class="subtitle">
            {{ categories().length }} catégorie(s) · {{ products().length }} produit(s) · {{ themes().length }} thème(s)
          </p>
        </div>
        <button class="btn-primary" (click)="onNewClick()">
          + {{ activeTab() === 'categories' ? 'Nouvelle catégorie' : activeTab() === 'themes' ? 'Nouveau thème' : 'Nouveau produit' }}
        </button>
      </div>

      <!-- Onglets -->
      <div class="tabs">
        <button
          class="tab"
          [class.active]="activeTab() === 'products'"
          (click)="activeTab.set('products')"
        >
          Produits
          <span class="tab-count">{{ products().length }}</span>
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'categories'"
          (click)="activeTab.set('categories')"
        >
          Catégories
          <span class="tab-count">{{ categories().length }}</span>
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'themes'"
          (click)="activeTab.set('themes')"
        >
          Thèmes
          <span class="tab-count">{{ themes().length }}</span>
        </button>
      </div>

      <!-- ===== ONGLET PRODUITS ===== -->
      @if (activeTab() === 'products') {
        <!-- Filtres produits -->
        <div class="filters-bar">
          <input
            class="search-input"
            type="text"
            placeholder="Rechercher par nom, marque..."
            [(ngModel)]="productSearch"
            (ngModelChange)="onProductSearchChange()"
          />
          <select [(ngModel)]="productCategoryFilter" (ngModelChange)="loadProducts()">
            <option value="">Toutes les catégories</option>
            @for (c of categories(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
          <select [(ngModel)]="productStatusFilter" (ngModelChange)="loadProducts()">
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="DRAFT">Brouillon</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>
        <!-- Grille produits -->
        @if (productsLoading()) {
          <div class="loading-bar"></div>
        }
        @if (!productsLoading() && filteredProducts().length === 0) {
          <p class="empty-state">
            Aucun produit trouvé.
            <button class="link-btn" (click)="openProductDrawer(null)">Créer le premier →</button>
          </p>
        }
        @if (filteredProducts().length > 0) {
          <div class="products-grid">
            @for (p of filteredProducts(); track p.id) {
              <app-catalog-product-card
                [product]="p"
                [resolveImageUrl]="resolveImageUrl.bind(this)"
                [isPromoActive]="isPromoActive.bind(this)"
                [getStatusLabel]="getStatusLabel.bind(this)"
                [getStatusClass]="getStatusClass.bind(this)"
                [onImageError]="onImageError.bind(this)"
                (open)="openProductDrawer(p)"
                (toggleStatus)="toggleProductStatus(p)"
                (delete)="confirmDeleteProduct(p)"
              />
            }
          </div>
        }
      }

      <!-- ===== ONGLET THÈMES ===== -->
      @if (activeTab() === 'themes') {
        @if (themesLoading()) {
          <div class="loading-bar"></div>
        }
        @if (!themesLoading() && themes().length === 0) {
          <p class="empty-state">
            Aucun thème. <button class="link-btn" (click)="openThemeDrawer(null)">Créer le premier →</button>
          </p>
        }
        @if (themes().length > 0) {
          <div class="themes-grid">
            @for (t of themes(); track t.id) {
              <div class="theme-card" [style.border-top-color]="t.color || '#e5e7eb'">
                <div class="theme-emoji">{{ t.emoji || '🏷️' }}</div>
                  <div class="theme-info">
                  <div class="theme-name">{{ t.name }}</div>
                  @if (t.description) {
                    <div class="theme-desc muted">{{ t.description | slice:0:60 }}{{ t.description.length > 60 ? '…' : '' }}</div>
                  }
                  <div class="theme-footer">
                    <span class="badge" [ngClass]="t.isActive ? 'badge-green' : 'badge-gray'">{{ t.isActive ? 'Actif' : 'Inactif' }}</span>
                    <span class="theme-count muted">{{ getProductCountForTheme(t.id) }} produit(s)</span>
                  </div>
                </div>
                <div class="theme-actions">
                  <button class="btn-sm" (click)="openThemeDrawer(t)">Modifier</button>
                  <button class="btn-sm btn-sm-danger" (click)="confirmDeleteTheme(t)">Supprimer</button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ===== ONGLET CATÉGORIES ===== -->
      @if (activeTab() === 'categories') {
        @if (categoriesLoading()) {
          <div class="loading-bar"></div>
        }
        @if (!categoriesLoading() && categories().length === 0) {
          <p class="empty-state">
            Aucune catégorie.
            <button class="link-btn" (click)="openCategoryDrawer(null)">Créer la première →</button>
          </p>
        }
        @if (categories().length > 0) {
          <div class="categories-list">
            @for (c of categories(); track c.id) {
              <div class="category-row">
                <div class="category-left">
                  <div
                    class="category-dot"
                    [ngClass]="c.isActive ? 'dot-active' : 'dot-inactive'"
                  ></div>
                  <div>
                    <div class="category-name">{{ c.name }}</div>
                    <div class="category-meta muted">
                      /{{ c.slug }}
                      @if (c.description) {
                        <span>
                          · {{ c.description | slice: 0 : 60
                          }}{{ c.description.length > 60 ? '…' : '' }}</span
                        >
                      }
                    </div>
                  </div>
                </div>
                <div class="category-right">
                  <span class="category-count">
                    {{ getProductCountForCategory(c.id) }} produit(s)
                  </span>
                  <span class="badge" [ngClass]="c.isActive ? 'badge-green' : 'badge-gray'">
                    {{ c.isActive ? 'Active' : 'Inactive' }}
                  </span>
                  <button class="btn-sm" (click)="openCategoryDrawer(c)">Modifier</button>
                  <button class="btn-sm btn-sm-danger" (click)="confirmDeleteCategory(c)">
                    Supprimer
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <app-catalog-product-drawer [host]="this" />

    <!-- ===== DRAWER CATÉGORIE ===== -->
    @if (categoryDrawerOpen()) {
      <div class="drawer-overlay" (click)="closeCategoryDrawer()">
        <div class="drawer drawer-narrow" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>{{ editingCategory() ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h2>
            <button class="btn-close" (click)="closeCategoryDrawer()">✕</button>
          </div>
          <div class="drawer-body">
            <form [formGroup]="categoryForm" (ngSubmit)="submitCategory()">
              <div class="form-group">
                <label>Nom <span class="required">*</span></label>
                <input
                  type="text"
                  formControlName="name"
                  class="form-input"
                  placeholder="Ex: Électronique"
                  (input)="autoSlugCategory()"
                  [class.invalid]="isInvalid('category', 'name')"
                />
                @if (isInvalid('category', 'name')) {
                  <span class="field-error">Nom requis.</span>
                }
              </div>
              <div class="form-group">
                <label>Slug <span class="required">*</span></label>
                <input
                  type="text"
                  formControlName="slug"
                  class="form-input mono"
                  placeholder="electronique"
                  [class.invalid]="isInvalid('category', 'slug')"
                />
                @if (isInvalid('category', 'slug')) {
                  <span class="field-error">Slug requis.</span>
                }
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea
                  formControlName="description"
                  class="form-input"
                  rows="3"
                  placeholder="Description de la catégorie..."
                ></textarea>
              </div>
              <label class="toggle-row">
                <span>Catégorie active</span>
                <div
                  class="toggle"
                  [class.on]="categoryForm.get('isActive')?.value"
                  (click)="toggleCategoryActive()"
                >
                  <div class="toggle-thumb"></div>
                </div>
              </label>
              <div class="drawer-actions">
                <button type="button" class="btn-cancel" (click)="closeCategoryDrawer()">
                  Annuler
                </button>
                <button type="submit" class="btn-primary" [disabled]="categoryLoading()">
                  {{
                    categoryLoading()
                      ? 'Enregistrement...'
                      : editingCategory()
                        ? 'Mettre à jour'
                        : 'Créer'
                  }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- ===== DRAWER THÈME ===== -->
    @if (themeDrawerOpen()) {
      <div class="drawer-overlay" (click)="closeThemeDrawer()">
        <div class="drawer drawer-narrow" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>{{ editingTheme() ? 'Modifier le thème' : 'Nouveau thème' }}</h2>
            <button class="btn-close" (click)="closeThemeDrawer()">✕</button>
          </div>
          <div class="drawer-body">
            <form [formGroup]="themeForm" (ngSubmit)="submitTheme()">
              <div class="form-row">
                <div class="form-group">
                  <label>Emoji</label>
                  <input type="text" formControlName="emoji" class="form-input" placeholder="💍" maxlength="4" />
                </div>
                <div class="form-group">
                  <label>Couleur</label>
                  <div class="color-row">
                    <input type="color" formControlName="color" class="color-swatch" />
                    <input type="text" formControlName="color" class="form-input" placeholder="#FFD700" />
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Nom <span class="required">*</span></label>
                <input type="text" formControlName="name" class="form-input" placeholder="Ex: Mariage"
                  (input)="autoSlugTheme()" [class.invalid]="isInvalid('theme', 'name')" />
                @if (isInvalid('theme', 'name')) { <span class="field-error">Nom requis.</span> }
              </div>
              <div class="form-group">
                <label>Slug <span class="required">*</span></label>
                <input type="text" formControlName="slug" class="form-input mono" placeholder="mariage"
                  [class.invalid]="isInvalid('theme', 'slug')" />
                @if (isInvalid('theme', 'slug')) { <span class="field-error">Slug requis.</span> }
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea formControlName="description" class="form-input" rows="2" placeholder="Cadeaux pour un mariage..."></textarea>
              </div>
              <label class="toggle-row">
                <span>Thème actif</span>
                <div class="toggle" [class.on]="themeForm.get('isActive')?.value" (click)="toggleThemeActive()">
                  <div class="toggle-thumb"></div>
                </div>
              </label>
              <div class="drawer-actions">
                <button type="button" class="btn-cancel" (click)="closeThemeDrawer()">Annuler</button>
                <button type="submit" class="btn-primary" [disabled]="themeLoading()">
                  {{ themeLoading() ? 'Enregistrement...' : editingTheme() ? 'Mettre à jour' : 'Créer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Modal confirmation suppression -->
    @if (deleteTarget()) {
      <div class="modal-backdrop" (click)="deleteTarget.set(null)">
        <div class="modal-confirm" (click)="$event.stopPropagation()">
          <div class="confirm-icon">🗑️</div>
          <h3>Supprimer {{ deleteTarget()?.name }} ?</h3>
          <p>Cette action est irréversible.</p>
          <div class="confirm-actions">
            <button class="btn-cancel" (click)="deleteTarget.set(null)">Annuler</button>
            <button class="btn-danger" (click)="executeDelete()" [disabled]="deleteLoading()">
              {{ deleteLoading() ? '...' : 'Supprimer définitivement' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .page {
        padding: 32px 24px;
      }

      /* Header */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0 0 4px;
        font-size: 1.8rem;
        font-weight: 800;
        color: #111827;
      }
      .subtitle {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
      .btn-primary {
        padding: 10px 20px;
        border: 0;
        border-radius: 10px;
        background: #111827;
        color: white;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-primary:hover:not(:disabled) {
        background: #1f2937;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Tabs */
      .tabs {
        display: flex;
        gap: 0;
        border-bottom: 2px solid #f3f4f6;
        margin-bottom: 20px;
      }
      .tab {
        padding: 12px 20px;
        border: 0;
        background: transparent;
        font: inherit;
        font-size: 0.92rem;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: 0.15s;
      }
      .tab.active {
        color: #111827;
        border-bottom-color: #111827;
      }
      .tab-count {
        background: #f3f4f6;
        color: #6b7280;
        padding: 1px 7px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .tab.active .tab-count {
        background: #111827;
        color: white;
      }

      /* Filters */
      .filters-bar {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .search-input {
        flex: 1;
        min-width: 180px;
        padding: 9px 14px;
        border: 1.5px solid #d1d5db;
        border-radius: 10px;
        font: inherit;
        font-size: 0.9rem;
      }
      .search-input:focus {
        outline: none;
        border-color: #111827;
      }
      select {
        padding: 9px 12px;
        border: 1.5px solid #d1d5db;
        border-radius: 10px;
        font: inherit;
        background: white;
        cursor: pointer;
      }

      /* Loading */
      .loading-bar {
        height: 3px;
        background: linear-gradient(90deg, #111827, #6b7280, #111827);
        background-size: 200%;
        animation: shimmer 1.2s infinite;
        margin-bottom: 16px;
        border-radius: 2px;
      }
      @keyframes shimmer {
        0% {
          background-position: -200%;
        }
        100% {
          background-position: 200%;
        }
      }

      .empty-state {
        text-align: center;
        color: #9ca3af;
        padding: 60px;
      }
      .link-btn {
        color: #6366f1;
        font-weight: 600;
        background: 0;
        border: 0;
        cursor: pointer;
        font: inherit;
      }

      /* Products grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
      }

      /* Categories list */
      .categories-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .category-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        background: white;
        border: 1.5px solid #e5e7eb;
        border-radius: 14px;
        padding: 16px 20px;
        flex-wrap: wrap;
      }
      .category-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .category-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .dot-active {
        background: #22c55e;
      }
      .dot-inactive {
        background: #d1d5db;
      }
      .category-name {
        font-weight: 700;
        color: #111827;
      }
      .category-meta {
        font-size: 0.82rem;
        margin-top: 2px;
      }
      .category-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .category-count {
        font-size: 0.82rem;
        color: #6b7280;
        white-space: nowrap;
      }
      .badge {
        display: inline-flex;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .badge-green {
        background: #dcfce7;
        color: #166534;
      }
      .badge-gray {
        background: #f3f4f6;
        color: #6b7280;
      }
      .btn-sm {
        padding: 6px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-sm:hover {
        background: #f9fafb;
      }
      .btn-sm-danger {
        border-color: #fca5a5;
        color: #991b1b;
      }
      .btn-sm-danger:hover {
        background: #fee2e2;
      }

      /* Drawer */
      .drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        z-index: 200;
        display: flex;
        justify-content: flex-end;
      }
      .drawer {
        width: min(520px, 100vw);
        height: 100vh;
        background: white;
        display: flex;
        flex-direction: column;
        box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
        animation: slideIn 0.25s ease;
      }
      .drawer-narrow {
        width: min(400px, 100vw);
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 28px;
        border-bottom: 1px solid #f3f4f6;
        flex-shrink: 0;
      }
      .drawer-header h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 800;
        color: #111827;
      }
      .btn-close {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 8px;
        background: #f3f4f6;
        cursor: pointer;
        font-size: 1rem;
      }
      .btn-close:hover {
        background: #e5e7eb;
      }

      .drawer-body {
        flex: 1;
        overflow-y: auto;
        padding: 24px 28px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      /* Form */
      .form-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #374151;
      }
      .required {
        color: #ef4444;
      }
      .form-input {
        padding: 10px 14px;
        border: 1.5px solid #d1d5db;
        border-radius: 10px;
        font: inherit;
        font-size: 0.9rem;
        width: 100%;
        box-sizing: border-box;
      }
      .form-input:focus {
        outline: none;
        border-color: #111827;
      }
      .form-input.invalid {
        border-color: #ef4444;
      }
      .mono {
        font-family: monospace;
      }
      textarea.form-input {
        resize: vertical;
      }
      .field-error {
        font-size: 0.78rem;
        color: #ef4444;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
      }
      .toggle {
        width: 44px;
        height: 24px;
        border-radius: 12px;
        background: #d1d5db;
        position: relative;
        transition: 0.2s;
        flex-shrink: 0;
      }
      .toggle.on {
        background: #22c55e;
      }
      .toggle-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        position: absolute;
        top: 3px;
        left: 3px;
        transition: 0.2s;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      }
      .toggle.on .toggle-thumb {
        left: 23px;
      }

      .drawer-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding-top: 8px;
        border-top: 1px solid #f3f4f6;
        margin-top: 8px;
      }
      .btn-cancel {
        padding: 10px 18px;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        background: white;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-danger-outline {
        padding: 10px 18px;
        border: 1px solid #fca5a5;
        border-radius: 10px;
        background: #fff5f5;
        color: #991b1b;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      /* Delete confirm modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 300;
        padding: 16px;
      }
      .modal-confirm {
        background: white;
        border-radius: 20px;
        padding: 32px;
        width: min(400px, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
      }
      .confirm-icon {
        font-size: 2.5rem;
      }
      .modal-confirm h3 {
        margin: 0;
        font-size: 1.15rem;
        color: #111827;
      }
      .modal-confirm p {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
      .confirm-actions {
        display: flex;
        gap: 10px;
        margin-top: 8px;
      }
      .btn-danger {
        padding: 10px 20px;
        border: 0;
        border-radius: 10px;
        background: #ef4444;
        color: white;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-danger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .themes-grid { display: flex; flex-direction: column; gap: 8px; }
      .theme-card { background: white; border: 1.5px solid #f3f4f6; border-top-width: 3px; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; transition: 0.15s; }
      .theme-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      .theme-emoji { font-size: 2rem; flex-shrink: 0; width: 44px; text-align: center; }
      .theme-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
      .theme-name { font-weight: 800; color: #111; font-size: 0.95rem; }
      .theme-desc { font-size: 0.82rem; }
      .theme-footer { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
      .theme-count { font-size: 0.75rem; }
      .theme-actions { display: flex; gap: 6px; flex-shrink: 0; }

      /* Color picker row */
      .color-row { display: flex; gap: 8px; align-items: center; }
      .color-swatch { width: 40px; height: 40px; border: 1.5px solid #d1d5db; border-radius: 8px; padding: 2px; cursor: pointer; flex-shrink: 0; }

      @media (max-width: 640px) {
        .form-row { grid-template-columns: 1fr; }
        .products-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 400px) {
        .products-grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class CatalogAdminPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly promotionsService = inject(PromotionsService);
  private readonly deliveryOptionsService = inject(DeliveryOptionsService);

  // Data
  readonly categories = signal<CatalogCategory[]>([]);
  readonly products = signal<CatalogProduct[]>([]);
  readonly themes = signal<CatalogTheme[]>([]);
  readonly categoriesLoading = signal(false);
  readonly productsLoading = signal(false);
  readonly themesLoading = signal(false);

  // UI state
  readonly activeTab = signal<'products' | 'categories' | 'themes'>('products');
  readonly productDrawerOpen = signal(false);
  readonly categoryDrawerOpen = signal(false);
  readonly themeDrawerOpen = signal(false);
  readonly editingProduct = signal<CatalogProduct | null>(null);
  readonly editingCategory = signal<CatalogCategory | null>(null);
  readonly editingTheme = signal<CatalogTheme | null>(null);
  readonly productLoading = signal(false);
  readonly categoryLoading = signal(false);
  readonly themeLoading = signal(false);
  readonly deleteLoading = signal(false);
  readonly deleteTarget = signal<{ id: number; name: string; type: 'product' | 'category' | 'theme' } | null>(
    null,
  );
  readonly selectedThemeIds = signal<Set<number>>(new Set());
  readonly allDeliveryOptions = signal<{ id: number; label: string; type: string; price: number }[]>([]);
  readonly selectedDeliveryOptionIds = signal<Set<number>>(new Set());
  readonly deliveryOptionsLoading = signal(false);

  // Drawer quick-promo
  readonly drawerActivePromo = signal<Promotion | null>(null);
  readonly showQuickPromoForm = signal(false);
  readonly promoLoading = signal(false);
  readonly promoEndLoading = signal(false);
  readonly quickPromoLoading = signal(false);
  readonly quickPromoError = signal('');
  readonly quickPromoPrice = signal<number | null>(null);
  readonly quickPromoEndsAt = signal('');
  readonly quickPromoNote = signal('');

  // Filtres produits
  productSearch = '';
  productCategoryFilter: number | '' = '';
  productStatusFilter = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // Image
  selectedImageFile: File | null = null;
  readonly productImagePreview = signal<string | null>(null);

  // Computed
  readonly filteredProducts = computed(() => {
    let items = this.products();
    if (this.productCategoryFilter) {
      items = items.filter((p) => p.category?.id === Number(this.productCategoryFilter));
    }
    return items;
  });

  // Forms
  readonly productForm = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    categoryId: [null as number | null, [Validators.required]],
    status: ['ACTIVE' as CatalogProductStatus, [Validators.required]],
    brand: [''],
    estimatedPrice: [0, [Validators.min(0)]],
    realPrice: [null as number | null, [Validators.min(0)]],
    sellingPrice: [null as number | null, [Validators.min(0)]],
    currencyCode: ['XOF'],
    description: [''],
    referenceUrl: [''],
    mainImageUrl: [''],
  });

  readonly categoryForm = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    description: [''],
    isActive: [true],
  });

  readonly themeForm = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    emoji: [''],
    description: [''],
    color: ['#6b7280'],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadThemes();
    this.loadAllDeliveryOptions();
  }

  // ===== LOADERS =====

  loadAllDeliveryOptions(): void {
    this.deliveryOptionsService.getCatalogOptions(false).subscribe({
      next: (opts) => this.allDeliveryOptions.set(opts.map(o => ({ id: o.id, label: o.label, type: o.type, price: Number(o.price) }))),
      error: () => {},
    });
  }

  loadThemes(): void {
    this.themesLoading.set(true);
    this.catalogService.getThemes().subscribe({
      next: (t) => { this.themes.set(t); this.themesLoading.set(false); },
      error: () => this.themesLoading.set(false),
    });
  }

  loadCategories(): void {
    this.categoriesLoading.set(true);
    this.catalogService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.categoriesLoading.set(false);
      },
      error: () => this.categoriesLoading.set(false),
    });
  }

  loadProducts(): void {
    this.productsLoading.set(true);
    const status = this.productStatusFilter as CatalogProductStatus | undefined;
    this.catalogService
      .getProducts(this.productSearch.trim() || undefined, status || undefined)
      .subscribe({
        next: (prods) => {
          this.products.set(prods);
          this.productsLoading.set(false);
        },
        error: () => this.productsLoading.set(false),
      });
  }

  onProductSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProducts(), 350);
  }

  // ===== DRAWERS =====

  onNewClick(): void {
    const tab = this.activeTab();
    if (tab === 'categories') this.openCategoryDrawer(null);
    else if (tab === 'themes') this.openThemeDrawer(null);
    else this.openProductDrawer(null);
  }

  openProductDrawer(product: CatalogProduct | null): void {
    this.editingProduct.set(product);
    this.selectedImageFile = null;
    this.productImagePreview.set(null);

    if (product) {
      this.productForm.patchValue({
        name: product.name,
        slug: product.slug,
        categoryId: product.category?.id ?? null,
        status: product.status,
        brand: product.brand ?? '',
        estimatedPrice: product.estimatedPrice ?? 0,
        realPrice: product.realPrice ?? null,
        sellingPrice: product.sellingPrice ?? null,
        currencyCode: product.currencyCode ?? 'XOF',
        description: product.description ?? '',
        referenceUrl: product.referenceUrl ?? '',
        mainImageUrl: product.mainImageUrl ?? '',
      });
      if (product.mainImageUrl) {
        this.productImagePreview.set(this.resolveImageUrl(product.mainImageUrl));
      }
      this.selectedThemeIds.set(new Set((product.themes ?? []).map(t => t.id)));
      this.deliveryOptionsLoading.set(true);
      this.catalogService.getProductDeliveryOptions(product.id).subscribe({
        next: (opts) => { this.selectedDeliveryOptionIds.set(new Set(opts.map(o => o.id))); this.deliveryOptionsLoading.set(false); },
        error: () => { this.selectedDeliveryOptionIds.set(new Set()); this.deliveryOptionsLoading.set(false); },
      });
      this.drawerActivePromo.set(null);
      this.showQuickPromoForm.set(false);
      this.promoLoading.set(true);
      this.promotionsService.getAll('ACTIVE', product.id).subscribe({
        next: promos => { this.drawerActivePromo.set(promos[0] ?? null); this.promoLoading.set(false); },
        error: () => this.promoLoading.set(false),
      });
    } else {
      this.productForm.reset({
        name: '',
        slug: '',
        categoryId: null,
        status: 'ACTIVE',
        brand: '',
        estimatedPrice: 0,
        realPrice: null,
        sellingPrice: null,
        currencyCode: 'XOF',
        description: '',
        referenceUrl: '',
        mainImageUrl: '',
      });
      this.selectedThemeIds.set(new Set());
      this.selectedDeliveryOptionIds.set(new Set());
      this.drawerActivePromo.set(null);
      this.showQuickPromoForm.set(false);
    }
    this.productDrawerOpen.set(true);
  }

  openThemeDrawer(theme: CatalogTheme | null): void {
    this.editingTheme.set(theme);
    if (theme) {
      this.themeForm.patchValue({
        name: theme.name,
        slug: theme.slug,
        emoji: theme.emoji ?? '',
        description: theme.description ?? '',
        color: theme.color ?? '#6b7280',
        isActive: theme.isActive,
      });
    } else {
      this.themeForm.reset({ name: '', slug: '', emoji: '', description: '', color: '#6b7280', isActive: true });
    }
    this.themeDrawerOpen.set(true);
  }

  closeThemeDrawer(): void {
    this.themeDrawerOpen.set(false);
    this.editingTheme.set(null);
  }

  toggleThemeSelection(id: number): void {
    const s = new Set(this.selectedThemeIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedThemeIds.set(s);
  }

  toggleDeliveryOption(id: number): void {
    const s = new Set(this.selectedDeliveryOptionIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedDeliveryOptionIds.set(s);
  }

  closeProductDrawer(): void {
    this.productDrawerOpen.set(false);
    this.editingProduct.set(null);
    this.drawerActivePromo.set(null);
    this.showQuickPromoForm.set(false);
  }

  openCategoryDrawer(category: CatalogCategory | null): void {
    this.editingCategory.set(category);
    if (category) {
      this.categoryForm.patchValue({
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        isActive: category.isActive,
      });
    } else {
      this.categoryForm.reset({ name: '', slug: '', description: '', isActive: true });
    }
    this.categoryDrawerOpen.set(true);
  }

  closeCategoryDrawer(): void {
    this.categoryDrawerOpen.set(false);
    this.editingCategory.set(null);
  }

  // ===== AUTO SLUG =====

  autoSlugProduct(): void {
    const name = this.productForm.get('name')?.value ?? '';
    if (!this.editingProduct()) {
      this.productForm.patchValue({ slug: this.toSlug(name) }, { emitEvent: false });
    }
  }

  autoSlugCategory(): void {
    const name = this.categoryForm.get('name')?.value ?? '';
    if (!this.editingCategory()) {
      this.categoryForm.patchValue({ slug: this.toSlug(name) }, { emitEvent: false });
    }
  }

  autoSlugTheme(): void {
    const name = this.themeForm.get('name')?.value ?? '';
    if (!this.editingTheme()) {
      this.themeForm.patchValue({ slug: this.toSlug(name) }, { emitEvent: false });
    }
  }

  private toSlug(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ===== IMAGE =====

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = () => this.productImagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiBaseUrl.replace('/api', '')}${url}`;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  // ===== SUBMIT =====

  submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.productLoading.set(true);

    const doSave = (imageUrl: string) => {
      const raw = this.productForm.getRawValue();
      const payload = {
        name: raw.name ?? '',
        slug: raw.slug ?? '',
        categoryId: Number(raw.categoryId),
        status: raw.status ?? 'ACTIVE',
        brand: raw.brand ?? '',
        estimatedPrice: Number(raw.estimatedPrice ?? 0),
        realPrice: raw.realPrice != null ? Number(raw.realPrice) : null,
        sellingPrice: raw.sellingPrice != null ? Number(raw.sellingPrice) : null,
        currencyCode: raw.currencyCode ?? 'XOF',
        description: raw.description ?? '',
        referenceUrl: raw.referenceUrl ?? '',
        mainImageUrl: imageUrl,
      };

      const editing = this.editingProduct();
      const req$ = editing
        ? this.catalogService.updateProduct(editing.id, payload)
        : this.catalogService.createProduct(payload);

      req$.subscribe({
        next: (res) => {
          const productId = editing ? editing.id : res.item.id;
          const themeIds = Array.from(this.selectedThemeIds());
          const deliveryOptionIds = Array.from(this.selectedDeliveryOptionIds());
          if (productId) {
            const finish = () => {
              this.productLoading.set(false);
              this.closeProductDrawer();
              this.toast.success(editing ? 'Produit mis à jour.' : 'Produit créé.');
              this.loadProducts();
            };
            this.catalogService.setProductThemes(productId, themeIds).subscribe({ error: () => {} });
            this.catalogService.setProductDeliveryOptions(productId, deliveryOptionIds).subscribe({
              next: finish,
              error: finish,
            });
          } else {
            this.productLoading.set(false);
            this.closeProductDrawer();
            this.toast.success(editing ? 'Produit mis à jour.' : 'Produit créé.');
            this.loadProducts();
          }
        },
        error: (e: unknown) => {
          this.productLoading.set(false);
          const message =
            typeof e === 'object' &&
            e !== null &&
            'error' in e &&
            typeof (e as { error?: { message?: unknown } }).error?.message === 'string'
              ? (e as { error: { message: string } }).error.message
              : 'Erreur.';
          this.toast.error(message);
        },
      });
    };

    if (this.selectedImageFile) {
      this.catalogService.uploadImage(this.selectedImageFile).subscribe({
        next: (url) => doSave(url),
        error: () => {
          this.productLoading.set(false);
          this.toast.error("Erreur lors de l'upload.");
        },
      });
    } else {
      doSave(this.productForm.get('mainImageUrl')?.value?.trim() ?? '');
    }
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.categoryLoading.set(true);

    const raw = this.categoryForm.getRawValue();
    const payload = {
      name: raw.name ?? '',
      slug: raw.slug ?? '',
      description: raw.description ?? '',
      isActive: raw.isActive ?? true,
    };

    const editing = this.editingCategory();
    const req$ = editing
      ? this.catalogService.updateCategory(editing.id, payload)
      : this.catalogService.createCategory(payload);

    req$.subscribe({
      next: () => {
        this.categoryLoading.set(false);
        this.closeCategoryDrawer();
        this.toast.success(editing ? 'Catégorie mise à jour.' : 'Catégorie créée.');
        this.loadCategories();
      },
      error: (e: any) => {
        this.categoryLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur.');
      },
    });
  }

  toggleCategoryActive(): void {
    const current = this.categoryForm.get('isActive')?.value;
    this.categoryForm.patchValue({ isActive: !current });
  }

  toggleThemeActive(): void {
    const current = this.themeForm.get('isActive')?.value;
    this.themeForm.patchValue({ isActive: !current });
  }

  submitTheme(): void {
    if (this.themeForm.invalid) { this.themeForm.markAllAsTouched(); return; }
    this.themeLoading.set(true);
    const raw = this.themeForm.getRawValue();
    const payload: CreateCatalogThemePayload = {
      name: raw.name ?? '',
      slug: raw.slug ?? '',
      emoji: raw.emoji?.trim() || undefined,
      description: raw.description?.trim() || undefined,
      color: raw.color?.trim() || undefined,
      isActive: raw.isActive ?? true,
    };
    const editing = this.editingTheme();
    const req$ = editing
      ? this.catalogService.updateTheme(editing.id, payload as UpdateCatalogThemePayload)
      : this.catalogService.createTheme(payload);
    req$.subscribe({
      next: () => {
        this.themeLoading.set(false);
        this.closeThemeDrawer();
        this.toast.success(editing ? 'Thème mis à jour.' : 'Thème créé.');
        this.loadThemes();
      },
      error: (e: any) => {
        this.themeLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur.');
      },
    });
  }

  // ===== STATUS PRODUIT =====

  toggleProductStatus(product: CatalogProduct): void {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.catalogService
      .updateProduct(product.id, { status: newStatus as CatalogProductStatus })
      .subscribe({
        next: () => {
          this.products.update((prods) =>
            prods.map((p) =>
              p.id === product.id ? { ...p, status: newStatus as CatalogProductStatus } : p,
            ),
          );
          this.toast.success(`Produit ${newStatus === 'ACTIVE' ? 'activé' : 'désactivé'}.`);
        },
        error: (e: any) => this.toast.error(e?.error?.message ?? 'Erreur.'),
      });
  }

  // ===== DELETE =====

  confirmDeleteProduct(product: CatalogProduct): void {
    this.deleteTarget.set({ id: product.id, name: product.name, type: 'product' });
  }

  confirmDeleteCategory(category: CatalogCategory): void {
    this.deleteTarget.set({ id: category.id, name: category.name, type: 'category' });
  }

  confirmDeleteTheme(theme: CatalogTheme): void {
    this.deleteTarget.set({ id: theme.id, name: theme.name, type: 'theme' });
  }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleteLoading.set(true);

    const req$ =
      target.type === 'product'
        ? this.catalogService.deleteProduct(target.id)
        : target.type === 'theme'
          ? this.catalogService.deleteTheme(target.id)
          : this.catalogService.deleteCategory(target.id);

    req$.subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.deleteTarget.set(null);
        if (target.type === 'product') {
          this.products.update((prods) => prods.filter((p) => p.id !== target.id));
          this.toast.success('Produit supprimé.');
        } else if (target.type === 'theme') {
          this.loadThemes();
          this.toast.success('Thème supprimé.');
        } else {
          this.loadCategories();
          this.toast.success('Catégorie supprimée.');
        }
      },
      error: (e: any) => {
        this.deleteLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur lors de la suppression.');
      },
    });
  }

  // ===== HELPERS =====

  getProductCountForCategory(categoryId: number): number {
    return this.products().filter((p) => p.category?.id === categoryId).length;
  }

  getProductCountForTheme(themeId: number): number {
    return this.products().filter((p) => p.themes?.some(t => t.id === themeId)).length;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Actif',
      INACTIVE: 'Inactif',
      DRAFT: 'Brouillon',
      ARCHIVED: 'Archivé',
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'status-active',
      INACTIVE: 'status-inactive',
      DRAFT: 'status-draft',
      ARCHIVED: 'status-archived',
    };
    return map[status] ?? 'status-draft';
  }

  isPromoActive(product: CatalogProduct): boolean {
    if (!product.promoPrice || !product.promoEndsAt) return false;
    return new Date(product.promoEndsAt) > new Date();
  }

  isInvalid(form: 'product' | 'category' | 'theme', field: string): boolean {
    const ctrl = form === 'product'
      ? this.productForm.get(field)
      : form === 'theme'
        ? this.themeForm.get(field)
        : this.categoryForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  // ===== QUICK PROMO =====

  openQuickPromoForm(): void {
    const sellingPrice = this.productForm.get('sellingPrice')?.value;
    this.quickPromoPrice.set(sellingPrice ? Number(sellingPrice) : null);
    this.quickPromoEndsAt.set('');
    this.quickPromoNote.set('');
    this.quickPromoError.set('');
    this.showQuickPromoForm.set(true);
  }

  submitQuickPromo(): void {
    const product = this.editingProduct();
    const price = this.quickPromoPrice();
    const endsAt = this.quickPromoEndsAt();
    if (!product || !price || price <= 0 || !endsAt || this.quickPromoLoading()) return;
    this.quickPromoLoading.set(true);
    this.quickPromoError.set('');
    this.promotionsService.create({
      catalogProductId: product.id,
      promoPrice: price,
      startsAt: new Date().toISOString(),
      endsAt,
      note: this.quickPromoNote() || undefined,
    }).subscribe({
      next: (promo) => {
        this.quickPromoLoading.set(false);
        this.showQuickPromoForm.set(false);
        this.drawerActivePromo.set(promo);
        this.toast.success('Promotion créée.');
        this.loadProducts();
      },
      error: (e: any) => {
        this.quickPromoLoading.set(false);
        this.quickPromoError.set(e?.error?.message ?? 'Erreur lors de la création');
      },
    });
  }

  endDrawerPromo(): void {
    const promo = this.drawerActivePromo();
    if (!promo) return;
    this.promoEndLoading.set(true);
    this.promotionsService.end(promo.id).subscribe({
      next: () => {
        this.promoEndLoading.set(false);
        this.drawerActivePromo.set(null);
        this.toast.success('Promotion terminée.');
        this.loadProducts();
      },
      error: (e: any) => {
        this.promoEndLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Erreur');
      },
    });
  }

  getInputVal(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  getNumOrNull(event: Event): number | null {
    const v = Number((event.target as HTMLInputElement).value);
    return isNaN(v) || v <= 0 ? null : v;
  }
}
