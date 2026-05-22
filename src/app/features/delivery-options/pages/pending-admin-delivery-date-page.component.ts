import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DeliveryOptionsService } from '../services/delivery-options.service';
import { PendingAdminDeliveryRow } from '../models/delivery-option.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pending-admin-delivery-date-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Dates de livraison à définir</h1>
          <p class="subtitle">
            @if (!loading()) {
              {{ items().length }} item(s) en attente — aucune règle ne couvrait leur date de financement
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
          <lucide-icon name="calendar-check" [size]="48" color="#86efac" [strokeWidth]="1.7" />
          <p>Aucune date à définir. Tout est à jour !</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Événement</th>
                <th>Financé le</th>
                <th>Date de livraison</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of items(); track row.wishlistItemId) {
                <tr>
                  <td>
                    <span class="item-name">{{ row.itemName }}</span>
                    <span class="item-id">#{{ row.wishlistItemId }}</span>
                  </td>
                  <td>
                    <span class="event-title">{{ row.eventTitle }}</span>
                    <span class="event-id">#{{ row.eventId }}</span>
                  </td>
                  <td>
                    @if (row.fundedAt) {
                      <span class="date-funded">{{ row.fundedAt | date:'dd/MM/yyyy' }}</span>
                    } @else {
                      <span class="na">—</span>
                    }
                  </td>
                  <td>
                    <input
                      type="date"
                      class="date-input"
                      [(ngModel)]="dateInputs()[row.wishlistItemId]"
                      (ngModelChange)="onDateChange(row.wishlistItemId, $event)"
                      [min]="today"
                    />
                  </td>
                  <td>
                    <button
                      class="btn-save"
                      (click)="save(row)"
                      [disabled]="!dateInputs()[row.wishlistItemId] || saving() === row.wishlistItemId"
                    >
                      @if (saving() === row.wishlistItemId) {
                        <span class="btn-spinner"></span>
                      } @else {
                        <lucide-icon name="check" [size]="14" color="currentColor" [strokeWidth]="2" />
                      }
                      Confirmer
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
    .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 80px 20px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 16px; font-size: 1rem; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #fffbeb; }
    th { padding: 12px 16px; text-align: left; font-size: 0.8rem; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #fde68a; }
    td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tr:last-child td { border-bottom: 0; }
    tr:hover td { background: #fafafa; }

    .item-name { display: block; font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .item-id { font-size: 0.78rem; color: #94a3b8; }
    .event-title { display: block; font-weight: 600; color: #334155; font-size: 0.9rem; }
    .event-id { font-size: 0.78rem; color: #94a3b8; }
    .date-funded { font-size: 0.875rem; color: #475569; }
    .na { color: #cbd5e1; }

    .date-input { border: 1px solid #d1d5db; border-radius: 7px; padding: 7px 10px; font-size: 0.875rem; color: #1e293b; outline: none; transition: border-color 0.15s; }
    .date-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px #fef3c7; }

    .btn-save { display: flex; align-items: center; gap: 5px; background: #f59e0b; border: 0; padding: 7px 14px; border-radius: 7px; font-size: 0.82rem; font-weight: 700; color: white; cursor: pointer; white-space: nowrap; transition: 0.15s; }
    .btn-save:hover:not(:disabled) { background: #d97706; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
  `],
})
export class PendingAdminDeliveryDatePageComponent implements OnInit {
  private readonly svc = inject(DeliveryOptionsService);
  private readonly toast = inject(ToastService);

  readonly items = signal<PendingAdminDeliveryRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal<number | null>(null);
  readonly dateInputs = signal<Record<number, string>>({});
  readonly today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getPendingAdminDeliveryDates().subscribe({
      next: (items) => {
        this.items.set(items);
        const inputs: Record<number, string> = {};
        items.forEach((i) => (inputs[i.wishlistItemId] = ''));
        this.dateInputs.set(inputs);
        this.loading.set(false);
      },
      error: () => { this.toast.error('Erreur lors du chargement'); this.loading.set(false); },
    });
  }

  onDateChange(wishlistItemId: number, value: string): void {
    this.dateInputs.update((prev) => ({ ...prev, [wishlistItemId]: value }));
  }

  save(row: PendingAdminDeliveryRow): void {
    const date = this.dateInputs()[row.wishlistItemId];
    if (!date) return;

    this.saving.set(row.wishlistItemId);
    this.svc.setAdminDeliveryDate(row.wishlistItemId, date).subscribe({
      next: () => {
        this.toast.success(`Date de livraison définie pour "${row.itemName}"`);
        this.items.update((prev) => prev.filter((i) => i.wishlistItemId !== row.wishlistItemId));
        this.saving.set(null);
      },
      error: () => { this.toast.error('Erreur lors de la sauvegarde'); this.saving.set(null); },
    });
  }
}
