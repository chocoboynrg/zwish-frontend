import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductRequestsService } from '../services/product-requests.service';
import {
  ProductRequest,
  ProductRequestReviewer,
  ProductRequestStatus,
} from '../models/product-request.model';
import { ProductRequestReviewPayload } from '../services/product-requests.service';
import { CatalogService } from '../../catalog/services/catalog.service';
import { CatalogCategory } from '../../catalog/models/catalog-category.model';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductRequestsAdminDetailPanelComponent } from '../components/product-requests-admin-detail-panel.component';
import { PRODUCT_REQUEST_STATUS_META } from '../models/product-request-admin.types';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-product-requests-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductRequestsAdminDetailPanelComponent, LucideAngularModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Demandes produit</h1>
          <p class="subtitle">{{ pending() }} en attente · {{ total() }} total</p>
        </div>
        <button class="btn-refresh" (click)="loadRequests()">
          <lucide-icon name="refresh-cw" [size]="15" color="currentColor" [strokeWidth]="1.8" />
          Actualiser
        </button>
      </div>

      <div class="filter-row">
        @for (f of filters; track f.value) {
          <button class="filter-btn" [class.active]="statusFilter() === f.value" (click)="statusFilter.set(f.value); loadRequests()">
            {{ f.label }}
            @if (getCount(f.value) > 0) { <span class="fc">{{ getCount(f.value) }}</span> }
          </button>
        }
      </div>

      <div class="two-col">
        <div class="list-panel">
          @if (loading()) {
            <div class="loading-state"><div class="spinner"></div> Chargement...</div>
          }
          @if (loadError()) { <div class="error-state">{{ loadError() }}</div> }
          @if (!loading() && filtered().length === 0) {
            <div class="empty-state"><div>📦</div><span>Aucune demande{{ statusFilter() ? ' avec ce statut' : '' }}.</span></div>
          }
          @for (r of filtered(); track r.id) {
            <button class="req-item" [class.active]="selected()?.id === r.id" [class.locked]="r.status === 'UNDER_REVIEW'" (click)="select(r)">
              <div class="req-item-img">
                @if (r.imageUrl) { <img [src]="r.imageUrl" [alt]="r.name" (error)="onImgError($event)" /> }
                @if (!r.imageUrl) { <span>🛍️</span> }
              </div>
              <div class="req-item-info">
                <div class="req-item-name">{{ r.name }}</div>
                <div class="req-item-user">{{ r.requestedBy.name }}</div>
                <div class="req-item-event">{{ r.event.title }}</div>
              </div>
              <div class="req-item-right">
                <span class="req-badge" [style.background]="getMeta(r.status).bg" [style.color]="getMeta(r.status).color">{{ getMeta(r.status).emoji }} {{ getMeta(r.status).label }}</span>
                @if (r.reviewedBy) { <span class="req-reviewer">👤 {{ r.reviewedBy.name }}</span> }
                @if (r.estimatedPrice) { <span class="req-price">{{ r.estimatedPrice | number: '1.0-0' }} XOF</span> }
              </div>
            </button>
          }
        </div>

        <app-product-requests-admin-detail-panel
          [request]="selected()"
          [categories]="categories()"
          [adminsList]="adminsList()"
          [approveForm]="approveForm"
          [rejectForm]="rejectForm"
          [publishForm]="publishForm"
          [isSuperAdmin]="isSuperAdmin()"
          [actionLoading]="actionLoading()"
          [reassignLoading]="actionLoading()"
          [reviewLoading]="reviewLoading"
          [reviewError]="reviewError"
          [publishLoading]="publishLoading"
          [publishError]="publishError"
          (takeOver)="takeOver($event)"
          (approveSubmit)="submitApprove()"
          (rejectSubmit)="submitReject()"
          (publishSubmit)="submitPublish()"
          (reassignSubmit)="doReassign($event)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .page { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 1400px; }
      .page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
      h1 { font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0 0 4px; }
      .subtitle { color: #64748b; font-size: 0.88rem; margin: 0; }
      .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 9px 16px; border: 1.5px solid #e2e8f0; border-radius: 9px; background: white; color: #374151; font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
      .filter-row { display: flex; gap: 7px; flex-wrap: wrap; }
      .filter-btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border: 1.5px solid #e2e8f0; border-radius: 999px; background: white; font: inherit; font-size: 0.8rem; font-weight: 600; color: #64748b; cursor: pointer; }
      .filter-btn.active { background: #6366f1; border-color: #6366f1; color: white; }
      .fc { background: rgba(255,255,255,.25); padding: 1px 6px; border-radius: 999px; font-size: .68rem; font-weight: 800; }
      .filter-btn:not(.active) .fc { background: #f1f5f9; color: #64748b; }
      .two-col { display: grid; grid-template-columns: 380px 1fr; gap: 16px; align-items: start; min-height: 500px; }
      .list-panel { background: white; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
      .loading-state,.error-state,.empty-state { display:flex; align-items:center; gap:10px; justify-content:center; padding:40px; color:#94a3b8; font-size:.9rem; flex-direction:column; }
      .spinner { width:20px; height:20px; border:2px solid #f1f5f9; border-top-color:#6366f1; border-radius:50%; animation: spin .8s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .error-state { color:#ef4444; }
      .empty-state div:first-child { font-size: 2rem; }
      .req-item { display:flex; align-items:center; gap:12px; padding:14px 16px; border:0; background:white; cursor:pointer; text-align:left; border-bottom:1px solid #f8fafc; transition:.15s; width:100%; }
      .req-item:hover { background:#f8fafc; }
      .req-item.active { background:#f0f0ff; border-left:3px solid #6366f1; }
      .req-item.locked { background:#fffbeb; }
      .req-item-img { width:44px; height:44px; border-radius:8px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; overflow:hidden; }
      .req-item-img img { width:100%; height:100%; object-fit:cover; }
      .req-item-info { flex:1; min-width:0; }
      .req-item-name { font-size:.85rem; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .req-item-user,.req-item-event { font-size:.72rem; }
      .req-item-user { color:#94a3b8; margin-top:1px; }
      .req-item-event { color:#cbd5e1; }
      .req-item-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
      .req-badge { padding:3px 8px; border-radius:999px; font-size:.68rem; font-weight:700; white-space:nowrap; }
      .req-price { font-size:.72rem; color:#64748b; font-weight:600; }
      .req-reviewer { font-size:.68rem; color:#6366f1; font-weight:600; white-space:nowrap; }
      @media (max-width: 1200px) { .two-col { grid-template-columns: 1fr; } }
    `,
  ],
})
export class ProductRequestsAdminPageDecoupledComponent implements OnInit {
  private readonly service = inject(ProductRequestsService);
  private readonly catalogService = inject(CatalogService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly requests = signal<ProductRequest[]>([]);
  readonly categories = signal<CatalogCategory[]>([]);
  readonly adminsList = signal<ProductRequestReviewer[]>([]);
  readonly selected = signal<ProductRequest | null>(null);
  readonly statusFilter = signal('');
  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly loadError = signal('');

  reviewLoading = false;
  reviewError = '';
  publishLoading = false;
  publishError = '';

  readonly isSuperAdmin = computed(() => this.authService.getCurrentUserSnapshot()?.platformRole === 'SUPER_ADMIN');

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
    return f ? this.requests().filter((r) => r.status === f) : this.requests();
  });
  readonly total = computed(() => this.requests().length);
  readonly pending = computed(() => this.requests().filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length);

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
  readonly rejectForm = this.fb.group({ reviewComment: [''] });
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
    this.service.getAll(this.statusFilter() ? (this.statusFilter() as ProductRequestStatus) : undefined).subscribe({
      next: (rs) => {
        this.requests.set(rs);
        this.loading.set(false);
      },
      error: (e) => {
        this.loadError.set(this.extractMessage(e, 'Erreur'));
        this.loading.set(false);
      },
    });
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({ next: (cs) => this.categories.set(cs) });
  }

  loadAdminsList(): void {
    this.service.getAdminsList().subscribe({ next: (admins) => this.adminsList.set(admins) });
  }

  select(r: ProductRequest): void {
    this.selected.set(r);
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
        this.toast.success('Demande prise en charge.');
        this.updateRequest(updated);
        this.selected.set(updated);
      },
      error: (e) => {
        this.actionLoading.set(false);
        this.toast.error(this.extractMessage(e, 'Erreur'));
      },
    });
  }

  submitApprove(): void {
    const r = this.selected();
    if (!r || this.reviewLoading || this.approveForm.invalid) return;
    this.reviewLoading = true;
    this.reviewError = '';
    const raw = this.approveForm.getRawValue();
    const payload: ProductRequestReviewPayload = {
      status: 'APPROVED' as ProductRequestStatus,
      categoryId: Number(raw.categoryId),
      approvedProductName: raw.approvedProductName || r.name,
      approvedProductSlug: raw.approvedProductSlug ?? undefined,
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
      },
      error: (e) => {
        this.reviewLoading = false;
        this.reviewError = this.extractMessage(e, 'Erreur');
      },
    });
  }

  submitReject(): void {
    const r = this.selected();
    if (!r || this.reviewLoading) return;
    this.reviewLoading = true;
    this.reviewError = '';
    const raw = this.rejectForm.getRawValue();
    this.service.review(r.id, { status: 'REJECTED' as ProductRequestStatus, reviewComment: raw.reviewComment || undefined }).subscribe({
      next: (updated) => {
        this.reviewLoading = false;
        this.toast.success('Demande refusée.');
        this.updateRequest(updated);
        this.selected.set(updated);
      },
      error: (e) => {
        this.reviewLoading = false;
        this.reviewError = this.extractMessage(e, 'Erreur');
      },
    });
  }

  submitPublish(): void {
    const r = this.selected();
    if (!r || this.publishLoading) return;
    this.publishLoading = true;
    this.publishError = '';
    const raw = this.publishForm.getRawValue();
    this.service.publish(r.id, { name: raw.name!, price: Number(raw.price), quantity: Number(raw.quantity) }).subscribe({
      next: () => {
        this.publishLoading = false;
        this.toast.success('Publié dans la wishlist !');
        this.loadRequests();
        this.selected.set(null);
      },
      error: (e) => {
        this.publishLoading = false;
        this.publishError = this.extractMessage(e, 'Erreur');
      },
    });
  }

  doReassign(adminId: number): void {
    const r = this.selected();
    if (!r) return;
    this.actionLoading.set(true);
    this.service.reassign(r.id, adminId).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.toast.success('Demande réaffectée.');
        this.updateRequest(updated);
        this.selected.set(updated);
      },
      error: (e) => {
        this.actionLoading.set(false);
        this.toast.error(this.extractMessage(e, 'Erreur lors de la réaffectation'));
      },
    });
  }

  getMeta(status: string) {
    return PRODUCT_REQUEST_STATUS_META[status as ProductRequestStatus] ?? PRODUCT_REQUEST_STATUS_META.DRAFT;
  }

  getCount(value: string): number {
    if (!value) return this.requests().length;
    return this.requests().filter((r) => r.status === value).length;
  }

  private updateRequest(updated: ProductRequest): void {
    this.requests.update((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  }

  private slugify(name: string): string {
    return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private extractMessage(error: unknown, fallback: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: unknown } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }
    return fallback;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
