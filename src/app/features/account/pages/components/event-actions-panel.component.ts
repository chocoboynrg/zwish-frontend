import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-event-actions-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (showRequestBanner) {
      <div class="request-product-banner">
        <div class="rpb-left">
          <div class="rpb-icon">📦</div>
          <div>
            <div class="rpb-title">Vous ne trouvez pas le produit dans le catalogue ?</div>
            <div class="rpb-desc">Proposez-le — notre équipe l'examinera et l'ajoutera à votre wishlist.</div>
          </div>
        </div>
        <button class="btn-request-product" type="button" (click)="requestProduct.emit()">
          <lucide-icon name="plus" [size]="15" color="currentColor" [strokeWidth]="1.8" />
          Demander un produit
        </button>
      </div>
    }

    @if (isManager) {
      <div class="mgmt-section">
        <div class="mgmt-section-title">Gestion de l'événement</div>
        <div class="mgmt-card archive-mgmt-card">
          <div class="mgmt-card-left">
            <div class="mgmt-icon">📦</div>
            <div class="mgmt-text">
              <div class="mgmt-card-title">
                {{ isArchived ? 'Événement archivé' : 'Archiver cet événement' }}
              </div>
              @if (!isArchived) {
                <div class="mgmt-card-desc">
                  Conserve <strong>toutes les données</strong> (contributions, paiements,
                  participants, wishlist) mais masque l'événement de votre liste active.
                  Réversible à tout moment.
                </div>
              }
              @if (isArchived) {
                <div class="mgmt-card-desc archived-notice">
                  Cet événement est archivé. Toutes les données sont conservées — il est
                  simplement masqué de votre liste principale.
                </div>
              }
            </div>
          </div>
          @if (!isArchived) {
            <button class="btn-mgmt btn-archive" type="button" (click)="archive.emit()" [disabled]="archiveLoading">
              <lucide-icon name="package" [size]="15" color="currentColor" [strokeWidth]="1.8" />
              {{ archiveLoading ? '...' : 'Archiver' }}
            </button>
          }
          @if (isArchived) {
            <button class="btn-mgmt btn-unarchive" type="button" (click)="unarchive.emit()" [disabled]="archiveLoading">
              <lucide-icon name="package" [size]="15" color="currentColor" [strokeWidth]="1.8" />
              {{ archiveLoading ? '...' : 'Désarchiver' }}
            </button>
          }
        </div>

        @if (isOrganizer) {
          <div class="danger-section">
            <div class="danger-section-header">
              <lucide-icon name="alert-circle" [size]="16" color="#ef4444" [strokeWidth]="1.8" />
              Zone dangereuse — Suppression définitive
            </div>
            <div class="danger-section-body">
              <div class="danger-consequences">
                <div class="dc-item dc-bad">
                  <lucide-icon name="x" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                  L'événement et tous ses items wishlist sont <strong>effacés définitivement</strong>
                </div>
                <div class="dc-item dc-bad">
                  <lucide-icon name="x" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                  L'historique des contributions et participants est <strong>perdu</strong>
                </div>
                <div class="dc-item dc-bad">
                  <lucide-icon name="x" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                  Tous les <strong>liens de partage</strong> deviennent invalides
                </div>
                @if (canDeleteEvent) {
                  <div class="dc-item dc-ok">
                    <lucide-icon name="check" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    Aucun paiement validé — suppression autorisée
                  </div>
                }
                @if (!canDeleteEvent) {
                  <div class="dc-item dc-warn">
                    <lucide-icon name="info" [size]="13" color="currentColor" [strokeWidth]="1.8" />
                    <strong>Bloquée :</strong> {{ deleteBlockedReason }}
                  </div>
                }
              </div>
              <div class="danger-tip">
                <lucide-icon name="info" [size]="15" color="#92400e" [strokeWidth]="1.8" />
                Préférez l'<strong>archivage</strong> — vos données seront conservées et
                l'événement restera accessible.
              </div>
              <div class="danger-footer">
                <button class="btn-delete-final" type="button" [disabled]="!canDeleteEvent || deleteLoading" (click)="delete.emit()">
                  <lucide-icon name="trash-2" [size]="15" color="currentColor" [strokeWidth]="1.8" />
                  {{ deleteLoading ? 'Suppression...' : 'Supprimer définitivement' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .request-product-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 20px 24px;
        background: white;
        border: 1.5px solid #e0e7ff;
        border-radius: 16px;
        flex-wrap: wrap;
      }
      .rpb-left {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;
      }
      .rpb-icon {
        font-size: 1.8rem;
        flex-shrink: 0;
      }
      .rpb-title {
        font-size: 0.92rem;
        font-weight: 800;
        color: #111;
      }
      .rpb-desc {
        font-size: 0.8rem;
        color: #6b7280;
        margin-top: 3px;
      }
      .btn-request-product {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 11px 20px;
        border: 0;
        border-radius: 12px;
        background: #6d28d9;
        color: white;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .btn-request-product:hover {
        background: #5b21b6;
      }
      .mgmt-section {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        overflow: hidden;
      }
      .mgmt-section-title {
        padding: 16px 24px 0;
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #9ca3af;
      }
      .mgmt-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 20px 24px;
        border-bottom: 1px solid #f3f4f6;
        flex-wrap: wrap;
      }
      .archive-mgmt-card {
        background: #faf5ff;
        border-bottom-color: #ede9fe;
      }
      .mgmt-card-left {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        flex: 1;
        min-width: 0;
      }
      .mgmt-icon {
        font-size: 1.6rem;
        flex-shrink: 0;
      }
      .mgmt-text {
        flex: 1;
      }
      .mgmt-card-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111;
      }
      .mgmt-card-desc {
        font-size: 0.82rem;
        color: #6b7280;
        line-height: 1.6;
        margin-top: 4px;
      }
      .mgmt-card-desc strong {
        color: #374151;
      }
      .archived-notice {
        color: #6d28d9;
      }
      .btn-mgmt {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 10px 18px;
        border-radius: 11px;
        border: 0;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-archive {
        background: #6d28d9;
        color: white;
      }
      .btn-unarchive {
        background: #ede9fe;
        color: #6d28d9;
      }
      .danger-section {
        background: #fff;
        border-top: 1px solid #f3f4f6;
      }
      .danger-section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 18px 24px 0;
        font-size: 0.82rem;
        font-weight: 800;
        color: #b91c1c;
      }
      .danger-section-body {
        padding: 14px 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .danger-consequences {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .dc-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 0.82rem;
        line-height: 1.5;
      }
      .dc-bad {
        color: #7f1d1d;
      }
      .dc-ok {
        color: #166534;
      }
      .dc-warn {
        color: #92400e;
      }
      .danger-tip {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 10px;
        background: #fffbeb;
        color: #92400e;
        font-size: 0.82rem;
        line-height: 1.5;
      }
      .danger-footer {
        display: flex;
        justify-content: flex-end;
      }
      .btn-delete-final {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 11px 18px;
        border-radius: 11px;
        border: 0;
        background: #dc2626;
        color: white;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-delete-final:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      @media (max-width: 900px) {
        .request-product-banner,
        .mgmt-card {
          flex-direction: column;
          align-items: flex-start;
        }
        .danger-footer {
          width: 100%;
        }
      }
    `,
  ],
})
export class EventActionsPanelComponent {
  @Input() showRequestBanner = false;
  @Input() isManager = false;
  @Input() isArchived = false;
  @Input() isOrganizer = false;
  @Input() canDeleteEvent = false;
  @Input() deleteBlockedReason = '';
  @Input() archiveLoading = false;
  @Input() deleteLoading = false;

  @Output() requestProduct = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @Output() unarchive = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}
