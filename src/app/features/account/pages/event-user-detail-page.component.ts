import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { EventUserHeaderCardComponent } from './components/event-user-header-card.component';
import { EventWishlistSectionComponent } from './components/event-wishlist-section.component';
import { WishlistItemDetailModalComponent } from './components/wishlist-item-detail-modal.component';
import { EventParticipantsModalComponent } from './components/event-participants-modal.component';
import { EventDeleteModalComponent } from './components/event-delete-modal.component';
import { EventContributionModalComponent } from './components/event-contribution-modal.component';

import { EventUserDetailFacade } from './event-user-detail.facade';
import { formatAmount } from './components/event-ui.utils';

@Component({
  selector: 'app-event-user-detail-page',
  standalone: true,
  providers: [EventUserDetailFacade],
  imports: [
    CommonModule,
    RouterLink,
    EmptyStateComponent,
    EventUserHeaderCardComponent,
    EventWishlistSectionComponent,
    WishlistItemDetailModalComponent,
    EventParticipantsModalComponent,
    EventDeleteModalComponent,
    EventContributionModalComponent,
  ],
  template: `
    <section class="page">
      <app-event-user-header-card
        *ngIf="vm().data && !vm().loading"
        [data]="vm().data!"
        [isManager]="isManager()"
        [inviteLink]="vm().inviteLink"
        [copySuccess]="vm().copySuccess"
        [inviteError]="vm().inviteError"
        (openCatalog)="facade.openCatalog()"
        (openProductRequests)="facade.openProductRequestsPage()"
        (openParticipants)="facade.openParticipantsModal()"
        (generateInviteLink)="facade.generateInviteLink()"
        (copyInviteLink)="facade.copyInviteLink()"
      />

      <ng-container *ngIf="!vm().data || vm().loading">
        <div class="page-header">
          <div>
            <a routerLink="/app/events" class="back-link">← Retour à mes événements</a>
            <h1>Détail événement</h1>
            <p class="subtitle" *ngIf="vm().data">{{ vm().data?.event?.title }}</p>
          </div>
        </div>
      </ng-container>

      <div *ngIf="vm().loading" class="state-card">
        Chargement de l’événement...
      </div>

      <div *ngIf="vm().error && !vm().loading" class="state-card error">
        {{ vm().error }}
      </div>

      <ng-container *ngIf="vm().data && !vm().loading">
        <section class="content-single-column">
          <section
            class="payment-feedback-banner"
            *ngIf="vm().paymentFeedbackVisible && vm().paymentFeedbackStatus"
            [ngClass]="{
              'payment-feedback-success': vm().paymentFeedbackStatus === 'SUCCESS',
              'payment-feedback-pending': vm().paymentFeedbackStatus === 'PENDING',
              'payment-feedback-failed': vm().paymentFeedbackStatus === 'FAILED'
            }"
          >
            <div class="payment-feedback-icon">
              <span *ngIf="vm().paymentFeedbackStatus === 'SUCCESS'">✓</span>
              <span *ngIf="vm().paymentFeedbackStatus === 'PENDING'">⏳</span>
              <span *ngIf="vm().paymentFeedbackStatus === 'FAILED'">!</span>
            </div>

            <div class="payment-feedback-content">
              <div class="payment-feedback-eyebrow">Retour paiement</div>
              <h2 class="payment-feedback-title">{{ facade.getPaymentFeedbackTitle() }}</h2>
              <p class="payment-feedback-text">{{ facade.getPaymentFeedbackMessage() }}</p>

              <div class="payment-feedback-meta" *ngIf="vm().paymentFeedbackItemId">
                Paiement #{{ vm().paymentFeedbackItemId }}
              </div>
            </div>

            <div class="payment-feedback-actions">
              <button
                type="button"
                class="btn btn-secondary"
                *ngIf="vm().paymentFeedbackStatus === 'FAILED' && vm().contributionModalItem"
                (click)="facade.retryContributionAfterFailure()"
              >
                Réessayer
              </button>

              <button
                type="button"
                class="btn btn-secondary"
                *ngIf="vm().paymentFeedbackItemId"
                (click)="facade.openPaymentDetails()"
              >
                Voir mes paiements
              </button>

              <button
                type="button"
                class="btn btn-ghost-detail"
                (click)="facade.dismissPaymentFeedback()"
              >
                Fermer
              </button>
            </div>
          </section>

          <app-event-wishlist-section
            [data]="vm().data!"
            [filteredWishlist]="filteredWishlist()"
            [wishlistSearch]="vm().wishlistSearch"
            [selectedFilter]="vm().selectedFilter"
            [selectedSort]="vm().selectedSort"
            [contributionError]="vm().contributionError"
            [reservationError]="vm().reservationError"
            [contributionLoading]="vm().contributionLoading"
            [reservationLoading]="vm().reservationLoading"
            (wishlistSearchChange)="facade.setWishlistSearch($event)"
            (selectedFilterChange)="facade.setSelectedFilter($event)"
            (selectedSortChange)="facade.setSelectedSort($event)"
            (openItemDetail)="facade.openItemDetail($event)"
            (handleContribution)="facade.handleContributionAction($event)"
            (reserveItem)="facade.reserveItem($event)"
          />

          <section class="stats-row stats-row-bottom">
            <article class="stat-card">
              <span class="stat-label">Items</span>
              <strong class="stat-value">{{ vm().data?.summary?.totalItems }}</strong>
            </article>

            <article class="stat-card">
              <span class="stat-label">Montant cible</span>
              <strong class="stat-value">{{ formatAmount(vm().data?.summary?.totalTargetAmount) }}</strong>
            </article>

            <article class="stat-card">
              <span class="stat-label">Montant financé</span>
              <strong class="stat-value">{{ formatAmount(vm().data?.summary?.totalFundedAmount) }}</strong>
            </article>

            <article class="stat-card">
              <span class="stat-label">Reste à financer</span>
              <strong class="stat-value">{{ formatAmount(vm().data?.summary?.totalRemainingAmount) }}</strong>
            </article>
          </section>

          <section
            class="card section-card danger-zone"
            *ngIf="vm().data?.accessRole === 'ORGANIZER'"
          >
            <div class="section-header">
              <div>
                <div class="section-kicker">Zone dangereuse</div>
                <h2>Supprimer l’événement</h2>
              </div>
            </div>

            <p class="section-description">
              Cette action est irréversible. Elle supprime l’événement et les données liées
              uniquement si aucun paiement déjà effectué n’existe.
            </p>

            <p class="error-text" *ngIf="!canDeleteEvent()">
              {{ deleteBlockedReason() }}
            </p>

            <button
              type="button"
              class="btn btn-danger"
              [disabled]="!canDeleteEvent()"
              [title]="!canDeleteEvent() ? deleteBlockedReason() : 'Supprimer l’événement'"
              (click)="facade.openDeleteModal()"
            >
              Supprimer l’événement
            </button>
          </section>
        </section>
      </ng-container>
    </section>

    <app-wishlist-item-detail-modal
      [show]="vm().showItemDetailModal"
      [selectedItem]="vm().selectedItem"
      [isManager]="isManager()"
      [deleteItemLoading]="vm().deleteItemLoading"
      [canDeleteSelectedItem]="canDeleteSelectedItem()"
      [deleteSelectedItemBlockedReason]="deleteSelectedItemBlockedReason()"
      [contributionLoading]="vm().contributionLoading"
      [reservationLoading]="vm().reservationLoading"
      (close)="facade.closeItemDetailModal()"
      (contribute)="facade.handleContributionAction($event)"
      (reserve)="facade.reserveItem($event)"
      (delete)="facade.openDeleteItemModal()"
    />

    <app-event-participants-modal
      [show]="vm().showParticipantsModal"
      [participants]="vm().participants"
      [participantsLoading]="vm().participantsLoading"
      [participantsError]="vm().participantsError"
      [accessRole]="vm().data?.accessRole ?? null"
      (close)="facade.closeParticipantsModal()"
      (changeRole)="facade.changeParticipantRole($event.participantId, $event.role)"
    />

    <app-event-delete-modal
      [show]="vm().showDeleteModal"
      [deleteLoading]="vm().deleteLoading"
      [title]="vm().data?.event?.title ?? ''"
      [mode]="'event'"
      (close)="facade.closeDeleteModal()"
      (confirm)="facade.deleteEvent()"
    />

    <app-event-delete-modal
      [show]="vm().showDeleteItemModal"
      [deleteLoading]="vm().deleteItemLoading"
      [title]="vm().selectedItem?.name ?? ''"
      [mode]="'item'"
      (close)="facade.closeDeleteItemModal()"
      (confirm)="facade.confirmDeleteSelectedItem()"
    />

    <app-event-contribution-modal
      [show]="vm().showContributionModal"
      [item]="vm().contributionModalItem"
      [contributionAmount]="vm().contributionAmount"
      [contributionMessage]="vm().contributionMessage"
      [contributionAnonymous]="vm().contributionAnonymous"
      [contributionLoading]="vm().contributionLoading"
      [contributionError]="vm().contributionError"
      (close)="facade.closeContributionModal()"
      (contributionAmountChange)="facade.setContributionAmount($event)"
      (contributionMessageChange)="facade.setContributionMessage($event)"
      (contributionAnonymousChange)="facade.setContributionAnonymous($event)"
      (submit)="facade.submitContribution($event)"
    />
  `,
  styles: [`
    :host { display: block; }
    .page { display: flex; flex-direction: column; gap: 24px; color: #111827; }
    .page-header h1 { margin: 8px 0 6px; font-size: clamp(1.8rem, 3vw, 2.2rem); color: #111827; }
    .back-link { color: #ea580c; text-decoration: none; font-weight: 700; }
    .subtitle { margin: 0; color: #6b7280; }

    .card, .state-card, .stat-card, .payment-feedback-banner {
      background: #ffffff;
      border: 1px solid #f3e8e2;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .card, .state-card { padding: 20px; }
    .section-card { padding: 22px; }
    .state-card.error, .error-text { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
    .content-single-column { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      align-items: stretch;
    }

    .stat-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 108px;
      justify-content: center;
    }

    .stat-label { color: #6b7280; font-size: 14px; }
    .stat-value { font-size: 1.35rem; line-height: 1.2; color: #111827; word-break: break-word; }

    .payment-feedback-banner {
      padding: 20px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 18px;
      align-items: center;
    }

    .payment-feedback-success { border-color: #bbf7d0; background: linear-gradient(135deg, #f0fdf4, #ffffff); }
    .payment-feedback-pending { border-color: #fde68a; background: linear-gradient(135deg, #fffbea, #ffffff); }
    .payment-feedback-failed { border-color: #fecaca; background: linear-gradient(135deg, #fef2f2, #ffffff); }

    .payment-feedback-icon {
      width: 56px;
      height: 56px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 800;
      flex-shrink: 0;
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(0,0,0,0.05);
    }

    .payment-feedback-success .payment-feedback-icon { color: #15803d; }
    .payment-feedback-pending .payment-feedback-icon { color: #a16207; }
    .payment-feedback-failed .payment-feedback-icon { color: #b91c1c; }

    .payment-feedback-eyebrow {
      color: #6b7280;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }

    .payment-feedback-title { margin: 0 0 6px; font-size: 1.2rem; color: #111827; }
    .payment-feedback-text { margin: 0; color: #4b5563; line-height: 1.6; }
    .payment-feedback-meta { margin-top: 8px; font-size: 0.9rem; font-weight: 700; color: #6b7280; }
    .payment-feedback-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; align-items: center; }

    .btn {
      border: 0;
      border-radius: 14px;
      padding: 11px 16px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }

    .btn-secondary { background: #fff7f3; color: #9a3412; border: 1px solid #f3dfd4; }
    .btn-danger { background: #dc2626; color: #ffffff; }
    .btn-ghost-detail { background: #ffffff; color: #374151; border: 1px solid #e5e7eb; }

    .danger-zone { border-color: #fecaca; background: linear-gradient(180deg, #fff7f7 0%, #ffffff 100%); }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
    }

    .section-header h2 { margin: 4px 0 0; font-size: 1.3rem; line-height: 1.2; }
    .section-kicker { color: #ea580c; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .section-description { margin: 0; color: #4b5563; line-height: 1.7; }

    @media (max-width: 960px) {
      .stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .payment-feedback-banner { grid-template-columns: 1fr; }
      .payment-feedback-actions { justify-content: flex-start; }
    }

    @media (max-width: 640px) {
      .stats-row { grid-template-columns: 1fr; }
      .payment-feedback-actions { flex-direction: column; align-items: stretch; }
    }
  `],
})
export class EventUserDetailPageComponent implements OnInit {
  readonly facade = inject(EventUserDetailFacade);

  readonly vm = this.facade.state;
  readonly filteredWishlist = this.facade.filteredWishlist;
  readonly isManager = this.facade.isManager;
  readonly canDeleteEvent = this.facade.canDeleteEvent;
  readonly deleteBlockedReason = this.facade.deleteBlockedReason;
  readonly canDeleteSelectedItem = this.facade.canDeleteSelectedItem;
  readonly deleteSelectedItemBlockedReason = this.facade.deleteSelectedItemBlockedReason;

  readonly formatAmount = formatAmount;

  ngOnInit(): void {
    this.facade.init();
  }
}