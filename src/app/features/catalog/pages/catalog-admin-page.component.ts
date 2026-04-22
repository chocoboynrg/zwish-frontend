import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogService } from '../services/catalog.service';
import { CatalogCategory } from '../models/catalog-category.model';
import { ToastService } from '../../../core/services/toast.service';
import {
  CatalogProduct,
  CatalogProductStatus,
} from '../models/catalog-product.model';

@Component({
  selector: 'app-catalog-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Catalogue admin</h1>
        <p>Gestion complète des catégories et produits</p>
      </div>

      <div class="layout-grid">
        <section class="card">
          <h2>
            {{ selectedCategory() ? 'Modifier une catégorie' : 'Créer une catégorie' }}
          </h2>

          <form [formGroup]="categoryForm" (ngSubmit)="submitCategory()">
            <div class="form-group">
              <label>Nom</label>
              <input
                type="text"
                formControlName="name"
                [class.invalid]="isCategoryFieldInvalid('name')"
              />
              <small class="field-error" *ngIf="isCategoryFieldInvalid('name')">
                Le nom est obligatoire.
              </small>
            </div>

            <div class="form-group">
              <label>Slug</label>
              <input
                type="text"
                formControlName="slug"
                [class.invalid]="isCategoryFieldInvalid('slug')"
              />
              <small class="field-error" *ngIf="isCategoryFieldInvalid('slug')">
                Le slug est obligatoire.
              </small>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea rows="3" formControlName="description"></textarea>
            </div>

            <label class="checkbox">
              <input type="checkbox" formControlName="isActive" />
              Catégorie active
            </label>

            <div class="actions">
              <button type="submit" [disabled]="categoryLoading">
                {{
                  categoryLoading
                    ? 'Traitement...'
                    : selectedCategory()
                      ? 'Mettre à jour'
                      : 'Créer la catégorie'
                }}
              </button>

              <button
                *ngIf="selectedCategory()"
                type="button"
                class="secondary"
                (click)="cancelCategoryEdit()"
              >
                Annuler
              </button>
            </div>
          </form>
        </section>

        <section class="card">
          <h2>
            {{ selectedProduct() ? 'Modifier un produit' : 'Créer un produit' }}
          </h2>

          <form [formGroup]="productForm" (ngSubmit)="submitProduct()">
            <div class="form-group">
              <label>Catégorie</label>
              <select
                formControlName="categoryId"
                [class.invalid]="isProductFieldInvalid('categoryId')"
              >
                <option [ngValue]="null">Choisir une catégorie</option>
                <option *ngFor="let category of categories()" [ngValue]="category.id">
                  {{ category?.name || '—' }}
                </option>
              </select>
              <small class="field-error" *ngIf="isProductFieldInvalid('categoryId')">
                La catégorie est obligatoire.
              </small>
            </div>

            <div class="form-group">
              <label>Nom</label>
              <input
                type="text"
                formControlName="name"
                [class.invalid]="isProductFieldInvalid('name')"
              />
              <small class="field-error" *ngIf="isProductFieldInvalid('name')">
                Le nom est obligatoire.
              </small>
            </div>

            <div class="form-group">
              <label>Slug</label>
              <input
                type="text"
                formControlName="slug"
                [class.invalid]="isProductFieldInvalid('slug')"
              />
              <small class="field-error" *ngIf="isProductFieldInvalid('slug')">
                Le slug est obligatoire.
              </small>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea rows="3" formControlName="description"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Marque</label>
                <input type="text" formControlName="brand" />
              </div>

              <div class="form-group">
                <label>Prix estimé</label>
                <input
                  type="number"
                  formControlName="estimatedPrice"
                  [class.invalid]="isProductFieldInvalid('estimatedPrice')"
                />
                <small class="field-error" *ngIf="isProductFieldInvalid('estimatedPrice')">
                  Le prix estimé doit être supérieur ou égal à 0.
                </small>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Devise</label>
                <input
                  type="text"
                  formControlName="currencyCode"
                  [class.invalid]="isProductFieldInvalid('currencyCode')"
                />
                <small class="field-error" *ngIf="isProductFieldInvalid('currencyCode')">
                  La devise est obligatoire.
                </small>
              </div>

              <div class="form-group">
                <label>Statut</label>
                <select
                  formControlName="status"
                  [class.invalid]="isProductFieldInvalid('status')"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <small class="field-error" *ngIf="isProductFieldInvalid('status')">
                  Le statut est obligatoire.
                </small>
              </div>
            </div>

            <div class="form-group">
              <label>Image du produit</label>
              <input
                type="file"
                accept="image/*"
                (change)="onImageSelected($event)"
              />
              <small class="field-help">
                Choisissez une image depuis votre appareil.
              </small>
            </div>

            <div class="image-preview-block">
              <div class="image-preview-label">Aperçu image</div>

              <ng-container *ngIf="productImagePreviewUrl(); else noProductImage">
                <img
                  class="image-preview"
                  [src]="productImagePreviewUrl()!"
                  alt="Aperçu produit"
                />
              </ng-container>

              <ng-template #noProductImage>
                <div class="image-placeholder">
                  Aucune image
                </div>
              </ng-template>
            </div>

            <div class="form-group">
              <label>Reference URL</label>
              <input type="text" formControlName="referenceUrl" />
            </div>

            <div class="actions">
              <button type="submit" [disabled]="productLoading">
                {{
                  productLoading
                    ? 'Traitement...'
                    : selectedProduct()
                      ? 'Mettre à jour'
                      : 'Créer le produit'
                }}
              </button>

              <button
                *ngIf="selectedProduct()"
                type="button"
                class="secondary"
                (click)="cancelProductEdit()"
              >
                Annuler
              </button>
            </div>
          </form>
        </section>
      </div>

      <section class="card">
        <div class="section-header">
          <h2>Catégories</h2>
          <button type="button" (click)="loadCategories()">Actualiser</button>
        </div>

        <p *ngIf="categoriesLoading()">Chargement...</p>

        <div class="table-wrapper" *ngIf="!categoriesLoading()">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Slug</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let category of categories()">
                <td>{{ category.id }}</td>
                <td>{{ category.name }}</td>
                <td>{{ category.slug }}</td>
                <td>{{ category.isActive ? 'Oui' : 'Non' }}</td>
                <td class="table-actions">
                  <button type="button" (click)="editCategory(category)">
                    Modifier
                  </button>
                  <button
                    type="button"
                    class="danger"
                    (click)="deleteCategory(category)"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
              <tr *ngIf="categories().length === 0">
                <td colspan="5">Aucune catégorie</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <h2>Produits</h2>

          <div class="filters">
            <input
              type="text"
              [value]="productSearch()"
              (input)="onSearchChange($any($event.target).value)"
              placeholder="Rechercher un produit"
            />

            <select
              [value]="productStatusFilter()"
              (change)="onStatusChange($any($event.target).value)"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            <button type="button" (click)="loadProducts()">Actualiser</button>
          </div>
        </div>

        <p *ngIf="productsLoading()">Chargement...</p>

        <div class="table-wrapper" *ngIf="!productsLoading()">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Devise</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of products()">
                <td>{{ product.id }}</td>
                <td>
                  <ng-container *ngIf="hasProductImage(product); else noTableImage">
                    <img
                      class="table-product-image"
                      [src]="product.mainImageUrl!"
                      [alt]="product.name"
                    />
                  </ng-container>

                  <ng-template #noTableImage>
                    <div class="table-image-placeholder">—</div>
                  </ng-template>
                </td>
                <td>
                  <strong>{{ product.name }}</strong>
                  <div class="muted">{{ product.slug }}</div>
                  <div class="muted" *ngIf="product.brand">{{ product.brand }}</div>
                </td>
                <td>{{ product.category?.name || '—' }}</td>
                <td>{{ product.estimatedPrice }}</td>
                <td>{{ product.currencyCode }}</td>
                <td>{{ product.status }}</td>
                <td class="table-actions">
                  <button type="button" (click)="editProduct(product)">
                    Modifier
                  </button>
                  <button
                    type="button"
                    class="danger"
                    (click)="deleteProduct(product)"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
              <tr *ngIf="products().length === 0">
                <td colspan="8">Aucun produit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .page {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .page-header h1 {
        margin: 0 0 6px;
      }

      .page-header p {
        margin: 0;
        color: #6b7280;
      }

      .layout-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
      }

      .card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }

      .card h2 {
        margin-top: 0;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 14px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      input,
      textarea,
      select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 10px 12px;
        font: inherit;
      }

      input.invalid,
      textarea.invalid,
      select.invalid {
        border-color: #dc2626;
        outline: none;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
      }

      .field-error {
        color: #b91c1c;
        font-size: 13px;
      }

      .field-help {
        color: #6b7280;
        font-size: 13px;
      }

      button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        background: #1d4ed8;
        color: white;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      button.secondary {
        background: #6b7280;
      }

      button.danger {
        background: #dc2626;
      }

      .checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
      }

      .checkbox input {
        width: auto;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 14px;
      }

      .filters {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .filters input,
      .filters select {
        min-width: 180px;
      }

      .actions,
      .table-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 12px 10px;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: top;
      }

      th {
        color: #6b7280;
        font-size: 13px;
      }

      .muted {
        color: #6b7280;
        font-size: 13px;
      }

      .image-preview-block {
        margin-top: 4px;
        margin-bottom: 16px;
      }

      .image-preview-label {
        margin-bottom: 8px;
        font-size: 13px;
        color: #6b7280;
      }

      .image-preview {
        width: 100%;
        max-width: 220px;
        height: 160px;
        object-fit: cover;
        border-radius: 14px;
        border: 1px solid #e5e7eb;
        display: block;
      }

      .image-placeholder {
        width: 100%;
        max-width: 220px;
        height: 160px;
        border-radius: 14px;
        border: 1px dashed #d1d5db;
        background: #f9fafb;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .table-product-image {
        width: 56px;
        height: 56px;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        display: block;
      }

      .table-image-placeholder {
        width: 56px;
        height: 56px;
        border-radius: 10px;
        border: 1px dashed #d1d5db;
        background: #f9fafb;
        color: #9ca3af;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      @media (max-width: 980px) {
        .layout-grid {
          grid-template-columns: 1fr;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .section-header,
        .filters {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class CatalogAdminPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly products = signal<CatalogProduct[]>([]);

  readonly selectedCategory = signal<CatalogCategory | null>(null);
  readonly selectedProduct = signal<CatalogProduct | null>(null);

  readonly categoriesLoading = signal(false);
  readonly productsLoading = signal(false);

  readonly productSearch = signal('');
  readonly productStatusFilter = signal('');

  categoryLoading = false;
  productLoading = false;
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  readonly categoryForm = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    description: [''],
    isActive: [true],
  });

  readonly productForm = this.fb.group({
    categoryId: [null as number | null, [Validators.required]],
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    description: [''],
    mainImageUrl: [''],
    referenceUrl: [''],
    brand: [''],
    estimatedPrice: [0, [Validators.required, Validators.min(0)]],
    currencyCode: ['XOF', [Validators.required]],
    status: ['ACTIVE' as CatalogProductStatus, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  productImagePreviewUrl(): string | null {
    if (this.imagePreview) {
      return this.imagePreview;
    }

    const value = this.productForm.get('mainImageUrl')?.value;

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  hasProductImage(product: CatalogProduct): boolean {
    return !!product.mainImageUrl?.trim();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.selectedImageFile = null;
      this.imagePreview = null;
      return;
    }

    const file = input.files[0];
    this.selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  loadCategories(): void {
    this.categoriesLoading.set(true);

    this.catalogService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.categoriesLoading.set(false);
      },
    });
  }

  loadProducts(): void {
    this.productsLoading.set(true);

    const status = this.productStatusFilter().trim()
      ? (this.productStatusFilter() as CatalogProductStatus)
      : undefined;

    this.catalogService
      .getProducts(this.productSearch(), status)
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.productsLoading.set(false);
        },
        error: () => {
          this.productsLoading.set(false);
        },
      });
  }

  submitCategory(): void {
    if (this.categoryForm.invalid || this.categoryLoading) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.categoryLoading = true;

    const raw = this.categoryForm.getRawValue();
    const payload = {
      name: raw.name || '',
      slug: raw.slug || '',
      description: raw.description ?? undefined,
      isActive: raw.isActive ?? undefined,
    };
    const selected = this.selectedCategory();

    const request$ = selected
      ? this.catalogService.updateCategory(selected.id, payload)
      : this.catalogService.createCategory(payload);

    request$.subscribe({
      next: () => {
        this.categoryLoading = false;

        this.toast.success(
          selected
            ? 'Catégorie mise à jour avec succès'
            : 'Catégorie créée avec succès',
        );

        this.cancelCategoryEdit();
        this.loadCategories();
      },
      error: (error: unknown) => {
        this.categoryLoading = false;

        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Une erreur est survenue';

        this.toast.error(message);
      },
    });
  }

  submitProduct(): void {
    if (this.productForm.invalid || this.productLoading) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.productLoading = true;

    if (this.selectedImageFile) {
      this.catalogService.uploadImage(this.selectedImageFile).subscribe({
        next: (imageUrl) => {
          this.createOrUpdateProduct(imageUrl);
        },
        error: () => {
          this.productLoading = false;
          this.toast.error('Impossible d’envoyer l’image.');
        },
      });

      return;
    }

    const existingImageUrl =
      typeof this.productForm.get('mainImageUrl')?.value === 'string'
        ? this.productForm.get('mainImageUrl')?.value?.trim() || ''
        : '';

    this.createOrUpdateProduct(existingImageUrl);
  }

  private createOrUpdateProduct(imageUrl: string): void {
    const raw = this.productForm.getRawValue();

    const payload = {
      categoryId: Number(raw.categoryId),
      name: raw.name ?? '',
      slug: raw.slug ?? '',
      description: raw.description ?? '',
      mainImageUrl: imageUrl || '',
      referenceUrl: raw.referenceUrl ?? '',
      brand: raw.brand ?? '',
      estimatedPrice: Number(raw.estimatedPrice ?? 0),
      currencyCode: raw.currencyCode ?? 'XOF',
      status: raw.status ?? 'ACTIVE',
    };

    const selected = this.selectedProduct();

    const request$ = selected
      ? this.catalogService.updateProduct(selected.id, payload)
      : this.catalogService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.productLoading = false;

        this.toast.success(
          selected
            ? 'Produit mis à jour avec succès'
            : 'Produit créé avec succès',
        );

        this.cancelProductEdit();
        this.loadProducts();
      },
      error: (error: unknown) => {
        this.productLoading = false;

        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Une erreur est survenue';

        this.toast.error(message);
      },
    });
  }

  editCategory(category: CatalogCategory): void {
    this.selectedCategory.set(category);

    this.categoryForm.reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      isActive: category.isActive,
    });
  }

  cancelCategoryEdit(): void {
    this.selectedCategory.set(null);
    this.categoryForm.reset({
      name: '',
      slug: '',
      description: '',
      isActive: true,
    });
  }

  deleteCategory(category: CatalogCategory): void {
    const confirmed = window.confirm(
      `Supprimer la catégorie "${category.name}" ?`,
    );

    if (!confirmed) return;

    this.catalogService.deleteCategory(category.id).subscribe({
      next: () => {
        if (this.selectedCategory()?.id === category.id) {
          this.cancelCategoryEdit();
        }

        this.toast.success('Catégorie supprimée avec succès');
        this.loadCategories();
      },
      error: (error: unknown) => {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Une erreur est survenue';

        this.toast.error(message);
      },
    });
  }

  editProduct(product: CatalogProduct): void {
    this.selectedProduct.set(product);
    this.selectedImageFile = null;
    this.imagePreview = product.mainImageUrl ?? null;

    this.productForm.reset({
      categoryId: product.category?.id ?? null,
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      mainImageUrl: product.mainImageUrl ?? '',
      referenceUrl: product.referenceUrl ?? '',
      brand: product.brand ?? '',
      estimatedPrice: Number(product.estimatedPrice ?? 0),
      currencyCode: product.currencyCode,
      status: product.status ?? 'DRAFT',
    });
  }

  cancelProductEdit(): void {
    this.selectedProduct.set(null);
    this.selectedImageFile = null;
    this.imagePreview = null;

    this.productForm.reset({
      categoryId: null,
      name: '',
      slug: '',
      description: '',
      mainImageUrl: '',
      referenceUrl: '',
      brand: '',
      estimatedPrice: 0,
      currencyCode: 'XOF',
      status: 'ACTIVE',
    });
  }

  deleteProduct(product: CatalogProduct): void {
    const confirmed = window.confirm(
      `Supprimer le produit "${product.name}" ?`,
    );

    if (!confirmed) return;

    this.catalogService.deleteProduct(product.id).subscribe({
      next: () => {
        if (this.selectedProduct()?.id === product.id) {
          this.cancelProductEdit();
        }

        this.toast.success('Produit supprimé avec succès');
        this.loadProducts();
      },
      error: (error: unknown) => {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Une erreur est survenue';

        this.toast.error(message);
      },
    });
  }

  onSearchChange(value: string): void {
    this.productSearch.set(value);
    this.loadProducts();
  }

  onStatusChange(value: string): void {
    this.productStatusFilter.set(value);
    this.loadProducts();
  }

  isCategoryFieldInvalid(fieldName: 'name' | 'slug'): boolean {
    const control = this.categoryForm.get(fieldName);
    return !!control && control.invalid && control.touched;
  }

  isProductFieldInvalid(
    fieldName:
      | 'categoryId'
      | 'name'
      | 'slug'
      | 'estimatedPrice'
      | 'currencyCode'
      | 'status',
  ): boolean {
    const control = this.productForm.get(fieldName);
    return !!control && control.invalid && control.touched;
  }
}