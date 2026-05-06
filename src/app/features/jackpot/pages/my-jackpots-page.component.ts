// src/app/features/jackpot/pages/my-jackpots-page.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JackpotService } from '../services/jackpot.service';
import { Jackpot, STATUS_META, JackpotStatus } from '../models/jackpot.model';
import { JackpotRequestModalComponent } from '../components/jackpot-request-modal.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-my-jackpots-page',
  standalone: true,
  imports: [CommonModule, RouterLink, JackpotRequestModalComponent],
  template: `
    <div class="page-wrap">
      <div class="page-hero">
        <div class="hero-inner">
          <div class="hero-text">
            <div class="eyebrow">Mon espace</div>
            <h1>Mes cagnottes</h1>
            <p>Lancez et suivez vos collectes en ligne.</p>
          </div>
          <button class="btn-new" (click)="showModal.set(true)">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 4v12M4 10h12"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </svg>
            Créer une cagnotte
          </button>
        </div>
      </div>

      <div class="page-body">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            Chargement...
          </div>
        }

        @if (!loading() && jackpots().length === 0) {
          <div class="empty-block">
            <div class="empty-icon">💰</div>
            <div class="empty-title">Aucune cagnotte</div>
            <p>Lancez votre première collecte en cliquant sur "Créer une cagnotte".</p>
            <button class="btn-yellow" (click)="showModal.set(true)">
              Créer ma première cagnotte
            </button>
          </div>
        }

        @if (!loading() && jackpots().length > 0) {
          <div class="jackpot-list">
            @for (j of jackpots(); track j.id) {
              <div class="jackpot-card">
                <div class="card-left">
                  <div class="card-icon">💰</div>
                  <div class="card-info">
                    <div class="card-title">{{ j.title }}</div>
                    <div class="card-meta">
                      <span class="vis-tag">{{
                        j.visibility === 'PUBLIC' ? '🌍 Public' : '🔒 Privé'
                      }}</span>
                      <span>{{ j.createdAt | date: 'dd MMM yyyy' }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-center">
                  <div class="card-progress-block">
                    <div class="progress-vals">
                      <span class="collected">{{ j.collectedAmount | number: '1.0-0' }}</span>
                      <span class="sep">/</span>
                      <span class="target"
                        >{{ j.targetAmount | number: '1.0-0' }} {{ j.currencyCode }}</span
                      >
                    </div>
                    <div class="progress-track">
                      <div class="progress-fill" [style.width]="getPct(j) + '%'"></div>
                    </div>
                  </div>
                </div>
                <div class="card-right">
                  <span
                    class="status-badge"
                    [style.background]="getMeta(j.status).bg"
                    [style.color]="getMeta(j.status).color"
                  >
                    {{ getMeta(j.status).emoji }} {{ getMeta(j.status).label }}
                  </span>
                  <!-- Lien de partage si APPROVED -->
                  @if (j.status === 'APPROVED') {
                    <button class="btn-copy-link" (click)="copyLink(j)">
                      {{ copiedId() === j.id ? '✓ Copié' : '🔗 Lien' }}
                    </button>
                  }
                  <!-- Clôturer si APPROVED -->
                  @if (j.status === 'APPROVED') {
                    <button class="btn-close-jack" (click)="closeJackpot(j)">Clôturer</button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Modal création -->
    <app-jackpot-request-modal
      [show]="showModal()"
      (close)="showModal.set(false)"
      (submitted)="onSubmitted()"
    ></app-jackpot-request-modal>
  `,
  styles: [
    `
      .page-wrap {
        background: #f9fafb;
        min-height: calc(100vh - 64px);
      }
      .page-hero {
        background: #000;
        padding: 40px 0;
      }
      .hero-inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
      }
      .eyebrow {
        color: #ffd700;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 8px;
      }
      h1 {
        font-size: 2rem;
        font-weight: 900;
        color: white;
        margin: 0 0 6px;
        letter-spacing: -0.02em;
      }
      .page-hero p {
        color: rgba(255, 255, 255, 0.45);
        margin: 0;
        font-size: 0.88rem;
      }
      .btn-new {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ffd700;
        color: #000;
        padding: 12px 22px;
        border: 0;
        border-radius: 12px;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
        transition: 0.2s;
      }
      .btn-new:hover {
        background: #ffc000;
      }

      .page-body {
        max-width: 1280px;
        margin: 0 auto;
        padding: 28px 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .loading-state {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
        padding: 56px;
        color: #9ca3af;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f4f6;
        border-top-color: #ffd700;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty-block {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        padding: 56px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
      }
      .empty-icon {
        font-size: 3rem;
      }
      .empty-title {
        font-size: 1rem;
        font-weight: 800;
        color: #111;
      }
      .empty-block p {
        color: #9ca3af;
        margin: 0;
        font-size: 0.88rem;
      }
      .btn-yellow {
        background: #ffd700;
        color: #000;
        padding: 10px 22px;
        border: 0;
        border-radius: 10px;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 800;
        cursor: pointer;
      }

      /* Cards */
      .jackpot-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .jackpot-card {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 16px;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        transition: 0.15s;
      }
      .jackpot-card:hover {
        border-color: #e5e7eb;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      }
      .card-left {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;
        min-width: 0;
      }
      .card-icon {
        font-size: 1.8rem;
        flex-shrink: 0;
      }
      .card-info {
        min-width: 0;
      }
      .card-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #111;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 3px;
      }
      .vis-tag {
        font-weight: 600;
      }

      .card-center {
        flex: 1;
        min-width: 180px;
      }
      .card-progress-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .progress-vals {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: 0.88rem;
      }
      .collected {
        font-weight: 900;
        color: #111;
      }
      .sep {
        color: #d1d5db;
      }
      .target {
        color: #9ca3af;
        font-size: 0.78rem;
      }
      .progress-track {
        height: 4px;
        background: #f3f4f6;
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ffd700, #ffa500);
        border-radius: 999px;
      }

      .card-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        flex-wrap: wrap;
      }
      .status-badge {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
      }
      .btn-copy-link {
        padding: 7px 12px;
        border: 1.5px solid #e5e7eb;
        border-radius: 9px;
        background: white;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        color: #6b7280;
        cursor: pointer;
        transition: 0.15s;
      }
      .btn-copy-link:hover {
        border-color: #111;
        color: #111;
      }
      .btn-close-jack {
        padding: 7px 12px;
        border: 1.5px solid #fecaca;
        border-radius: 9px;
        background: white;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        color: #ef4444;
        cursor: pointer;
        transition: 0.15s;
      }
      .btn-close-jack:hover {
        background: #fef2f2;
      }

      @media (max-width: 768px) {
        .card-center {
          min-width: 100%;
          order: 3;
        }
      }
    `,
  ],
})
export class MyJackpotsPageComponent implements OnInit {
  private readonly service = inject(JackpotService);
  private readonly toast = inject(ToastService);

  readonly jackpots = signal<Jackpot[]>([]);
  readonly loading = signal(true);
  readonly showModal = signal(false);
  readonly copiedId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getMine().subscribe({
      next: (js) => {
        this.jackpots.set(js);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSubmitted(): void {
    this.showModal.set(false);
    this.load();
    this.toast.success('Demande soumise ! Vous serez notifié(e) dès la validation.');
  }

  getPct(j: Jackpot): number {
    if (!j.targetAmount) return 0;
    return Math.min(100, Math.round((Number(j.collectedAmount) / Number(j.targetAmount)) * 100));
  }

  getMeta(status: string) {
    return STATUS_META[status as JackpotStatus] ?? STATUS_META['PENDING'];
  }

  copyLink(j: Jackpot): void {
    const url = `${window.location.origin}/jackpot/${j.shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedId.set(j.id);
      setTimeout(() => this.copiedId.set(null), 2000);
    });
  }

  closeJackpot(j: Jackpot): void {
    if (!confirm(`Clôturer la cagnotte "${j.title}" ? Cette action est irréversible.`)) return;
    this.service.close(j.id).subscribe({
      next: (updated) => {
        this.jackpots.update((js) => js.map((x) => (x.id === updated.id ? updated : x)));
        this.toast.success('Cagnotte clôturée.');
      },
      error: (e: any) => this.toast.error(e?.error?.message ?? 'Erreur.'),
    });
  }
}
