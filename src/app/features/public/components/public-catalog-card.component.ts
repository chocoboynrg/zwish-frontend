import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogProduct } from '../../catalog/models/catalog-product.model';

@Component({
  selector: 'app-public-catalog-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <article class="card" (click)="view.emit(product)" style="cursor:pointer">
      <div class="card-img-wrap">
        @if (product.mainImageUrl) {
          <img
            [src]="resolveUrl(product.mainImageUrl)"
            [alt]="product.name"
            class="card-img"
            (error)="onImgError($event)"
            loading="lazy"
          />
        } @else {
          <div class="card-no-img">
            <lucide-icon name="image-off" [size]="36" color="#d1d5db" [strokeWidth]="1.5" />
          </div>
        }
        @if (product.category) {
          <div class="card-cat-tag">{{ product.category.name }}</div>
        }
        @if (product.themes && product.themes.length > 0) {
          <div class="card-theme-dots">
            @for (t of product.themes.slice(0, 3); track t.id) {
              <span class="theme-dot" [style.background]="t.color || '#6366f1'" [title]="t.name"></span>
            }
          </div>
        }
        @if (isPromoActive(product)) {
          <div class="promo-ribbon">-{{ getDiscountPct(product) }}%</div>
        }
      </div>
      <div class="card-body">
        @if (product.brand) {
          <div class="card-brand">{{ product.brand }}</div>
        }
        <h3 class="card-name">{{ product.name }}</h3>
        @if (product.description) {
          <p class="card-desc">
            {{ product.description | slice:0:72 }}{{ product.description.length > 72 ? '…' : '' }}
          </p>
        }
        <div class="card-footer">
          <div class="card-price">
            @if (isPromoActive(product)) {
              <span class="promo-price-pub">{{ product.promoPrice! | number }}</span>
              <span class="original-price-pub">{{ (product.sellingPrice ?? product.estimatedPrice) | number }}</span>
              <span class="card-cur"> {{ product.currencyCode }}</span>
            } @else {
              {{ (product.sellingPrice ?? product.estimatedPrice) | number }}<span class="card-cur"> {{ product.currencyCode }}</span>
            }
          </div>
          <div class="card-actions">
            <button class="card-detail-btn" (click)="$event.stopPropagation(); view.emit(product)" title="Voir les détails">
              <lucide-icon name="external-link" [size]="13" color="currentColor" [strokeWidth]="2" />
            </button>
            <button class="card-add" (click)="$event.stopPropagation(); add.emit(product)" [disabled]="submitting">
              @if (submitting) {
                <span class="spinner"></span>
              } @else {
                <lucide-icon name="plus" [size]="14" color="currentColor" [strokeWidth]="2.5" />
              }
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .card {
        background: white;
        border: 1px solid #eef1f4;
        border-radius: 18px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition:
          box-shadow 0.2s,
          transform 0.2s,
          border-color 0.2s;
      }
      .card:hover {
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
        transform: translateY(-4px);
        border-color: #e5e7eb;
      }
      .card-img-wrap {
        position: relative;
        height: 220px;
        background: #f3f4f6;
        overflow: hidden;
        flex-shrink: 0;
      }
      .card-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
      .card:hover .card-img {
        transform: scale(1.05);
      }
      .card-no-img {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f9fafb;
      }
      .card-cat-tag {
        position: absolute;
        left: 10px;
        bottom: 10px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(8px);
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 0.68rem;
        font-weight: 800;
        color: #111827;
      }
      .card-theme-dots {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 4px;
      }
      .theme-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.8);
      }
      .promo-ribbon {
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 4px 8px;
        border-radius: 999px;
        background: #111827;
        color: white;
        font-size: 0.68rem;
        font-weight: 800;
      }
      .card-body {
        padding: 16px 18px 18px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .card-brand {
        font-size: 0.68rem;
        font-weight: 800;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }
      .card-name {
        font-size: 0.92rem;
        font-weight: 700;
        color: #111;
        margin: 0;
        line-height: 1.35;
      }
      .card-desc {
        font-size: 0.78rem;
        color: #9ca3af;
        line-height: 1.5;
        margin: 2px 0 0;
        flex: 1;
      }
      .card-footer {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-top: 10px;
      }
      .card-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .card-detail-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border: 1.5px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        color: #6b7280;
        cursor: pointer;
        transition: border-color 0.15s, color 0.15s;
      }
      .card-detail-btn:hover {
        border-color: #111;
        color: #111;
      }
      .card-price {
        font-size: 1rem;
        font-weight: 900;
        color: #111;
        white-space: nowrap;
        display: flex;
        align-items: baseline;
        gap: 4px;
        flex-wrap: wrap;
      }
      .card-cur {
        font-size: 0.7rem;
        font-weight: 600;
        color: #9ca3af;
        margin-left: 2px;
      }
      .promo-price-pub {
        font-size: 1.05rem;
        font-weight: 900;
        color: #dc2626;
      }
      .original-price-pub {
        font-size: 0.75rem;
        color: #94a3b8;
        text-decoration: line-through;
      }
      .card-add {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 14px;
        border: 0;
        border-radius: 12px;
        background: #111827;
        color: white;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        transition:
          background 0.18s,
          transform 0.18s;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .card-add:hover:not(:disabled) {
        background: #222;
        transform: scale(1.04);
      }
      .card-add:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .spinner {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class PublicCatalogCardComponent {
  @Input({ required: true }) product!: CatalogProduct;
  @Input({ required: true }) submitting = false;
  @Input({ required: true }) resolveUrl!: (url: string) => string;
  @Input({ required: true }) isPromoActive!: (product: CatalogProduct) => boolean;
  @Input({ required: true }) getDiscountPct!: (product: CatalogProduct) => number;
  @Input({ required: true }) onImgError!: (event: Event) => void;
  @Output() add = new EventEmitter<CatalogProduct>();
  @Output() view = new EventEmitter<CatalogProduct>();
}
