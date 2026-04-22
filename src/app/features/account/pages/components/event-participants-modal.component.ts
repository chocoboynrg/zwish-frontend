import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EventParticipantsResponse } from '../../../events/services/participants.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import {
  formatParticipantStatus,
  formatRoleLabel,
} from './event-ui.utils';

@Component({
  selector: 'app-event-participants-modal',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="modal-backdrop" *ngIf="show" (click)="close.emit()"></div>

    <section class="request-modal participants-modal" *ngIf="show">
      <div class="request-modal-card participants-modal-card" (click)="$event.stopPropagation()">
        <div class="request-modal-header">
          <div>
            <div class="section-kicker">Organisation</div>
            <h2>Participants</h2>
            <p class="section-description">
              Gérez les participants de l’événement depuis cette fenêtre.
            </p>
          </div>

          <button type="button" class="modal-close-btn" (click)="close.emit()" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div *ngIf="participantsLoading" class="state-card compact-state">
          Chargement participants...
        </div>

        <div *ngIf="participantsError" class="state-card error compact-state">
          {{ participantsError }}
        </div>

        <app-empty-state
          *ngIf="participants && participants.participants.length === 0"
          icon="👥"
          title="Aucun participant"
          description="Les participants apparaîtront ici après invitation ou inscription."
        />

        <div *ngIf="participants && participants.participants.length > 0" class="participant-list">
          <div class="participant-card" *ngFor="let p of participants.participants">
            <div class="participant-main">
              <strong>{{ p.user.name }}</strong>
              <div class="muted">{{ p.user.email }}</div>
            </div>

            <div class="badge-group">
              <span class="badge badge-indigo">{{ formatRoleLabel(p.role) }}</span>
              <span class="badge badge-slate">{{ formatParticipantStatus(p.status) }}</span>
            </div>

            <div *ngIf="accessRole === 'ORGANIZER'" class="role-actions">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                *ngIf="p.role === 'GUEST'"
                (click)="changeRole.emit({ participantId: p.id, role: 'CO_ORGANIZER' })"
              >
                Passer co-organisateur
              </button>

              <button
                type="button"
                class="btn btn-secondary btn-sm"
                *ngIf="p.role === 'CO_ORGANIZER'"
                (click)="changeRole.emit({ participantId: p.id, role: 'GUEST' })"
              >
                Repasser invité
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.45); z-index: 80; }
    .request-modal { position: fixed; inset: 0; display: grid; place-items: center; padding: 16px; z-index: 90; }
    .request-modal-card {
      width: min(760px, 100%); max-height: min(88vh, 900px); overflow: auto; padding: 22px;
      background: #ffffff; border: 1px solid #f3e8e2; border-radius: 24px; box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }
    .request-modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
    .modal-close-btn { width: 42px; height: 42px; border: none; border-radius: 12px; background: #f3f4f6; cursor: pointer; font-size: 1rem; flex-shrink: 0; }
    .section-kicker { color: #ea580c; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .section-description { margin: 0; color: #4b5563; line-height: 1.7; }
    .compact-state { padding: 14px 16px; margin-bottom: 12px; border-radius: 16px; }
    .state-card.error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }
    .participant-list { display: flex; flex-direction: column; gap: 14px; }
    .participant-card {
      border: 1px solid #efe5de; border-radius: 20px; padding: 18px; background: linear-gradient(180deg, #fffdfc 0%, #ffffff 100%);
      display: flex; flex-direction: column; gap: 12px;
    }
    .participant-main { display: flex; flex-direction: column; gap: 4px; }
    .muted { color: #6b7280; font-size: 13px; }
    .badge-group { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .badge { display: inline-flex; align-items: center; padding: 7px 11px; border-radius: 999px; font-size: 12px; font-weight: 800; white-space: nowrap; }
    .badge-indigo { background: #eef2ff; color: #4338ca; }
    .badge-slate { background: #f3f4f6; color: #374151; }
    .role-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .btn { border: 0; border-radius: 14px; padding: 11px 16px; cursor: pointer; font: inherit; font-weight: 700; }
    .btn-secondary { background: #fff7f3; color: #9a3412; border: 1px solid #f3dfd4; }
    .btn-sm { padding: 9px 12px; font-size: 0.92rem; }
  `],
})
export class EventParticipantsModalComponent {
  @Input() show = false;
  @Input() participants: EventParticipantsResponse | null = null;
  @Input() participantsLoading = false;
  @Input() participantsError = '';
  @Input() accessRole: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() changeRole = new EventEmitter<{ participantId: number; role: 'CO_ORGANIZER' | 'GUEST' }>();

  readonly formatRoleLabel = formatRoleLabel;
  readonly formatParticipantStatus = formatParticipantStatus;
}