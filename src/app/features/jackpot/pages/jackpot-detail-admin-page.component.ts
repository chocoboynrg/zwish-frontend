import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { JackpotService } from '../services/jackpot.service';
import { Jackpot, STATUS_META } from '../models/jackpot.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-jackpot-detail-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  template: `
    <div class="page">

      <div class="back-row">
        <a routerLink="/admin/jackpot" class="back-link">
          <lucide-icon name="arrow-left" [size]="16" color="currentColor" [strokeWidth]="2" />
          Retour aux cagnottes
        </a>
      </div>

      @if (loading()) { <div class="loading-bar"></div> }

      @if (error() && !loading()) {
        <div class="alert-error">{{ error() }}</div>
      }

      @if (jackpot() && !loading()) {
        <div class="detail-layout">

          <!-- Header -->
          <div class="detail-header">
            <div class="header-left">
              <span class="status-badge" [style.background]="meta().bg" [style.color]="meta().color">
                {{ meta().emoji }} {{ meta().label }}
              </span>
              <h1>{{ jackpot()!.title }}</h1>
              <span class="detail-id muted">#{{ jackpot()!.id }}</span>
            </div>
            <div class="header-meta">
              <div class="meta-chip">
                <lucide-icon name="info" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                {{ jackpot()!.visibility === 'PUBLIC' ? 'Public' : 'Privé' }}
              </div>
              @if (jackpot()!.purposeCategory) {
                <div class="meta-chip">
                  <lucide-icon name="folder" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                  {{ jackpot()!.purposeCategory }}
                </div>
              }
              @if (jackpot()!.deadlineAt) {
                <div class="meta-chip">
                  <lucide-icon name="calendar" [size]="14" color="currentColor" [strokeWidth]="1.8" />
                  Échéance: {{ jackpot()!.deadlineAt | date:'d MMMM yyyy' }}
                </div>
              }
            </div>
          </div>

          <div class="two-col">

            <!-- LEFT: Info -->
            <div class="info-col">

              <!-- Owner -->
              <div class="card">
                <div class="card-label">Propriétaire</div>
                <div class="owner-row">
                  <div class="org-avatar">{{ initials(jackpot()!.owner.name) }}</div>
                  <div>
                    <div class="owner-name">{{ jackpot()!.owner.name }}</div>
                    <div class="muted" style="font-size:0.8rem">Créée le {{ jackpot()!.createdAt | date:'d MMMM yyyy' }}</div>
                  </div>
                </div>
              </div>

              <!-- Financement -->
              <div class="card">
                <div class="card-label">Financement</div>
                <div class="funding-row">
                  <div class="funding-stat">
                    <span class="funding-value">{{ jackpot()!.collectedAmount | number }}</span>
                    <span class="funding-sub">{{ jackpot()!.currencyCode }} collectés</span>
                  </div>
                  <div class="funding-sep">/</div>
                  <div class="funding-stat">
                    <span class="funding-value target">{{ jackpot()!.targetAmount | number }}</span>
                    <span class="funding-sub">{{ jackpot()!.currencyCode }} objectif</span>
                  </div>
                  <div class="funding-pct" [class.pct-full]="progressPercent() === 100">{{ progressPercent() }}%</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill"
                    [style.width.%]="progressPercent()"
                    [class.fill-partial]="progressPercent() > 0 && progressPercent() < 100"
                    [class.fill-full]="progressPercent() === 100">
                  </div>
                </div>
              </div>

              <!-- Description -->
              @if (jackpot()!.description) {
                <div class="card">
                  <div class="card-label">Description</div>
                  <p class="description-text">{{ jackpot()!.description }}</p>
                </div>
              }

              <!-- Message aux contributeurs -->
              @if (jackpot()!.contributorMessage) {
                <div class="card">
                  <div class="card-label">Message aux contributeurs</div>
                  <p class="description-text">{{ jackpot()!.contributorMessage }}</p>
                </div>
              }

              <!-- Photo -->
              @if (jackpot()!.imageUrl) {
                <div class="card">
                  <div class="card-label">Photo</div>
                  <img [src]="jackpot()!.imageUrl" alt="Image cagnotte" class="jackpot-img" />
                </div>
              }

              <!-- Révision précédente -->
              @if (jackpot()!.reviewedBy || jackpot()!.reviewComment) {
                <div class="card card-review-info">
                  <div class="card-label">Décision précédente</div>
                  @if (jackpot()!.reviewedBy) {
                    <div class="muted" style="font-size:0.85rem;margin-bottom:6px">
                      Par {{ jackpot()!.reviewedBy!.name }}
                      @if (jackpot()!.reviewedAt) { · {{ jackpot()!.reviewedAt | date:'d MMM yyyy' }} }
                    </div>
                  }
                  @if (jackpot()!.reviewComment) {
                    <p class="review-comment-text">{{ jackpot()!.reviewComment }}</p>
                  }
                </div>
              }

            </div>

            <!-- RIGHT: Actions -->
            <div class="action-col">

              @if (jackpot()!.status === 'PENDING') {
                <div class="card card-review">
                  <div class="card-label">Décision</div>
                  <p class="review-hint">Approuvez ou refusez cette cagnotte. Le propriétaire recevra une notification.</p>

                  <label class="field-label">Commentaire (optionnel)</label>
                  <textarea
                    [(ngModel)]="reviewComment"
                    class="review-textarea"
                    rows="4"
                    placeholder="Motif de refus, message de félicitations...">
                  </textarea>

                  @if (reviewError()) {
                    <div class="alert-error small">{{ reviewError() }}</div>
                  }

                  <div class="review-actions">
                    <button class="btn-approve" (click)="approve()" [disabled]="reviewLoading()">
                      @if (reviewLoading()) { <span class="spinner"></span> }
                      Approuver
                    </button>
                    <button class="btn-reject" (click)="reject()" [disabled]="reviewLoading()">
                      Refuser
                    </button>
                  </div>
                </div>
              } @else {
                <div class="card card-status-info">
                  <div class="card-label">Statut</div>
                  <div class="status-summary">
                    <span class="status-badge-lg" [style.background]="meta().bg" [style.color]="meta().color">
                      {{ meta().emoji }} {{ meta().label }}
                    </span>
                    <p class="muted" style="font-size:0.85rem;margin:8px 0 0">{{ meta().desc }}</p>
                    @if (jackpot()!.approvedAt) {
                      <p class="muted" style="font-size:0.8rem;margin:4px 0 0">Approuvée le {{ jackpot()!.approvedAt | date:'d MMMM yyyy' }}</p>
                    }
                    @if (jackpot()!.closedAt) {
                      <p class="muted" style="font-size:0.8rem;margin:4px 0 0">Clôturée le {{ jackpot()!.closedAt | date:'d MMMM yyyy' }}</p>
                    }
                  </div>
                </div>
              }

              <!-- Share link -->
              <div class="card">
                <div class="card-label">Lien de partage</div>
                <div class="share-link-wrap">
                  <span class="share-link-text">{{ shareLink() }}</span>
                  <button class="btn-copy" (click)="copyLink()">Copier</button>
                </div>
              </div>

            </div>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    .page { padding: 32px 24px; display: flex; flex-direction: column; gap: 20px; max-width: 1100px; }

    .back-link {
      display: inline-flex; align-items: center; gap: 8px;
      color: #6b7280; font-size: 0.88rem; font-weight: 600; text-decoration: none; transition: 0.15s;
    }
    .back-link:hover { color: #111827; }

    .loading-bar {
      height: 3px; border-radius: 2px;
      background: linear-gradient(90deg, #111827 25%, #6b7280 50%, #111827 75%);
      background-size: 200%; animation: shimmer 1.2s infinite;
    }
    @keyframes shimmer { 0% { background-position: -200%; } 100% { background-position: 200%; } }

    .alert-error { padding: 14px 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; font-size: 0.88rem; }
    .alert-error.small { padding: 10px 14px; font-size: 0.82rem; border-radius: 10px; }

    .detail-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;
      padding-bottom: 20px; border-bottom: 1.5px solid #f3f4f6;
    }
    .header-left { display: flex; flex-direction: column; gap: 8px; }
    .header-left h1 { margin: 0; font-size: 1.7rem; font-weight: 800; color: #111827; }
    .detail-id { font-size: 0.8rem; font-family: monospace; }
    .header-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: flex-start; padding-top: 4px; }

    .meta-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 8px;
      background: #f9fafb; font-size: 0.82rem; color: #374151;
    }

    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 800;
      white-space: nowrap; text-transform: uppercase; letter-spacing: 0.06em; width: fit-content;
    }
    .status-badge-lg {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 999px; font-size: 0.82rem; font-weight: 800;
    }

    .two-col { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }

    .card {
      background: white; border: 1.5px solid #e5e7eb; border-radius: 16px;
      padding: 20px 22px; display: flex; flex-direction: column; gap: 12px;
    }
    .card-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; }
    .card-review { border-color: #fde68a; background: #fffdf5; }
    .card-review-info { background: #f9fafb; }
    .card-status-info { }

    .owner-row { display: flex; align-items: center; gap: 12px; }
    .org-avatar {
      width: 40px; height: 40px; border-radius: 50%; background: #f3f4f6;
      border: 1.5px solid #e5e7eb; font-size: 0.8rem; font-weight: 800; color: #374151;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .owner-name { font-weight: 700; color: #111827; font-size: 0.95rem; }

    .funding-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .funding-stat { display: flex; flex-direction: column; }
    .funding-value { font-size: 1.2rem; font-weight: 800; color: #111827; }
    .funding-value.target { color: #6b7280; font-size: 1rem; }
    .funding-sub { font-size: 0.75rem; color: #9ca3af; }
    .funding-sep { font-size: 1.4rem; color: #d1d5db; font-weight: 300; }
    .funding-pct { margin-left: auto; font-size: 1.3rem; font-weight: 800; color: #6366f1; }
    .pct-full { color: #16a34a; }

    .progress-bar { height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; background: #e5e7eb; transition: width 0.4s; }
    .fill-partial { background: #6366f1; }
    .fill-full { background: #22c55e; }

    .description-text { margin: 0; color: #374151; font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; }
    .review-comment-text { margin: 0; color: #374151; font-size: 0.88rem; line-height: 1.6; font-style: italic; }

    .jackpot-img { width: 100%; max-height: 240px; object-fit: cover; border-radius: 10px; }

    .field-label { font-size: 0.82rem; font-weight: 700; color: #374151; }
    .review-hint { margin: 0; font-size: 0.85rem; color: #6b7280; line-height: 1.5; }
    .review-textarea {
      width: 100%; padding: 10px 12px; border: 1.5px solid #d1d5db; border-radius: 10px;
      font: inherit; font-size: 0.88rem; color: #111827; resize: vertical;
      box-sizing: border-box; transition: border-color 0.15s;
    }
    .review-textarea:focus { outline: none; border-color: #111827; }

    .review-actions { display: flex; gap: 10px; }
    .btn-approve, .btn-reject {
      flex: 1; padding: 10px 14px; border-radius: 10px; border: none;
      font: inherit; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 7px;
    }
    .btn-approve { background: #111827; color: white; }
    .btn-approve:hover:not(:disabled) { background: #1f2937; }
    .btn-reject { background: #fef2f2; color: #991b1b; border: 1.5px solid #fecaca; }
    .btn-reject:hover:not(:disabled) { background: #fee2e2; }
    .btn-approve:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }

    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .status-summary { display: flex; flex-direction: column; gap: 4px; }

    .share-link-wrap {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;
    }
    .share-link-text {
      flex: 1; font-size: 0.78rem; color: #6b7280; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; font-family: monospace;
    }
    .btn-copy {
      flex-shrink: 0; padding: 5px 12px; border: 1.5px solid #d1d5db; border-radius: 8px;
      background: white; font: inherit; font-size: 0.78rem; font-weight: 700;
      color: #374151; cursor: pointer; transition: 0.15s;
    }
    .btn-copy:hover { background: #f3f4f6; }

    .info-col, .action-col { display: flex; flex-direction: column; gap: 16px; }

    .muted { color: #9ca3af; }

    @media (max-width: 860px) {
      .two-col { grid-template-columns: 1fr; }
      .detail-header { flex-direction: column; }
    }
  `],
})
export class JackpotDetailAdminPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(JackpotService);
  private readonly toast = inject(ToastService);

  readonly jackpot = signal<Jackpot | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly reviewLoading = signal(false);
  readonly reviewError = signal('');
  reviewComment = '';

  meta() {
    const j = this.jackpot();
    if (!j) return { label: '', emoji: '', bg: '', color: '', desc: '' };
    return STATUS_META[j.status];
  }

  progressPercent(): number {
    const j = this.jackpot();
    if (!j || !j.targetAmount) return 0;
    return Math.min(100, Math.round((Number(j.collectedAmount) / Number(j.targetAmount)) * 100));
  }

  initials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  shareLink(): string {
    const j = this.jackpot();
    if (!j) return '';
    return `${window.location.origin}/jackpot/${j.shareToken}`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.shareLink()).then(() => {
      this.toast.success('Lien copié !');
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.service.getOne(id).subscribe({
      next: (j) => { this.jackpot.set(j); this.loading.set(false); },
      error: () => { this.error.set('Cagnotte introuvable.'); this.loading.set(false); },
    });
  }

  approve(): void { this.doReview('APPROVED'); }
  reject(): void  { this.doReview('REJECTED'); }

  private doReview(status: 'APPROVED' | 'REJECTED'): void {
    const j = this.jackpot();
    if (!j) return;
    this.reviewLoading.set(true);
    this.reviewError.set('');
    this.service.review(j.id, status, this.reviewComment || undefined).subscribe({
      next: (updated) => {
        this.reviewLoading.set(false);
        this.toast.success(status === 'APPROVED' ? 'Cagnotte approuvée' : 'Cagnotte refusée');
        this.jackpot.set(updated);
        this.reviewComment = '';
      },
      error: (e: any) => {
        this.reviewLoading.set(false);
        this.reviewError.set(e?.error?.message ?? 'Erreur.');
      },
    });
  }
}
