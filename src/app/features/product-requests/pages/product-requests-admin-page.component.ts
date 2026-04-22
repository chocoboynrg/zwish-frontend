import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductRequestsService } from '../services/product-requests.service';
import {
  ProductRequest,
  ProductRequestStatus,
} from '../models/product-request.model';
import { CatalogService } from '../../catalog/services/catalog.service';
import { CatalogCategory } from '../../catalog/models/catalog-category.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-requests-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Demandes produit</h1>
        <p>Validation et publication des demandes organisateur</p>
      </div>

      <section class="card">
        <div class="toolbar">
          <div class="filters">
            <select
              [value]="statusFilter()"
              (change)="onStatusChange($any($event.target).value)"
            >
              <option value="">Tous les statuts</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>

            <button type="button" (click)="loadRequests()">Actualiser</button>
          </div>
        </div>

        <p *ngIf="loading()">Chargement...</p>
        <p class="error" *ngIf="loadError()">{{ loadError() }}</p>

        <div class="table-wrapper" *ngIf="!loading()">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Demande</th>
                <th>Événement</th>
                <th>Demandeur</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let request of requests()">
                <td>{{ request.id }}</td>
                <td>
                  <strong>{{ request.name }}</strong>
                  <div class="muted" *ngIf="request.category">
                    Catégorie: {{ request.category.name }}
                  </div>
                  <div class="muted" *ngIf="request.reviewComment">
                    Commentaire: {{ request.reviewComment }}
                  </div>
                </td>
                <td>
                  {{ request.event.title }}
                  <div class="muted">Wishlist #{{ request.wishlist.id }}</div>
                </td>
                <td>
                  {{ request.requestedBy.name }}
                  <div class="muted">{{ request.requestedBy.email }}</div>
                </td>
                <td>{{ request.estimatedPrice }} {{ request.currencyCode }}</td>
                <td>
                  <span class="status">{{ request.status }}</span>
                </td>
                <td>
                  <button type="button" (click)="selectRequest(request)">
                    Gérer
                  </button>
                </td>
              </tr>

              <tr *ngIf="requests().length === 0">
                <td colspan="7">Aucune demande produit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card" *ngIf="selectedRequest() as request">
        <div class="section-header">
          <h2>Gestion de la demande #{{ request.id }}</h2>
          <button type="button" class="secondary" (click)="clearSelection()">
            Fermer
          </button>
        </div>

        <div class="request-summary">
          <p><strong>Nom :</strong> {{ request.name }}</p>
          <p><strong>Description :</strong> {{ request.description || '—' }}</p>
          <p><strong>Statut actuel :</strong> {{ request.status }}</p>
          <p><strong>Demandeur :</strong> {{ request.requestedBy.name }}</p>
          <p><strong>Événement :</strong> {{ request.event.title }}</p>
        </div>

        <div class="forms-grid">
          <form class="sub-card" [formGroup]="reviewForm" (ngSubmit)="submitReview()">
            <h3>Review admin</h3>

            <div class="form-group">
              <label>Nouveau statut</label>
              <select formControlName="status">
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div class="form-group">
              <label>Commentaire</label>
              <textarea rows="3" formControlName="reviewComment"></textarea>
            </div>

            <div class="form-group">
              <label>Catégorie</label>
              <select formControlName="categoryId">
                <option [ngValue]="null">Choisir une catégorie</option>
                <option *ngFor="let category of categories()" [ngValue]="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Nom produit approuvé</label>
              <input type="text" formControlName="approvedProductName" />
            </div>

            <div class="form-group">
              <label>Slug produit approuvé</label>
              <input type="text" formControlName="approvedProductSlug" />
            </div>

            <button type="submit" [disabled]="reviewLoading">
              {{ reviewLoading ? 'Traitement...' : 'Enregistrer review' }}
            </button>
          </form>

          <form class="sub-card" [formGroup]="publishForm" (ngSubmit)="submitPublish()">
            <h3>Publier dans la wishlist</h3>

            <div class="form-group">
              <label>Nom item</label>
              <input type="text" formControlName="name" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Prix</label>
                <input type="number" formControlName="price" />
              </div>

              <div class="form-group">
                <label>Quantité</label>
                <input type="number" formControlName="quantity" />
              </div>
            </div>

            <button
              type="submit"
              [disabled]="publishLoading || request.status !== 'APPROVED'"
            >
              {{ publishLoading ? 'Publication...' : 'Publier la demande' }}
            </button>

            <p class="muted" *ngIf="request.status !== 'APPROVED'">
              La publication est disponible uniquement pour une demande APPROVED.
            </p>
          </form>
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

      .card,
      .sub-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }

      .toolbar,
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }

      .filters {
        display: flex;
        gap: 10px;
        align-items: center;
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

      .status {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        background: #eef2ff;
        color: #3730a3;
        font-size: 12px;
        font-weight: 600;
      }

      .request-summary {
        margin-bottom: 18px;
      }

      .forms-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
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
      select,
      button {
        font: inherit;
      }

      input,
      textarea,
      select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 10px 12px;
      }

      button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        background: #1d4ed8;
        color: white;
        cursor: pointer;
      }

      button.secondary {
        background: #6b7280;
      }

      button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .success {
        color: #15803d;
        margin-top: 12px;
      }

      .error {
        color: #b91c1c;
        margin-top: 12px;
      }

      @media (max-width: 980px) {
        .forms-grid,
        .form-row {
          grid-template-columns: 1fr;
        }

        .toolbar,
        .section-header,
        .filters {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class ProductRequestsAdminPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productRequestsService = inject(ProductRequestsService);
  private readonly catalogService = inject(CatalogService);
  private readonly toastService = inject(ToastService);

  readonly requests = signal<ProductRequest[]>([]);
  readonly categories = signal<CatalogCategory[]>([]);
  readonly selectedRequest = signal<ProductRequest | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly statusFilter = signal('');

  reviewLoading = false;
  publishLoading = false;

  reviewSuccess = '';
  reviewError = '';
  publishSuccess = '';
  publishError = '';

  readonly reviewForm = this.fb.group({
    status: ['UNDER_REVIEW' as ProductRequestStatus, [Validators.required]],
    reviewComment: [''],
    categoryId: [null as number | null],
    approvedProductName: [''],
    approvedProductSlug: [''],
  });

  readonly publishForm = this.fb.group({
    name: [''],
    price: [0],
    quantity: [1],
  });

  ngOnInit(): void {
    this.loadRequests();
    this.loadCategories();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.loadError.set('');

    const status = this.statusFilter().trim()
      ? (this.statusFilter() as ProductRequestStatus)
      : undefined;

    this.productRequestsService.getAll(status).subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(
          error?.error?.message || 'Impossible de charger les demandes produit',
        );
        this.loading.set(false);
      },
    });
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
    });
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.loadRequests();
  }

  selectRequest(request: ProductRequest): void {
    this.selectedRequest.set(request);

    this.reviewSuccess = '';
    this.reviewError = '';
    this.publishSuccess = '';
    this.publishError = '';

    this.reviewForm.reset({
      status:
        request.status === 'REJECTED' || request.status === 'PUBLISHED'
          ? 'UNDER_REVIEW'
          : request.status,
      reviewComment: request.reviewComment ?? '',
      categoryId: request.category?.id ?? null,
      approvedProductName: request.name,
      approvedProductSlug: this.slugify(request.name),
    });

    this.publishForm.reset({
      name: request.name,
      price: Number(request.estimatedPrice ?? 0),
      quantity: 1,
    });
  }

  clearSelection(): void {
    this.selectedRequest.set(null);
  }

  submitReview(): void {
    const request = this.selectedRequest();
    if (!request || this.reviewLoading || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.reviewLoading = true;
    this.reviewSuccess = '';
    this.reviewError = '';

    const raw = this.reviewForm.getRawValue();

    const payload: {
      status: ProductRequestStatus;
      reviewComment?: string;
      categoryId?: number;
      approvedProductName?: string;
      approvedProductSlug?: string;
    } = {
      status: raw.status as ProductRequestStatus,
      reviewComment: raw.reviewComment || undefined,
    };

    if (raw.categoryId) {
      payload.categoryId = Number(raw.categoryId);
    }

    if (raw.approvedProductName) {
      payload.approvedProductName = raw.approvedProductName;
    }

    if (raw.approvedProductSlug) {
      payload.approvedProductSlug = raw.approvedProductSlug;
    }

    this.productRequestsService.review(request.id, payload).subscribe({
      next: (updated) => {
        this.reviewLoading = false;
        this.reviewSuccess = '';
        this.toastService.success('Review enregistrée avec succès.');
        this.replaceRequestInList(updated);
        this.selectRequest(updated);
      },
      error: (error) => {
        this.reviewLoading = false;
        this.reviewError = '';
        this.toastService.error(
          error?.error?.message || 'Impossible de traiter la review',
        );
      },
    });
  }

  submitPublish(): void {
    const request = this.selectedRequest();
    if (!request || this.publishLoading || request.status !== 'APPROVED') {
      return;
    }

    this.publishLoading = true;
    this.publishSuccess = '';
    this.publishError = '';

    const raw = this.publishForm.getRawValue();

    const payload = {
      name: raw.name || undefined,
      price: Number(raw.price ?? 0),
      quantity: Number(raw.quantity ?? 1),
    };

    this.productRequestsService.publish(request.id, payload).subscribe({
      next: () => {
        this.publishLoading = false;
        this.publishSuccess = '';
        this.toastService.success('Demande publiée avec succès.');
        this.loadRequests();

        this.selectedRequest.set({
          ...request,
          status: 'PUBLISHED',
        });
      },
      error: (error) => {
        this.publishLoading = false;
        this.publishError = '';
        this.toastService.error(
          error?.error?.message || 'Impossible de publier la demande',
        );
      },
    });
  }

  private replaceRequestInList(updated: ProductRequest): void {
    this.requests.update((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}