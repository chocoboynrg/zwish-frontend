import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DeliveryOptionsService } from '../services/delivery-options.service';
import { PendingDeliverySelection } from '../models/delivery-option.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pending-delivery-selections-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Sélections de livraison en attente</h1>
          <p class="subtitle">
            @if (!loading()) {
              {{ items().length }} item(s) en attente de choix
            }
          </p>
        </div>
        <button class="btn-refresh" (click)="load()" [disabled]="loading()">
          <lucide-icon name="refresh-cw" [size]="15" color="currentColor" [strokeWidth]="1.8" />
          Rafraîchir
        </button>
      </div>

      @if (loading()) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <lucide-icon name="check-circle-2" [size]="48" color="#86efac" [strokeWidth]="1.7" />
          <p>Aucune sélection en attente. Tout est à jour !</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Événement</th>
                <th>Décideur</th>
                <th>Organisateur</th>
                <th>En attente depuis</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of items(); track row.wishlistItemId) {
                <tr>
                  <td>
                    <span class="item-name">{{ row.itemName }}</span>
                  </td>
                  <td>
                    <span class="event-title">{{ row.eventTitle }}</span>
                    <span class="event-id">#{{ row.eventId }}</span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-org]="row.deliveryDecider === 'ORGANIZER'" [class.badge-contrib]="row.deliveryDecider === 'CONTRIBUTOR'">
                      {{ row.deliveryDecider === 'ORGANIZER' ? 'Organisateur' : 'Contributeur' }}
                    </span>
                  </td>
                  <td>
                    <div class="organizer-info">
                      <span class="org-name">{{ row.organizerName }}</span>
                      <span class="org-email">{{ row.organizerEmail }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="date" [class.overdue]="isOverdue(row.pendingSince)">
                      {{ row.pendingSince | date:'dd/MM/yyyy HH:mm' }}
                      @if (isOverdue(row.pendingSince)) {
                        <span class="overdue-badge">{{ daysSince(row.pendingSince) }}j</span>
                      }
                    </span>
                  </td>
                  <td>
                    <button class="btn-view" (click)="viewItem(row.wishlistItemId)" title="Voir la page de sélection">
                      <lucide-icon name="eye" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                      Voir
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin: 0; }

    .btn-refresh { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #e5e7eb; padding: 8px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: #374151; cursor: pointer; transition: 0.15s; }
    .btn-refresh:hover { background: #f9fafb; }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

    .spinner-wrap { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 80px 20px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 16px; font-size: 1rem; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8fafc; }
    th { padding: 12px 16px; text-align: left; font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #e5e7eb; }
    td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tr:last-child td { border-bottom: 0; }
    tr:hover td { background: #fafafa; }

    .item-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .event-title { display: block; font-weight: 600; color: #334155; font-size: 0.9rem; }
    .event-id { font-size: 0.78rem; color: #94a3b8; }

    .badge { font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
    .badge-org { background: #ede9fe; color: #7c3aed; }
    .badge-contrib { background: #dbeafe; color: #1d4ed8; }

    .organizer-info { display: flex; flex-direction: column; gap: 2px; }
    .org-name { font-weight: 600; color: #334155; font-size: 0.9rem; }
    .org-email { font-size: 0.8rem; color: #64748b; }

    .date { font-size: 0.875rem; color: #475569; display: flex; align-items: center; gap: 6px; }
    .date.overdue { color: #ef4444; }
    .overdue-badge { background: #fee2e2; color: #ef4444; font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; }

    .btn-view { display: flex; align-items: center; gap: 5px; background: #f1f5f9; border: 0; padding: 6px 12px; border-radius: 7px; font-size: 0.82rem; font-weight: 600; color: #475569; cursor: pointer; white-space: nowrap; transition: 0.15s; }
    .btn-view:hover { background: #e2e8f0; color: #1e293b; }
  `],
})
export class PendingDeliverySelectionsPageComponent implements OnInit {
  private readonly svc = inject(DeliveryOptionsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly items = signal<PendingDeliverySelection[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getPendingSelections().subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => { this.toast.error('Erreur lors du chargement'); this.loading.set(false); },
    });
  }

  viewItem(wishlistItemId: number): void {
    this.router.navigate(['/app/delivery', wishlistItemId]);
  }

  isOverdue(since: string): boolean {
    return this.daysSince(since) >= 2;
  }

  daysSince(since: string): number {
    return Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000);
  }
}
