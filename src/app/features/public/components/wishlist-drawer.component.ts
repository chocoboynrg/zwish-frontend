import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistDrawerService, WishlistDrawerEvent } from '../services/wishlist-drawer.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-wishlist-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Overlay -->
    <div
      class="overlay"
      *ngIf="drawer.isOpen()"
      (click)="drawer.close()"
    ></div>

    <!-- Drawer -->
    <div class="drawer" [class.open]="drawer.isOpen()">
      <div class="drawer-header">
        <div class="drawer-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Ma Wishlist
          <span class="total-badge" *ngIf="drawer.totalItems() > 0">{{ drawer.totalItems() }}</span>
        </div>
        <button class="btn-close" (click)="drawer.close()">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>

      <!-- Loading -->
      <div class="drawer-loading" *ngIf="drawer.loading()">
        <div class="loading-spinner"></div>
        <span>Chargement...</span>
      </div>

      <!-- Non connecté -->
      <div class="drawer-empty" *ngIf="!auth.isAuthenticated() && !drawer.loading()">
        <div class="empty-icon">🔒</div>
        <p>Connectez-vous pour voir votre wishlist.</p>
        <a routerLink="/login" class="btn-action" (click)="drawer.close()">Se connecter</a>
      </div>

      <!-- Vide -->
      <div class="drawer-empty" *ngIf="auth.isAuthenticated() && !drawer.loading() && drawer.events().length === 0">
        <div class="empty-icon">🎁</div>
        <p>Votre wishlist est vide. Parcourez le catalogue pour ajouter des idées cadeaux.</p>
        <a routerLink="/catalog" class="btn-action" (click)="drawer.close()">Voir le catalogue</a>
      </div>

      <!-- Liste des événements -->
      <div class="drawer-body" *ngIf="auth.isAuthenticated() && !drawer.loading() && drawer.events().length > 0">
        <div
          class="event-section"
          *ngFor="let event of drawer.events(); let first = first"
          [class.recent]="event.eventId === drawer.lastAddedEventId()"
        >
          <!-- Header événement -->
          <div class="event-head">
            <div class="event-head-left">
              <div class="event-dot" [class.dot-recent]="event.eventId === drawer.lastAddedEventId()"></div>
              <div>
                <div class="event-title">
                  {{ event.eventTitle }}
                  <span class="recent-badge" *ngIf="event.eventId === drawer.lastAddedEventId()">Récent</span>
                </div>
                <div class="event-date">{{ event.eventDate | date:'dd MMM yyyy' }}</div>
              </div>
            </div>
            <span class="item-count">{{ event.totalItems }} item{{ event.totalItems > 1 ? 's' : '' }}</span>
          </div>

          <!-- Items -->
          <div class="items-list" *ngIf="event.items.length > 0">
            <div class="wish-item" *ngFor="let item of event.items.slice(0, 5)">
              <div class="wish-img" *ngIf="item.imageUrl">
                <img [src]="item.imageUrl" [alt]="item.name" (error)="onImgError($event)" />
              </div>
              <div class="wish-img wish-img-placeholder" *ngIf="!item.imageUrl">🎁</div>
              <div class="wish-info">
                <div class="wish-name">{{ item.name }}</div>
                <div class="wish-progress-wrap">
                  <div class="wish-progress-bar">
                    <div class="wish-progress-fill" [style.width]="getPercent(item) + '%'" [class.funded]="item.fundingStatus === 'FUNDED'"></div>
                  </div>
                  <span class="wish-pct" [class.pct-funded]="item.fundingStatus === 'FUNDED'">
                    {{ item.fundingStatus === 'FUNDED' ? '✓' : getPercent(item) + '%' }}
                  </span>
                </div>
                <div class="wish-amounts">
                  <span class="wish-funded">{{ item.fundedAmount | number:'1.0-0' }}</span>
                  <span class="wish-sep">/</span>
                  <span class="wish-target">{{ item.targetAmount | number:'1.0-0' }} XOF</span>
                </div>
              </div>
              <div class="wish-status" [ngClass]="getStatusClass(item.fundingStatus)">
                {{ getStatusLabel(item.fundingStatus) }}
              </div>
            </div>

            <!-- Plus d'items -->
            <div class="more-items" *ngIf="event.items.length > 5">
              + {{ event.items.length - 5 }} autre(s) item(s)
            </div>
          </div>

          <div class="items-empty" *ngIf="event.items.length === 0">
            Aucun item dans cette wishlist.
          </div>

          <!-- Lien vers l'événement -->
          <a
            [routerLink]="['/app/events', event.eventId]"
            class="event-link"
            (click)="drawer.close()"
          >
            Voir l'événement complet →
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="drawer-footer" *ngIf="auth.isAuthenticated() && drawer.events().length > 0">
        <a routerLink="/app/events" class="btn-footer" (click)="drawer.close()">
          Tous mes événements
        </a>
        <button class="btn-refresh" (click)="drawer.load()" [disabled]="drawer.loading()">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 016-6 6 6 0 015.66 4M16 4v4h-4M16 10a6 6 0 01-6 6 6 6 0 01-5.66-4M4 16v-4h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    /* Overlay */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 299; }

    /* Drawer */
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 300;
      width: min(420px, 100vw); background: white;
      display: flex; flex-direction: column;
      box-shadow: -8px 0 40px rgba(0,0,0,0.15);
      transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .drawer.open { transform: translateX(0); }

    /* Header */
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6;
      background: #000; flex-shrink: 0;
    }
    .drawer-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 1rem; font-weight: 800; color: white;
    }
    .total-badge {
      background: #FFD700; color: #000; width: 22px; height: 22px;
      border-radius: 50%; font-size: 0.72rem; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-close {
      width: 36px; height: 36px; border: 0; border-radius: 8px;
      background: rgba(255,255,255,0.1); cursor: pointer; color: white;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-close:hover { background: rgba(255,255,255,0.2); }

    /* States */
    .drawer-loading { display: flex; align-items: center; justify-content: center; gap: 12px; flex: 1; color: #9ca3af; }
    .loading-spinner { width: 24px; height: 24px; border: 2px solid #f3f4f6; border-top-color: #111; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .drawer-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; flex: 1; padding: 32px; text-align: center; }
    .empty-icon { font-size: 3rem; }
    .drawer-empty p { color: #6b7280; font-size: 0.9rem; margin: 0; line-height: 1.6; }
    .btn-action { background: #111; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.85rem; }

    /* Body */
    .drawer-body { flex: 1; overflow-y: auto; }

    /* Event section */
    .event-section {
      border-bottom: 1px solid #f3f4f6; padding: 16px 20px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .event-section.recent { background: #fffbf0; border-left: 3px solid #FFD700; }

    .event-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .event-head-left { display: flex; align-items: flex-start; gap: 10px; }
    .event-dot { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; margin-top: 5px; flex-shrink: 0; }
    .dot-recent { background: #FFD700; }
    .event-title { font-size: 0.9rem; font-weight: 800; color: #111; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .recent-badge { background: #FFD700; color: #000; font-size: 0.65rem; font-weight: 900; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; }
    .event-date { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }
    .item-count { font-size: 0.75rem; font-weight: 700; color: #6b7280; background: #f3f4f6; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }

    /* Items */
    .items-list { display: flex; flex-direction: column; gap: 10px; }
    .wish-item { display: flex; align-items: center; gap: 10px; }
    .wish-img { width: 40px; height: 40px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f3f4f6; }
    .wish-img img { width: 100%; height: 100%; object-fit: cover; }
    .wish-img-placeholder { display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .wish-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .wish-name { font-size: 0.82rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wish-progress-wrap { display: flex; align-items: center; gap: 6px; }
    .wish-progress-bar { flex: 1; height: 3px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
    .wish-progress-fill { height: 100%; background: #FFD700; border-radius: 999px; transition: width 0.3s; }
    .wish-progress-fill.funded { background: #22c55e; }
    .wish-pct { font-size: 0.68rem; font-weight: 700; color: #9ca3af; white-space: nowrap; }
    .pct-funded { color: #22c55e; }
    .wish-amounts { display: flex; align-items: center; gap: 3px; font-size: 0.7rem; color: #9ca3af; }
    .wish-funded { color: #374151; font-weight: 600; }
    .wish-sep { color: #d1d5db; }
    .wish-status { font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
    .s-funded { background: #dcfce7; color: #166534; }
    .s-partial { background: #fef3c7; color: #92400e; }
    .s-empty { background: #f3f4f6; color: #6b7280; }

    .more-items { font-size: 0.78rem; color: #9ca3af; text-align: center; padding: 4px 0; font-style: italic; }
    .items-empty { font-size: 0.82rem; color: #9ca3af; font-style: italic; }
    .event-link { font-size: 0.8rem; font-weight: 700; color: #6b7280; text-decoration: none; display: inline-flex; align-items: center; }
    .event-link:hover { color: #111; }

    /* Footer */
    .drawer-footer {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 14px 20px; border-top: 1px solid #f3f4f6; flex-shrink: 0; background: white;
    }
    .btn-footer {
      flex: 1; text-align: center; padding: 11px 0; background: #111; color: white;
      border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.88rem;
    }
    .btn-footer:hover { background: #000; }
    .btn-refresh {
      width: 40px; height: 40px; border: 1.5px solid #e5e7eb; border-radius: 10px;
      background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #6b7280; flex-shrink: 0;
    }
    .btn-refresh:hover { background: #f9fafb; }
    .btn-refresh:disabled { opacity: 0.4; cursor: not-allowed; }
  `],
})
export class WishlistDrawerComponent {
  readonly drawer: WishlistDrawerService = inject(WishlistDrawerService);
  readonly auth: AuthService = inject(AuthService);

  getPercent(item: any): number {
    if (!item.targetAmount) return 0;
    return Math.min(100, Math.round((item.fundedAmount / item.targetAmount) * 100));
  }

  getStatusLabel(status: string): string {
    if (status === 'FUNDED') return 'Financé';
    if (status === 'PARTIALLY_FUNDED') return 'Partiel';
    return 'À financer';
  }

  getStatusClass(status: string): string {
    if (status === 'FUNDED') return 'wish-status s-funded';
    if (status === 'PARTIALLY_FUNDED') return 'wish-status s-partial';
    return 'wish-status s-empty';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}