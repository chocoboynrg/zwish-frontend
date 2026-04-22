export interface EventDashboard {
  event: {
    id: number;
    title: string;
    eventDate: string;
    description: string | null;
    organizer: {
      id: number;
      name: string;
      email: string;
    } | null;
  };
  wishlist: {
    id: number;
    title: string;
    description: string | null;
  } | null;
  summary: {
    participantsCount: number;
    totalItems: number;
    reservedItems: number;
    fundedItems: number;
    partiallyFundedItems: number;
    notFundedItems: number;
    totalTargetAmount: number;
    totalFundedAmount: number;
    totalRemainingAmount: number;
    fundingProgressPercent: number;
    totalContributions: number;
    confirmedContributions: number;
    awaitingPaymentContributions: number;
    confirmedContributionsAmount: number;
    totalPayments: number;
    initiatedPayments: number;
    succeededPayments: number;
    failedPayments: number;
    succeededPaymentsAmount: number;
  };
  latestContributions: Array<{
    id: number;
    amount: number;
    currencyCode: string;
    status: string;
    isAnonymous: boolean;
    message: string | null;
    confirmedAt: string | null;
    createdAt: string;
    contributor: {
      id: number;
      name: string;
    } | null;
  }>;
  latestPayments: Array<{
    id: number;
    amount: number;
    currencyCode: string;
    provider: string;
    paymentMethod: string;
    status: string;
    providerReference: string | null;
    providerTransactionId: string | null;
    confirmedAt: string | null;
    failedAt: string | null;
    createdAt: string;
    payer: {
      id: number;
      name: string;
    } | null;
  }>;
}