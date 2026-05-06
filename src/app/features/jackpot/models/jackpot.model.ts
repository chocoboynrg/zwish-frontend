// src/app/features/jackpot/models/jackpot.model.ts

export type JackpotStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
export type JackpotVisibility = 'PUBLIC' | 'PRIVATE';

export interface Jackpot {
  id: number;
  shareToken: string;
  title: string;
  description: string | null;
  purposeCategory: string | null;
  contributorMessage: string | null;
  imageUrl: string | null;
  targetAmount: number;
  collectedAmount: number;
  currencyCode: string;
  deadlineAt: string | null;
  status: JackpotStatus;
  visibility: JackpotVisibility;
  reviewComment: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  owner: { id: number; name: string };
  reviewedBy?: { id: number; name: string } | null;
}

export interface CreateJackpotDto {
  title: string;
  description?: string;
  purposeCategory?: string;
  contributorMessage?: string;
  imageUrl?: string;
  targetAmount: number;
  currencyCode?: string;
  deadlineAt?: string;
  visibility?: JackpotVisibility;
}

export const PURPOSE_CATEGORIES = [
  { value: 'voyage',     label: '✈️ Voyage / Lune de miel' },
  { value: 'sante',      label: '🏥 Santé / Opération' },
  { value: 'etudes',     label: '🎓 Études / Formation' },
  { value: 'maison',     label: '🏠 Maison / Équipement' },
  { value: 'bebe',       label: '👶 Naissance / Bébé' },
  { value: 'projet',     label: '💡 Projet personnel' },
  { value: 'solidarite', label: '🤝 Solidarité / Aide' },
  { value: 'autre',      label: '🎯 Autre' },
];

export const SUGGESTED_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

export const STATUS_META: Record<JackpotStatus, { label: string; emoji: string; bg: string; color: string; desc: string }> = {
  PENDING:  { label: 'En attente', emoji: '⏳', bg: '#fef3c7', color: '#92400e', desc: 'En attente de validation par notre équipe.' },
  APPROVED: { label: 'Actif',      emoji: '✅', bg: '#dcfce7', color: '#166534', desc: 'Votre jackpot est actif. Partagez le lien !' },
  REJECTED: { label: 'Refusé',     emoji: '❌', bg: '#fee2e2', color: '#991b1b', desc: 'Votre demande a été refusée.' },
  CLOSED:   { label: 'Clôturé',    emoji: '🔒', bg: '#f3f4f6', color: '#6b7280', desc: 'Ce jackpot est clôturé.' },
};