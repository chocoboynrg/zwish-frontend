import { UserEventView } from '../../events/services/events.service';
import { EventParticipantsResponse } from '../../events/services/participants.service';

export type WishlistFilter = 'ALL' | 'AVAILABLE' | 'RESERVED' | 'FUNDED' | 'PENDING';

export type WishlistSort =
  | 'DEFAULT'
  | 'TARGET_DESC'
  | 'REMAINING_DESC'
  | 'FUNDED_DESC'
  | 'PROGRESS_DESC';

export type WishlistItemVm = UserEventView['wishlist'][number];

export type PaymentFeedbackStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export type EventUserDetailState = {
  loading: boolean;
  error: string;
  data: UserEventView | null;

  inviteLink: string;
  copySuccess: string;
  inviteError: string;

  participants: EventParticipantsResponse | null;
  participantsLoading: boolean;
  participantsError: string;

  showParticipantsModal: boolean;

  showDeleteModal: boolean;
  deleteLoading: boolean;

  reservationLoading: boolean;
  reservationError: string;

  contributionAmount: number | null;
  contributionMessage: string;
  contributionAnonymous: boolean;
  contributionLoading: boolean;
  contributionError: string;

  wishlistSearch: string;
  selectedFilter: WishlistFilter;
  selectedSort: WishlistSort;

  selectedItem: WishlistItemVm | null;
  showItemDetailModal: boolean;
  deleteItemLoading: boolean;
  showDeleteItemModal: boolean;

  showContributionModal: boolean;
  contributionModalItem: WishlistItemVm | null;

  paymentFeedbackVisible: boolean;
  paymentFeedbackStatus: PaymentFeedbackStatus | null;
  paymentFeedbackItemId: number | null;
  paymentFeedbackMessage: string;
};

export const initialEventUserDetailState = (): EventUserDetailState => ({
  loading: true,
  error: '',
  data: null,

  inviteLink: '',
  copySuccess: '',
  inviteError: '',

  participants: null,
  participantsLoading: false,
  participantsError: '',

  showParticipantsModal: false,

  showDeleteModal: false,
  deleteLoading: false,

  reservationLoading: false,
  reservationError: '',

  contributionAmount: null,
  contributionMessage: '',
  contributionAnonymous: false,
  contributionLoading: false,
  contributionError: '',

  wishlistSearch: '',
  selectedFilter: 'ALL',
  selectedSort: 'DEFAULT',

  selectedItem: null,
  showItemDetailModal: false,
  deleteItemLoading: false,
  showDeleteItemModal: false,

  showContributionModal: false,
  contributionModalItem: null,

  paymentFeedbackVisible: false,
  paymentFeedbackStatus: null,
  paymentFeedbackItemId: null,
  paymentFeedbackMessage: '',
});