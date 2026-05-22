import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeliveryOptionsService } from '../services/delivery-options.service';
import {
  CatalogDeliveryOption,
  CreateCatalogDeliveryOptionPayload,
  DeliveryOptionType,
  DELIVERY_OPTION_TYPE_LABELS,
} from '../models/delivery-option.model';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

const OPTION_TYPES: DeliveryOptionType[] = [
  'GIFT_WRAPPING',
  'PERSONAL_MESSAGE',
  'HOME_DELIVERY',
  'SPECIAL_INSTRUCTIONS',
  'CUSTOM',
];

@Component({
  selector: 'app-delivery-options-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Options de livraison</h1>
          <p class="subtitle">
            {{ activeCount() }} actives · {{ inactiveCount() }} inactives
          </p>
        </div>
        <div class="hrow">
          <label class="toggle-label">
            <input type="checkbox" [(ngModel)]="showInactive" (change)="load()" />
            Afficher les inactives
          </label>
          <button class="btn-primary" (click)="openCreate()">+ Nouvelle option</button>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else if (options().length === 0) {
        <div class="empty-state">
          <p>Aucune option de livraison configurée.</p>
          <button class="btn-primary" (click)="openCreate()">Créer la première option</button>
        </div>
      } @else {
        <div class="options-grid">
          @for (opt of options(); track opt.id) {
            <div class="option-card" [class.inactive]="!opt.isActive">
              <div class="card-top">
                <span class="type-badge">{{ typeLabel(opt.type) }}</span>
                <div class="card-actions">
                  <button class="btn-icon" title="Modifier" (click)="openEdit(opt)">
                    <lucide-icon name="pencil" [size]="15" color="currentColor" [strokeWidth]="1.8" />
                  </button>
                  <button class="btn-icon danger" title="Désactiver" (click)="deleteOption(opt)" [disabled]="!opt.isActive">
                    <lucide-icon name="trash-2" [size]="15" color="currentColor" [strokeWidth]="1.8" />
                  </button>
                </div>
              </div>
              <div class="card-label">{{ opt.label }}</div>
              @if (opt.description) {
                <div class="card-desc">{{ opt.description }}</div>
              }
              <div class="card-meta">
                <span class="price-tag" [class.free]="opt.price === 0">
                  {{ opt.price === 0 ? 'Gratuit' : (opt.price | number:'1.0-0') + ' ' + opt.currencyCode }}
                </span>
                @if (opt.hasTextInput) {
                  <span class="tag-info">Saisie texte</span>
                }
                @if (!opt.isActive) {
                  <span class="tag-inactive">Inactif</span>
                }
              </div>
              <div class="card-order">Ordre: {{ opt.sortOrder }}</div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal créer / modifier -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Modifier l\'option' : 'Nouvelle option de livraison' }}</h2>
            <button class="btn-close" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body">
            @if (!editingId()) {
              <div class="field">
                <label>Type *</label>
                <select [(ngModel)]="form.type">
                  @for (t of optionTypes; track t) {
                    <option [value]="t">{{ typeLabel(t) }}</option>
                  }
                </select>
              </div>
            }

            <div class="field">
              <label>Libellé *</label>
              <input type="text" [(ngModel)]="form.label" placeholder="Ex: Emballage cadeau premium" maxlength="100" />
            </div>

            <div class="field">
              <label>Description</label>
              <textarea [(ngModel)]="form.description" placeholder="Description affichée au client" rows="2" maxlength="300"></textarea>
            </div>

            <div class="field-row">
              <div class="field">
                <label>Prix (XOF) *</label>
                <input type="number" [(ngModel)]="form.price" min="0" step="100" placeholder="0 = gratuit" />
              </div>
              <div class="field">
                <label>Ordre d'affichage</label>
                <input type="number" [(ngModel)]="form.sortOrder" min="0" step="1" />
              </div>
            </div>

            <div class="field-check">
              <input type="checkbox" id="hasTextInput" [(ngModel)]="form.hasTextInput" />
              <label for="hasTextInput">Nécessite une saisie texte (message, adresse, etc.)</label>
            </div>

            @if (form.hasTextInput) {
              <div class="field">
                <label>Placeholder du champ texte</label>
                <input type="text" [(ngModel)]="form.textInputPlaceholder" placeholder="Ex: Entrez votre message ici..." maxlength="150" />
              </div>
            }

            @if (editingId()) {
              <div class="field-check">
                <input type="checkbox" id="isActive" [(ngModel)]="form.isActive" />
                <label for="isActive">Option active</label>
              </div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn-primary" (click)="saveOption()" [disabled]="saving()">
              {{ saving() ? 'Enregistrement...' : (editingId() ? 'Mettre à jour' : 'Créer') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 32px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin: 0; }
    .hrow { display: flex; align-items: center; gap: 12px; }
    .toggle-label { display: flex; align-items: center; gap: 6px; font-size: 0.88rem; color: #64748b; cursor: pointer; }
    .toggle-label input { cursor: pointer; }

    .btn-primary { background: #6366f1; color: white; border: 0; padding: 9px 18px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: white; color: #374151; border: 1px solid #e5e7eb; padding: 9px 18px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
    .btn-secondary:hover { background: #f9fafb; }

    .spinner-wrap { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 16px; }

    .options-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .option-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; gap: 8px; transition: 0.15s; }
    .option-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .option-card.inactive { opacity: 0.55; background: #f9fafb; }

    .card-top { display: flex; align-items: center; justify-content: space-between; }
    .type-badge { background: #ede9fe; color: #7c3aed; font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
    .card-actions { display: flex; gap: 6px; }
    .btn-icon { background: #f1f5f9; border: 0; width: 30px; height: 30px; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: 0.15s; }
    .btn-icon:hover { background: #e2e8f0; color: #334155; }
    .btn-icon.danger:hover { background: #fee2e2; color: #ef4444; }
    .btn-icon:disabled { opacity: 0.35; cursor: not-allowed; }

    .card-label { font-weight: 700; font-size: 1rem; color: #1e293b; }
    .card-desc { font-size: 0.85rem; color: #64748b; line-height: 1.4; }
    .card-meta { display: flex; flex-wrap: wrap; gap: 6px; }
    .price-tag { background: #dcfce7; color: #15803d; font-size: 0.8rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
    .price-tag.free { background: #f0fdf4; color: #86efac; }
    .tag-info { background: #dbeafe; color: #1d4ed8; font-size: 0.78rem; font-weight: 600; padding: 3px 8px; border-radius: 999px; }
    .tag-inactive { background: #f3f4f6; color: #9ca3af; font-size: 0.78rem; font-weight: 600; padding: 3px 8px; border-radius: 999px; }
    .card-order { font-size: 0.75rem; color: #94a3b8; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal { background: white; border-radius: 16px; width: 100%; max-width: 520px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 28px 16px; border-bottom: 1px solid #f1f5f9; }
    .modal-header h2 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
    .btn-close { background: none; border: 0; font-size: 1.1rem; cursor: pointer; color: #94a3b8; }
    .modal-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer { padding: 16px 28px 24px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #f1f5f9; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .field input, .field select, .field textarea { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; font-size: 0.9rem; font-family: inherit; outline: none; transition: 0.15s; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field-check { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: #374151; cursor: pointer; }
    .field-check input { cursor: pointer; }
  `],
})
export class DeliveryOptionsAdminPageComponent implements OnInit {
  private readonly svc = inject(DeliveryOptionsService);
  private readonly toast = inject(ToastService);

  readonly options = signal<CatalogDeliveryOption[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showModal = signal(false);
  readonly editingId = signal<number | null>(null);

  showInactive = false;
  readonly optionTypes = OPTION_TYPES;

  form: {
    type: DeliveryOptionType;
    label: string;
    description: string;
    price: number;
    hasTextInput: boolean;
    textInputPlaceholder: string;
    isActive: boolean;
    sortOrder: number;
  } = this.defaultForm();

  readonly activeCount = computed(() => this.options().filter((o) => o.isActive).length);
  readonly inactiveCount = computed(() => this.options().filter((o) => !o.isActive).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getCatalogOptions(this.showInactive).subscribe({
      next: (items) => { this.options.set(items); this.loading.set(false); },
      error: () => { this.toast.error('Erreur chargement des options'); this.loading.set(false); },
    });
  }

  typeLabel(type: DeliveryOptionType): string {
    return DELIVERY_OPTION_TYPE_LABELS[type] ?? type;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = this.defaultForm();
    this.showModal.set(true);
  }

  openEdit(opt: CatalogDeliveryOption): void {
    this.editingId.set(opt.id);
    this.form = {
      type: opt.type,
      label: opt.label,
      description: opt.description ?? '',
      price: opt.price,
      hasTextInput: opt.hasTextInput,
      textInputPlaceholder: opt.textInputPlaceholder ?? '',
      isActive: opt.isActive,
      sortOrder: opt.sortOrder,
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveOption(): void {
    if (!this.form.label.trim()) {
      this.toast.error('Le libellé est requis');
      return;
    }
    this.saving.set(true);
    const id = this.editingId();

    if (id) {
      this.svc.updateCatalogOption(id, {
        label: this.form.label.trim(),
        description: this.form.description.trim() || undefined,
        price: this.form.price,
        hasTextInput: this.form.hasTextInput,
        textInputPlaceholder: this.form.hasTextInput ? this.form.textInputPlaceholder.trim() || undefined : undefined,
        isActive: this.form.isActive,
        sortOrder: this.form.sortOrder,
      }).subscribe({
        next: () => { this.toast.success('Option mise à jour'); this.saving.set(false); this.closeModal(); this.load(); },
        error: () => { this.toast.error('Erreur lors de la mise à jour'); this.saving.set(false); },
      });
    } else {
      const payload: CreateCatalogDeliveryOptionPayload = {
        type: this.form.type,
        label: this.form.label.trim(),
        description: this.form.description.trim() || undefined,
        price: this.form.price,
        hasTextInput: this.form.hasTextInput,
        textInputPlaceholder: this.form.hasTextInput ? this.form.textInputPlaceholder.trim() || undefined : undefined,
        sortOrder: this.form.sortOrder,
      };
      this.svc.createCatalogOption(payload).subscribe({
        next: () => { this.toast.success('Option créée'); this.saving.set(false); this.closeModal(); this.load(); },
        error: () => { this.toast.error('Erreur lors de la création'); this.saving.set(false); },
      });
    }
  }

  deleteOption(opt: CatalogDeliveryOption): void {
    if (!confirm(`Désactiver "${opt.label}" ?`)) return;
    this.svc.deleteCatalogOption(opt.id).subscribe({
      next: () => { this.toast.success('Option désactivée'); this.load(); },
      error: () => this.toast.error('Erreur lors de la désactivation'),
    });
  }

  private defaultForm() {
    return {
      type: 'GIFT_WRAPPING' as DeliveryOptionType,
      label: '',
      description: '',
      price: 0,
      hasTextInput: false,
      textInputPlaceholder: '',
      isActive: true,
      sortOrder: 0,
    };
  }
}
