// src/app/features/jackpot/pages/jackpot-admin-page.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JackpotService } from '../services/jackpot.service';
import { Jackpot, JackpotStatus } from '../models/jackpot.model';
import { ToastService } from '../../../core/services/toast.service';

const STATUS_META: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  PENDING: { label: 'En attente', emoji: '⏳', bg: '#fef3c7', color: '#92400e' },
  APPROVED: { label: 'Approuvée', emoji: '✅', bg: '#dcfce7', color: '#166534' },
  REJECTED: { label: 'Refusée', emoji: '❌', bg: '#fee2e2', color: '#991b1b' },
  CLOSED: { label: 'Clôturée', emoji: '🔒', bg: '#f3f4f6', color: '#6b7280' },
};

@Component({
  selector: 'app-jackpot-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Cagnottes</h1>
          <p class="subtitle">{{ pending() }} en attente · {{ total() }} total</p>
        </div>
        <button class="btn-refresh" (click)="load()">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10a6 6 0 016-6 6 6 0 015.66 4M16 4v4h-4M16 10a6 6 0 01-6 6 6 6 0 01-5.66-4M4 16v-4h4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
          Actualiser
        </button>
      </div>

      <!-- Filtres -->
      <div class="filter-row">
        @for (f of filters; track f.value) {
          <button
            class="filter-btn"
            [class.active]="statusFilter() === f.value"
            (click)="statusFilter.set(f.value); load()"
          >
            {{ f.label }}
            @if (getCount(f.value) > 0) {
              <span class="fc">{{ getCount(f.value) }}</span>
            }
          </button>
        }
      </div>

      <!-- Layout master-detail -->
      <div class="two-col">
        <!-- LISTE -->
        <div class="list-panel">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              Chargement...
            </div>
          }
          @if (!loading() && filtered().length === 0) {
            <div class="empty-state">
              <div>💰</div>
              <span>Aucune cagnotte{{ statusFilter() ? ' avec ce statut' : '' }}.</span>
            </div>
          }
          @for (p of filtered(); track p.id) {
            <button
              class="pot-item"
              [class.active]="selected()?.id === p.id"
              [class.pending]="p.status === 'PENDING'"
              (click)="selected.set(p)"
            >
              <div class="pot-item-icon">💰</div>
              <div class="pot-item-info">
                <div class="pot-item-title">{{ p.title }}</div>
                <div class="pot-item-user">{{ p.owner.name }}</div>
                <div class="pot-item-event">{{ p.purposeCategory ?? '—' }}</div>
              </div>
              <div class="pot-item-right">
                <span
                  class="status-badge"
                  [style.background]="getMeta(p.status).bg"
                  [style.color]="getMeta(p.status).color"
                >
                  {{ getMeta(p.status).emoji }} {{ getMeta(p.status).label }}
                </span>
                <div class="pot-item-amount">{{ p.targetAmount | number: '1.0-0' }} XOF</div>
              </div>
            </button>
          }
        </div>

        <!-- DÉTAIL -->
        <div class="detail-panel">
          @if (!selected()) {
            <div class="detail-placeholder">
              <div>💰</div>
              <div>Sélectionnez une cagnotte pour la traiter</div>
            </div>
          }

          @if (selected(); as p) {
            <!-- Header -->
            <div class="detail-head">
              <div>
                <div class="detail-title">{{ p.title }}</div>
                <div class="detail-meta">
                  {{ p.owner.name }} · {{ p.createdAt | date: 'dd MMM yyyy' }}
                </div>
              </div>
              <span
                class="status-badge lg"
                [style.background]="getMeta(p.status).bg"
                [style.color]="getMeta(p.status).color"
              >
                {{ getMeta(p.status).emoji }} {{ getMeta(p.status).label }}
              </span>
            </div>
            <!-- Infos -->
            <div class="detail-section">
              <div class="ds-title">Informations</div>
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Plafond</span>
                  <span class="info-val strong"
                    >{{ p.targetAmount | number: '1.0-0' }} {{ p.currencyCode }}</span
                  >
                </div>
                <div class="info-row">
                  <span class="info-label">Collecté</span>
                  <span class="info-val"
                    >{{ p.collectedAmount | number: '1.0-0' }} {{ p.currencyCode }}</span
                  >
                </div>
                @if (p.deadlineAt) {
                  <div class="info-row">
                    <span class="info-label">Date limite</span>
                    <span class="info-val">{{ p.deadlineAt | date: 'dd MMM yyyy' }}</span>
                  </div>
                }
                <div class="info-row">
                  <span class="info-label">Visibilité</span>
                  <span class="info-val">{{
                    p.visibility === 'PUBLIC' ? '🌍 Public' : '🔒 Privé'
                  }}</span>
                </div>
                @if (p.shareToken && p.status === 'APPROVED') {
                  <div class="info-row">
                    <span class="info-label">Lien de partage</span>
                    <span class="info-val mono small">{{ getShareLink(p.shareToken) }}</span>
                  </div>
                }
                @if (p.purposeCategory) {
                  <div class="info-row">
                    <span class="info-label">Objectif</span>
                    <span class="info-val">{{ p.purposeCategory }}</span>
                  </div>
                }
                @if (p.description) {
                  <div class="info-row">
                    <span class="info-label">Description</span>
                    <span class="info-val">{{ p.description }}</span>
                  </div>
                }
                @if (p.contributorMessage) {
                  <div class="info-row">
                    <span class="info-label">Message contributors</span>
                    <span class="info-val italic">{{ p.contributorMessage }}</span>
                  </div>
                }
                @if (p.reviewComment) {
                  <div class="info-row">
                    <span class="info-label">Commentaire précédent</span>
                    <span class="info-val italic">{{ p.reviewComment }}</span>
                  </div>
                }
              </div>
            </div>
            <!-- Décision (si PENDING) -->
            @if (p.status === 'PENDING') {
              <div class="detail-section">
                <div class="ds-title">Décision</div>
                @if (reviewError()) {
                  <div class="alert-error">{{ reviewError() }}</div>
                }
                <div class="field">
                  <label class="field-label"
                    >Commentaire <span class="opt">— optionnel</span></label
                  >
                  <textarea
                    [(ngModel)]="reviewComment"
                    rows="3"
                    placeholder="Motif du refus, conditions particulières..."
                  ></textarea>
                </div>
                <div class="decision-btns">
                  <button class="btn-reject" [disabled]="reviewLoading()" (click)="reject(p)">
                    {{ reviewLoading() ? '...' : '❌ Refuser' }}
                  </button>
                  <button class="btn-approve" [disabled]="reviewLoading()" (click)="approve(p)">
                    {{ reviewLoading() ? '...' : '✅ Approuver' }}
                  </button>
                </div>
              </div>
            }
            <!-- Déjà traitée -->
            @if (p.status !== 'PENDING') {
              <div class="detail-section">
                <div class="already-done">
                  <div class="ad-icon">{{ getMeta(p.status).emoji }}</div>
                  <div>
                    <div class="ad-title">{{ getMeta(p.status).label }}</div>
                    @if (p.reviewedAt) {
                      <div class="ad-date">Le {{ p.reviewedAt | date: 'dd MMM yyyy à HH:mm' }}</div>
                    }
                    @if (p.reviewComment) {
                      <div class="ad-comment">{{ p.reviewComment }}</div>
                    }
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 28px 32px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 1400px;
      }
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 900;
        color: #0f172a;
        margin: 0 0 4px;
      }
      .subtitle {
        color: #64748b;
        font-size: 0.88rem;
        margin: 0;
      }
      .btn-refresh {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 9px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 9px;
        background: white;
        font: inherit;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
      }

      .filter-row {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
      }
      .filter-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 999px;
        background: white;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: 0.15s;
      }
      .filter-btn:hover {
        border-color: #6366f1;
        color: #6366f1;
      }
      .filter-btn.active {
        background: #6366f1;
        border-color: #6366f1;
        color: white;
      }
      .fc {
        background: rgba(255, 255, 255, 0.25);
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 800;
      }
      .filter-btn:not(.active) .fc {
        background: #f1f5f9;
        color: #64748b;
      }

      .two-col {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 16px;
        align-items: start;
      }

      /* Liste */
      .list-panel {
        background: white;
        border: 1px solid #f1f5f9;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .loading-state,
      .empty-state {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        padding: 40px;
        color: #94a3b8;
        font-size: 0.9rem;
        flex-direction: column;
      }
      .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid #f1f5f9;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty-state div:first-child {
        font-size: 2rem;
      }

      .pot-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border: 0;
        background: white;
        cursor: pointer;
        text-align: left;
        border-bottom: 1px solid #f8fafc;
        transition: 0.15s;
        width: 100%;
      }
      .pot-item:hover {
        background: #f8fafc;
      }
      .pot-item.active {
        background: #f0f0ff;
        border-left: 3px solid #6366f1;
      }
      .pot-item.pending {
        background: #fffbeb;
      }
      .pot-item-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }
      .pot-item-info {
        flex: 1;
        min-width: 0;
      }
      .pot-item-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pot-item-user {
        font-size: 0.72rem;
        color: #64748b;
      }
      .pot-item-event {
        font-size: 0.7rem;
        color: #cbd5e1;
      }
      .pot-item-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
      }
      .status-badge {
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        white-space: nowrap;
      }
      .status-badge.lg {
        padding: 5px 12px;
        font-size: 0.78rem;
      }
      .pot-item-amount {
        font-size: 0.72rem;
        color: #64748b;
        font-weight: 600;
      }

      /* Détail */
      .detail-panel {
        background: white;
        border: 1px solid #f1f5f9;
        border-radius: 16px;
        overflow: hidden;
      }
      .detail-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 56px;
        color: #94a3b8;
        font-size: 0.88rem;
        min-height: 300px;
      }
      .detail-placeholder div:first-child {
        font-size: 2.5rem;
      }
      .detail-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 18px 20px;
        border-bottom: 1px solid #f1f5f9;
      }
      .detail-title {
        font-size: 1.05rem;
        font-weight: 800;
        color: #0f172a;
      }
      .detail-meta {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 3px;
      }

      .detail-section {
        padding: 18px 20px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .ds-title {
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
      }
      .info-grid {
        display: flex;
        flex-direction: column;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #f8fafc;
      }
      .info-row:last-child {
        border-bottom: 0;
      }
      .info-label {
        font-size: 0.75rem;
        color: #94a3b8;
        font-weight: 600;
        flex-shrink: 0;
      }
      .info-val {
        font-size: 0.82rem;
        color: #0f172a;
        font-weight: 600;
        text-align: right;
        word-break: break-word;
      }
      .info-val.strong {
        font-size: 1rem;
        font-weight: 900;
      }
      .info-val.italic {
        font-style: italic;
        color: #64748b;
      }
      .info-val.mono {
        font-family: monospace;
        font-size: 0.75rem;
        word-break: break-all;
        color: #6366f1;
      }

      .alert-error {
        padding: 10px 14px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 9px;
        font-size: 0.82rem;
        color: #991b1b;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .field-label {
        font-size: 0.78rem;
        font-weight: 700;
        color: #374151;
      }
      .opt {
        font-weight: 500;
        color: #94a3b8;
      }
      textarea {
        padding: 9px 12px;
        border: 1.5px solid #e2e8f0;
        border-radius: 9px;
        font: inherit;
        font-size: 0.85rem;
        resize: vertical;
        outline: 0;
        width: 100%;
        box-sizing: border-box;
        transition: 0.2s;
      }
      textarea:focus {
        border-color: #6366f1;
      }

      .decision-btns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .btn-reject {
        padding: 12px;
        border: 1.5px solid #fecaca;
        border-radius: 10px;
        background: white;
        color: #991b1b;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-reject:hover:not(:disabled) {
        background: #fef2f2;
      }
      .btn-approve {
        padding: 12px;
        border: 0;
        border-radius: 10px;
        background: #22c55e;
        color: white;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 800;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-approve:hover:not(:disabled) {
        background: #16a34a;
      }
      .btn-reject:disabled,
      .btn-approve:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .already-done {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 4px 0;
      }
      .ad-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }
      .ad-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #0f172a;
      }
      .ad-date {
        font-size: 0.78rem;
        color: #64748b;
        margin-top: 2px;
      }
      .ad-comment {
        font-size: 0.82rem;
        color: #64748b;
        margin-top: 6px;
        font-style: italic;
      }

      @media (max-width: 1100px) {
        .two-col {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class JackpotAdminPageComponent implements OnInit {
  private readonly service = inject(JackpotService);
  private readonly toast = inject(ToastService);

  readonly items = signal<Jackpot[]>([]);
  readonly loading = signal(false);
  readonly statusFilter = signal('');
  readonly selected = signal<Jackpot | null>(null);
  readonly reviewLoading = signal(false);
  readonly reviewError = signal('');
  reviewComment = '';

  readonly filters = [
    { label: 'Toutes', value: '' },
    { label: 'En attente', value: 'PENDING' },
    { label: 'Approuvées', value: 'APPROVED' },
    { label: 'Refusées', value: 'REJECTED' },
    { label: 'Clôturées', value: 'CLOSED' },
  ];

  readonly filtered = computed(() => {
    const f = this.statusFilter() as JackpotStatus;
    if (!f) return this.items();
    return this.items().filter((p) => p.status === f);
  });

  readonly total = computed(() => this.items().length);
  readonly pending = computed(() => this.items().filter((p) => p.status === 'PENDING').length);

  getCount(v: string): number {
    if (!v) return this.items().length;
    return this.items().filter((p) => p.status === v).length;
  }

  getMeta(status: string) {
    return STATUS_META[status as JackpotStatus] ?? STATUS_META['PENDING'];
  }

  getShareLink(token: string): string {
    return `${window.location.origin}/jackpot/${token}`;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const s = this.statusFilter() as JackpotStatus | undefined;
    this.service.getAll(s || undefined).subscribe({
      next: (rs) => {
        this.items.set(rs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Erreur de chargement.');
      },
    });
  }

  approve(p: Jackpot): void {
    this.doReview(p, 'APPROVED');
  }
  reject(p: Jackpot): void {
    this.doReview(p, 'REJECTED');
  }

  private doReview(p: Jackpot, status: 'APPROVED' | 'REJECTED'): void {
    this.reviewLoading.set(true);
    this.reviewError.set('');
    this.service.review(p.id, status, this.reviewComment || undefined).subscribe({
      next: (updated) => {
        this.reviewLoading.set(false);
        this.toast.success(status === 'APPROVED' ? 'Jackpot approuvée ✅' : 'Jackpot refusée.');
        this.items.update((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
        this.selected.set(updated);
        this.reviewComment = '';
      },
      error: (e: any) => {
        this.reviewLoading.set(false);
        this.reviewError.set(e?.error?.message ?? 'Erreur.');
      },
    });
  }
}
