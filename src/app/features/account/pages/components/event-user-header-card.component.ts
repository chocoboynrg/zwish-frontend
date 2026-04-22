import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserEventView } from '../../../events/services/events.service';
import {
  formatAmount,
  formatEventDate,
  formatRoleLabel,
} from './event-ui.utils';

@Component({
  selector: 'app-event-user-header-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="hero-card" *ngIf="data">
      <div class="hero-top">
        <a routerLink="/app/events" class="back-link">← Retour à mes événements</a>

        <div class="hero-actions" *ngIf="isManager">
          <button type="button" class="btn btn-secondary" (click)="openCatalog.emit()">
            Choisir depuis le catalogue
          </button>
          <button type="button" class="btn btn-primary" (click)="openProductRequests.emit()">
            Gérer les demandes produit
          </button>
        </div>
      </div>

      <div class="hero-content">
        <div class="hero-main">
          <div class="eyebrow">Événement</div>
          <h1>{{ data.event.title }}</h1>
          <p class="hero-description">
            {{ data.event.description || 'Aucune description renseignée pour cet événement.' }}
          </p>

          <div class="hero-meta">
            <span class="meta-pill">{{ formatRoleLabel(data.accessRole) }}</span>
            <span class="meta-pill">{{ formatEventDate(data.event.eventDate) }}</span>
            <span class="meta-pill">
              {{ data.event.organizer?.name || 'Organisateur non renseigné' }}
            </span>
          </div>

          <div class="hero-extra-row">
            <div class="hero-participants-card">
              <span class="hero-extra-label">Participants</span>
              <strong class="hero-extra-value">{{ data.summary.participantsCount }}</strong>

              <button
                *ngIf="isManager"
                type="button"
                class="hero-inline-link"
                (click)="openParticipants.emit()"
              >
                Voir participants
              </button>
            </div>
          </div>
        </div>

        <div class="hero-side">
          <div class="summary-card summary-card-accent">
            <span class="summary-label">Progression</span>
            <strong class="summary-value">
              {{ formatAmount(data.summary.totalFundedAmount) }}
            </strong>
            <span class="summary-help">
              sur {{ formatAmount(data.summary.totalTargetAmount) }}
            </span>
          </div>

          <div class="summary-card">
            <span class="summary-label">Reste à financer</span>
            <strong class="summary-value">
              {{ formatAmount(data.summary.totalRemainingAmount) }}
            </strong>
            <span class="summary-help">
              {{ data.summary.totalItems }} item(s)
            </span>
          </div>
        </div>
      </div>

      <section class="card section-card invite-section" *ngIf="isManager">
        <div class="section-header">
          <div>
            <div class="section-kicker">Partage</div>
            <h2>Invitation</h2>
          </div>

          <button type="button" class="btn btn-primary" (click)="generateInviteLink.emit()">
            Générer lien d’invitation
          </button>
        </div>

        <p class="section-description">
          Partage un lien public pour permettre à d’autres personnes de rejoindre
          ou consulter l’événement selon les règles définies.
        </p>

        <div class="invite-box" *ngIf="inviteLink">
          <label>Lien d’invitation</label>

          <div class="invite-row">
            <input [value]="inviteLink" readonly />
            <button type="button" class="btn btn-secondary" (click)="copyInviteLink.emit()">
              Copier
            </button>
          </div>

          <p class="success-text" *ngIf="copySuccess">{{ copySuccess }}</p>
        </div>

        <p class="error-text" *ngIf="inviteError">{{ inviteError }}</p>
      </section>
    </header>
  `,
  styles: [`
    .hero-card,
    .card {
      background: #ffffff;
      border: 1px solid #f3e8e2;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }
    .hero-card {
      padding: 24px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.16), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.10), transparent 32%),
        linear-gradient(135deg, #fff7f2, #ffffff 58%);
    }
    .card { padding: 20px; margin-top: 20px; }
    .back-link { color: #ea580c; text-decoration: none; font-weight: 700; }
    .hero-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
    .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    .hero-content { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr); gap: 20px; align-items: stretch; }
    h1 { margin: 6px 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); line-height: 1.1; letter-spacing: -0.03em; }
    .eyebrow, .section-kicker { color: #ea580c; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .hero-description, .section-description { margin: 0; color: #4b5563; line-height: 1.7; }
    .hero-meta { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px; }
    .meta-pill { display: inline-flex; align-items: center; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.9); border: 1px solid #f3dfd4; color: #7c2d12; font-size: 0.88rem; font-weight: 700; }
    .hero-side { display: grid; gap: 14px; }
    .summary-card { border-radius: 22px; padding: 18px; border: 1px solid #f3e8e2; background: white; display: flex; flex-direction: column; gap: 6px; }
    .summary-card-accent { background: linear-gradient(135deg, #fff1e8, #ffffff); }
    .summary-label { color: #6b7280; font-size: 0.9rem; }
    .summary-value { font-size: 1.7rem; line-height: 1.15; color: #111827; }
    .summary-help { color: #6b7280; font-size: 0.92rem; }
    .hero-extra-row { margin-top: 18px; display: flex; gap: 12px; flex-wrap: wrap; }
    .hero-participants-card { display: inline-flex; flex-direction: column; gap: 6px; padding: 14px 16px; border-radius: 18px; background: rgba(255,255,255,0.88); border: 1px solid #f3dfd4; min-width: 180px; }
    .hero-extra-label { font-size: 0.82rem; color: #6b7280; }
    .hero-extra-value { font-size: 1.4rem; line-height: 1.1; color: #111827; }
    .hero-inline-link { width: fit-content; border: none; background: transparent; color: #ea580c; font: inherit; font-weight: 700; padding: 0; cursor: pointer; }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
    .section-header h2 { margin: 4px 0 0; font-size: 1.3rem; line-height: 1.2; }
    .invite-box { margin-top: 16px; padding: 16px; border: 1px solid #f3dfd4; background: #fff8f4; border-radius: 18px; }
    .invite-row { display: flex; gap: 10px; align-items: center; }
    .invite-row input { width: 100%; box-sizing: border-box; border: 1px solid #e5d7cf; border-radius: 14px; padding: 11px 13px; font: inherit; background: white; color: #111827; }
    .success-text, .error-text { display: block; padding: 10px 12px; border-radius: 12px; margin-top: 12px; }
    .success-text { color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; }
    .error-text { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }
    .btn { border: 0; border-radius: 14px; padding: 11px 16px; cursor: pointer; font: inherit; font-weight: 700; }
    .btn-primary { background: linear-gradient(135deg, #ff7a59, #ffb347); color: white; }
    .btn-secondary { background: #fff7f3; color: #9a3412; border: 1px solid #f3dfd4; }

    @media (max-width: 960px) {
      .hero-top, .section-header, .invite-row { flex-direction: column; align-items: stretch; }
      .hero-content { grid-template-columns: 1fr; }
      .hero-actions { justify-content: flex-start; }
    }
  `],
})
export class EventUserHeaderCardComponent {
  @Input({ required: true }) data!: UserEventView;
  @Input() isManager = false;
  @Input() inviteLink = '';
  @Input() copySuccess = '';
  @Input() inviteError = '';

  @Output() openCatalog = new EventEmitter<void>();
  @Output() openProductRequests = new EventEmitter<void>();
  @Output() openParticipants = new EventEmitter<void>();
  @Output() generateInviteLink = new EventEmitter<void>();
  @Output() copyInviteLink = new EventEmitter<void>();

  readonly formatAmount = formatAmount;
  readonly formatEventDate = formatEventDate;
  readonly formatRoleLabel = formatRoleLabel;
}