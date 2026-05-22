import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CatalogService } from '../../catalog/services/catalog.service';
import { CatalogProduct } from '../../catalog/models/catalog-product.model';
import { CatalogCategory } from '../../catalog/models/catalog-category.model';
import { CatalogTheme } from '../../catalog/models/catalog-theme.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserWishlistItemService } from '../../account/services/user-wishlist-item.service';
import { DashboardService } from '../../account/services/dashboard.service';
import { EventsService } from '../../events/services/events.service';
import { WishlistDrawerService } from '../services/wishlist-drawer.service';
import { PublicCatalogCardComponent } from '../components/public-catalog-card.component';
import { environment } from '../../../../environments/environment';

interface WishlistChoice {
  wishlistId: number;
  eventId: number;
  eventTitle: string;
  existingNames: string[];
}

const SHOW_LIMIT = 7;

@Component({
  selector: 'app-public-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule, PublicCatalogCardComponent],
  template: `
    <!-- ─── HERO ─── -->
    <section class="hero">
      <div class="hero-grid"></div>
      <div class="hero-glow"></div>
      <div class="hero-inner">
        <div class="eyebrow">Catalogue</div>
        <h1>Trouvez l'idée<br /><span class="accent">parfaite.</span></h1>
        <p class="hero-sub">Des milliers de produits soigneusement sélectionnés pour tous vos événements.</p>

        <div class="search-bar" [class.has-value]="search().trim()">
          <lucide-icon name="search" [size]="18" color="currentColor" [strokeWidth]="1.8" class="search-icon" />
          <input
            type="text"
            [ngModel]="search()"
            (ngModelChange)="search.set($event)"
            placeholder="Rechercher un produit, une marque, une catégorie…"
            class="search-input"
            autocomplete="off"
          />
          @if (search().trim()) {
            <button class="search-clear" (click)="search.set('')">
              <lucide-icon name="x" [size]="14" color="currentColor" [strokeWidth]="2.2" />
            </button>
          }
        </div>

        @if (!loading() && products().length > 0) {
          <div class="hero-stats">
            <div class="stat">
              <span class="stat-n">{{ products().length }}</span>
              <span class="stat-l">produits</span>
            </div>
            <div class="stat-sep"></div>
            <div class="stat">
              <span class="stat-n">{{ categories().length }}</span>
              <span class="stat-l">catégories</span>
            </div>
            @if (activeThemes().length > 0) {
              <div class="stat-sep"></div>
              <div class="stat">
                <span class="stat-n">{{ activeThemes().length }}</span>
                <span class="stat-l">thèmes</span>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <!-- ─── BODY ─── -->
    <section class="body">
      <div class="layout">

        <!-- SIDEBAR -->
        <aside class="sidebar">

          <!-- Active filter reset -->
          @if (hasActiveFilters()) {
            <div class="sidebar-reset">
              <div class="reset-label">
                <lucide-icon name="info" [size]="13" color="#d97706" [strokeWidth]="2" />
                Filtres actifs
              </div>
              <button class="reset-btn" (click)="resetFilters()">Tout effacer</button>
            </div>
          }

          <!-- PROMOTIONS -->
          @if (promoCount() > 0) {
            <div class="filter-section promo-filter-section">
              <div class="filter-list">
                <button
                  class="filter-item promo-filter-btn"
                  [class.active]="showPromoOnly()"
                  (click)="showPromoOnly.set(!showPromoOnly())"
                >
                  <span class="item-label">
                    <lucide-icon name="tag" [size]="13" color="currentColor" [strokeWidth]="1.8" style="flex-shrink:0" />
                    En promotion
                  </span>
                  <span class="promo-count-pill">{{ promoCount() }}</span>
                </button>
              </div>
            </div>
          }

          <!-- THÈMES -->
          @if (activeThemes().length > 0) {
            <div class="filter-section">
              <div class="filter-title">Thèmes</div>
              <div class="filter-list">
                @for (t of visibleThemes(); track t.id) {
                  <button
                    class="filter-item theme-item"
                    [class.active]="activeThemeId() === t.id"
                    [style.--tc]="t.color || '#6366f1'"
                    (click)="activeThemeId.set(activeThemeId() === t.id ? null : t.id)"
                  >
                    <span class="item-label">
                      @if (t.emoji) { <span class="item-emoji">{{ t.emoji }}</span> }
                      {{ t.name }}
                    </span>
                    <span class="item-count">{{ getThemeCount(t.id) }}</span>
                  </button>
                }
                @if (activeThemes().length > LIMIT) {
                  <button class="show-more-btn" (click)="themesExpanded.set(!themesExpanded())">
                    @if (!themesExpanded()) {
                      + {{ activeThemes().length - LIMIT }} autre(s)
                    } @else {
                      Réduire
                    }
                  </button>
                }
              </div>
            </div>
          }

          <!-- CATÉGORIES -->
          @if (categories().length > 0) {
            <div class="filter-section">
              <div class="filter-title">Catégories</div>
              <div class="filter-list">
                <button
                  class="filter-item"
                  [class.active]="activeCategoryId() === null"
                  (click)="activeCategoryId.set(null)"
                >
                  <span class="item-label">Tout voir</span>
                  <span class="item-count">{{ products().length }}</span>
                </button>
                @for (c of visibleCategories(); track c.id) {
                  <button
                    class="filter-item"
                    [class.active]="activeCategoryId() === c.id"
                    (click)="activeCategoryId.set(c.id)"
                  >
                    <span class="item-label">{{ c.name }}</span>
                    <span class="item-count">{{ getCount(c.id) }}</span>
                  </button>
                }
                @if (categories().length > LIMIT) {
                  <button class="show-more-btn" (click)="categoriesExpanded.set(!categoriesExpanded())">
                    @if (!categoriesExpanded()) {
                      + {{ categories().length - LIMIT }} autre(s)
                    } @else {
                      Réduire
                    }
                  </button>
                }
              </div>
            </div>
          }

          <!-- PRIX -->
          <div class="filter-section">
            <div class="filter-title">Prix</div>
            <div class="filter-list">
              <button class="filter-item" [class.active]="priceRange() === null" (click)="priceRange.set(null)">
                <span class="item-label">Tous les prix</span>
              </button>
              <button class="filter-item" [class.active]="priceRange() === '0-50000'" (click)="priceRange.set('0-50000')">
                <span class="item-label">Moins de 50 000</span>
              </button>
              <button class="filter-item" [class.active]="priceRange() === '50000-200000'" (click)="priceRange.set('50000-200000')">
                <span class="item-label">50 000 — 200 000</span>
              </button>
              <button class="filter-item" [class.active]="priceRange() === '200000-500000'" (click)="priceRange.set('200000-500000')">
                <span class="item-label">200 000 — 500 000</span>
              </button>
              <button class="filter-item" [class.active]="priceRange() === '500000+'" (click)="priceRange.set('500000+')">
                <span class="item-label">500 000 et plus</span>
              </button>
            </div>
          </div>

        </aside>

        <!-- PRODUCTS AREA -->
        <div class="products-wrap">

          <!-- Toolbar -->
          <div class="toolbar">
            <p class="results">
              <strong>{{ filteredProducts().length }}</strong> produit(s)
              @if (activeCategoryName()) {
                <span> dans <em>{{ activeCategoryName() }}</em></span>
              }
              @if (activeThemeName()) {
                <span class="theme-pill">{{ activeThemeName() }}</span>
              }
              @if (showPromoOnly()) {
                <span class="promo-active-pill">🏷️ En promo</span>
              }
            </p>
            <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)" class="sort-sel">
              <option value="default">Par défaut</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="name">Nom A→Z</option>
            </select>
          </div>

          <!-- Skeleton -->
          @if (loading()) {
            <div class="grid">
              @for (i of [1,2,3,4,5,6,7,8,9]; track i) {
                <div class="skeleton-card">
                  <div class="sk-img"></div>
                  <div class="sk-body">
                    <div class="sk-line w80"></div>
                    <div class="sk-line w50"></div>
                    <div class="sk-line w30"></div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Empty -->
          @if (!loading() && filteredProducts().length === 0) {
            <div class="empty">
              <div class="empty-icon">🔍</div>
              <h3>Aucun résultat</h3>
              <p>Essayez d'autres termes ou ajustez vos filtres.</p>
              <button class="empty-reset" (click)="resetFilters()">Réinitialiser les filtres</button>
            </div>
          }

          <!-- Grid -->
          @if (!loading() && filteredProducts().length > 0) {
            <div class="grid">
              @for (p of sortedProducts(); track p.id) {
                <app-public-catalog-card
                  [product]="p"
                  [submitting]="submittingId() === p.id"
                  [resolveUrl]="resolveUrl.bind(this)"
                  [isPromoActive]="isPromoActive.bind(this)"
                  [getDiscountPct]="getDiscountPct.bind(this)"
                  [onImgError]="onImgError.bind(this)"
                  (add)="addToWishlist($event)"
                />
              }
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ─── WISHLIST MODAL ─── -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>Ajouter à ma wishlist</h3>
            <button class="modal-close" (click)="showModal.set(false)">
              <lucide-icon name="x" [size]="16" color="currentColor" [strokeWidth]="2.2" />
            </button>
          </div>
          @if (selectedProduct()) {
            <div class="modal-product">
              @if (selectedProduct()!.mainImageUrl) {
                <div class="modal-product-img">
                  <img [src]="resolveUrl(selectedProduct()!.mainImageUrl!)" [alt]="selectedProduct()!.name"/>
                </div>
              }
              <div>
                <div class="modal-product-name">{{ selectedProduct()!.name }}</div>
                <div class="modal-product-price">
                  @if (isPromoActive(selectedProduct()!)) {
                    <span class="promo-price-pub">{{ selectedProduct()!.promoPrice! | number }}</span>
                    <span class="original-price-pub">{{ (selectedProduct()!.sellingPrice ?? selectedProduct()!.estimatedPrice) | number }}</span>
                  } @else {
                    {{ (selectedProduct()!.sellingPrice ?? selectedProduct()!.estimatedPrice) | number }}
                  }
                  {{ selectedProduct()!.currencyCode }}
                </div>
              </div>
            </div>
          }
          <div class="modal-body">
            <p class="modal-label">Choisir un événement</p>
            @if (wishlistLoading()) {
              <div class="modal-loading">Chargement de vos événements…</div>
            }
            @if (!wishlistLoading() && wishlistChoices().length === 0) {
              <div class="modal-empty">
                <p>Vous n'avez pas encore d'événement actif.</p>
                <a routerLink="/app/events/new" class="btn-create-event" (click)="showModal.set(false)">
                  Créer un événement →
                </a>
              </div>
            }
            @if (!wishlistLoading() && wishlistChoices().length > 0) {
              <div class="wishlist-choices">
                @for (choice of wishlistChoices(); track choice.eventId) {
                  <button
                    class="choice-btn"
                    [class.added]="isAlreadyInWishlist(choice)"
                    (click)="!isAlreadyInWishlist(choice) && confirmAdd(choice)"
                    [disabled]="submittingId() !== null || isAlreadyInWishlist(choice)"
                  >
                    <div class="choice-info">
                      <div class="choice-title">{{ choice.eventTitle }}</div>
                      @if (isAlreadyInWishlist(choice)) {
                        <div class="choice-done">Déjà dans cette wishlist</div>
                      }
                    </div>
                    @if (isAlreadyInWishlist(choice)) {
                      <lucide-icon name="check" [size]="16" color="#16a34a" [strokeWidth]="2.5" />
                    } @else {
                      <lucide-icon name="chevron-right" [size]="16" color="currentColor" [strokeWidth]="2" />
                    }
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      padding-top: 64px;
      background: #f8f9fb;
    }

    /* ── HERO ── */
    .hero {
      position: relative;
      background: #0a0a0a;
      overflow: hidden;
      padding: 72px 24px 64px;
    }
    .hero-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
    }
    .hero-glow {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 60% 70% at 50% 60%, rgba(255,215,0,0.08) 0%, transparent 65%);
    }
    .hero-inner {
      position: relative; z-index: 1;
      max-width: 680px; margin: 0 auto;
      text-align: center;
      display: flex; flex-direction: column; align-items: center;
    }
    .eyebrow {
      font-size: 0.7rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.18em;
      color: #ffd700; margin-bottom: 20px;
    }
    .hero-inner h1 {
      font-size: clamp(2.6rem, 5.5vw, 3.8rem); font-weight: 900;
      color: white; line-height: 1.08; letter-spacing: -0.035em;
      margin: 0 0 18px;
    }
    .accent { color: #ffd700; }
    .hero-sub {
      color: rgba(255,255,255,0.45); font-size: 0.98rem; line-height: 1.6;
      margin: 0 0 36px; max-width: 460px;
    }

    .search-bar {
      width: 100%; max-width: 580px;
      display: flex; align-items: center; gap: 12px;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 14px 20px;
      backdrop-filter: blur(16px);
      transition: border-color 0.2s, background 0.2s;
      margin-bottom: 32px;
    }
    .search-bar:focus-within, .search-bar.has-value {
      border-color: rgba(255,215,0,0.5);
      background: rgba(255,255,255,0.09);
    }
    .search-icon { color: rgba(255,255,255,0.3); flex-shrink: 0; }
    .search-input {
      flex: 1; background: transparent; border: 0; outline: 0;
      color: white; font: inherit; font-size: 0.95rem; min-width: 0;
    }
    .search-input::placeholder { color: rgba(255,255,255,0.28); }
    .search-clear {
      display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border: 0;
      background: rgba(255,255,255,0.1); border-radius: 50%;
      cursor: pointer; color: rgba(255,255,255,0.6); flex-shrink: 0;
      transition: background 0.15s;
    }
    .search-clear:hover { background: rgba(255,255,255,0.18); }

    .hero-stats {
      display: flex; align-items: center; gap: 20px;
    }
    .stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .stat-n { font-size: 1.4rem; font-weight: 900; color: white; line-height: 1; }
    .stat-l { font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em; }
    .stat-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.12); }

    /* ── BODY ── */
    .body { padding: 36px 0 80px; }
    .layout {
      max-width: 1320px; margin: 0 auto; padding: 0 24px;
      display: grid; grid-template-columns: 220px 1fr;
      gap: 40px; align-items: start;
    }

    /* ── SIDEBAR ── */
    .sidebar {
      position: sticky; top: 88px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .sidebar-reset {
      display: flex; align-items: center; justify-content: space-between;
      background: #fffbeb; border: 1px solid #fde68a;
      border-radius: 12px; padding: 10px 14px; margin-bottom: 8px;
    }
    .reset-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.78rem; font-weight: 700; color: #92400e;
    }
    .reset-btn {
      font: inherit; font-size: 0.75rem; font-weight: 700;
      color: #d97706; background: none; border: 0; cursor: pointer;
      text-decoration: underline; padding: 0;
    }

    .filter-section {
      background: white; border: 1px solid #f0f1f3;
      border-radius: 14px; overflow: hidden;
    }
    .filter-title {
      font-size: 0.68rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: #9ca3af; padding: 14px 16px 10px;
      border-bottom: 1px solid #f3f4f6;
    }
    .filter-list {
      display: flex; flex-direction: column;
      padding: 6px;
    }
    .filter-item {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; padding: 8px 10px;
      border: 0; background: transparent;
      border-radius: 9px; font: inherit; font-size: 0.84rem;
      color: #4b5563; cursor: pointer; text-align: left;
      transition: background 0.12s, color 0.12s;
    }
    .filter-item:hover { background: #f9fafb; color: #111; }
    .filter-item.active { background: #111; color: white; font-weight: 600; }
    .item-label { display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0; }
    .item-emoji { font-size: 0.95em; }
    .item-count {
      font-size: 0.72rem; font-weight: 600;
      background: rgba(0,0,0,0.06);
      padding: 1px 7px; border-radius: 999px;
      flex-shrink: 0; color: inherit;
    }
    .filter-item.active .item-count { background: rgba(255,255,255,0.18); }

    /* theme item: uses its own color when active */
    .theme-item.active {
      background: var(--tc, #6366f1);
      color: white;
    }
    .theme-item:not(.active):hover {
      background: #f9fafb;
      color: #111;
    }

    .show-more-btn {
      margin: 4px 6px 6px;
      padding: 6px 10px;
      border: 1.5px dashed #e5e7eb;
      border-radius: 8px; background: transparent;
      font: inherit; font-size: 0.78rem; font-weight: 600;
      color: #6b7280; cursor: pointer;
      text-align: center; transition: 0.15s;
    }
    .show-more-btn:hover { border-color: #9ca3af; color: #374151; background: #f9fafb; }

    /* ── TOOLBAR ── */
    .products-wrap { min-width: 0; }
    .toolbar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .results { font-size: 0.88rem; color: #6b7280; margin: 0; }
    .results strong { color: #111; font-weight: 800; }
    .results em { color: #111; font-style: normal; font-weight: 600; }
    .theme-pill {
      display: inline-block; margin-left: 6px;
      background: #fef9c3; color: #92400e;
      font-size: 0.73rem; font-weight: 700;
      padding: 2px 8px; border-radius: 999px;
    }
    .sort-sel {
      padding: 8px 12px; border: 1.5px solid #e5e7eb;
      border-radius: 10px; font: inherit; font-size: 0.84rem;
      background: white; cursor: pointer; color: #374151;
    }

    /* ── GRID ── */
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

    /* ── SKELETON ── */
    .skeleton-card {
      border-radius: 16px; overflow: hidden;
      background: white; border: 1.5px solid #f3f4f6;
    }
    .sk-img {
      height: 220px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
      background-size: 200%; animation: shimmer 1.5s infinite;
    }
    .sk-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .sk-line { height: 12px; border-radius: 6px; background: #f3f4f6; animation: shimmer 1.5s infinite; }
    .sk-line.w80 { width: 80%; }
    .sk-line.w50 { width: 50%; }
    .sk-line.w30 { width: 30%; }
    @keyframes shimmer {
      0%   { background-position: -200%; }
      100% { background-position:  200%; }
    }

    .promo-price-pub { color: #dc2626; font-weight: 900; }
    .original-price-pub { font-size: 0.75rem; color: #9ca3af; text-decoration: line-through; font-weight: 500; }

    /* Promo sidebar filter */
    .promo-filter-section { border-color: #fecaca; }
    .promo-filter-btn { color: #b91c1c !important; }
    .promo-filter-btn:hover { background: #fff1f2 !important; color: #991b1b !important; }
    .promo-filter-btn.active { background: #dc2626 !important; color: white !important; }
    .promo-count-pill {
      background: rgba(220,38,38,0.12); color: #dc2626;
      font-size: 0.72rem; font-weight: 800;
      padding: 1px 7px; border-radius: 999px; flex-shrink: 0;
    }
    .promo-filter-btn.active .promo-count-pill { background: rgba(255,255,255,0.25); color: white; }

    /* Promo pill in toolbar */
    .promo-active-pill {
      display: inline-block; margin-left: 6px;
      background: #fef2f2; color: #dc2626;
      font-size: 0.73rem; font-weight: 700;
      padding: 2px 8px; border-radius: 999px;
      border: 1px solid #fecaca;
    }
    /* ── EMPTY ── */
    .empty {
      text-align: center; padding: 80px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-icon { font-size: 3.5rem; }
    .empty h3 { font-size: 1.25rem; font-weight: 800; color: #111; margin: 0; }
    .empty p { color: #6b7280; margin: 0; font-size: 0.9rem; }
    .empty-reset {
      margin-top: 8px; padding: 10px 24px;
      border: 2px solid #111; border-radius: 10px;
      background: white; font: inherit; font-weight: 700; font-size: 0.88rem;
      cursor: pointer; transition: 0.15s;
    }
    .empty-reset:hover { background: #111; color: white; }

    /* ── MODAL ── */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 300;
      display: flex; align-items: center; justify-content: center; padding: 20px;
      backdrop-filter: blur(4px);
    }
    .modal {
      background: white; border-radius: 24px;
      width: min(500px, 100%); overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.25);
    }
    .modal-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 28px 20px; border-bottom: 1px solid #f3f4f6;
    }
    .modal-head h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: #111; }
    .modal-close {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: 0; background: #f3f4f6;
      border-radius: 8px; cursor: pointer; color: #6b7280; transition: background 0.15s;
    }
    .modal-close:hover { background: #e5e7eb; }
    .modal-product {
      display: flex; align-items: center; gap: 16px;
      padding: 18px 28px; background: #f9fafb; border-bottom: 1px solid #f3f4f6;
    }
    .modal-product-img { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: #e5e7eb; }
    .modal-product-img img { width: 100%; height: 100%; object-fit: cover; }
    .modal-product-name { font-weight: 700; color: #111; font-size: 0.9rem; margin-bottom: 3px; }
    .modal-product-price { font-size: 0.82rem; color: #6b7280; }
    .modal-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
    .modal-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin: 0; }
    .modal-loading { color: #6b7280; font-size: 0.9rem; text-align: center; padding: 20px 0; }
    .modal-empty { text-align: center; padding: 12px 0; display: flex; flex-direction: column; gap: 14px; align-items: center; }
    .modal-empty p { color: #6b7280; margin: 0; font-size: 0.9rem; }
    .btn-create-event { background: #111; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.88rem; }
    .wishlist-choices { display: flex; flex-direction: column; gap: 8px; }
    .choice-btn {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 14px 18px; border: 1.5px solid #e5e7eb; border-radius: 12px;
      background: white; font: inherit; cursor: pointer; text-align: left;
      transition: 0.15s; color: #374151;
    }
    .choice-btn:hover:not(:disabled):not(.added) { border-color: #111; background: #f9fafb; }
    .choice-btn.added { border-color: #bbf7d0; background: #f0fdf4; cursor: default; }
    .choice-btn:disabled:not(.added) { opacity: 0.5; cursor: not-allowed; }
    .choice-info { display: flex; flex-direction: column; gap: 2px; }
    .choice-title { font-size: 0.9rem; font-weight: 600; color: #111; }
    .choice-done { font-size: 0.75rem; color: #16a34a; font-weight: 600; }

    /* ── RESPONSIVE ── */
    @media (max-width: 1100px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar {
        position: static;
        display: grid; grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .sidebar-reset { grid-column: 1 / -1; }
    }
    @media (max-width: 600px) {
      .hero { padding: 56px 20px 48px; }
      .hero-inner h1 { font-size: 2.2rem; }
      .layout { padding: 0 16px; }
      .body { padding: 24px 0 60px; }
      .sidebar { grid-template-columns: 1fr; }
      .grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .card-img-wrap { height: 160px; }
    }
    @media (max-width: 400px) {
      .grid { grid-template-columns: 1fr; }
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

  readonly LIMIT = SHOW_LIMIT;

  readonly products = signal<CatalogProduct[]>([]);
  readonly categories = signal<CatalogCategory[]>([]);
  readonly themes = signal<CatalogTheme[]>([]);
  readonly loading = signal(false);
  readonly submittingId = signal<number | null>(null);
  readonly showModal = signal(false);
  readonly wishlistLoading = signal(false);
  readonly wishlistChoices = signal<WishlistChoice[]>([]);
  readonly selectedProduct = signal<CatalogProduct | null>(null);

  readonly activeCategoryId = signal<number | null>(null);
  readonly activeThemeId = signal<number | null>(null);
  readonly priceRange = signal<string | null>(null);
  readonly search = signal('');
  sortBy = signal('default');

  readonly showPromoOnly = signal(false);
  readonly themesExpanded = signal(false);
  readonly categoriesExpanded = signal(false);

  readonly promoCount = computed(() => this.products().filter(p => this.isPromoActive(p)).length);

  readonly activeThemes = computed(() => this.themes().filter(t => t.isActive));

  readonly visibleThemes = computed(() =>
    this.themesExpanded() ? this.activeThemes() : this.activeThemes().slice(0, SHOW_LIMIT)
  );

  readonly visibleCategories = computed(() =>
    this.categoriesExpanded() ? this.categories() : this.categories().slice(0, SHOW_LIMIT)
  );

  readonly hasActiveFilters = computed(() =>
    this.activeCategoryId() !== null ||
    this.activeThemeId() !== null ||
    this.priceRange() !== null ||
    this.showPromoOnly() ||
    this.search().trim() !== ''
  );

  readonly filteredProducts = computed(() => {
    let items = this.products();
    const term = this.search().trim().toLowerCase();
    const catId = this.activeCategoryId();
    const themeId = this.activeThemeId();
    const range = this.priceRange();

    if (term) {
      items = items.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.brand ?? '').toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term) ||
        (p.category?.name ?? '').toLowerCase().includes(term),
      );
    }
    if (this.showPromoOnly()) items = items.filter(p => this.isPromoActive(p));
    if (catId !== null) items = items.filter(p => p.category?.id === catId);
    if (themeId !== null) items = items.filter(p => p.themes?.some(t => t.id === themeId));
    if (range) {
      if (range === '0-50000')         items = items.filter(p => this.effectivePrice(p) < 50000);
      else if (range === '50000-200000')   items = items.filter(p => this.effectivePrice(p) >= 50000  && this.effectivePrice(p) <= 200000);
      else if (range === '200000-500000')  items = items.filter(p => this.effectivePrice(p) > 200000 && this.effectivePrice(p) <= 500000);
      else if (range === '500000+')    items = items.filter(p => this.effectivePrice(p) > 500000);
    }
    return items;
  });

  readonly sortedProducts = computed(() => {
    const items = [...this.filteredProducts()];
    switch (this.sortBy()) {
      case 'price-asc':  return items.sort((a, b) => this.effectivePrice(a) - this.effectivePrice(b));
      case 'price-desc': return items.sort((a, b) => this.effectivePrice(b) - this.effectivePrice(a));
      case 'name':       return items.sort((a, b) => a.name.localeCompare(b.name));
      default:           return items;
    }
  });

  readonly activeCategoryName = computed(() => {
    const id = this.activeCategoryId();
    return id !== null ? (this.categories().find(c => c.id === id)?.name ?? '') : '';
  });

  readonly activeThemeName = computed(() => {
    const id = this.activeThemeId();
    return id !== null ? (this.activeThemes().find(t => t.id === id)?.name ?? '') : '';
  });

  ngOnInit(): void {
    this.catalogService.getThemes(true).subscribe({ next: t => this.themes.set(t) });

    this.loading.set(true);
    this.catalogService.getProducts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: prods => {
          this.products.set(prods.filter(p => p.status === 'ACTIVE'));
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

  getThemeCount(themeId: number): number {
    return this.products().filter(p => p.themes?.some(t => t.id === themeId)).length;
  }

  resetFilters(): void {
    this.search.set('');
    this.activeCategoryId.set(null);
    this.activeThemeId.set(null);
    this.priceRange.set(null);
    this.showPromoOnly.set(false);
    this.sortBy.set('default');
  }

  getDiscountPct(p: CatalogProduct): number {
    const normal = Number(p.sellingPrice ?? p.estimatedPrice ?? 0);
    if (!normal) return 0;
    return Math.round(((normal - Number(p.promoPrice!)) / normal) * 100);
  }

  resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiBaseUrl.replace('/api', '')}${url}`;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  isPromoActive(p: CatalogProduct): boolean {
    if (!p.promoPrice || !p.promoEndsAt) return false;
    return new Date(p.promoEndsAt) > new Date();
  }

  effectivePrice(p: CatalogProduct): number {
    if (this.isPromoActive(p)) return Number(p.promoPrice!);
    return Number(p.sellingPrice ?? p.estimatedPrice ?? 0);
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
      next: dashboard => {
        const events = dashboard.organizedEvents ?? [];
        if (events.length === 0) { this.wishlistLoading.set(false); return; }
        let remaining = events.length;
        const choices: WishlistChoice[] = [];
        events.forEach((e) => {
          this.eventsService.getEventWishlist(e.id).subscribe({
            next: wl => choices.push({
              wishlistId: 0, eventId: e.id, eventTitle: e.title,
              existingNames: (wl.items ?? []).map((item) => item.name.trim().toLowerCase()),
            }),
            error: () => choices.push({ wishlistId: 0, eventId: e.id, eventTitle: e.title, existingNames: [] }),
            complete: () => { if (--remaining === 0) { this.wishlistChoices.set(choices); this.wishlistLoading.set(false); } },
          });
        });
      },
      error: () => { this.wishlistLoading.set(false); this.toast.error('Impossible de charger vos événements.'); },
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
    this.eventsService.getMyEventView(choice.eventId).subscribe({
      next: view => {
        const wishlistId = view.event.wishlistId;
        if (!wishlistId) { this.submittingId.set(null); this.toast.error('Wishlist introuvable.'); return; }
        if (!product.sellingPrice) {
          this.submittingId.set(null);
          this.toast.error("Ce produit n'a pas encore de prix de vente défini.");
          return;
        }
        this.wishlistItemService.createWishlistItem({
          wishlistId, name: product.name,
          price: product.sellingPrice, quantity: 1,
          imageUrl: product.mainImageUrl ?? undefined,
          catalogProductId: product.id,
        }).subscribe({
          next: () => {
            this.submittingId.set(null);
            this.showModal.set(false);
            this.toast.success(`"${product.name}" ajouté à votre wishlist !`);
            this.loadWishlists();
            this.wishlistDrawer.notifyAdded(choice.eventId);
          },
          error: (e: unknown) => {
            this.submittingId.set(null);
            this.toast.error(this.extractErrorMessage(e, "Erreur lors de l'ajout."));
          },
        });
      },
      error: () => { this.submittingId.set(null); this.toast.error('Impossible de récupérer la wishlist.'); },
    });
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
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
}
