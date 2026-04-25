import { Injectable, inject, signal, computed } from '@angular/core';
import { EventsService } from '../../events/services/events.service';
import { EventWishlistItem } from '../../events/models/event-wishlist.model';
import { DashboardService, DashboardEventItem } from '../../account/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface WishlistDrawerEvent {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  items: EventWishlistItem[];
  totalItems: number;
  lastAddedAt?: number; // timestamp pour trier
}

@Injectable({ providedIn: 'root' })
export class WishlistDrawerService {
  private readonly eventsService = inject(EventsService);
  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);

  readonly isOpen = signal(false);
  readonly loading = signal(false);
  readonly events = signal<WishlistDrawerEvent[]>([]);
  readonly lastAddedEventId = signal<number | null>(null);

  readonly totalItems = computed(() =>
    this.events().reduce((sum, e) => sum + e.totalItems, 0)
  );

  open(): void {
    this.isOpen.set(true);
    this.load();
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  /** Appelé après un ajout — marque l'événement comme "dernier ajouté" et recharge */
  notifyAdded(eventId: number): void {
    this.lastAddedEventId.set(eventId);
    this.load();
  }

  load(): void {
    if (!this.auth.isAuthenticated()) return;
    this.loading.set(true);

    this.dashboardService.getMyDashboard().subscribe({
      next: (dashboard) => {
        const organized = dashboard.organizedEvents ?? [];
        if (organized.length === 0) {
          this.events.set([]);
          this.loading.set(false);
          return;
        }

        const wishlistLoads = organized.map((e: DashboardEventItem) =>
          this.eventsService.getEventWishlist(e.id).pipe(
            map((wl) => ({
              eventId: e.id,
              eventTitle: e.title,
              eventDate: e.eventDate,
              items: wl.items,
              totalItems: wl.total,
            } as WishlistDrawerEvent)),
            catchError(() => of({
              eventId: e.id,
              eventTitle: e.title,
              eventDate: e.eventDate,
              items: [],
              totalItems: 0,
            } as WishlistDrawerEvent))
          )
        );

        forkJoin(wishlistLoads).subscribe({
          next: (results) => {
            // Trier : l'événement "lastAdded" en premier, puis par nb d'items desc
            const lastId = this.lastAddedEventId();
            const sorted = [...results].sort((a, b) => {
              if (a.eventId === lastId) return -1;
              if (b.eventId === lastId) return 1;
              return b.totalItems - a.totalItems;
            });
            this.events.set(sorted);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }
}