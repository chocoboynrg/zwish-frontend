import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DeliveryOptionsService } from '../services/delivery-options.service';
import { FundingDeliveryRule, FundingDeliveryRulePayload } from '../models/delivery-option.model';
import { ToastService } from '../../../core/services/toast.service';

interface RuleRow {
  fundingDeadline: string;
  deliveryDate: string;
  label: string;
}

@Component({
  selector: 'app-delivery-rules-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Règles de date de livraison</h1>
          <p class="subtitle">Item #{{ wishlistItemId() }} — Si financé avant [date limite], livrer le [date livraison]</p>
        </div>
      </div>

      @if (loading()) {
        <div class="spinner-wrap"><div class="spinner"></div></div>
      } @else {
        <div class="card">
          <div class="card-header">
            <p class="hint">
              <lucide-icon name="info" [size]="14" color="#6366f1" [strokeWidth]="1.8" />
              Les règles sont évaluées dans l'ordre. La première dont la date limite est ≥ la date de financement est appliquée.
              Si aucune ne matche, l'admin reçoit une notification pour saisir la date manuellement.
            </p>
          </div>

          <table class="rules-table">
            <thead>
              <tr>
                <th>Si financé avant le</th>
                <th>Date de livraison</th>
                <th>Libellé (optionnel)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track $index; let i = $index) {
                <tr>
                  <td>
                    <input type="date" class="date-input" [(ngModel)]="row.fundingDeadline" />
                  </td>
                  <td>
                    <input type="date" class="date-input" [(ngModel)]="row.deliveryDate" />
                  </td>
                  <td>
                    <input type="text" class="text-input" [(ngModel)]="row.label" placeholder="ex: Livraison standard" maxlength="100" />
                  </td>
                  <td>
                    <button class="btn-remove" (click)="removeRow(i)" title="Supprimer">
                      <lucide-icon name="trash-2" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                    </button>
                  </td>
                </tr>
              }
              @if (rows().length === 0) {
                <tr>
                  <td colspan="4" class="empty-row">Aucune règle définie — ajoutez-en une ci-dessous.</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="actions">
            <button class="btn-add" (click)="addRow()">
              <lucide-icon name="plus" [size]="15" color="currentColor" [strokeWidth]="2" />
              Ajouter une règle
            </button>
            <button class="btn-save" (click)="save()" [disabled]="saving() || !isValid()">
              @if (saving()) {
                <span class="btn-spinner"></span>
              } @else {
                <lucide-icon name="save" [size]="15" color="currentColor" [strokeWidth]="2" />
              }
              Enregistrer
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 28px; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin: 0; }

    .spinner-wrap { display: flex; justify-content: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .hint { display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: #6366f1; margin: 0; background: #eef2ff; padding: 10px 14px; border-radius: 8px; line-height: 1.5; }

    .rules-table { width: 100%; border-collapse: collapse; }
    thead { background: #f8fafc; }
    th { padding: 11px 16px; text-align: left; font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #e5e7eb; }
    td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tr:last-child td { border-bottom: 0; }

    .date-input { border: 1px solid #d1d5db; border-radius: 7px; padding: 7px 10px; font-size: 0.875rem; color: #1e293b; outline: none; width: 150px; }
    .date-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px #eef2ff; }
    .text-input { border: 1px solid #d1d5db; border-radius: 7px; padding: 7px 10px; font-size: 0.875rem; color: #1e293b; outline: none; width: 100%; min-width: 180px; }
    .text-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px #eef2ff; }

    .empty-row { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 32px 16px !important; }

    .btn-remove { background: none; border: none; cursor: pointer; color: #ef4444; padding: 4px; border-radius: 5px; display: flex; align-items: center; transition: 0.15s; }
    .btn-remove:hover { background: #fee2e2; }

    .actions { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid #f1f5f9; gap: 12px; }

    .btn-add { display: flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer; transition: 0.15s; }
    .btn-add:hover { background: #e2e8f0; }

    .btn-save { display: flex; align-items: center; gap: 6px; background: #6366f1; border: 0; padding: 9px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 700; color: white; cursor: pointer; transition: 0.15s; }
    .btn-save:hover:not(:disabled) { background: #4f46e5; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
  `],
})
export class DeliveryRulesPageComponent implements OnInit {
  private readonly svc = inject(DeliveryOptionsService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly wishlistItemId = signal(0);
  readonly rows = signal<RuleRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('wishlistItemId'));
    this.wishlistItemId.set(id);
    this.load(id);
  }

  private load(id: number): void {
    this.loading.set(true);
    this.svc.getDeliveryRules(id).subscribe({
      next: (rules: FundingDeliveryRule[]) => {
        this.rows.set(
          rules.map((r) => ({
            fundingDeadline: r.fundingDeadline.slice(0, 10),
            deliveryDate: r.deliveryDate.slice(0, 10),
            label: r.label ?? '',
          })),
        );
        this.loading.set(false);
      },
      error: () => { this.toast.error('Erreur lors du chargement'); this.loading.set(false); },
    });
  }

  addRow(): void {
    this.rows.update((prev) => [...prev, { fundingDeadline: '', deliveryDate: '', label: '' }]);
  }

  removeRow(index: number): void {
    this.rows.update((prev) => prev.filter((_, i) => i !== index));
  }

  isValid(): boolean {
    return this.rows().every((r) => r.fundingDeadline && r.deliveryDate);
  }

  save(): void {
    if (!this.isValid()) return;
    this.saving.set(true);

    const payload: FundingDeliveryRulePayload[] = this.rows().map((r, i) => ({
      fundingDeadline: r.fundingDeadline,
      deliveryDate: r.deliveryDate,
      label: r.label || undefined,
      sortOrder: i,
    }));

    this.svc.setDeliveryRules(this.wishlistItemId(), payload).subscribe({
      next: () => { this.toast.success('Règles enregistrées'); this.saving.set(false); },
      error: () => { this.toast.error('Erreur lors de la sauvegarde'); this.saving.set(false); },
    });
  }
}
