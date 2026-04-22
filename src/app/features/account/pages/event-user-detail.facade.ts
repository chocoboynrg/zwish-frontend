import { Injectable, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { EventsService, UserEventView } from '../../events/services/events.service';
import {
  ParticipantsService,
  EventParticipantsResponse,
} from '../../events/services/participants.service';
import {
  CreateUserContributionResponse,
  UserContributionService,
} from '../services/user-contribution.service';
import { UserReservationService } from '../services/user-reservation.service';
import {
  PaymentItem,
  UserPaymentService,
} from '../services/user-payment.service';
import { UserWishlistItemService } from '../services/user-wishlist-item.service';
import { ToastService } from '../../../core/services/toast.service';

import {
  EventUserDetailState,
  initialEventUserDetailState,
  WishlistItemVm,
} from './event-user-detail.types';
import { getFundingPercent } from './components/event-ui.utils';

@Injectable()
export class EventUserDetailFacade {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventsService = inject(EventsService);
  private readonly participantsService = inject(ParticipantsService);
  private readonly userContributionService = inject(UserContributionService);
  private readonly userReservationService = inject(UserReservationService);
  private readonly userPaymentService = inject(UserPaymentService);
  private readonly userWishlistItemService = inject(UserWishlistItemService);
  private readonly toastService = inject(ToastService);

  readonly state = signal<EventUserDetailState>(initialEventUserDetailState());

  readonly data = computed(() => this.state().data);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  readonly isManager = computed(() => {
    const role = this.state().data?.accessRole;
    return role === 'ORGANIZER' || role === 'CO_ORGANIZER';
  });

  readonly canDeleteEvent = computed(() => {
    const data = this.state().data;
    return data?.accessRole === 'ORGANIZER' && data?.event?.canDelete === true;
  });

  readonly deleteBlockedReason = computed(() => {
    return (
      this.state().data?.event?.deleteBlockedReason ||
      'Suppression impossible pour cet événement.'
    );
  });

  readonly canDeleteSelectedItem = computed(() => {
    const item = this.state().selectedItem;
    if (!this.isManager() || !item) return false;
    if (item.isReserved) return false;
    if (item.hasPendingContribution) return false;
    if (Number(item.fundedAmount ?? 0) > 0) return false;
    return true;
  });

  readonly deleteSelectedItemBlockedReason = computed(() => {
    const item = this.state().selectedItem;
    if (!this.isManager() || !item) return 'Suppression indisponible.';
    if (item.isReserved) return "Impossible de supprimer : l'item est réservé.";
    if (item.hasPendingContribution) return 'Impossible de supprimer : une contribution est en cours.';
    if (Number(item.fundedAmount ?? 0) > 0) {
      return 'Impossible de supprimer : un paiement validé existe déjà sur cet item.';
    }
    return '';
  });

  readonly filteredWishlist = computed(() => {
    const state = this.state();
    const items = [...(state.data?.wishlist ?? [])];
    const search = state.wishlistSearch.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const matchesSearch = !search || item.name.toLowerCase().includes(search);

      const matchesFilter = (() => {
        switch (state.selectedFilter) {
          case 'AVAILABLE':
            return !item.isReserved && item.fundingStatus !== 'FUNDED';
          case 'RESERVED':
            return item.isReserved;
          case 'FUNDED':
            return item.fundingStatus === 'FUNDED';
          case 'PENDING':
            return item.hasPendingContribution;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      switch (state.selectedSort) {
        case 'TARGET_DESC':
          return Number(b.targetAmount ?? 0) - Number(a.targetAmount ?? 0);
        case 'REMAINING_DESC':
          return Number(b.remainingAmount ?? 0) - Number(a.remainingAmount ?? 0);
        case 'FUNDED_DESC':
          return Number(b.fundedAmount ?? 0) - Number(a.fundedAmount ?? 0);
        case 'PROGRESS_DESC':
          return getFundingPercent(b) - getFundingPercent(a);
        default:
          return 0;
      }
    });

    return filtered;
  });

  init(): void {
    this.readPaymentFeedbackFromQueryParams();
    this.loadEvent();
  }

  setWishlistSearch(value: string): void {
    this.patch({ wishlistSearch: value });
  }

  setSelectedFilter(value: EventUserDetailState['selectedFilter']): void {
    this.patch({ selectedFilter: value });
  }

  setSelectedSort(value: EventUserDetailState['selectedSort']): void {
    this.patch({ selectedSort: value });
  }

  setContributionAmount(value: number | null): void {
    this.patch({ contributionAmount: value });
  }

  setContributionMessage(value: string): void {
    this.patch({ contributionMessage: value });
  }

  setContributionAnonymous(value: boolean): void {
    this.patch({ contributionAnonymous: value });
  }

  openCatalog(): void {
    const eventId = this.state().data?.event?.id;

    if (!this.isManager() || !eventId) {
      this.toastService.error('Impossible de retrouver cet événement.');
      return;
    }

    this.router.navigate(['/catalog'], {
      queryParams: { eventId },
    });
  }

  openProductRequestsPage(): void {
    const event = this.state().data?.event;

    if (!this.isManager() || !event?.id || !event?.wishlistId) {
      this.toastService.error('Impossible d’ouvrir les demandes produit pour cet événement.');
      return;
    }

    this.router.navigate(['/app/product-requests'], {
      queryParams: {
        eventId: event.id,
        wishlistId: event.wishlistId,
      },
    });
  }

  openParticipantsModal(): void {
    this.patch({ showParticipantsModal: true });

    const eventId = this.state().data?.event?.id;
    const hasParticipants = this.state().participants;
    const isLoading = this.state().participantsLoading;

    if (eventId && !hasParticipants && !isLoading) {
      this.loadParticipants(eventId);
    }
  }

  closeParticipantsModal(): void {
    this.patch({ showParticipantsModal: false });
  }

  openItemDetail(item: WishlistItemVm): void {
    this.patch({
      selectedItem: item,
      showItemDetailModal: true,
    });
  }

  closeItemDetailModal(): void {
    if (this.state().deleteItemLoading) return;

    this.patch({
      showDeleteItemModal: false,
      showItemDetailModal: false,
      selectedItem: null,
    });
  }

  openDeleteItemModal(): void {
    if (!this.state().selectedItem || this.state().deleteItemLoading || !this.canDeleteSelectedItem()) {
      return;
    }

    this.patch({ showDeleteItemModal: true });
  }

  closeDeleteItemModal(): void {
    if (this.state().deleteItemLoading) return;
    this.patch({ showDeleteItemModal: false });
  }

  confirmDeleteSelectedItem(): void {
    const selectedItem = this.state().selectedItem;

    if (!selectedItem || this.state().deleteItemLoading || !this.canDeleteSelectedItem()) {
      return;
    }

    this.patch({ deleteItemLoading: true });

    this.userWishlistItemService.deleteWishlistItem(selectedItem.id).subscribe({
      next: () => {
        this.patch({
          deleteItemLoading: false,
          showDeleteItemModal: false,
          showItemDetailModal: false,
          selectedItem: null,
        });
        this.toastService.success('Item supprimé avec succès.');
        this.loadEvent();
      },
      error: (err: { error?: { message?: string } }) => {
        this.patch({ deleteItemLoading: false });
        const message = err?.error?.message || "Impossible de supprimer cet item.";
        this.toastService.error(message);
      },
    });
  }

  openContributionModal(item: WishlistItemVm): void {
    if (!item.canContribute && !item.pendingContributionByMe) return;

    const suggestions = this.getSuggestedAmounts(item);

    this.patch({
      contributionError: '',
      contributionModalItem: item,
      showContributionModal: true,
      contributionAmount:
        item.remainingAmount > 0
          ? (suggestions[1] ?? suggestions[0] ?? item.remainingAmount)
          : null,
      contributionMessage: '',
      contributionAnonymous: false,
    });
  }

  closeContributionModal(): void {
    if (this.state().contributionLoading) return;

    this.patch({
      showContributionModal: false,
      contributionModalItem: null,
      contributionAmount: null,
      contributionMessage: '',
      contributionAnonymous: false,
      contributionError: '',
    });
  }

  reserveItem(wishlistItemId: number): void {
    const data = this.state().data;
    if (this.state().reservationLoading || !data) return;

    this.patch({
      reservationLoading: true,
      reservationError: '',
    });

    this.userReservationService.createReservation({
      wishlistItemId,
      eventId: data.event.id,
    }).subscribe({
      next: () => {
        this.patch({ reservationLoading: false });
        this.toastService.success('Item réservé avec succès.');
        this.loadEvent();
      },
      error: () => {
        this.patch({
          reservationLoading: false,
          reservationError: 'Impossible de réserver cet item.',
        });
      },
    });
  }

  handleContributionAction(item: WishlistItemVm): void {
    if (item.pendingContributionByMe && item.pendingPaymentId) {
      this.router.navigate(['/app/payments', item.pendingPaymentId]);
      return;
    }

    this.openContributionModal(item);
  }

  submitContribution(wishlistItemId: number): void {
    const amount = this.state().contributionAmount;

    if (!amount || amount <= 0 || this.state().contributionLoading) {
      this.patch({ contributionError: 'Veuillez saisir un montant valide.' });
      return;
    }

    this.patch({
      contributionLoading: true,
      contributionError: '',
    });

    this.userContributionService.createContribution({
      wishlistItemId,
      amount,
      currencyCode: 'XOF',
      isAnonymous: this.state().contributionAnonymous,
      message: this.state().contributionMessage || null,
    }).subscribe({
      next: (contribution: CreateUserContributionResponse) => {
        this.userPaymentService.createPayment({
          contributionId: contribution.id,
          provider: 'OTHER',
          paymentMethod: 'MOBILE_MONEY',
        }).subscribe({
          next: (payment: PaymentItem) => {
            this.patch({ contributionLoading: false });
            this.closeContributionModal();

            if (payment.paymentUrl) {
              window.location.href = payment.paymentUrl;
              return;
            }

            this.patch({
              paymentFeedbackStatus: 'PENDING',
              paymentFeedbackVisible: true,
              paymentFeedbackItemId: payment.id ?? null,
              paymentFeedbackMessage:
                'Le paiement a été initialisé. Vous pouvez suivre son évolution dans vos paiements.',
            });

            this.toastService.success('Contribution créée et paiement initialisé avec succès.');
            this.loadEvent();
            this.router.navigate(['/app/payments']);
          },
          error: () => {
            this.patch({
              contributionLoading: false,
              paymentFeedbackStatus: 'FAILED',
              paymentFeedbackVisible: true,
              paymentFeedbackMessage: 'Contribution créée, mais paiement non initialisé.',
              contributionError: 'Contribution créée, mais paiement non initialisé.',
            });
            this.loadEvent();
          },
        });
      },
      error: () => {
        this.patch({
          contributionLoading: false,
          paymentFeedbackStatus: 'FAILED',
          paymentFeedbackVisible: true,
          paymentFeedbackMessage: 'Impossible de créer la contribution.',
          contributionError: 'Impossible de créer la contribution.',
        });
      },
    });
  }

  openDeleteModal(): void {
    if (!this.state().data) return;

    if (!this.canDeleteEvent()) {
      this.toastService.error(this.deleteBlockedReason());
      return;
    }

    this.patch({ showDeleteModal: true });
  }

  closeDeleteModal(): void {
    if (this.state().deleteLoading) return;
    this.patch({ showDeleteModal: false });
  }

  deleteEvent(): void {
    const data = this.state().data;

    if (!data || !this.canDeleteEvent() || this.state().deleteLoading) {
      this.toastService.error(this.deleteBlockedReason());
      return;
    }

    this.patch({ deleteLoading: true });

    this.eventsService.deleteEvent(data.event.id).subscribe({
      next: () => {
        this.patch({
          deleteLoading: false,
          showDeleteModal: false,
        });
        this.toastService.success('Événement supprimé');
        this.router.navigate(['/app/events']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.patch({ deleteLoading: false });
        const message = err?.error?.message || 'Impossible de supprimer cet événement';
        this.toastService.error(message);
      },
    });
  }

  generateInviteLink(): void {
    const data = this.state().data;
    if (!data) return;

    this.patch({
      copySuccess: '',
      inviteError: '',
    });

    this.eventsService.generateInviteLink(data.event.id).subscribe({
      next: (response) => {
        this.patch({
          inviteLink: `${window.location.origin}${response.invitePath}`,
        });
        this.toastService.success('Lien d’invitation généré.');
      },
      error: () => {
        this.patch({ inviteError: 'Impossible de générer le lien d’invitation.' });
      },
    });
  }

  async copyInviteLink(): Promise<void> {
    const inviteLink = this.state().inviteLink;
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      this.patch({
        copySuccess: 'Lien copié avec succès',
        inviteError: '',
      });
      this.toastService.success('Lien copié.');
    } catch {
      this.patch({ inviteError: 'Impossible de copier le lien.' });
    }
  }

  dismissPaymentFeedback(): void {
    this.patch({ paymentFeedbackVisible: false });
    this.clearPaymentFeedbackQueryParams();
  }

  openPaymentDetails(): void {
    const paymentId = this.state().paymentFeedbackItemId;

    if (paymentId) {
      this.router.navigate(['/app/payments', paymentId]);
      return;
    }

    this.router.navigate(['/app/payments']);
  }

  retryContributionAfterFailure(): void {
    this.patch({ paymentFeedbackVisible: false });
    this.clearPaymentFeedbackQueryParams();

    const item = this.state().contributionModalItem;
    if (item) {
      this.openContributionModal(item);
    }
  }

  changeParticipantRole(
    participantId: number,
    role: 'CO_ORGANIZER' | 'GUEST',
  ): void {
    const data = this.state().data;
    if (!data || data.accessRole !== 'ORGANIZER') return;

    this.participantsService.updateParticipantRole(participantId, role).subscribe({
      next: () => {
        this.toastService.success('Rôle participant mis à jour.');
        this.loadParticipants(data.event.id);
      },
      error: () => {
        this.toastService.error('Impossible de modifier le rôle du participant.');
      },
    });
  }

  getPaymentFeedbackTitle(): string {
    switch (this.state().paymentFeedbackStatus) {
      case 'SUCCESS':
        return 'Paiement confirmé';
      case 'PENDING':
        return 'Paiement en attente';
      case 'FAILED':
        return 'Paiement échoué';
      default:
        return '';
    }
  }

  getPaymentFeedbackMessage(): string {
    const message = this.state().paymentFeedbackMessage;
    if (message?.trim()) return message;

    switch (this.state().paymentFeedbackStatus) {
      case 'SUCCESS':
        return 'Votre contribution a bien été enregistrée. La wishlist va se mettre à jour avec les dernières informations.';
      case 'PENDING':
        return 'Votre paiement est en cours de validation. Vous pouvez revenir plus tard ou suivre son évolution dans vos paiements.';
      case 'FAILED':
        return 'Le paiement n’a pas abouti. Vous pouvez réessayer ou consulter le détail du paiement.';
      default:
        return '';
    }
  }

  private readPaymentFeedbackFromQueryParams(): void {
    const rawStatus = this.route.snapshot.queryParamMap.get('paymentStatus');
    const rawPaymentItemId = this.route.snapshot.queryParamMap.get('paymentItemId');
    const rawMessage = this.route.snapshot.queryParamMap.get('paymentMessage');

    if (!rawStatus) return;

    let status: EventUserDetailState['paymentFeedbackStatus'] = null;

    switch (rawStatus.toLowerCase()) {
      case 'success':
        status = 'SUCCESS';
        break;
      case 'pending':
        status = 'PENDING';
        break;
      case 'failed':
      case 'error':
        status = 'FAILED';
        break;
      default:
        status = null;
    }

    if (!status) return;

    const parsedPaymentItemId = Number(rawPaymentItemId);

    this.patch({
      paymentFeedbackVisible: true,
      paymentFeedbackStatus: status,
      paymentFeedbackMessage: rawMessage ?? '',
      paymentFeedbackItemId:
        rawPaymentItemId && Number.isFinite(parsedPaymentItemId)
          ? parsedPaymentItemId
          : null,
    });
  }

  private clearPaymentFeedbackQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        paymentStatus: null,
        paymentItemId: null,
        paymentMessage: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private loadParticipants(eventId: number): void {
    this.patch({
      participantsLoading: true,
      participantsError: '',
    });

    this.participantsService.getByEvent(eventId).subscribe({
      next: (res: EventParticipantsResponse) => {
        this.patch({
          participants: res,
          participantsLoading: false,
        });
      },
      error: () => {
        this.patch({
          participantsError: 'Impossible de charger les participants.',
          participantsLoading: false,
        });
      },
    });
  }

  private loadEvent(): void {
    const eventId = Number(this.route.snapshot.paramMap.get('id'));

    if (!eventId || Number.isNaN(eventId)) {
      this.patch({
        loading: false,
        error: 'Identifiant événement invalide.',
      });
      return;
    }

    this.patch({
      loading: true,
      error: '',
    });

    this.eventsService.getMyEventView(eventId).subscribe({
      next: (response: UserEventView) => {
        this.patch({
          data: response,
          loading: false,
        });

        if (
          response.accessRole === 'ORGANIZER' ||
          response.accessRole === 'CO_ORGANIZER'
        ) {
          this.loadParticipants(response.event.id);
        } else {
          this.patch({
            participants: null,
            participantsError: '',
            participantsLoading: false,
          });
        }

        const selectedItem = this.state().selectedItem;
        if (selectedItem) {
          const refreshedSelected =
            response.wishlist.find((w) => w.id === selectedItem.id) ?? null;

          this.patch({
            selectedItem: refreshedSelected,
            showDeleteItemModal: refreshedSelected ? this.state().showDeleteItemModal : false,
            showItemDetailModal: refreshedSelected ? this.state().showItemDetailModal : false,
          });
        }

        const contributionItem = this.state().contributionModalItem;
        if (contributionItem) {
          const refreshedContribution =
            response.wishlist.find((w) => w.id === contributionItem.id) ?? null;

          if (!refreshedContribution) {
            this.closeContributionModal();
          } else {
            this.patch({ contributionModalItem: refreshedContribution });
          }
        }
      },
      error: (error: { error?: { message?: string } }) => {
        this.patch({
          loading: false,
          error: error?.error?.message || 'Impossible de charger le détail de l’événement.',
        });
      },
    });
  }

  private getSuggestedAmounts(item: WishlistItemVm): number[] {
    const remaining = Number(item.remainingAmount ?? 0);
    if (!Number.isFinite(remaining) || remaining <= 0) return [];

    const suggestions = [
      Math.min(remaining, Math.ceil(remaining * 0.25)),
      Math.min(remaining, Math.ceil(remaining * 0.5)),
      Math.min(remaining, Math.ceil(remaining * 0.75)),
      remaining,
    ].filter((value) => value > 0);

    return [...new Set(suggestions)].sort((a, b) => a - b);
  }

  private patch(patch: Partial<EventUserDetailState>): void {
    this.state.update((current) => ({ ...current, ...patch }));
  }
}