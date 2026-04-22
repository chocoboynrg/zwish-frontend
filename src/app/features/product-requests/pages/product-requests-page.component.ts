import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

type ProductRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

type ProductRequestItem = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  referenceUrl?: string | null;
  estimatedPrice?: number | null;
  currencyCode?: string | null;
  status: ProductRequestStatus;
  reviewComment?: string | null;
  createdAt?: string | null;
  reviewedAt?: string | null;
};

@Component({
  selector: 'app-product-requests-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="hero-card">
        <div class="hero-top">
          <a routerLink="/app/events" class="back-link">← Retour à mes événements</a>
        </div>

        <div class="hero-content">
          <div>
            <div class="eyebrow">Demandes produit</div>
            <h1>Gérer mes demandes produit</h1>
            <p class="hero-description">
              Suivez le traitement de vos demandes, soumettez un produit personnalisé
              et ajoutez une image via URL pour une validation plus complète.
            </p>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="state-card">
        Chargement des demandes produit...
      </div>

      <div *ngIf="error && !loading" class="state-card error">
        {{ error }}
      </div>

      <ng-container *ngIf="!loading">
        <section class="stats-row">
          <article class="stat-card">
            <span class="stat-label">Total</span>
            <strong class="stat-value">{{ requests.length }}</strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">En attente</span>
            <strong class="stat-value">{{ pendingCount }}</strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Approuvées</span>
            <strong class="stat-value">{{ approvedCount }}</strong>
          </article>

          <article class="stat-card">
            <span class="stat-label">Publiées</span>
            <strong class="stat-value">{{ publishedCount }}</strong>
          </article>
        </section>

        <section class="card form-card">
          <div class="section-header">
            <div>
              <div class="section-kicker">Nouvelle demande</div>
              <h2>Soumettre un produit</h2>
            </div>
          </div>

          <div *ngIf="submitError" class="state-card error compact-state">
            {{ submitError }}
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Nom du produit</label>
              <input
                type="text"
                [(ngModel)]="form.name"
                placeholder="Ex: Mixeur KitchenAid"
              />
            </div>

            <div class="form-group">
              <label>Prix estimé</label>
              <input
                type="number"
                min="0"
                [(ngModel)]="form.estimatedPrice"
                placeholder="Ex: 85000"
              />
            </div>

            <div class="form-group full">
              <label>Description</label>
              <textarea
                rows="4"
                [(ngModel)]="form.description"
                placeholder="Décris le produit demandé..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>URL image</label>
              <input
                type="text"
                [(ngModel)]="form.imageUrl"
                placeholder="https://..."
              />
            </div>

            <div class="form-group">
              <label>Lien de référence</label>
              <input
                type="text"
                [(ngModel)]="form.referenceUrl"
                placeholder="https://..."
              />
            </div>
          </div>

          <div class="image-preview-card" *ngIf="form.imageUrl?.trim()">
            <span class="preview-label">Aperçu image</span>
            <img
              [src]="form.imageUrl"
              alt="Aperçu du produit demandé"
              class="preview-image"
            />
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="submitLoading || !wishlistId"
              (click)="submit()"
            >
              {{ submitLoading ? 'Envoi...' : 'Envoyer la demande' }}
            </button>
          </div>
        </section>

        <section class="card list-card">
          <div class="section-header">
            <div>
              <div class="section-kicker">Suivi</div>
              <h2>Mes demandes</h2>
            </div>

            <div class="toolbar-select">
              <label for="status-filter">Filtre</label>
              <select id="status-filter" [(ngModel)]="selectedStatus">
                <option value="ALL">Tous</option>
                <option value="SUBMITTED">Soumises</option>
                <option value="UNDER_REVIEW">En revue</option>
                <option value="APPROVED">Approuvées</option>
                <option value="REJECTED">Rejetées</option>
                <option value="PUBLISHED">Publiées</option>
              </select>
            </div>
          </div>

          <div *ngIf="filteredRequests.length === 0" class="state-card">
            Aucune demande produit pour le moment.
          </div>

          <div class="request-grid" *ngIf="filteredRequests.length > 0">
            <article class="request-card" *ngFor="let request of filteredRequests">
              <div class="request-image">
                <img
                  *ngIf="request.imageUrl; else noImage"
                  [src]="request.imageUrl"
                  [alt]="request.name"
                />
                <ng-template #noImage>
                  <div class="image-placeholder">🛍️</div>
                </ng-template>
              </div>

              <div class="request-body">
                <div class="request-top">
                  <h3>{{ request.name }}</h3>
                  <span class="status-badge" [ngClass]="statusClass(request.status)">
                    {{ formatStatus(request.status) }}
                  </span>
                </div>

                <p class="request-description">
                  {{ request.description || 'Aucune description fournie.' }}
                </p>

                <div class="request-meta">
                  <span>{{ formatAmount(request.estimatedPrice, request.currencyCode) }}</span>
                  <span *ngIf="request.createdAt">Créée le {{ formatDate(request.createdAt) }}</span>
                  <span *ngIf="request.reviewedAt">Revue le {{ formatDate(request.reviewedAt) }}</span>
                </div>

                <a
                  *ngIf="request.referenceUrl"
                  class="reference-link"
                  [href]="request.referenceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir la référence
                </a>

                <div
                  class="review-box"
                  *ngIf="request.reviewComment && request.reviewComment.trim()"
                >
                  <strong>Commentaire :</strong>
                  <p>{{ request.reviewComment }}</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </ng-container>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }

    .page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      color: #111827;
    }

    .hero-card,
    .card,
    .state-card,
    .stat-card {
      background: #ffffff;
      border: 1px solid #f3e8e2;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .hero-card,
    .card,
    .state-card {
      padding: 22px;
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }

    .back-link {
      color: #ea580c;
      text-decoration: none;
      font-weight: 700;
    }

    .back-link:hover {
      color: #c2410c;
    }

    .eyebrow,
    .section-kicker {
      color: #ea580c;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    h1 {
      margin: 6px 0 10px;
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .hero-description {
      margin: 0;
      color: #4b5563;
      line-height: 1.7;
      max-width: 800px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    .stat-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 108px;
      justify-content: center;
    }

    .stat-label {
      color: #6b7280;
      font-size: 14px;
    }

    .stat-value {
      font-size: 1.35rem;
      line-height: 1.2;
      color: #111827;
      word-break: break-word;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-header h2 {
      margin: 4px 0 0;
      font-size: 1.3rem;
      line-height: 1.2;
    }

    .compact-state {
      padding: 14px 16px;
      margin-bottom: 12px;
      border-radius: 16px;
      box-shadow: none;
    }

    .state-card.error {
      color: #b91c1c;
      background: #fef2f2;
      border-color: #fecaca;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .form-grid .full {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label,
    .toolbar-select label {
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
    }

    .form-group input,
    .form-group textarea,
    .toolbar-select select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #e5d7cf;
      border-radius: 14px;
      padding: 11px 13px;
      font: inherit;
      background: white;
      color: #111827;
    }

    .image-preview-card {
      margin-top: 16px;
      padding: 16px;
      border: 1px solid #f3dfd4;
      background: #fff8f4;
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .preview-label {
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .preview-image {
      width: 100%;
      max-width: 320px;
      border-radius: 18px;
      border: 1px solid #f3e8e2;
      object-fit: cover;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 18px;
    }

    .btn {
      border: 0;
      border-radius: 14px;
      padding: 11px 16px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
      transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 14px 28px rgba(255, 122, 89, 0.18);
    }

    .list-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toolbar-select {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 180px;
    }

    .request-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .request-card {
      border: 1px solid #efe5de;
      border-radius: 22px;
      overflow: hidden;
      background: linear-gradient(180deg, #fffdfc 0%, #ffffff 100%);
      box-shadow: 0 14px 32px rgba(17, 24, 39, 0.05);
      display: flex;
      flex-direction: column;
    }

    .request-image {
      height: 220px;
      background: linear-gradient(180deg, #fff7f3 0%, #f9fafb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-bottom: 1px solid #f3e8e2;
    }

    .request-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .image-placeholder {
      font-size: 3rem;
      opacity: 0.85;
    }

    .request-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .request-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .request-top h3 {
      margin: 0;
      font-size: 1.08rem;
      line-height: 1.35;
      color: #111827;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 7px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      line-height: 1;
      white-space: nowrap;
    }

    .status-submitted {
      background: #fff7ed;
      color: #9a3412;
    }

    .status-under-review {
      background: #fef3c7;
      color: #92400e;
    }

    .status-approved {
      background: #dcfce7;
      color: #166534;
    }

    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-published {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .status-draft {
      background: #f3f4f6;
      color: #374151;
    }

    .request-description {
      margin: 0;
      color: #4b5563;
      line-height: 1.6;
    }

    .request-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .reference-link {
      color: #ea580c;
      font-weight: 700;
      text-decoration: none;
    }

    .reference-link:hover {
      color: #c2410c;
    }

    .review-box {
      padding: 12px;
      border-radius: 14px;
      background: #fffaf7;
      border: 1px solid #f3e8e2;
      color: #4b5563;
    }

    .review-box p {
      margin: 6px 0 0;
      line-height: 1.5;
    }

    @media (max-width: 960px) {
      .form-grid,
      .stats-row,
      .request-grid {
        grid-template-columns: 1fr;
      }

      .section-header,
      .request-top {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `],
})
export class ProductRequestsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  loading = false;
  submitLoading = false;
  error = '';
  submitError = '';

  wishlistId: number | null = null;
  eventId: number | null = null;

  selectedStatus: ProductRequestStatus | 'ALL' = 'ALL';

  requests: ProductRequestItem[] = [];

  form: {
    name: string;
    description: string;
    imageUrl: string;
    referenceUrl: string;
    estimatedPrice: number | null;
  } = {
    name: '',
    description: '',
    imageUrl: '',
    referenceUrl: '',
    estimatedPrice: null,
  };

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const wishlistId = Number(params.get('wishlistId'));
      const eventId = Number(params.get('eventId'));

      this.wishlistId = Number.isFinite(wishlistId) && wishlistId > 0 ? wishlistId : null;
      this.eventId = Number.isFinite(eventId) && eventId > 0 ? eventId : null;

      if (this.wishlistId) {
        this.loadRequests();
      } else {
        this.requests = [];
        this.error = 'Aucune wishlist sélectionnée. Ouvrez cette page depuis un événement.';
      }
    });
  }

  get filteredRequests(): ProductRequestItem[] {
    if (this.selectedStatus === 'ALL') {
      return this.requests;
    }

    return this.requests.filter((request) => request.status === this.selectedStatus);
  }

  get pendingCount(): number {
    return this.requests.filter(
      (request) =>
        request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW',
    ).length;
  }

  get approvedCount(): number {
    return this.requests.filter((request) => request.status === 'APPROVED').length;
  }

  get rejectedCount(): number {
    return this.requests.filter((request) => request.status === 'REJECTED').length;
  }

  get publishedCount(): number {
    return this.requests.filter((request) => request.status === 'PUBLISHED').length;
  }

  loadRequests(): void {
    if (!this.wishlistId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.http
      .get<ProductRequestItem[]>(`/api/product-requests/wishlist/${this.wishlistId}`)
      .subscribe({
        next: (requests) => {
          this.requests = Array.isArray(requests) ? requests : [];
          this.loading = false;
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading = false;
          this.error =
            err?.error?.message ||
            'Impossible de charger les demandes produit.';
        },
      });
  }

  submit(): void {
    if (!this.wishlistId) {
      this.submitError = 'Aucune wishlist sélectionnée.';
      return;
    }

    if (!this.form.name.trim()) {
      this.submitError = 'Le nom du produit est obligatoire.';
      return;
    }

    if (
      this.form.estimatedPrice !== null &&
      Number(this.form.estimatedPrice) < 0
    ) {
      this.submitError = 'Le prix estimé doit être supérieur ou égal à 0.';
      return;
    }

    this.submitLoading = true;
    this.submitError = '';

    this.http
      .post('/api/product-requests', {
        wishlistId: this.wishlistId,
        name: this.form.name.trim(),
        description: this.form.description.trim() || null,
        imageUrl: this.form.imageUrl.trim() || null,
        referenceUrl: this.form.referenceUrl.trim() || null,
        estimatedPrice: this.form.estimatedPrice ?? 0,
        currencyCode: 'XOF',
      })
      .subscribe({
        next: () => {
          this.submitLoading = false;
          this.form = {
            name: '',
            description: '',
            imageUrl: '',
            referenceUrl: '',
            estimatedPrice: null,
          };
          this.loadRequests();
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitLoading = false;
          this.submitError =
            err?.error?.message ||
            'Impossible d’envoyer la demande produit.';
        },
      });
  }

  formatAmount(
    value: number | string | null | undefined,
    currency: string | null | undefined = 'XOF'): string {
    const numericValue = Number(value ?? 0);

    if (!Number.isFinite(numericValue)) {
      return `0 ${currency}`;
    }

    return `${new Intl.NumberFormat('fr-FR').format(numericValue)} ${currency}`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  formatStatus(status: ProductRequestStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';
      case 'SUBMITTED':
        return 'Soumise';
      case 'UNDER_REVIEW':
        return 'En revue';
      case 'APPROVED':
        return 'Approuvée';
      case 'REJECTED':
        return 'Rejetée';
      case 'PUBLISHED':
        return 'Publiée';
      default:
        return status;
    }
  }

  statusClass(status: ProductRequestStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'status-draft';
      case 'SUBMITTED':
        return 'status-submitted';
      case 'UNDER_REVIEW':
        return 'status-under-review';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      case 'PUBLISHED':
        return 'status-published';
      default:
        return 'status-draft';
    }
  }
}