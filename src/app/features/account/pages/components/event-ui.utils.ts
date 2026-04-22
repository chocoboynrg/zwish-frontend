import { UserEventView } from '../../../events/services/events.service';

export type WishlistItem = UserEventView['wishlist'][number];

export function formatAmount(
  value: number | string | null | undefined,
  currency = 'XOF',
): string {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return `0 ${currency}`;
  }

  return `${new Intl.NumberFormat('fr-FR').format(numericValue)} ${currency}`;
}

export function formatEventDate(value: string | Date | null | undefined): string {
  if (!value) {
    return 'Date non renseignée';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'ORGANIZER':
      return 'Organisateur';
    case 'CO_ORGANIZER':
      return 'Co-organisateur';
    case 'GUEST':
      return 'Invité';
    default:
      return role || '—';
  }
}

export function formatParticipantStatus(status: string | null | undefined): string {
  switch (status) {
    case 'INVITED':
      return 'Invité';
    case 'ACCEPTED':
      return 'Accepté';
    case 'DECLINED':
      return 'Refusé';
    case 'REMOVED':
      return 'Retiré';
    default:
      return status || '—';
  }
}

export function formatFundingStatus(status: string | null | undefined): string {
  switch (status) {
    case 'NOT_FUNDED':
      return 'Non financé';
    case 'PARTIALLY_FUNDED':
      return 'Partiellement financé';
    case 'FUNDED':
      return 'Financé';
    default:
      return status || '—';
  }
}

export function formatReservationMode(mode: string | null | undefined): string {
  switch (mode) {
    case 'NONE':
      return 'Aucune';
    case 'EXCLUSIVE':
      return 'Exclusive';
    case 'COLLABORATIVE':
      return 'Collaborative';
    default:
      return mode || '—';
  }
}

export function getFundingPercent(item: WishlistItem): number {
  const target = Number(item.targetAmount ?? 0);
  const funded = Number(item.fundedAmount ?? 0);

  if (!target || target <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((funded / target) * 100)));
}

export function getSuggestedAmounts(item: WishlistItem): number[] {
  const remaining = Number(item.remainingAmount ?? 0);

  if (!Number.isFinite(remaining) || remaining <= 0) {
    return [];
  }

  const suggestions = [
    Math.min(remaining, Math.ceil(remaining * 0.25)),
    Math.min(remaining, Math.ceil(remaining * 0.5)),
    Math.min(remaining, Math.ceil(remaining * 0.75)),
    remaining,
  ].filter((value) => value > 0);

  return [...new Set(suggestions)].sort((a, b) => a - b);
}

export function getRemainingAfterContribution(
  item: WishlistItem,
  contributionAmount: number | null | undefined,
): number {
  const remaining = Number(item.remainingAmount ?? 0);
  const amount = Number(contributionAmount ?? 0);

  if (!Number.isFinite(remaining) || remaining <= 0) {
    return 0;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return remaining;
  }

  return Math.max(0, remaining - amount);
}