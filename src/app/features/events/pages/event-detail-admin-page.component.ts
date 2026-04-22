import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventsService } from '../services/events.service';
import { ParticipantsService } from '../services/participants.service';
import { EventDashboard } from '../models/event-dashboard.model';
import {
  EventWishlistFilter,
  EventWishlistSort,
  type EventWishlistItem,
} from '../models/event-wishlist.model';
import { EventParticipantsResponse } from '../services/participants.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-event-detail-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a routerLink="/admin/events" class="back-link">← Retour événements</a>
          <h1>Détail événement</h1>
          <p *ngIf="dashboard()">{{ dashboard()?.event?.title }}</p>
        </div>

        <div class="header-actions">
          <button type="button" (click)="reloadAll()">Actualiser</button>
        </div>
      </div>

      <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      <p *ngIf="loading()">Chargement...</p>

      <ng-container *ngIf="!loading() && dashboard() as data">
        <section class="card">
          <h2>Informations générales</h2>

          <div class="info-grid">
            <div><strong>ID :</strong> {{ data.event.id }}</div>
            <div><strong>Titre :</strong> {{ data.event.title }}</div>
            <div><strong>Date :</strong> {{ data.event.eventDate | date:'medium' }}</div>
            <div><strong>Organisateur :</strong> {{ data.event.organizer?.name || '—' }}</div>
            <div class="full"><strong>Description :</strong> {{ data.event.description || '—' }}</div>
          </div>
        </section>

        <section class="stats-grid">
          <div class="stat-card">
            <h3>Participants</h3>
            <p>{{ data.summary.participantsCount }}</p>
          </div>

          <div class="stat-card">
            <h3>Items</h3>
            <p>{{ data.summary.totalItems }}</p>
          </div>

          <div class="stat-card">
            <h3>Montant cible</h3>
            <p>{{ data.summary.totalTargetAmount }}</p>
          </div>

          <div class="stat-card">
            <h3>Montant financé</h3>
            <p>{{ data.summary.totalFundedAmount }}</p>
          </div>

          <div class="stat-card">
            <h3>Reste à financer</h3>
            <p>{{ data.summary.totalRemainingAmount }}</p>
          </div>

          <div class="stat-card">
            <h3>Paiements réussis</h3>
            <p>{{ data.summary.succeededPayments }}</p>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <h2>Participants</h2>

            <div class="participants-actions">
              <button type="button" (click)="generateInviteLink()">
                Générer lien d’invitation
              </button>
            </div>
          </div>

          <div class="invite-box" *ngIf="inviteLink()">
            <label>Lien d’invitation</label>
            <div class="invite-row">
              <input [value]="inviteLink()" readonly />
              <button type="button" (click)="copyInviteLink()">Copier</button>
            </div>
            <p class="success" *ngIf="copySuccess()">{{ copySuccess() }}</p>
          </div>

          <p *ngIf="participantsLoading()">Chargement participants...</p>

          <div class="table-wrapper" *ngIf="!participantsLoading() && participants() as p">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Rejoint le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let participant of p.participants">
                  <td>{{ participant.id }}</td>
                  <td>{{ participant.user.name || '—' }}</td>
                  <td>{{ participant.user.email || '—' }}</td>
                  <td>{{ participant.role }}</td>
                  <td>{{ participant.status }}</td>
                  <td>{{ participant.joinedAt ? (participant.joinedAt | date:'medium') : '—' }}</td>
                  <td>
                    <div class="role-actions">
                      <button
                        type="button"
                        *ngIf="participant.role === 'GUEST'"
                        (click)="changeParticipantRole(participant.id, 'CO_ORGANIZER')"
                      >
                        Passer co-organisateur
                      </button>

                      <button
                        type="button"
                        *ngIf="participant.role === 'CO_ORGANIZER'"
                        (click)="changeParticipantRole(participant.id, 'GUEST')"
                      >
                        Repasser invité
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="p.participants.length === 0">
                  <td colspan="7">Aucun participant</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <div class="section-header">
            <h2>Wishlist événement</h2>

            <div class="filters">
              <select
                [value]="wishlistFilter()"
                (change)="onFilterChange($any($event.target).value)"
              >
                <option value="all">Tous</option>
                <option value="available">Disponibles</option>
                <option value="reserved">Réservés</option>
                <option value="funded">Financés</option>
              </select>

              <select
                [value]="wishlistSort()"
                (change)="onSortChange($any($event.target).value)"
              >
                <option value="created_desc">Plus récents</option>
                <option value="created_asc">Plus anciens</option>
                <option value="progress_desc">Progression</option>
                <option value="remaining_asc">Reste à financer</option>
                <option value="name_asc">Nom</option>
              </select>
            </div>
          </div>

          <p *ngIf="wishlistLoading()">Chargement wishlist...</p>

          <div class="table-wrapper" *ngIf="!wishlistLoading() && wishlistItems().length">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item</th>
                  <th>Montant cible</th>
                  <th>Financé</th>
                  <th>Reste</th>
                  <th>Progression</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of wishlistItems()">
                  <td>{{ item.id }}</td>
                  <td>
                    <strong>{{ item.name }}</strong>
                    <div class="muted">Qté: {{ item.quantity }}</div>
                  </td>
                  <td>{{ item.targetAmount }}</td>
                  <td>{{ item.fundedAmount }}</td>
                  <td>{{ item.remainingAmount }}</td>
                  <td>{{ item.progressPercent }}%</td>
                  <td>{{ item.fundingStatus }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-wrapper" *ngIf="!wishlistLoading() && wishlistItems().length === 0">
            <table>
              <tbody>
                <tr>
                  <td>Aucun item</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="two-cols">
          <section class="card">
            <h2>Dernières contributions</h2>
            <div class="list-block" *ngIf="data.latestContributions.length > 0; else noContrib">
              <div class="list-item" *ngFor="let contribution of data.latestContributions">
                <strong>{{ contribution.amount }} {{ contribution.currencyCode }}</strong>
                <div class="muted">{{ contribution.status }}</div>
                <div>{{ contribution.message || '—' }}</div>
              </div>
            </div>
            <ng-template #noContrib>
              <p class="muted">Aucune contribution récente</p>
            </ng-template>
          </section>

          <section class="card">
            <h2>Derniers paiements</h2>
            <div class="list-block" *ngIf="data.latestPayments.length > 0; else noPay">
              <div class="list-item" *ngFor="let payment of data.latestPayments">
                <strong>{{ payment.amount }} {{ payment.currencyCode }}</strong>
                <div class="muted">{{ payment.status }} · {{ payment.provider }}</div>
                <div>{{ payment.paymentMethod }}</div>
              </div>
            </div>
            <ng-template #noPay>
              <p class="muted">Aucun paiement récent</p>
            </ng-template>
          </section>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .page {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .page-header h1 {
        margin: 8px 0 6px;
      }

      .back-link {
        color: #1d4ed8;
        text-decoration: none;
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }

      .card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      .stat-card {
        background: white;
        border-radius: 16px;
        padding: 18px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }

      .stat-card h3 {
        margin: 0 0 8px;
        color: #6b7280;
        font-size: 14px;
      }

      .stat-card p {
        margin: 0;
        font-size: 26px;
        font-weight: 700;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 20px;
      }

      .info-grid .full {
        grid-column: 1 / -1;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 14px;
      }

      .participants-actions {
        display: flex;
        gap: 10px;
      }

      .invite-box {
        margin-bottom: 18px;
        padding: 14px;
        border: 1px solid #dbeafe;
        background: #eff6ff;
        border-radius: 12px;
      }

      .invite-box label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
      }

      .invite-row {
        display: flex;
        gap: 10px;
      }

      .invite-row input {
        flex: 1;
        min-width: 0;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 10px 12px;
        font: inherit;
        background: white;
      }

      .success {
        color: #15803d;
        margin: 10px 0 0;
      }

      .filters {
        display: flex;
        gap: 10px;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 12px 10px;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: top;
      }

      th {
        color: #6b7280;
        font-size: 13px;
      }

      .two-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .list-block {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .list-item {
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      }

      .muted {
        color: #6b7280;
        font-size: 13px;
      }

      select,
      button {
        font: inherit;
      }

      select,
      button {
        border-radius: 10px;
      }

      select {
        border: 1px solid #d1d5db;
        padding: 10px 12px;
      }

      button {
        border: 0;
        padding: 10px 14px;
        background: #1d4ed8;
        color: white;
        cursor: pointer;
      }

      .error {
        color: #b91c1c;
      }

      @media (max-width: 980px) {
        .info-grid,
        .two-cols {
          grid-template-columns: 1fr;
        }

        .section-header,
        .filters,
        .page-header,
        .invite-row {
          flex-direction: column;
          align-items: stretch;
        }
      }

      .role-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .role-actions button {
        border: 0;
        border-radius: 8px;
        padding: 8px 10px;
        background: #1d4ed8;
        color: white;
        cursor: pointer;
        font: inherit;
      }
    `,
  ],
})
export class EventDetailAdminPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);
  private readonly participantsService = inject(ParticipantsService);
  private readonly toastService = inject(ToastService);

  readonly dashboard = signal<EventDashboard | null>(null);
  readonly participants = signal<EventParticipantsResponse | null>(null);
  readonly wishlistItems = signal<EventWishlistItem[]>([]);

  readonly loading = signal(false);
  readonly wishlistLoading = signal(false);
  readonly participantsLoading = signal(false);
  readonly errorMessage = signal('');
  readonly inviteLink = signal('');
  readonly copySuccess = signal('');

  readonly wishlistFilter = signal<EventWishlistFilter>('all');
  readonly wishlistSort = signal<EventWishlistSort>('created_desc');

  private eventId = 0;

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.eventId || Number.isNaN(this.eventId)) {
      this.errorMessage.set('Identifiant événement invalide');
      return;
    }

    this.reloadAll();
  }

  reloadAll(): void {
    this.loadDashboard();
    this.loadWishlist();
    this.loadParticipants();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventsService.getEventDashboard(this.eventId).subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message || 'Impossible de charger le dashboard événement',
        );
        this.loading.set(false);
      },
    });
  }

  loadWishlist(): void {
    this.wishlistLoading.set(true);

    this.eventsService
      .getEventWishlist(
        this.eventId,
        this.wishlistFilter(),
        this.wishlistSort(),
      )
      .subscribe({
        next: (wishlist) => {
          this.wishlistItems.set(wishlist.items);
          this.wishlistLoading.set(false);
        },
        error: () => {
          this.wishlistLoading.set(false);
        },
      });
  }

  loadParticipants(): void {
    this.participantsLoading.set(true);

    this.participantsService.getByEvent(this.eventId).subscribe({
      next: (participants) => {
        this.participants.set(participants);
        this.participantsLoading.set(false);
      },
      error: () => {
        this.participantsLoading.set(false);
      },
    });
  }

  generateInviteLink(): void {
    this.copySuccess.set('');

    this.eventsService.generateInviteLink(this.eventId).subscribe({
      next: (response) => {
        this.inviteLink.set(`${window.location.origin}${response.invitePath}`);
        this.toastService.success('Lien d’invitation généré.');
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message || 'Impossible de générer le lien d’invitation',
        );
      },
    });
  }

  async copyInviteLink(): Promise<void> {
    const value = this.inviteLink();

    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    this.copySuccess.set('Lien copié avec succès');
    this.toastService.success('Lien copié.');
  }

  onFilterChange(value: EventWishlistFilter): void {
    this.wishlistFilter.set(value);
    this.loadWishlist();
  }

  onSortChange(value: EventWishlistSort): void {
    this.wishlistSort.set(value);
    this.loadWishlist();
  }

  changeParticipantRole(
    participantId: number,
    role: 'CO_ORGANIZER' | 'GUEST',
  ): void {
    this.errorMessage.set('');
    this.copySuccess.set('');

    this.participantsService.updateParticipantRole(participantId, role).subscribe({
      next: () => {
        this.toastService.success('Rôle mis à jour.');
        this.loadParticipants();
        this.loadDashboard();
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message || 'Impossible de mettre à jour le rôle',
        );
      },
    });
  }
}
