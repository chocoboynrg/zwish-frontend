// src/app/features/jackpot/pages/jackpot-list-public-page.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JackpotService } from '../services/jackpot.service';
import { Jackpot } from '../models/jackpot.model';

@Component({
  selector: 'app-jackpot-list-public-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrap">
      <div class="page-hero">
        <div class="hero-inner">
          <div class="eyebrow">Cagnottes actives</div>
          <h1>Participez à une collecte</h1>
          <p>Soutenez des projets, des voyages, des événements — chaque contribution compte.</p>
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
            <div class="empty-title">Aucune cagnotte active pour le moment</div>
            <div class="empty-desc">
              Soyez le premier à lancer une collecte pour votre événement.
            </div>
            <a routerLink="/register" class="empty-cta">Créer une cagnotte →</a>
          </div>
        }
        @if (!loading() && jackpots().length > 0) {
          <div class="jackpot-grid">
            @for (j of jackpots(); track j.id) {
              <a [routerLink]="['/jackpot', j.shareToken]" class="jackpot-card">
                <div class="card-img-wrap">
                  @if (j.imageUrl) {
                    <img [src]="j.imageUrl" [alt]="j.title" class="card-img" />
                  }
                  @if (!j.imageUrl) {
                    <div class="card-img-placeholder">💰</div>
                  }
                  @if (j.purposeCategory) {
                    <div class="card-badge">{{ j.purposeCategory }}</div>
                  }
                </div>
                <div class="card-body">
                  <div class="card-title">{{ j.title }}</div>
                  <div class="card-owner">par {{ j.owner.name }}</div>
                  <div class="card-progress">
                    <div class="progress-track">
                      <div class="progress-fill" [style.width]="getPct(j) + '%'"></div>
                    </div>
                    <div class="progress-info">
                      <span class="pct">{{ getPct(j) }}%</span>
                      <span class="target"
                        >{{ j.targetAmount | number: '1.0-0' }} {{ j.currencyCode }}</span
                      >
                    </div>
                  </div>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding-top: 64px;
      }
      .page-wrap {
        background: #f9fafb;
        min-height: calc(100vh - 64px);
      }
      .page-hero {
        background: #000;
        padding: 48px 0;
      }
      .hero-inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .eyebrow {
        color: #ffd700;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 10px;
      }
      h1 {
        font-size: 2.2rem;
        font-weight: 900;
        color: white;
        margin: 0 0 10px;
        letter-spacing: -0.02em;
      }
      p {
        color: rgba(255, 255, 255, 0.5);
        font-size: 1rem;
        margin: 0;
      }
      .page-body {
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px;
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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 64px 24px;
        text-align: center;
      }
      .empty-icon {
        font-size: 3rem;
        margin-bottom: 4px;
      }
      .empty-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: #111;
      }
      .empty-desc {
        color: #9ca3af;
        font-size: 0.9rem;
      }
      .empty-cta {
        margin-top: 8px;
        display: inline-block;
        padding: 12px 28px;
        background: #ffd700;
        color: #000;
        font-weight: 800;
        font-size: 0.9rem;
        border-radius: 999px;
        text-decoration: none;
        transition: 0.15s;
      }
      .empty-cta:hover {
        background: #f59e0b;
        transform: translateY(-1px);
      }
      .jackpot-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      .jackpot-card {
        background: white;
        border: 1.5px solid #f3f4f6;
        border-radius: 20px;
        overflow: hidden;
        text-decoration: none;
        transition: 0.2s;
        display: flex;
        flex-direction: column;
      }
      .jackpot-card:hover {
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
        transform: translateY(-3px);
        border-color: rgba(255, 215, 0, 0.4);
      }
      .card-img-wrap {
        position: relative;
        aspect-ratio: 16/9;
        background: #f3f4f6;
        overflow: hidden;
      }
      .card-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .card-img-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
      }
      .card-badge {
        position: absolute;
        top: 10px;
        left: 12px;
        padding: 3px 10px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 0.72rem;
        font-weight: 700;
        backdrop-filter: blur(4px);
      }
      .card-body {
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
      }
      .card-title {
        font-size: 1rem;
        font-weight: 800;
        color: #111;
        line-height: 1.3;
      }
      .card-owner {
        font-size: 0.78rem;
        color: #9ca3af;
      }
      .card-progress {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: auto;
      }
      .progress-track {
        height: 5px;
        background: #f3f4f6;
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ffd700, #ffa500);
        border-radius: 999px;
      }
      .progress-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .pct {
        font-size: 0.78rem;
        font-weight: 800;
        color: #111;
      }
      .target {
        font-size: 0.72rem;
        color: #9ca3af;
      }
      @media (max-width: 1100px) {
        .jackpot-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 640px) {
        .jackpot-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class JackpotListPublicPageComponent implements OnInit {
  private readonly service = inject(JackpotService);
  readonly jackpots = signal<Jackpot[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.service.getPublicActive().subscribe({
      next: (js) => {
        this.jackpots.set(js);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getPct(j: Jackpot): number {
    if (!j.targetAmount) return 0;
    return Math.min(100, Math.round((Number(j.collectedAmount) / Number(j.targetAmount)) * 100));
  }
}
