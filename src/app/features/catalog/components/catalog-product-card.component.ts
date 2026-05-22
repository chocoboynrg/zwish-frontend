import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogProduct, CatalogProductStatus } from '../models/catalog-product.model';

@Component({
  selector: 'app-catalog-product-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="product-card" (click)="open.emit()">
      <div class="product-img-wrap">
        @if (product.mainImageUrl) {
          <img
            [src]="resolveImageUrl(product.mainImageUrl)"
            [alt]="product.name"
            class="product-img"
            (error)="onImageError($event)"
          />
        }
        @if (!product.mainImageUrl) {
          <div class="product-img-placeholder">
            <lucide-icon name="image" [size]="32" color="currentColor" [strokeWidth]="1.8" />
          </div>
        }
        <span class="product-status-badge" [ngClass]="getStatusClass(product.status)">
          {{ getStatusLabel(product.status) }}
        </span>
      </div>
      <div class="product-info">
        @if (product.category) {
          <div class="product-category-tag">{{ product.category.name }}</div>
        }
        <div class="product-name">{{ product.name }}</div>
        @if (product.brand) {
          <div class="product-brand muted">{{ product.brand }}</div>
        }
        <div class="product-price">
          @if (isPromoActive(product)) {
            <span class="promo-price">{{ product.promoPrice! | number }} <span class="currency">{{ product.currencyCode }}</span></span>
            <span class="original-price">{{ (product.sellingPrice ?? product.estimatedPrice) | number }}</span>
          } @else {
            {{ (product.sellingPrice ?? product.estimatedPrice) | number }}
            <span class="currency">{{ product.currencyCode }}</span>
          }
        </div>
        @if (isPromoActive(product)) {
          <div class="promo-badge">Promo · Fin {{ product.promoEndsAt! | date:'dd/MM' }}</div>
        }
      </div>
      <div class="product-actions" (click)="$event.stopPropagation()">
        <button
          class="btn-icon"
          [title]="product.status === 'ACTIVE' ? 'Désactiver' : 'Activer'"
          (click)="toggleStatus.emit()"
        >
          <lucide-icon [name]="product.status === 'ACTIVE' ? 'check-circle-2' : 'x-circle'" [size]="15" color="currentColor" [strokeWidth]="1.8" />
        </button>
        <button
          class="btn-icon btn-icon-danger"
          title="Supprimer"
          (click)="delete.emit()"
        >
          <lucide-icon name="trash-2" [size]="15" color="currentColor" [strokeWidth]="1.8" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .product-card {
      background: white;
      border: 1.5px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.15s, transform 0.15s;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .product-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    .product-img-wrap {
      position: relative;
      height: 160px;
      background: #f9fafb;
      flex-shrink: 0;
    }
    .product-img { width: 100%; height: 100%; object-fit: cover; }
    .product-img-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #d1d5db;
      font-size: 0.82rem;
    }
    .product-status-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .status-active { background: #dcfce7; color: #166534; }
    .status-inactive { background: #fef3c7; color: #92400e; }
    .status-draft { background: #f3f4f6; color: #4b5563; }
    .status-archived { background: #fee2e2; color: #991b1b; }
    .product-info {
      padding: 14px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .product-category-tag {
      font-size: 0.68rem;
      color: #6b7280;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .product-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.35;
    }
    .product-brand {
      font-size: 0.78rem;
      color: #6b7280;
    }
    .product-price {
      margin-top: 4px;
      font-size: 0.95rem;
      font-weight: 900;
      color: #111827;
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex-wrap: wrap;
    }
    .currency {
      font-size: 0.7rem;
      font-weight: 600;
      color: #9ca3af;
    }
    .promo-price { color: #dc2626; font-weight: 900; }
    .original-price {
      font-size: 0.75rem;
      color: #9ca3af;
      text-decoration: line-through;
      font-weight: 500;
    }
    .promo-badge {
      margin-top: 4px;
      font-size: 0.68rem;
      font-weight: 800;
      color: #b91c1c;
      background: #fef2f2;
      border-radius: 999px;
      padding: 3px 8px;
      width: fit-content;
    }
    .product-actions {
      display: flex;
      gap: 8px;
      padding: 0 16px 16px;
      margin-top: auto;
    }
    .btn-icon {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #374151;
    }
    .btn-icon:hover { background: #f9fafb; }
    .btn-icon-danger { color: #b91c1c; }
  `],
})
export class CatalogProductCardComponent {
  @Input({ required: true }) product!: CatalogProduct;
  @Input({ required: true }) resolveImageUrl!: (url: string) => string;
  @Input({ required: true }) isPromoActive!: (product: CatalogProduct) => boolean;
  @Input({ required: true }) getStatusLabel!: (status: CatalogProductStatus) => string;
  @Input({ required: true }) getStatusClass!: (status: CatalogProductStatus) => string;
  @Input({ required: true }) onImageError!: (event: Event) => void;

  @Output() open = new EventEmitter<void>();
  @Output() toggleStatus = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}
