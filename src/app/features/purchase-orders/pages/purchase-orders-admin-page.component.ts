import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/purchase-order.model';
import { ToastService } from '../../../core/services/toast.service';

const STATUS_META: Record<PurchaseOrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:   { label: 'En attente',  color: '#92400e', bg: '#fef3c7', icon: '🕐' },
  ORDERED:   { label: 'Commandé',    color: '#1d4ed8', bg: '#dbeafe', icon: '📦' },
  DELIVERED: { label: 'Livré',       color: '#166534', bg: '#dcfce7', icon: '✅' },
  CANCELLED: { label: 'Annulé',      color: '#6b7280', bg: '#f3f4f6', icon: '✕'  },
};

@Component({
  selector: 'app-purchase-orders-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Bons de commande</h1>
          <p class="subtitle">
            {{ pendingCount() }} en attente · {{ orderedCount() }} commandés · {{ deliveredCount() }} livrés
          </p>
        </div>
        <button class="btn-refresh" (click)="loadOrders()" [disabled]="loading()">
          <lucide-icon name="refresh-cw" [size]="15" color="currentColor" [strokeWidth]="1.8" [class.spinning]="loading()" />
          Actualiser
        </button>
      </div>

      <!-- Filtres -->
      <div class="filter-row">
        @for (f of filters; track f.value) {
          <button
            class="filter-btn"
            [class.active]="statusFilter() === f.value"
            (click)="statusFilter.set(f.value); loadOrders()"
          >
            {{ f.label }}
            @if (getCount(f.value) > 0) {
              <span class="fc">{{ getCount(f.value) }}</span>
            }
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          Chargement...
        </div>
      }
      @if (loadError()) {
        <div class="error-state">{{ loadError() }}</div>
      }

      @if (!loading() && !loadError()) {
        @if (filtered().length === 0) {
          <div class="empty-state">
            <lucide-icon name="package" [size]="48" color="currentColor" [strokeWidth]="1.8" style="opacity:.2" />
            <span>Aucun bon de commande{{ statusFilter() ? ' avec ce statut' : '' }}.</span>
          </div>
        } @else {
          <div class="orders-grid">
            @for (order of filtered(); track order.id) {
              <div class="order-card" [class.card-delivered]="order.status === 'DELIVERED'" [class.card-cancelled]="order.status === 'CANCELLED'">
                <!-- Header carte -->
                <div class="card-header">
                  <div class="card-id">#{{ order.id }}</div>
                  <span class="status-badge" [style.color]="statusMeta(order.status).color" [style.background]="statusMeta(order.status).bg">
                    {{ statusMeta(order.status).icon }} {{ statusMeta(order.status).label }}
                  </span>
                </div>

                <!-- Infos produit -->
                <div class="card-body">
                  <div class="item-name">{{ order.itemName }}</div>
                  <div class="item-meta">
                    <lucide-icon name="calendar" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    {{ order.event.title }}
                  </div>
                  @if (order.catalogProduct?.referenceUrl) {
                    <a [href]="order.catalogProduct!.referenceUrl" target="_blank" class="ref-link">
                      <lucide-icon name="external-link" [size]="12" color="currentColor" [strokeWidth]="1.8" />
                      Voir le produit référence
                    </a>
                  }
                </div>

                <!-- Montant -->
                <div class="card-amount">
                  <div class="amount-value">{{ order.totalAmount | number:'1.0-0' }} <span class="currency">{{ order.currencyCode }}</span></div>
                  <div class="amount-label">Montant financé · Qté {{ order.quantity }}</div>
                </div>

                <!-- Timeline -->
                <div class="card-timeline">
                  <div class="tl-item">
                    <div class="tl-dot tl-dot-done"></div>
                    <div class="tl-info">
                      <span class="tl-label">Financement complété</span>
                      <span class="tl-date">{{ order.createdAt | date:'dd/MM/yy HH:mm' }}</span>
                    </div>
                  </div>
                  <div class="tl-item" [class.tl-inactive]="!order.orderedAt">
                    <div class="tl-dot" [class.tl-dot-done]="order.orderedAt"></div>
                    <div class="tl-info">
                      <span class="tl-label">Commandé</span>
                      @if (order.orderedAt) {
                        <span class="tl-date">{{ order.orderedAt | date:'dd/MM/yy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                  <div class="tl-item" [class.tl-inactive]="!order.deliveredAt">
                    <div class="tl-dot" [class.tl-dot-done]="order.deliveredAt"></div>
                    <div class="tl-info">
                      <span class="tl-label">Livré</span>
                      @if (order.deliveredAt) {
                        <span class="tl-date">{{ order.deliveredAt | date:'dd/MM/yy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Notes admin -->
                @if (order.adminNotes) {
                  <div class="admin-notes">
                    <lucide-icon name="file-text" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    {{ order.adminNotes }}
                  </div>
                }

                <!-- Actions -->
                @if (order.status === 'PENDING' || order.status === 'ORDERED') {
                  <div class="card-actions">
                    @if (order.status === 'PENDING') {
                      <button class="btn-action btn-order" (click)="openAction(order, 'ORDERED')">
                        📦 Marquer comme commandé
                      </button>
                      <button class="btn-action btn-cancel" (click)="openAction(order, 'CANCELLED')">
                        Annuler
                      </button>
                    }
                    @if (order.status === 'ORDERED') {
                      <button class="btn-action btn-deliver" (click)="openAction(order, 'DELIVERED')">
                        ✅ Marquer comme livré
                      </button>
                      <button class="btn-action btn-cancel" (click)="openAction(order, 'CANCELLED')">
                        Annuler
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Modal confirmation action -->
    @if (actionTarget()) {
      <div class="modal-backdrop" (click)="closeAction()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">{{ actionLabel() }}</div>
            <button class="modal-close" (click)="closeAction()">✕</button>
          </div>
          <div class="modal-body">
            <div class="modal-item-name">{{ actionTarget()!.itemName }}</div>
            <label class="form-label">Note admin (optionnel)</label>
            <textarea
              class="notes-input"
              [(ngModel)]="actionNotes"
              placeholder="Ex: Commandé via Jumia, livraison prévue le 10/06…"
              rows="3"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel-modal" (click)="closeAction()" [disabled]="actionLoading()">Annuler</button>
            <button
              class="btn-confirm"
              [class.btn-confirm-danger]="actionStatus() === 'CANCELLED'"
              (click)="doAction()"
              [disabled]="actionLoading()"
            >
              @if (actionLoading()) { Traitement... } @else { Confirmer }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .subtitle { font-size: 0.88rem; color: #64748b; margin: 0; }
    .btn-refresh {
      display: flex; align-items: center; gap: 7px; padding: 9px 16px;
      border: 1.5px solid #e2e8f0; border-radius: 9px; background: white;
      color: #475569; font: inherit; font-size: 0.88rem; font-weight: 600;
      cursor: pointer; transition: 0.15s;
    }
    .btn-refresh:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
    .btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinning { animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .filter-row { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-btn {
      display: flex; align-items: center; gap: 7px; padding: 7px 14px;
      border: 1.5px solid #e2e8f0; border-radius: 20px; background: white;
      color: #475569; font: inherit; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: 0.15s;
    }
    .filter-btn:hover { border-color: #a5b4fc; color: #4338ca; }
    .filter-btn.active { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
    .fc {
      min-width: 20px; height: 20px; border-radius: 999px;
      background: #6366f1; color: white; font-size: 0.72rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; padding: 0 5px;
    }

    .loading-state { display: flex; align-items: center; gap: 12px; padding: 64px; justify-content: center; color: #64748b; font-size: 0.92rem; }
    .spinner { width: 22px; height: 22px; border: 2.5px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
    .error-state { padding: 16px 20px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; color: #991b1b; font-size: 0.9rem; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 72px 32px; color: #94a3b8; font-size: 0.9rem; background: white; border: 1.5px dashed #e2e8f0; border-radius: 14px; }

    /* Grid cartes */
    .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 18px; }

    .order-card {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 16px;
      overflow: hidden; display: flex; flex-direction: column;
      transition: box-shadow 0.15s;
    }
    .order-card:hover { box-shadow: 0 4px 20px rgba(15,23,42,0.08); }
    .card-delivered { border-color: #bbf7d0; background: #f0fdf4; }
    .card-cancelled { opacity: 0.6; }

    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; }
    .card-id { font-size: 0.75rem; font-weight: 700; color: #94a3b8; font-variant-numeric: tabular-nums; }
    .status-badge { font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; }

    .card-body { padding: 0 16px 12px; display: flex; flex-direction: column; gap: 6px; }
    .item-name { font-size: 1rem; font-weight: 800; color: #0f172a; line-height: 1.3; }
    .item-meta { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #64748b; }
    .ref-link { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: #6366f1; text-decoration: none; font-weight: 600; }
    .ref-link:hover { text-decoration: underline; }

    .card-amount {
      margin: 0 16px 12px; padding: 12px 14px;
      background: #f8faff; border: 1px solid #e0e7ff; border-radius: 10px;
    }
    .amount-value { font-size: 1.4rem; font-weight: 900; color: #0f172a; }
    .currency { font-size: 0.85rem; font-weight: 700; color: #6366f1; }
    .amount-label { font-size: 0.72rem; color: #64748b; margin-top: 2px; }

    /* Timeline */
    .card-timeline { padding: 0 16px 12px; display: flex; flex-direction: column; gap: 0; }
    .tl-item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; position: relative; }
    .tl-item:not(:last-child)::after {
      content: ''; position: absolute; left: 6px; top: 20px;
      width: 1px; height: calc(100% - 8px); background: #e2e8f0;
    }
    .tl-dot {
      width: 13px; height: 13px; border-radius: 50%; border: 2px solid #e2e8f0;
      background: white; flex-shrink: 0; margin-top: 2px;
    }
    .tl-dot-done { background: #6366f1; border-color: #6366f1; }
    .tl-inactive .tl-dot { opacity: 0.4; }
    .tl-info { display: flex; flex-direction: column; gap: 1px; }
    .tl-label { font-size: 0.78rem; font-weight: 600; color: #334155; }
    .tl-date { font-size: 0.72rem; color: #94a3b8; }
    .tl-inactive .tl-label { color: #94a3b8; }

    .admin-notes {
      margin: 0 16px 10px; display: flex; align-items: flex-start; gap: 7px;
      font-size: 0.8rem; color: #475569; padding: 9px 12px;
      background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1;
    }

    /* Actions */
    .card-actions { padding: 12px 16px; border-top: 1px solid #f1f5f9; display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; }
    .btn-action {
      flex: 1; min-width: 0; padding: 9px 12px; border: none; border-radius: 9px;
      font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: 0.12s;
    }
    .btn-order { background: #dbeafe; color: #1d4ed8; }
    .btn-order:hover { background: #bfdbfe; }
    .btn-deliver { background: #dcfce7; color: #166534; }
    .btn-deliver:hover { background: #bbf7d0; }
    .btn-cancel { background: #f1f5f9; color: #64748b; flex: 0 0 auto; padding: 9px 14px; }
    .btn-cancel:hover { background: #fee2e2; color: #991b1b; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.45); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal { background: white; border-radius: 16px; width: 460px; max-width: calc(100vw - 32px); box-shadow: 0 20px 60px rgba(15,23,42,0.18); overflow: hidden; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f1f5f9; }
    .modal-title { font-size: 1rem; font-weight: 800; color: #0f172a; }
    .modal-close { border: none; background: none; font-size: 1.1rem; color: #94a3b8; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
    .modal-close:hover { background: #f1f5f9; }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .modal-item-name { font-size: 0.9rem; font-weight: 700; color: #6366f1; padding: 9px 12px; background: #f0f1ff; border-radius: 8px; }
    .form-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .notes-input { width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 9px; font: inherit; font-size: 0.88rem; resize: vertical; box-sizing: border-box; }
    .notes-input:focus { outline: none; border-color: #6366f1; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid #f1f5f9; }
    .btn-cancel-modal { padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px; background: white; color: #475569; font: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-cancel-modal:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-confirm { padding: 9px 20px; border: none; border-radius: 9px; background: #6366f1; color: white; font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: 0.15s; }
    .btn-confirm:hover:not(:disabled) { background: #4f46e5; }
    .btn-confirm-danger { background: #ef4444; }
    .btn-confirm-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class PurchaseOrdersAdminPageComponent implements OnInit {
  private readonly service = inject(PurchaseOrdersService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly orders = signal<PurchaseOrder[]>([]);
  readonly statusFilter = signal<PurchaseOrderStatus | null>(null);

  readonly actionTarget = signal<PurchaseOrder | null>(null);
  readonly actionStatus = signal<PurchaseOrderStatus | null>(null);
  readonly actionLoading = signal(false);
  actionNotes = '';

  readonly filters: { label: string; value: PurchaseOrderStatus | null }[] = [
    { label: 'Tous', value: null },
    { label: '🕐 En attente', value: 'PENDING' },
    { label: '📦 Commandés', value: 'ORDERED' },
    { label: '✅ Livrés', value: 'DELIVERED' },
    { label: 'Annulés', value: 'CANCELLED' },
  ];

  readonly filtered = computed(() => {
    const f = this.statusFilter();
    return f ? this.orders().filter((o) => o.status === f) : this.orders();
  });

  readonly pendingCount = computed(() => this.orders().filter((o) => o.status === 'PENDING').length);
  readonly orderedCount = computed(() => this.orders().filter((o) => o.status === 'ORDERED').length);
  readonly deliveredCount = computed(() => this.orders().filter((o) => o.status === 'DELIVERED').length);

  readonly actionLabel = computed(() => {
    const s = this.actionStatus();
    if (s === 'ORDERED') return 'Confirmer la commande';
    if (s === 'DELIVERED') return 'Confirmer la livraison';
    if (s === 'CANCELLED') return 'Annuler le bon de commande';
    return '';
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.getAll().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(err?.error?.message ?? 'Erreur lors du chargement');
        this.loading.set(false);
      },
    });
  }

  getCount(status: PurchaseOrderStatus | null): number {
    if (!status) return this.orders().length;
    return this.orders().filter((o) => o.status === status).length;
  }

  statusMeta(status: PurchaseOrderStatus) {
    return STATUS_META[status];
  }

  openAction(order: PurchaseOrder, status: PurchaseOrderStatus): void {
    this.actionTarget.set(order);
    this.actionStatus.set(status);
    this.actionNotes = order.adminNotes ?? '';
  }

  closeAction(): void {
    this.actionTarget.set(null);
    this.actionStatus.set(null);
    this.actionNotes = '';
  }

  doAction(): void {
    const target = this.actionTarget();
    const status = this.actionStatus();
    if (!target || !status) return;

    this.actionLoading.set(true);
    this.service.updateStatus(target.id, { status, adminNotes: this.actionNotes || undefined }).subscribe({
      next: () => {
        const labels: Record<string, string> = {
          ORDERED: 'Commande enregistrée',
          DELIVERED: 'Livraison confirmée',
          CANCELLED: 'Bon de commande annulé',
        };
        this.toast.show('success', labels[status] ?? 'Mis à jour');
        this.closeAction();
        this.actionLoading.set(false);
        this.loadOrders();
      },
      error: (err) => {
        this.toast.show('error', err?.error?.message ?? 'Erreur');
        this.actionLoading.set(false);
      },
    });
  }
}
