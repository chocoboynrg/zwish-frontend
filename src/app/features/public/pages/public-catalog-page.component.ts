import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { CatalogService } from '../../catalog/services/catalog.service';
import { CatalogProduct } from '../../catalog/models/catalog-product.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserWishlistItemService } from '../../account/services/user-wishlist-item.service';
import {
  EventsService,
  EventItem,
  UserEventView,
} from '../../events/services/events.service';

type WishlistChoice = {
  eventId: number;
  eventTitle: string;
  eventDate?: string | null;
  wishlistId: number;
  wishlistLabel: string;
  accessRole: 'ORGANIZER' | 'CO_ORGANIZER';
  uniqueItemsCount: number;
};

@Component({
  selector: 'app-public-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="catalog-hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Catalogue ZWish</span>
          <h1>Trouvez des idées cadeaux et ajoutez-les à vos wishlists</h1>
          <p>
            Explorez le catalogue public, découvrez des produits inspirants et
            ajoutez-les facilement à l’un de vos événements.
          </p>

          <div class="hero-stats">
            <div class="stat-card">
              <strong>{{ products().length }}</strong>
              <span>produits affichés</span>
            </div>
            <div class="stat-card">
              <strong>Wishlist</strong>
              <span>ajout direct à vos événements</span>
            </div>
            <div class="stat-card">
              <strong>ZWish</strong>
              <span>expérience simple et élégante</span>
            </div>
          </div>
        </div>

        <div class="hero-panel">
          <div class="hero-panel-card">
            <div class="hero-panel-badge">Nouveau</div>
            <h3>Ajout rapide à la wishlist</h3>
            <p>
              Connectez-vous, choisissez un événement autorisé, puis ajoutez un
              produit en quelques clics.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="catalog-page">
      <div class="container">
        <div class="toolbar">
          <div class="toolbar-left">
            <h2>Catalogue</h2>
            <p>Choisissez un produit à offrir ou à financer collectivement.</p>
          </div>

          <div class="toolbar-right">
            <input
              type="text"
              placeholder="Rechercher un produit, une marque, une catégorie..."
              [(ngModel)]="search"
              (ngModelChange)="onSearchChange()"
            />
          </div>
        </div>

        <div *ngIf="loading()" class="state-card">
          <div class="state-title">Chargement du catalogue...</div>
          <div class="state-text">Veuillez patienter quelques instants.</div>
        </div>

        <div *ngIf="!loading() && error()" class="state-card state-error">
          <div class="state-title">Oups</div>
          <div class="state-text">{{ error() }}</div>
        </div>

        <div
          *ngIf="!loading() && !error() && filteredProducts().length === 0"
          class="state-card"
        >
          <div class="state-title">Aucun produit trouvé</div>
          <div class="state-text">
            Essayez un autre mot-clé ou videz la recherche.
          </div>
        </div>

        <div
          class="catalog-grid"
          *ngIf="!loading() && !error() && filteredProducts().length > 0"
        >
          <article class="product-card" *ngFor="let product of filteredProducts()">
            <div class="product-image-wrap">
              <img [src]="getImage(product)" [alt]="product.name" />
              <span class="product-chip">
                {{ product.category?.name || 'Catalogue' }}
              </span>
            </div>

            <div class="product-body">
              <h3>{{ product.name }}</h3>

              <p class="product-description">
                {{
                  product.description ||
                    'Produit disponible dans le catalogue ZWish.'
                }}
              </p>

              <div class="product-meta">
                <span *ngIf="product.brand">{{ product.brand }}</span>
                <span *ngIf="product.slug">{{ product.slug }}</span>
              </div>

              <div class="product-footer">
                <div class="price-block">
                  <strong>
                    {{
                      product.estimatedPrice
                        | currency:(product.currencyCode || 'XOF'):'symbol':'1.0-0'
                    }}
                  </strong>
                </div>

                <button
                  type="button"
                  class="add-btn"
                  [disabled]="submittingProductId() === product.id"
                  (click)="startAddToWishlist(product)"
                >
                  {{
                    submittingProductId() === product.id
                      ? 'Ajout...'
                      : 'Ajouter à ma wishlist'
                  }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div
      class="modal-backdrop"
      *ngIf="showWishlistModal()"
      (click)="closeWishlistModal()"
    ></div>

    <section class="wishlist-modal" *ngIf="showWishlistModal()">
      <div class="wishlist-modal-card">
        <div class="wishlist-modal-header">
          <div>
            <span class="eyebrow small">Choix de la wishlist</span>
            <h3>Ajouter ce produit à un événement</h3>
            <p *ngIf="selectedProduct() as product">
              Produit sélectionné :
              <strong>{{ product.name }}</strong>
            </p>
          </div>

          <button
            type="button"
            class="icon-close"
            (click)="closeWishlistModal()"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div *ngIf="wishlistChoicesLoading()" class="state-card modal-state">
          <div class="state-title">Chargement de vos événements...</div>
          <div class="state-text">Préparation des wishlists disponibles.</div>
        </div>

        <div
          *ngIf="!wishlistChoicesLoading() && wishlistChoices().length === 0"
          class="state-card modal-state"
        >
          <div class="state-title">Aucune wishlist disponible</div>
          <div class="state-text">
            Seules les wishlists où vous êtes organisateur ou co-organisateur
            apparaissent ici.
          </div>

          <div class="modal-actions">
            <button type="button" class="secondary-btn" (click)="goToCreateEvent()">
              Créer un événement
            </button>
          </div>
        </div>

        <div
          class="wishlist-list"
          *ngIf="!wishlistChoicesLoading() && wishlistChoices().length > 0"
        >
          <button
            type="button"
            class="wishlist-item"
            *ngFor="let choice of wishlistChoices()"
            (click)="confirmAddToWishlist(choice)"
          >
            <div class="wishlist-item-main">
              <div class="wishlist-item-title">{{ choice.eventTitle }}</div>

              <div class="wishlist-item-subtitle">
                {{ choice.wishlistLabel }}
              </div>

              <div class="wishlist-item-meta">
                <span class="wishlist-pill">{{ formatRoleLabel(choice.accessRole) }}</span>
                <span class="wishlist-pill wishlist-pill-soft">
                  {{ choice.uniqueItemsCount }} produit(s) unique(s)
                </span>
              </div>
            </div>

            <div class="wishlist-item-date" *ngIf="choice.eventDate">
              {{ formatEventDate(choice.eventDate) }}
            </div>
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      background: #fffaf8;
      min-height: 100%;
    }

    .container {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .catalog-hero {
      padding: 40px 0 20px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.18), transparent 26%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.12), transparent 30%);
    }

    .hero-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 24px;
      align-items: center;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .eyebrow.small {
      margin-bottom: 8px;
      font-size: 0.82rem;
    }

    .hero-copy h1 {
      margin: 0 0 14px;
      font-size: clamp(2rem, 4vw, 3.5rem);
      line-height: 1.08;
      color: #111827;
    }

    .hero-copy p {
      margin: 0;
      color: #4b5563;
      line-height: 1.75;
      max-width: 760px;
    }

    .hero-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 22px;
    }

    .stat-card,
    .hero-panel-card,
    .state-card,
    .product-card,
    .wishlist-modal-card {
      background: white;
      border: 1px solid #f0e5df;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .stat-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .stat-card strong {
      font-size: 1.1rem;
      color: #111827;
    }

    .stat-card span {
      color: #6b7280;
      font-size: 0.92rem;
    }

    .hero-panel-card {
      padding: 26px;
    }

    .hero-panel-badge {
      display: inline-block;
      margin-bottom: 12px;
      padding: 6px 10px;
      border-radius: 999px;
      background: #111827;
      color: white;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .hero-panel-card h3 {
      margin: 0 0 8px;
      color: #111827;
    }

    .hero-panel-card p {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
    }

    .catalog-page {
      padding: 20px 0 64px;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .toolbar-left h2 {
      margin: 0 0 6px;
      color: #111827;
      font-size: 1.8rem;
    }

    .toolbar-left p {
      margin: 0;
      color: #6b7280;
    }

    .toolbar-right input {
      width: min(440px, 100%);
      min-width: 280px;
      height: 50px;
      border-radius: 16px;
      border: 1px solid #e7ddd7;
      padding: 0 16px;
      font-size: 1rem;
      outline: none;
      background: white;
    }

    .state-card {
      padding: 18px 20px;
      margin-bottom: 18px;
    }

    .state-error {
      border-color: #fecaca;
      background: #fff7f7;
    }

    .state-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .state-text {
      color: #6b7280;
      line-height: 1.6;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }

    .product-card {
      overflow: hidden;
    }

    .product-image-wrap {
      position: relative;
      height: 240px;
      background: #fff5f0;
    }

    .product-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .product-chip {
      position: absolute;
      left: 14px;
      top: 14px;
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.92);
      color: #e85d3e;
      font-size: 0.84rem;
      font-weight: 700;
      backdrop-filter: blur(10px);
    }

    .product-body {
      padding: 20px;
    }

    .product-body h3 {
      margin: 0 0 10px;
      color: #111827;
      font-size: 1.12rem;
      line-height: 1.35;
    }

    .product-description {
      margin: 0 0 14px;
      color: #6b7280;
      line-height: 1.65;
      min-height: 52px;
    }

    .product-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }

    .product-meta span {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: #f8fafc;
      color: #475569;
      font-size: 0.8rem;
      border: 1px solid #e2e8f0;
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
    }

    .price-block strong {
      font-size: 1.05rem;
      color: #111827;
    }

    .add-btn,
    .secondary-btn {
      border: none;
      border-radius: 14px;
      padding: 11px 14px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.2s ease;
    }

    .add-btn {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
    }

    .add-btn:hover,
    .secondary-btn:hover {
      transform: translateY(-1px);
    }

    .add-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .secondary-btn {
      background: #111827;
      color: white;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.45);
      z-index: 40;
    }

    .wishlist-modal {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 16px;
      z-index: 50;
    }

    .wishlist-modal-card {
      width: min(760px, 100%);
      max-height: min(82vh, 900px);
      overflow: auto;
      padding: 22px;
    }

    .wishlist-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 16px;
      margin-bottom: 16px;
    }

    .wishlist-modal-header h3 {
      margin: 0 0 6px;
      color: #111827;
      font-size: 1.5rem;
    }

    .wishlist-modal-header p {
      margin: 0;
      color: #6b7280;
      line-height: 1.6;
    }

    .icon-close {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: #f3f4f6;
      cursor: pointer;
      font-size: 1rem;
    }

    .modal-state {
      margin-bottom: 0;
    }

    .modal-actions {
      margin-top: 14px;
    }

    .wishlist-list {
      display: grid;
      gap: 12px;
    }

    .wishlist-item {
      width: 100%;
      text-align: left;
      border: 1px solid #ece4df;
      background: white;
      border-radius: 18px;
      padding: 16px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: center;
      transition: 0.2s ease;
    }

    .wishlist-item:hover {
      border-color: #ff7a59;
      background: #fffaf8;
      transform: translateY(-1px);
    }

    .wishlist-item-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .wishlist-item-subtitle {
      color: #6b7280;
      font-size: 0.94rem;
      margin-bottom: 8px;
    }

    .wishlist-item-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .wishlist-pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .wishlist-pill-soft {
      background: #f8fafc;
      color: #475569;
    }

    .wishlist-item-date {
      color: #475569;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    @media (max-width: 1100px) {
      .hero-grid,
      .catalog-grid,
      .hero-stats {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 760px) {
      .hero-grid,
      .catalog-grid,
      .hero-stats {
        grid-template-columns: 1fr;
      }

      .toolbar-right {
        width: 100%;
      }

      .toolbar-right input {
        min-width: 0;
        width: 100%;
      }

      .product-footer {
        flex-direction: column;
        align-items: stretch;
      }

      .wishlist-item {
        flex-direction: column;
        align-items: start;
      }

      .wishlist-item-date {
        white-space: normal;
      }
    }
  `],
})
export class PublicCatalogPageComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly userWishlistItemService = inject(UserWishlistItemService);
  private readonly eventsService = inject(EventsService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly products = signal<CatalogProduct[]>([]);
  readonly submittingProductId = signal<number | null>(null);

  readonly showWishlistModal = signal(false);
  readonly wishlistChoicesLoading = signal(false);
  readonly wishlistChoices = signal<WishlistChoice[]>([]);
  readonly selectedProduct = signal<CatalogProduct | null>(null);

  search = '';

  readonly filteredProducts = computed(() => {
    const term = this.search.trim().toLowerCase();
    const items = this.products();

    if (!term) {
      return items;
    }

    return items.filter((product) =>
      product.name.toLowerCase().includes(term) ||
      (product.description || '').toLowerCase().includes(term) ||
      (product.category?.name || '').toLowerCase().includes(term) ||
      (product.brand || '').toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.catalogService
      .getProducts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (products) => {
          this.products.set(products);
        },
        error: () => {
          this.error.set('Impossible de charger le catalogue pour le moment.');
        },
      });
  }

  onSearchChange(): void {}

  getImage(product: CatalogProduct): string {
    return (
      product.mainImageUrl ||
      'https://images.unsplash.com/photo-1513495972900-f31c3238990d?auto=format&fit=crop&w=1200&q=80'
    );
  }

  startAddToWishlist(product: CatalogProduct): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('Connecte-toi pour ajouter ce produit à ta wishlist.');
      this.router.navigate(['/login']);
      return;
    }

    this.selectedProduct.set(product);
    this.showWishlistModal.set(true);
    this.loadWishlistChoices();
  }

  closeWishlistModal(): void {
    this.showWishlistModal.set(false);
    this.wishlistChoices.set([]);
    this.selectedProduct.set(null);
  }

  goToCreateEvent(): void {
    this.closeWishlistModal();
    this.router.navigate(['/app/events/new']);
  }

  loadWishlistChoices(): void {
    this.wishlistChoicesLoading.set(true);
    this.wishlistChoices.set([]);

    const preferredEventId = Number(this.route.snapshot.queryParamMap.get('eventId'));

    this.eventsService.getEvents().subscribe({
      next: (events: EventItem[]) => {
        if (!events.length) {
          this.wishlistChoicesLoading.set(false);
          return;
        }

        const requests = events.map((event) =>
          this.eventsService.getMyEventView(event.id)
        );

        forkJoin(requests)
          .pipe(finalize(() => this.wishlistChoicesLoading.set(false)))
          .subscribe({
            next: (views: UserEventView[]) => {
              const choices: WishlistChoice[] = [];

              for (const view of views) {
                const accessRole = view.accessRole;

                if (
                  accessRole !== 'ORGANIZER' &&
                  accessRole !== 'CO_ORGANIZER'
                ) {
                  continue;
                }

                if (!view.event.wishlistId) {
                  continue;
                }

                const uniqueItemsCount = new Set(
                  (view.wishlist || [])
                    .map((item) => (item?.name || '').trim().toLowerCase())
                    .filter(Boolean)
                ).size;

                choices.push({
                  eventId: view.event.id,
                  eventTitle: view.event.title,
                  eventDate: view.event.eventDate,
                  wishlistId: view.event.wishlistId,
                  wishlistLabel: `Wishlist #${view.event.wishlistId}`,
                  accessRole,
                  uniqueItemsCount,
                });
              }

              choices.sort((a, b) => {
                if (preferredEventId && a.eventId === preferredEventId) return -1;
                if (preferredEventId && b.eventId === preferredEventId) return 1;

                const aDate = a.eventDate ? new Date(a.eventDate).getTime() : 0;
                const bDate = b.eventDate ? new Date(b.eventDate).getTime() : 0;
                return bDate - aDate;
              });

              this.wishlistChoices.set(choices);
            },
            error: () => {
              this.toast.error('Impossible de charger vos wishlists.');
            },
          });
      },
      error: () => {
        this.wishlistChoicesLoading.set(false);
        this.toast.error('Impossible de charger vos événements.');
      },
    });
  }

  confirmAddToWishlist(choice: WishlistChoice): void {
    const product = this.selectedProduct();

    if (!product) {
      return;
    }

    this.submittingProductId.set(product.id);

    this.userWishlistItemService
      .createWishlistItem({
        wishlistId: choice.wishlistId,
        name: product.name,
        price: product.estimatedPrice,
        quantity: 1,
        imageUrl: product.mainImageUrl ?? undefined,
      })
      .pipe(finalize(() => this.submittingProductId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success('Produit ajouté à la wishlist.');
          this.closeWishlistModal();
        },
        error: () => {
          // toast global déjà géré
        },
      });
  }

  formatRoleLabel(role: 'ORGANIZER' | 'CO_ORGANIZER'): string {
    return role === 'ORGANIZER' ? 'Organisateur' : 'Co-organisateur';
  }

  formatEventDate(value: string | null | undefined): string {
    if (!value) return '';

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}