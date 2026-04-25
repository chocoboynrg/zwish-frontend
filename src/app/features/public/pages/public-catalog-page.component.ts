import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CatalogService } from '../../catalog/services/catalog.service';
import { CatalogProduct } from '../../catalog/models/catalog-product.model';
import { CatalogCategory } from '../../catalog/models/catalog-category.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserWishlistItemService } from '../../account/services/user-wishlist-item.service';
import { DashboardService } from '../../account/services/dashboard.service';
import { EventsService } from '../../events/services/events.service';
import { WishlistDrawerService } from '../services/wishlist-drawer.service';
import { environment } from '../../../../environments/environment';

interface WishlistChoice {
  wishlistId: number;
  eventId: number;
  eventTitle: string;
  existingNames: string[]; // noms déjà présents dans cette wishlist
}

@Component({
  selector: 'app-public-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- HERO -->
    <section class="catalog-hero">
      <div class="hero-bg"></div>
      <div class="container">
        <div class="hero-eyebrow">Catalogue</div>
        <h1>Trouvez l'idée<br/><span class="accent">parfaite.</span></h1>
        <p>Des milliers de produits soigneusement sélectionnés pour tous vos événements.</p>

        <!-- Barre de recherche hero -->
        <div class="hero-search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="rgba(255,255,255,0.4)" stroke-width="1.8"/>
            <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.4)" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="search"
            placeholder="Rechercher un produit, une marque..."
            class="hero-search-input"
          />
          <span class="search-count" *ngIf="search.trim()">{{ filteredProducts().length }} résultat(s)</span>
        </div>
      </div>
    </section>

    <!-- CATALOG BODY -->
    <section class="catalog-body">
      <div class="container-wide">

        <!-- Sidebar filtres -->
        <aside class="sidebar">
          <div class="sidebar-section">
            <div class="sidebar-title">Catégories</div>
            <div class="cat-list">
              <button
                class="cat-btn"
                [class.active]="activeCategoryId() === null"
                (click)="activeCategoryId.set(null)"
              >
                <span>Tout voir</span>
                <span class="cat-count">{{ products().length }}</span>
              </button>
              <button
                *ngFor="let c of categories()"
                class="cat-btn"
                [class.active]="activeCategoryId() === c.id"
                (click)="activeCategoryId.set(c.id)"
              >
                <span>{{ c.name }}</span>
                <span class="cat-count">{{ getCount(c.id) }}</span>
              </button>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-title">Prix</div>
            <div class="price-filters">
              <button class="price-btn" [class.active]="priceRange() === null" (click)="priceRange.set(null)">Tous les prix</button>
              <button class="price-btn" [class.active]="priceRange() === '0-50000'" (click)="priceRange.set('0-50000')">Moins de 50 000</button>
              <button class="price-btn" [class.active]="priceRange() === '50000-200000'" (click)="priceRange.set('50000-200000')">50 000 — 200 000</button>
              <button class="price-btn" [class.active]="priceRange() === '200000-500000'" (click)="priceRange.set('200000-500000')">200 000 — 500 000</button>
              <button class="price-btn" [class.active]="priceRange() === '500000+'" (click)="priceRange.set('500000+')">500 000 et plus</button>
            </div>
          </div>
        </aside>

        <!-- Grille produits -->
        <div class="products-area">
          <!-- Toolbar -->
          <div class="products-toolbar">
            <div class="products-count">
              <strong>{{ filteredProducts().length }}</strong> produit(s)
              <span *ngIf="activeCategoryId()"> dans <em>{{ activeCategoryName() }}</em></span>
            </div>
            <div class="toolbar-right">
              <select [(ngModel)]="sortBy" class="sort-select">
                <option value="default">Par défaut</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name">Nom A→Z</option>
              </select>
            </div>
          </div>

          <!-- Loading -->
          <div class="loading-state" *ngIf="loading()">
            <div class="skeleton-grid">
              <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]">
                <div class="skeleton-img"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
          </div>

          <!-- Empty -->
          <div class="empty-state" *ngIf="!loading() && filteredProducts().length === 0">
            <div class="empty-icon">🔍</div>
            <h3>Aucun produit trouvé</h3>
            <p>Essayez d'autres termes ou explorez toutes les catégories.</p>
            <button class="btn-reset" (click)="resetFilters()">Réinitialiser les filtres</button>
          </div>

          <!-- Grille -->
          <div class="products-grid" *ngIf="!loading() && filteredProducts().length > 0">
            <div
              class="product-card"
              *ngFor="let p of sortedProducts()"
            >
              <!-- Image -->
              <div class="card-img-wrap">
                <img
                  *ngIf="p.mainImageUrl"
                  [src]="resolveUrl(p.mainImageUrl)"
                  [alt]="p.name"
                  class="card-img"
                  (error)="onImgError($event)"
                  loading="lazy"
                />
                <div class="card-img-placeholder" *ngIf="!p.mainImageUrl">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#d1d5db" stroke-width="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#d1d5db"/>
                    <path d="M21 15l-5-5L5 21" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="card-category-tag" *ngIf="p.category">{{ p.category.name }}</div>
              </div>

              <!-- Infos -->
              <div class="card-body">
                <div class="card-brand" *ngIf="p.brand">{{ p.brand }}</div>
                <h3 class="card-name">{{ p.name }}</h3>
                <p class="card-desc" *ngIf="p.description">{{ p.description | slice:0:80 }}{{ (p.description?.length ?? 0) > 80 ? '…' : '' }}</p>
                <div class="card-footer">
                  <div class="card-price">
                    {{ p.estimatedPrice | number }}<span class="card-currency"> {{ p.currencyCode }}</span>
                  </div>
                  <button
                    class="card-cta"
                    (click)="addToWishlist(p)"
                    [disabled]="submittingId() === p.id"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                    {{ submittingId() === p.id ? '...' : 'Ajouter' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WISHLIST MODAL -->
    <div class="modal-backdrop" *ngIf="showModal()" (click)="showModal.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Ajouter à ma wishlist</h3>
          <button class="modal-close" (click)="showModal.set(false)">✕</button>
        </div>

        <div class="modal-product" *ngIf="selectedProduct()">
          <div class="modal-product-img" *ngIf="selectedProduct()!.mainImageUrl">
            <img [src]="resolveUrl(selectedProduct()!.mainImageUrl!)" [alt]="selectedProduct()!.name" />
          </div>
          <div>
            <div class="modal-product-name">{{ selectedProduct()!.name }}</div>
            <div class="modal-product-price">{{ selectedProduct()!.estimatedPrice | number }} {{ selectedProduct()!.currencyCode }}</div>
          </div>
        </div>

        <div class="modal-body">
          <p class="modal-label">Choisir un événement</p>

          <div class="modal-loading" *ngIf="wishlistLoading()">Chargement de vos événements...</div>

          <div class="modal-empty" *ngIf="!wishlistLoading() && wishlistChoices().length === 0">
            <p>Vous n'avez pas encore d'événement actif.</p>
            <a routerLink="/app/events/new" class="btn-create-event" (click)="showModal.set(false)">
              Créer un événement →
            </a>
          </div>

          <div class="wishlist-choices" *ngIf="!wishlistLoading() && wishlistChoices().length > 0">
            <button
              *ngFor="let choice of wishlistChoices()"
              class="wishlist-choice-btn"
              [class.already-added]="isAlreadyInWishlist(choice)"
              (click)="!isAlreadyInWishlist(choice) && confirmAdd(choice)"
              [disabled]="submittingId() !== null || isAlreadyInWishlist(choice)"
            >
              <div class="choice-left">
                <div class="choice-event-name">{{ choice.eventTitle }}</div>
                <div class="choice-already" *ngIf="isAlreadyInWishlist(choice)">Déjà dans cette wishlist</div>
              </div>
              <svg *ngIf="!isAlreadyInWishlist(choice)" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <svg *ngIf="isAlreadyInWishlist(choice)" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding-top: 64px; background: #fff; }
    .container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
    .container-wide { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

    /* HERO */
    .catalog-hero { background: #000; padding: 80px 0 64px; position: relative; overflow: hidden; }
    .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 80% at 30% 50%, rgba(255,215,0,0.07) 0%, transparent 60%); }
    .catalog-hero .container { position: relative; z-index: 1; }
    .hero-eyebrow { color: #FFD700; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 16px; }
    .catalog-hero h1 { font-size: clamp(2.5rem, 5vw, 3.5rem); font-weight: 900; color: white; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 16px; }
    .accent { color: #FFD700; }
    .catalog-hero p { color: rgba(255,255,255,0.5); font-size: 1rem; margin: 0 0 36px; max-width: 480px; }

    .hero-search {
      display: flex; align-items: center; gap: 12px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px; padding: 12px 20px; max-width: 560px;
      backdrop-filter: blur(12px); transition: 0.2s;
    }
    .hero-search:focus-within { border-color: rgba(255,215,0,0.4); background: rgba(255,255,255,0.08); }
    .hero-search-input {
      flex: 1; background: transparent; border: 0; outline: 0;
      color: white; font: inherit; font-size: 0.95rem;
    }
    .hero-search-input::placeholder { color: rgba(255,255,255,0.3); }
    .search-count { color: #FFD700; font-size: 0.8rem; font-weight: 700; white-space: nowrap; }

    /* CATALOG BODY */
    .catalog-body { padding: 48px 0 80px; }
    .container-wide { display: grid; grid-template-columns: 240px 1fr; gap: 40px; align-items: start; }

    /* SIDEBAR */
    .sidebar { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 32px; }
    .sidebar-section { display: flex; flex-direction: column; gap: 12px; }
    .sidebar-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; padding-bottom: 4px; border-bottom: 1px solid #f3f4f6; }

    .cat-list { display: flex; flex-direction: column; gap: 2px; }
    .cat-btn {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 12px; border: 0; background: transparent;
      border-radius: 10px; font: inherit; font-size: 0.88rem; color: #6b7280;
      cursor: pointer; text-align: left; transition: 0.15s;
    }
    .cat-btn:hover { background: #f9fafb; color: #111; }
    .cat-btn.active { background: #111; color: white; font-weight: 700; }
    .cat-count { font-size: 0.75rem; background: rgba(0,0,0,0.06); color: inherit; padding: 1px 7px; border-radius: 999px; }
    .cat-btn.active .cat-count { background: rgba(255,255,255,0.15); }

    .price-filters { display: flex; flex-direction: column; gap: 4px; }
    .price-btn {
      padding: 8px 12px; border: 0; background: transparent; border-radius: 10px;
      font: inherit; font-size: 0.85rem; color: #6b7280; cursor: pointer; text-align: left; transition: 0.15s;
    }
    .price-btn:hover { background: #f9fafb; color: #111; }
    .price-btn.active { background: #111; color: white; font-weight: 700; }

    /* PRODUCTS AREA */
    .products-area { min-width: 0; }
    .products-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .products-count { font-size: 0.9rem; color: #6b7280; }
    .products-count strong { color: #111; font-weight: 800; }
    .products-count em { color: #111; font-style: normal; font-weight: 600; }
    .sort-select { padding: 8px 12px; border: 1.5px solid #e5e7eb; border-radius: 9px; font: inherit; font-size: 0.85rem; background: white; cursor: pointer; }

    /* SKELETON */
    .skeleton-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .skeleton-card { border-radius: 16px; overflow: hidden; background: #f9fafb; }
    .skeleton-img { height: 200px; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    .skeleton-line { height: 14px; margin: 12px 16px 0; background: #f3f4f6; border-radius: 6px; animation: shimmer 1.4s infinite; }
    .skeleton-line.short { width: 60%; margin-top: 8px; }
    @keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }

    /* EMPTY */
    .empty-state { text-align: center; padding: 80px 0; }
    .empty-icon { font-size: 3rem; margin-bottom: 16px; }
    .empty-state h3 { font-size: 1.2rem; font-weight: 800; color: #111; margin: 0 0 8px; }
    .empty-state p { color: #6b7280; margin: 0 0 24px; }
    .btn-reset { padding: 10px 24px; border: 2px solid #111; border-radius: 10px; background: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-reset:hover { background: #111; color: white; }

    /* PRODUCTS GRID */
    .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

    .product-card {
      background: white; border: 1.5px solid #f3f4f6; border-radius: 18px;
      overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; display: flex; flex-direction: column;
    }
    .product-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,0.1); transform: translateY(-3px); border-color: #e5e7eb; }

    .card-img-wrap { position: relative; height: 200px; background: #f9fafb; overflow: hidden; }
    .card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .product-card:hover .card-img { transform: scale(1.04); }
    .card-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .card-category-tag {
      position: absolute; bottom: 10px; left: 10px;
      background: rgba(0,0,0,0.65); color: white; backdrop-filter: blur(8px);
      padding: 3px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700;
    }

    .card-body { padding: 18px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .card-brand { font-size: 0.72rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; }
    .card-name { font-size: 0.95rem; font-weight: 700; color: #111; margin: 0; line-height: 1.3; }
    .card-desc { font-size: 0.8rem; color: #9ca3af; line-height: 1.5; margin: 0; flex: 1; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; }
    .card-price { font-size: 1.05rem; font-weight: 900; color: #111; }
    .card-currency { font-size: 0.72rem; font-weight: 600; color: #9ca3af; }
    .card-cta {
      display: inline-flex; align-items: center; gap: 5px;
      background: #111; color: white; border: 1px solid transparent; border-radius: 10px;
      padding: 8px 14px; font: inherit; font-size: 0.82rem; font-weight: 700;
      cursor: pointer; transition: 0.15s; white-space: nowrap;
    }
    .card-cta:hover:not(:disabled) { background: #000; transform: scale(1.03); }
    .card-cta:disabled { opacity: 0.5; cursor: not-allowed; }

    /* MODAL */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: white; border-radius: 24px; width: min(500px, 100%); overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.2); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 28px 20px; border-bottom: 1px solid #f3f4f6; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #111; }
    .modal-close { border: 0; background: #f3f4f6; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 0.9rem; }

    .modal-product { display: flex; align-items: center; gap: 16px; padding: 20px 28px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
    .modal-product-img { width: 60px; height: 60px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: #e5e7eb; }
    .modal-product-img img { width: 100%; height: 100%; object-fit: cover; }
    .modal-product-name { font-weight: 700; color: #111; font-size: 0.9rem; margin-bottom: 4px; }
    .modal-product-price { font-size: 0.85rem; color: #6b7280; }

    .modal-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
    .modal-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin: 0; }
    .modal-loading { color: #6b7280; font-size: 0.9rem; text-align: center; padding: 16px 0; }
    .modal-empty { text-align: center; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; align-items: center; }
    .modal-empty p { color: #6b7280; margin: 0; font-size: 0.9rem; }
    .btn-create-event { background: #111; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.88rem; }

    .wishlist-choices { display: flex; flex-direction: column; gap: 8px; }
    .wishlist-choice-btn {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px; border: 1.5px solid #e5e7eb; border-radius: 12px;
      background: white; font: inherit; cursor: pointer; text-align: left; transition: 0.15s; gap: 12px;
    }
    .wishlist-choice-btn:hover:not(:disabled):not(.already-added) { border-color: #111; background: #f9fafb; }
    .wishlist-choice-btn.already-added { border-color: #bbf7d0; background: #f0fdf4; cursor: default; }
    .wishlist-choice-btn:disabled:not(.already-added) { opacity: 0.5; cursor: not-allowed; }
    .choice-left { display: flex; flex-direction: column; gap: 2px; }
    .choice-event-name { font-size: 0.9rem; font-weight: 600; color: #111; }
    .choice-already { font-size: 0.75rem; color: #16a34a; font-weight: 600; }

    /* RESPONSIVE */
    @media (max-width: 1100px) {
      .products-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 900px) {
      .container-wide { grid-template-columns: 1fr; }
      .sidebar { position: static; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    }
    @media (max-width: 600px) {
      .products-grid { grid-template-columns: 1fr; }
      .skeleton-grid { grid-template-columns: 1fr; }
      .sidebar { grid-template-columns: 1fr; }
    }
  `],
})
export class PublicCatalogPageComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly wishlistItemService = inject(UserWishlistItemService);
  private readonly dashboardService = inject(DashboardService);
  private readonly eventsService = inject(EventsService);
  private readonly wishlistDrawer = inject(WishlistDrawerService);

  readonly products = signal<CatalogProduct[]>([]);
  readonly categories = signal<CatalogCategory[]>([]);
  readonly loading = signal(false);
  readonly submittingId = signal<number | null>(null);
  readonly showModal = signal(false);
  readonly wishlistLoading = signal(false);
  readonly wishlistChoices = signal<WishlistChoice[]>([]);
  readonly selectedProduct = signal<CatalogProduct | null>(null);

  readonly activeCategoryId = signal<number | null>(null);
  readonly priceRange = signal<string | null>(null);
  search = '';
  sortBy = 'default';

  readonly filteredProducts = computed(() => {
    let items = this.products();
    const term = this.search.trim().toLowerCase();
    const catId = this.activeCategoryId();
    const range = this.priceRange();

    if (term) {
      items = items.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.brand ?? '').toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term) ||
        (p.category?.name ?? '').toLowerCase().includes(term)
      );
    }
    if (catId !== null) {
      items = items.filter(p => p.category?.id === catId);
    }
    if (range) {
      if (range === '0-50000') items = items.filter(p => (p.estimatedPrice ?? 0) < 50000);
      else if (range === '50000-200000') items = items.filter(p => (p.estimatedPrice ?? 0) >= 50000 && (p.estimatedPrice ?? 0) <= 200000);
      else if (range === '200000-500000') items = items.filter(p => (p.estimatedPrice ?? 0) > 200000 && (p.estimatedPrice ?? 0) <= 500000);
      else if (range === '500000+') items = items.filter(p => (p.estimatedPrice ?? 0) > 500000);
    }
    return items;
  });

  readonly sortedProducts = computed(() => {
    const items = [...this.filteredProducts()];
    switch (this.sortBy) {
      case 'price-asc': return items.sort((a, b) => (a.estimatedPrice ?? 0) - (b.estimatedPrice ?? 0));
      case 'price-desc': return items.sort((a, b) => (b.estimatedPrice ?? 0) - (a.estimatedPrice ?? 0));
      case 'name': return items.sort((a, b) => a.name.localeCompare(b.name));
      default: return items;
    }
  });

  readonly activeCategoryName = computed(() => {
    const id = this.activeCategoryId();
    return this.categories().find(c => c.id === id)?.name ?? '';
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.catalogService.getProducts().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (prods) => {
        this.products.set(prods.filter(p => p.status === 'ACTIVE'));
        // Extraire catégories uniques
        const cats = new Map<number, CatalogCategory>();
        prods.forEach(p => { if (p.category) cats.set(p.category.id, p.category); });
        this.categories.set([...cats.values()]);
      },
      error: () => this.toast.error('Impossible de charger le catalogue.'),
    });
  }

  getCount(catId: number): number {
    return this.products().filter(p => p.category?.id === catId).length;
  }

  resetFilters(): void {
    this.search = '';
    this.activeCategoryId.set(null);
    this.priceRange.set(null);
    this.sortBy = 'default';
  }

  resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiBaseUrl.replace('/api', '')}${url}`;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  addToWishlist(product: CatalogProduct): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.info('Connectez-vous pour ajouter ce produit à votre wishlist.');
      this.router.navigate(['/login']);
      return;
    }
    this.selectedProduct.set(product);
    this.showModal.set(true);
    this.loadWishlists();
  }


  private loadWishlists(): void {
    this.wishlistLoading.set(true);
    this.wishlistChoices.set([]);
    this.dashboardService.getMyDashboard().subscribe({
      next: (dashboard) => {
        const events = dashboard.organizedEvents ?? [];
        if (events.length === 0) {
          this.wishlistLoading.set(false);
          return;
        }

        // Pour chaque événement, charger la wishlist pour connaître les items existants
        let remaining = events.length;
        const choices: WishlistChoice[] = [];

        events.forEach((e: any) => {
          this.eventsService.getEventWishlist(e.id).subscribe({
            next: (wl) => {
              choices.push({
                wishlistId: 0, // résolu dans confirmAdd via getMyEventView
                eventId: e.id,
                eventTitle: e.title,
                existingNames: (wl.items ?? []).map((item: any) =>
                  item.name.trim().toLowerCase()
                ),
              });
            },
            error: () => {
              // si erreur sur la wishlist, on ajoute quand même sans noms
              choices.push({ wishlistId: 0, eventId: e.id, eventTitle: e.title, existingNames: [] });
            },
            complete: () => {
              remaining--;
              if (remaining === 0) {
                this.wishlistChoices.set(choices);
                this.wishlistLoading.set(false);
              }
            },
          });
        });
      },
      error: () => {
        this.wishlistLoading.set(false);
        this.toast.error('Impossible de charger vos événements.');
      },
    });
  }

  isAlreadyInWishlist(choice: WishlistChoice): boolean {
    const productName = this.selectedProduct()?.name?.trim().toLowerCase() ?? '';
    return choice.existingNames.includes(productName);
  }

  confirmAdd(choice: WishlistChoice): void {
    const product = this.selectedProduct();
    if (!product) return;
    this.submittingId.set(product.id);

    // Résoudre le wishlistId via getMyEventView puis créer l'item
    this.eventsService.getMyEventView(choice.eventId).subscribe({
      next: (view) => {
        const wishlistId = view.event.wishlistId;
        if (!wishlistId) {
          this.submittingId.set(null);
          this.toast.error('Wishlist introuvable pour cet événement.');
          return;
        }
        this.wishlistItemService.createWishlistItem({
          wishlistId,
          name: product.name,
          price: product.estimatedPrice ?? 0,
          quantity: 1,
          imageUrl: product.mainImageUrl ?? undefined,
        }).subscribe({
          next: () => {
            this.submittingId.set(null);
            this.showModal.set(false);
            this.toast.success(`"${product.name}" ajouté à votre wishlist !`);
            this.loadWishlists();
            this.wishlistDrawer.notifyAdded(choice.eventId);
          },
          error: (e: any) => {
            this.submittingId.set(null);
            this.toast.error(e?.error?.message ?? 'Erreur lors de l\'ajout.');
          },
        });
      },
      error: () => {
        this.submittingId.set(null);
        this.toast.error('Impossible de récupérer la wishlist de cet événement.');
      },
    });
  }
}