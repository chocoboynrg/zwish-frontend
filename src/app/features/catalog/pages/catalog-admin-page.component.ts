import { CommonModule } from '@angular/common';
import {
  Component, OnInit, inject, signal, computed, effect
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../services/catalog.service';
import { CatalogCategory } from '../models/catalog-category.model';
import { CatalogProduct, CatalogProductStatus } from '../models/catalog-product.model';
import { ToastService } from '../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-catalog-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Catalogue</h1>
          <p class="subtitle">
            {{ categories().length }} catégorie(s) · {{ products().length }} produit(s)
          </p>
        </div>
        <button
          class="btn-primary"
          (click)="activeTab() === 'categories' ? openCategoryDrawer(null) : openProductDrawer(null)"
        >
          + {{ activeTab() === 'categories' ? 'Nouvelle catégorie' : 'Nouveau produit' }}
        </button>
      </div>

      <!-- Onglets -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'products'" (click)="activeTab.set('products')">
          Produits
          <span class="tab-count">{{ products().length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'categories'" (click)="activeTab.set('categories')">
          Catégories
          <span class="tab-count">{{ categories().length }}</span>
        </button>
      </div>

      <!-- ===== ONGLET PRODUITS ===== -->
      <ng-container *ngIf="activeTab() === 'products'">

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
            <option *ngFor="let c of categories()" [value]="c.id">{{ c.name }}</option>
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
        <div class="loading-bar" *ngIf="productsLoading()"></div>

        <p class="empty-state" *ngIf="!productsLoading() && filteredProducts().length === 0">
          Aucun produit trouvé.
          <button class="link-btn" (click)="openProductDrawer(null)">Créer le premier →</button>
        </p>

        <div class="products-grid" *ngIf="filteredProducts().length > 0">
          <div
            class="product-card"
            *ngFor="let p of filteredProducts()"
            (click)="openProductDrawer(p)"
          >
            <!-- Image -->
            <div class="product-img-wrap">
              <img
                *ngIf="p.mainImageUrl"
                [src]="resolveImageUrl(p.mainImageUrl)"
                [alt]="p.name"
                class="product-img"
                (error)="onImageError($event)"
              />
              <div class="product-img-placeholder" *ngIf="!p.mainImageUrl">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="#d1d5db" stroke-width="1.5"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="#d1d5db"/>
                  <path d="M21 15l-5-5L5 21" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="product-status-badge" [ngClass]="getStatusClass(p.status)">
                {{ getStatusLabel(p.status) }}
              </span>
            </div>

            <!-- Infos -->
            <div class="product-info">
              <div class="product-category-tag" *ngIf="p.category">{{ p.category.name }}</div>
              <div class="product-name">{{ p.name }}</div>
              <div class="product-brand muted" *ngIf="p.brand">{{ p.brand }}</div>
              <div class="product-price">
                {{ p.estimatedPrice | number }} <span class="currency">{{ p.currencyCode }}</span>
              </div>
            </div>

            <!-- Actions rapides -->
            <div class="product-actions" (click)="$event.stopPropagation()">
              <button
                class="btn-icon"
                [title]="p.status === 'ACTIVE' ? 'Désactiver' : 'Activer'"
                (click)="toggleProductStatus(p)"
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.6"/>
                  <path *ngIf="p.status === 'ACTIVE'" d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  <path *ngIf="p.status !== 'ACTIVE'" d="M7 13l6-6M13 13L7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
              <button class="btn-icon btn-icon-danger" title="Supprimer" (click)="confirmDeleteProduct(p)">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M4 6h12M8 6V4h4v2M7 6v9a1 1 0 001 1h4a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ===== ONGLET CATÉGORIES ===== -->
      <ng-container *ngIf="activeTab() === 'categories'">
        <div class="loading-bar" *ngIf="categoriesLoading()"></div>

        <p class="empty-state" *ngIf="!categoriesLoading() && categories().length === 0">
          Aucune catégorie.
          <button class="link-btn" (click)="openCategoryDrawer(null)">Créer la première →</button>
        </p>

        <div class="categories-list" *ngIf="categories().length > 0">
          <div class="category-row" *ngFor="let c of categories()">
            <div class="category-left">
              <div class="category-dot" [ngClass]="c.isActive ? 'dot-active' : 'dot-inactive'"></div>
              <div>
                <div class="category-name">{{ c.name }}</div>
                <div class="category-meta muted">
                  /{{ c.slug }}
                  <span *ngIf="c.description"> · {{ c.description | slice:0:60 }}{{ c.description.length > 60 ? '…' : '' }}</span>
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
              <button class="btn-sm btn-sm-danger" (click)="confirmDeleteCategory(c)">Supprimer</button>
            </div>
          </div>
        </div>
      </ng-container>

    </div>

    <!-- ===== DRAWER PRODUIT ===== -->
    <div class="drawer-overlay" *ngIf="productDrawerOpen()" (click)="closeProductDrawer()">
      <div class="drawer" (click)="$event.stopPropagation()">
        <div class="drawer-header">
          <h2>{{ editingProduct() ? 'Modifier le produit' : 'Nouveau produit' }}</h2>
          <button class="btn-close" (click)="closeProductDrawer()">✕</button>
        </div>

        <div class="drawer-body">
          <form [formGroup]="productForm" (ngSubmit)="submitProduct()">

            <!-- Image -->
            <div class="form-section">
              <div class="image-upload-area" (click)="imageInput.click()">
                <img
                  *ngIf="productImagePreview()"
                  [src]="productImagePreview()!"
                  class="image-preview"
                  alt="Aperçu"
                />
                <div class="image-placeholder" *ngIf="!productImagePreview()">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#9ca3af" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="#9ca3af"/><path d="M21 15l-5-5L5 21" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <span>Cliquer pour ajouter une image</span>
                </div>
              </div>
              <input #imageInput type="file" accept="image/*" style="display:none" (change)="onImageSelected($event)" />
              <div class="or-separator">ou</div>
              <input
                type="text"
                formControlName="mainImageUrl"
                placeholder="URL de l'image (https://...)"
                class="form-input"
              />
            </div>

            <!-- Champs principaux -->
            <div class="form-group">
              <label>Nom <span class="required">*</span></label>
              <input type="text" formControlName="name" class="form-input" placeholder="Ex: iPhone 15 Pro"
                (input)="autoSlugProduct()" [class.invalid]="isInvalid('product', 'name')" />
              <span class="field-error" *ngIf="isInvalid('product', 'name')">Nom requis.</span>
            </div>

            <div class="form-group">
              <label>Slug <span class="required">*</span></label>
              <input type="text" formControlName="slug" class="form-input mono" placeholder="iphone-15-pro"
                [class.invalid]="isInvalid('product', 'slug')" />
              <span class="field-error" *ngIf="isInvalid('product', 'slug')">Slug requis.</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Catégorie <span class="required">*</span></label>
                <select formControlName="categoryId" class="form-input" [class.invalid]="isInvalid('product', 'categoryId')">
                  <option [ngValue]="null" disabled>Choisir...</option>
                  <option *ngFor="let c of categories()" [ngValue]="c.id">{{ c.name }}</option>
                </select>
                <span class="field-error" *ngIf="isInvalid('product', 'categoryId')">Catégorie requise.</span>
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
                <label>Marque</label>
                <input type="text" formControlName="brand" class="form-input" placeholder="Ex: Apple" />
              </div>
              <div class="form-group">
                <label>Prix estimé</label>
                <div class="price-input-wrap">
                  <input type="number" formControlName="estimatedPrice" class="form-input" min="0" placeholder="0" />
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
              <textarea formControlName="description" class="form-input" rows="3" placeholder="Description du produit..."></textarea>
            </div>

            <div class="form-group">
              <label>Lien de référence</label>
              <input type="url" formControlName="referenceUrl" class="form-input" placeholder="https://..." />
            </div>

            <div class="drawer-actions">
              <button type="button" class="btn-cancel" (click)="closeProductDrawer()">Annuler</button>
              <button
                *ngIf="editingProduct()"
                type="button"
                class="btn-danger-outline"
                (click)="confirmDeleteProduct(editingProduct()!); closeProductDrawer()"
              >
                Supprimer
              </button>
              <button type="submit" class="btn-primary" [disabled]="productLoading()">
                {{ productLoading() ? 'Enregistrement...' : (editingProduct() ? 'Mettre à jour' : 'Créer le produit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- ===== DRAWER CATÉGORIE ===== -->
    <div class="drawer-overlay" *ngIf="categoryDrawerOpen()" (click)="closeCategoryDrawer()">
      <div class="drawer drawer-narrow" (click)="$event.stopPropagation()">
        <div class="drawer-header">
          <h2>{{ editingCategory() ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h2>
          <button class="btn-close" (click)="closeCategoryDrawer()">✕</button>
        </div>

        <div class="drawer-body">
          <form [formGroup]="categoryForm" (ngSubmit)="submitCategory()">

            <div class="form-group">
              <label>Nom <span class="required">*</span></label>
              <input type="text" formControlName="name" class="form-input"
                placeholder="Ex: Électronique"
                (input)="autoSlugCategory()"
                [class.invalid]="isInvalid('category', 'name')" />
              <span class="field-error" *ngIf="isInvalid('category', 'name')">Nom requis.</span>
            </div>

            <div class="form-group">
              <label>Slug <span class="required">*</span></label>
              <input type="text" formControlName="slug" class="form-input mono"
                placeholder="electronique"
                [class.invalid]="isInvalid('category', 'slug')" />
              <span class="field-error" *ngIf="isInvalid('category', 'slug')">Slug requis.</span>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea formControlName="description" class="form-input" rows="3"
                placeholder="Description de la catégorie..."></textarea>
            </div>

            <label class="toggle-row">
              <span>Catégorie active</span>
              <div class="toggle" [class.on]="categoryForm.get('isActive')?.value" (click)="toggleCategoryActive()">
                <div class="toggle-thumb"></div>
              </div>
            </label>

            <div class="drawer-actions">
              <button type="button" class="btn-cancel" (click)="closeCategoryDrawer()">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="categoryLoading()">
                {{ categoryLoading() ? 'Enregistrement...' : (editingCategory() ? 'Mettre à jour' : 'Créer') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal confirmation suppression -->
    <div class="modal-backdrop" *ngIf="deleteTarget()" (click)="deleteTarget.set(null)">
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
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 0; }

    /* Header */
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    h1 { margin: 0 0 4px; font-size: 1.8rem; font-weight: 800; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .btn-primary { padding: 10px 20px; border: 0; border-radius: 10px; background: #111827; color: white; font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-primary:hover:not(:disabled) { background: #1f2937; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Tabs */
    .tabs { display: flex; gap: 0; border-bottom: 2px solid #f3f4f6; margin-bottom: 20px; }
    .tab {
      padding: 12px 20px; border: 0; background: transparent; font: inherit;
      font-size: 0.92rem; font-weight: 600; color: #6b7280; cursor: pointer;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
      display: flex; align-items: center; gap: 8px; transition: 0.15s;
    }
    .tab.active { color: #111827; border-bottom-color: #111827; }
    .tab-count {
      background: #f3f4f6; color: #6b7280; padding: 1px 7px;
      border-radius: 999px; font-size: 0.75rem; font-weight: 700;
    }
    .tab.active .tab-count { background: #111827; color: white; }

    /* Filters */
    .filters-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-input {
      flex: 1; min-width: 180px; padding: 9px 14px;
      border: 1.5px solid #d1d5db; border-radius: 10px; font: inherit; font-size: 0.9rem;
    }
    .search-input:focus { outline: none; border-color: #111827; }
    select { padding: 9px 12px; border: 1.5px solid #d1d5db; border-radius: 10px; font: inherit; background: white; cursor: pointer; }

    /* Loading */
    .loading-bar { height: 3px; background: linear-gradient(90deg, #111827, #6b7280, #111827); background-size: 200%; animation: shimmer 1.2s infinite; margin-bottom: 16px; border-radius: 2px; }
    @keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }

    .empty-state { text-align: center; color: #9ca3af; padding: 60px; }
    .link-btn { color: #6366f1; font-weight: 600; background: 0; border: 0; cursor: pointer; font: inherit; }

    /* Products grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }

    .product-card {
      background: white; border: 1.5px solid #e5e7eb; border-radius: 16px;
      overflow: hidden; cursor: pointer; transition: box-shadow 0.15s, transform 0.15s;
      display: flex; flex-direction: column;
      position: relative;
    }
    .product-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }

    .product-img-wrap { position: relative; height: 160px; background: #f9fafb; flex-shrink: 0; }
    .product-img { width: 100%; height: 100%; object-fit: cover; }
    .product-img-placeholder {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px; color: #d1d5db; font-size: 0.82rem;
    }
    .product-status-badge {
      position: absolute; top: 8px; right: 8px;
      padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 700;
    }
    .status-active { background: #dcfce7; color: #166534; }
    .status-inactive { background: #fef3c7; color: #92400e; }
    .status-draft { background: #f3f4f6; color: #6b7280; }
    .status-archived { background: #fee2e2; color: #991b1b; }

    .product-info { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .product-category-tag { font-size: 0.72rem; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.04em; }
    .product-name { font-size: 0.95rem; font-weight: 700; color: #111827; line-height: 1.3; }
    .product-brand { font-size: 0.82rem; }
    .product-price { font-size: 1rem; font-weight: 800; color: #111827; margin-top: 4px; }
    .currency { font-size: 0.75rem; font-weight: 600; color: #6b7280; }
    .muted { color: #9ca3af; }

    .product-actions {
      display: flex; gap: 4px; padding: 10px 14px;
      border-top: 1px solid #f3f4f6; justify-content: flex-end;
    }
    .btn-icon {
      width: 32px; height: 32px; border: 1px solid #e5e7eb; border-radius: 8px;
      background: white; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #6b7280; transition: 0.15s;
    }
    .btn-icon:hover { background: #f3f4f6; color: #111827; }
    .btn-icon-danger:hover { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }

    /* Categories list */
    .categories-list { display: flex; flex-direction: column; gap: 8px; }
    .category-row {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      background: white; border: 1.5px solid #e5e7eb; border-radius: 14px;
      padding: 16px 20px; flex-wrap: wrap;
    }
    .category-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .category-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .dot-active { background: #22c55e; }
    .dot-inactive { background: #d1d5db; }
    .category-name { font-weight: 700; color: #111827; }
    .category-meta { font-size: 0.82rem; margin-top: 2px; }
    .category-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .category-count { font-size: 0.82rem; color: #6b7280; white-space: nowrap; }
    .badge { display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-gray { background: #f3f4f6; color: #6b7280; }
    .btn-sm { padding: 6px 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    .btn-sm:hover { background: #f9fafb; }
    .btn-sm-danger { border-color: #fca5a5; color: #991b1b; }
    .btn-sm-danger:hover { background: #fee2e2; }

    /* Drawer */
    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.35);
      z-index: 200; display: flex; justify-content: flex-end;
    }
    .drawer {
      width: min(520px, 100vw); height: 100vh; background: white;
      display: flex; flex-direction: column; box-shadow: -8px 0 40px rgba(0,0,0,0.12);
      animation: slideIn 0.25s ease;
    }
    .drawer-narrow { width: min(400px, 100vw); }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 28px; border-bottom: 1px solid #f3f4f6; flex-shrink: 0;
    }
    .drawer-header h2 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #111827; }
    .btn-close { width: 36px; height: 36px; border: 0; border-radius: 8px; background: #f3f4f6; cursor: pointer; font-size: 1rem; }
    .btn-close:hover { background: #e5e7eb; }

    .drawer-body { flex: 1; overflow-y: auto; padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; }

    /* Form */
    .form-section { display: flex; flex-direction: column; gap: 8px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    label { font-size: 0.85rem; font-weight: 700; color: #374151; }
    .required { color: #ef4444; }
    .form-input {
      padding: 10px 14px; border: 1.5px solid #d1d5db; border-radius: 10px;
      font: inherit; font-size: 0.9rem; width: 100%; box-sizing: border-box;
    }
    .form-input:focus { outline: none; border-color: #111827; }
    .form-input.invalid { border-color: #ef4444; }
    .mono { font-family: monospace; }
    textarea.form-input { resize: vertical; }
    .field-error { font-size: 0.78rem; color: #ef4444; }

    .price-input-wrap { display: flex; gap: 0; }
    .price-input-wrap .form-input { border-radius: 10px 0 0 10px; flex: 1; }
    .currency-select { border: 1.5px solid #d1d5db; border-left: 0; border-radius: 0 10px 10px 0; padding: 10px 10px; font: inherit; background: #f9fafb; cursor: pointer; }

    /* Image upload */
    .image-upload-area {
      border: 2px dashed #d1d5db; border-radius: 12px; cursor: pointer;
      min-height: 140px; display: flex; align-items: center; justify-content: center;
      overflow: hidden; transition: 0.15s; background: #f9fafb;
    }
    .image-upload-area:hover { border-color: #111827; background: #f3f4f6; }
    .image-preview { width: 100%; height: 140px; object-fit: cover; }
    .image-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; font-size: 0.82rem; padding: 20px; text-align: center; }
    .or-separator { text-align: center; color: #9ca3af; font-size: 0.82rem; position: relative; }
    .or-separator::before, .or-separator::after { content: ''; position: absolute; top: 50%; width: 40%; height: 1px; background: #e5e7eb; }
    .or-separator::before { left: 0; }
    .or-separator::after { right: 0; }

    /* Toggle */
    .toggle-row { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
    .toggle { width: 44px; height: 24px; border-radius: 12px; background: #d1d5db; position: relative; transition: 0.2s; flex-shrink: 0; }
    .toggle.on { background: #22c55e; }
    .toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: white; position: absolute; top: 3px; left: 3px; transition: 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    .toggle.on .toggle-thumb { left: 23px; }

    /* Drawer actions */
    .drawer-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 8px; border-top: 1px solid #f3f4f6; margin-top: 8px; }
    .btn-cancel { padding: 10px 18px; border: 1px solid #d1d5db; border-radius: 10px; background: white; font: inherit; font-weight: 600; cursor: pointer; }
    .btn-danger-outline { padding: 10px 18px; border: 1px solid #fca5a5; border-radius: 10px; background: #fff5f5; color: #991b1b; font: inherit; font-weight: 600; cursor: pointer; }

    /* Delete confirm modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 16px; }
    .modal-confirm { background: white; border-radius: 20px; padding: 32px; width: min(400px, 100%); display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .confirm-icon { font-size: 2.5rem; }
    .modal-confirm h3 { margin: 0; font-size: 1.15rem; color: #111827; }
    .modal-confirm p { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .confirm-actions { display: flex; gap: 10px; margin-top: 8px; }
    .btn-danger { padding: 10px 20px; border: 0; border-radius: 10px; background: #ef4444; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
      .products-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 400px) {
      .products-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CatalogAdminPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly toast = inject(ToastService);

  // Data
  readonly categories = signal<CatalogCategory[]>([]);
  readonly products = signal<CatalogProduct[]>([]);
  readonly categoriesLoading = signal(false);
  readonly productsLoading = signal(false);

  // UI state
  readonly activeTab = signal<'products' | 'categories'>('products');
  readonly productDrawerOpen = signal(false);
  readonly categoryDrawerOpen = signal(false);
  readonly editingProduct = signal<CatalogProduct | null>(null);
  readonly editingCategory = signal<CatalogCategory | null>(null);
  readonly productLoading = signal(false);
  readonly categoryLoading = signal(false);
  readonly deleteLoading = signal(false);
  readonly deleteTarget = signal<{ id: number; name: string; type: 'product' | 'category' } | null>(null);

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
      items = items.filter(p => p.category?.id === Number(this.productCategoryFilter));
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

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  // ===== LOADERS =====

  loadCategories(): void {
    this.categoriesLoading.set(true);
    this.catalogService.getCategories().subscribe({
      next: (cats) => { this.categories.set(cats); this.categoriesLoading.set(false); },
      error: () => this.categoriesLoading.set(false),
    });
  }

  loadProducts(): void {
    this.productsLoading.set(true);
    const status = this.productStatusFilter as CatalogProductStatus | undefined;
    this.catalogService.getProducts(this.productSearch.trim() || undefined, status || undefined).subscribe({
      next: (prods) => { this.products.set(prods); this.productsLoading.set(false); },
      error: () => this.productsLoading.set(false),
    });
  }

  onProductSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadProducts(), 350);
  }

  // ===== DRAWERS =====

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
        currencyCode: product.currencyCode ?? 'XOF',
        description: product.description ?? '',
        referenceUrl: product.referenceUrl ?? '',
        mainImageUrl: product.mainImageUrl ?? '',
      });
      if (product.mainImageUrl) {
        this.productImagePreview.set(this.resolveImageUrl(product.mainImageUrl));
      }
    } else {
      this.productForm.reset({
        name: '', slug: '', categoryId: null, status: 'ACTIVE',
        brand: '', estimatedPrice: 0, currencyCode: 'XOF',
        description: '', referenceUrl: '', mainImageUrl: '',
      });
    }
    this.productDrawerOpen.set(true);
  }

  closeProductDrawer(): void {
    this.productDrawerOpen.set(false);
    this.editingProduct.set(null);
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

  private toSlug(str: string): string {
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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
    if (this.productForm.invalid) { this.productForm.markAllAsTouched(); return; }
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
        next: () => {
          this.productLoading.set(false);
          this.closeProductDrawer();
          this.toast.success(editing ? 'Produit mis à jour.' : 'Produit créé.');
          this.loadProducts();
        },
        error: (e: any) => {
          this.productLoading.set(false);
          this.toast.error(e?.error?.message ?? 'Erreur.');
        },
      });
    };

    if (this.selectedImageFile) {
      this.catalogService.uploadImage(this.selectedImageFile).subscribe({
        next: (url) => doSave(url),
        error: () => { this.productLoading.set(false); this.toast.error('Erreur lors de l\'upload.'); },
      });
    } else {
      doSave(this.productForm.get('mainImageUrl')?.value?.trim() ?? '');
    }
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); return; }
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

  // ===== STATUS PRODUIT =====

  toggleProductStatus(product: CatalogProduct): void {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.catalogService.updateProduct(product.id, { status: newStatus as CatalogProductStatus }).subscribe({
      next: () => {
        this.products.update(prods => prods.map(p => p.id === product.id ? { ...p, status: newStatus as CatalogProductStatus } : p));
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

  executeDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleteLoading.set(true);

    const req$ = target.type === 'product'
      ? this.catalogService.deleteProduct(target.id)
      : this.catalogService.deleteCategory(target.id);

    req$.subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.deleteTarget.set(null);
        if (target.type === 'product') {
          this.products.update(prods => prods.filter(p => p.id !== target.id));
          this.toast.success('Produit supprimé.');
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
    return this.products().filter(p => p.category?.id === categoryId).length;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { ACTIVE: 'Actif', INACTIVE: 'Inactif', DRAFT: 'Brouillon', ARCHIVED: 'Archivé' };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { ACTIVE: 'status-active', INACTIVE: 'status-inactive', DRAFT: 'status-draft', ARCHIVED: 'status-archived' };
    return map[status] ?? 'status-draft';
  }

  isInvalid(form: 'product' | 'category', field: string): boolean {
    const ctrl = form === 'product'
      ? this.productForm.get(field)
      : this.categoryForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}