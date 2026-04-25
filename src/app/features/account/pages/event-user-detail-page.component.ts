import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { EventWishlistSectionComponent } from './components/event-wishlist-section.component';
import { WishlistItemDetailModalComponent } from './components/wishlist-item-detail-modal.component';
import { EventParticipantsModalComponent } from './components/event-participants-modal.component';
import { EventDeleteModalComponent } from './components/event-delete-modal.component';
import { EventContributionModalComponent } from './components/event-contribution-modal.component';
import { EventUserDetailFacade } from './event-user-detail.facade';
import { formatAmount } from './components/event-ui.utils';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-event-user-detail-page',
  standalone: true,
  providers: [EventUserDetailFacade],
  imports: [
    CommonModule,
    RouterLink,
    EventWishlistSectionComponent,
    WishlistItemDetailModalComponent,
    EventParticipantsModalComponent,
    EventDeleteModalComponent,
    EventContributionModalComponent,
  ],
  template: `
    <div class="detail-page">

      <!-- LOADING -->
      <div class="loading-screen" *ngIf="vm().loading">
        <div class="loading-inner">
          <div class="loading-spinner"></div>
          <p>Chargement de l'événement...</p>
        </div>
      </div>

      <!-- ERREUR -->
      <div class="error-screen" *ngIf="vm().error && !vm().loading">
        <div class="error-inner">
          <div class="error-icon">⚠️</div>
          <h2>Impossible de charger cet événement</h2>
          <p>{{ vm().error }}</p>
          <a routerLink="/app/events" class="btn-back">← Retour à mes événements</a>
        </div>
      </div>

      <!-- CONTENU -->
      <ng-container *ngIf="vm().data && !vm().loading">

        <!-- HERO -->
        <div class="event-hero">
          <div class="event-hero-inner">

            <div class="hero-top-bar">
              <a routerLink="/app/events" class="back-link">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Mes événements
              </a>
              <div class="hero-top-actions" *ngIf="isManager()">
                <span class="archived-pill" *ngIf="vm().data!.event.isArchived">
                  📦 Archivé
                </span>
                <button class="btn-action-ghost" (click)="facade.openCatalog()">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Catalogue
                </button>
                <button class="btn-action-ghost" (click)="facade.openParticipantsModal()">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a4 4 0 00-4-4h-.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                  Participants
                </button>
              </div>
            </div>

            <div class="hero-content">
              <div class="hero-main">
                <div class="hero-badges">
                  <span class="role-badge" [ngClass]="getRoleBadgeClass(vm().data!.accessRole)">
                    {{ formatRoleLabel(vm().data!.accessRole) }}
                  </span>
                  <span class="event-date-badge">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    {{ formatDate(vm().data!.event.eventDate) }}
                  </span>
                </div>
                <h1>{{ vm().data!.event.title }}</h1>
                <p class="hero-desc" *ngIf="vm().data!.event.description">{{ vm().data!.event.description }}</p>
                <p class="hero-desc muted" *ngIf="!vm().data!.event.description">Aucune description renseignée.</p>
                <div class="organizer-tag" *ngIf="!isManager() && vm().data!.event.organizer">
                  <div class="org-avatar">{{ getInitials(vm().data!.event.organizer!.name) }}</div>
                  <div>
                    <div class="org-label">Organisé par</div>
                    <div class="org-name">{{ vm().data!.event.organizer!.name }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats horizontales -->
            <div class="hero-stats-row">
              <div class="stat-block">
                <div class="stat-label">Collecté</div>
                <div class="stat-value accent">{{ fmt(vm().data!.summary.totalFundedAmount) }}</div>
                <div class="stat-sub">sur {{ fmt(vm().data!.summary.totalTargetAmount) }}</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-block">
                <div class="stat-label">Reste à financer</div>
                <div class="stat-value">{{ fmt(vm().data!.summary.totalRemainingAmount) }}</div>
                <div class="stat-sub">à collecter</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-block">
                <div class="stat-label">Items</div>
                <div class="stat-value">{{ vm().data!.summary.totalItems }}</div>
                <div class="stat-sub">dans la wishlist</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-block">
                <div class="stat-label">Participants</div>
                <div class="stat-value">{{ vm().data!.summary.participantsCount }}</div>
                <div class="stat-sub">invités</div>
              </div>
            </div>

            <!-- Progress -->
            <div class="global-progress" *ngIf="vm().data!.summary.totalTargetAmount > 0">
              <div class="progress-header">
                <span>Progression globale</span>
                <span class="progress-pct">{{ globalPercent() }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width]="globalPercent() + '%'"></div>
              </div>
            </div>

            <!-- Invitation -->
            <div class="invite-section" *ngIf="isManager() && !vm().data!.event.isArchived">
              <div class="invite-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                <span>Lien d'invitation</span>
              </div>
              <div class="invite-right">
                <div class="invite-link-box" *ngIf="vm().inviteLink">
                  <input class="invite-input" [value]="vm().inviteLink" readonly />
                  <button class="btn-copy" (click)="facade.copyInviteLink()">
                    {{ vm().copySuccess ? '✓ Copié !' : 'Copier' }}
                  </button>
                </div>
                <button class="btn-generate" (click)="facade.generateInviteLink()">
                  {{ vm().inviteLink ? 'Regénérer' : 'Générer le lien' }}
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- BODY -->
        <div class="event-body">
          <div class="event-body-inner">

            <!-- Feedback paiement -->
            <div class="payment-feedback success" *ngIf="vm().paymentFeedbackVisible && vm().paymentFeedbackStatus === 'SUCCESS'">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              {{ vm().paymentFeedbackMessage }}
            </div>
            <div class="payment-feedback pending" *ngIf="vm().paymentFeedbackVisible && vm().paymentFeedbackStatus === 'PENDING'">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              {{ vm().paymentFeedbackMessage }}
            </div>
            <div class="payment-feedback failed" *ngIf="vm().paymentFeedbackVisible && vm().paymentFeedbackStatus === 'FAILED'">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M7 13l6-6M13 13L7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              {{ vm().paymentFeedbackMessage }}
            </div>

            <!-- Wishlist -->
            <app-event-wishlist-section
              [data]="vm().data"
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

            <!-- ============================= -->
            <!-- SECTION ARCHIVAGE             -->
            <!-- ============================= -->
            <div class="action-card archive-card" *ngIf="isManager()">
              <div class="action-card-left">
                <div class="action-card-icon">📦</div>
                <div class="action-card-text">
                  <div class="action-card-title">
                    {{ vm().data!.event.isArchived ? 'Événement archivé' : 'Archiver cet événement' }}
                  </div>
                  <div class="action-card-desc" *ngIf="!vm().data!.event.isArchived">
                    L'archivage <strong>conserve toutes les données</strong> — contributions, paiements, participants, wishlist — mais masque l'événement de votre liste active. Vous pourrez le désarchiver à tout moment.
                  </div>
                  <div class="action-card-desc archived-notice" *ngIf="vm().data!.event.isArchived">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    Cet événement est archivé. Il est masqué de votre liste active mais toutes ses données sont intactes.
                  </div>
                </div>
              </div>
              <div class="action-card-right">
                <button
                  *ngIf="!vm().data!.event.isArchived"
                  class="btn-archive"
                  (click)="archiveEvent()"
                  [disabled]="archiveLoading()"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 8v13H3V8M23 3H1v5h22V3zM10 12h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ archiveLoading() ? 'Archivage...' : 'Archiver' }}
                </button>
                <button
                  *ngIf="vm().data!.event.isArchived"
                  class="btn-unarchive"
                  (click)="unarchiveEvent()"
                  [disabled]="archiveLoading()"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 8v13H3V8M23 3H1v5h22V3zM10 12h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ archiveLoading() ? '...' : 'Désarchiver' }}
                </button>
              </div>
            </div>

            <!-- ============================= -->
            <!-- ZONE DANGER — SUPPRESSION     -->
            <!-- ============================= -->
            <div class="danger-zone" *ngIf="isManager() && vm().data!.accessRole === 'ORGANIZER'">

              <div class="danger-zone-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/></svg>
                <span>Zone dangereuse</span>
              </div>

              <div class="danger-zone-body">
                <div class="danger-zone-title">Supprimer définitivement cet événement</div>
                <div class="danger-zone-subtitle">Cette action est irréversible et ne peut pas être annulée.</div>

                <!-- Conséquences -->
                <div class="danger-consequences">
                  <div class="consequence-item bad">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7 13l6-6M13 13L7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    L'événement et <strong>tous ses items wishlist</strong> sont effacés définitivement
                  </div>
                  <div class="consequence-item bad">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7 13l6-6M13 13L7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    L'historique des <strong>contributions et participants</strong> est perdu
                  </div>
                  <div class="consequence-item bad">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7 13l6-6M13 13L7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    Tous les <strong>liens de partage</strong> envoyés à vos invités deviennent invalides
                  </div>
                  <!-- État de blocage -->
                  <div class="consequence-item ok" *ngIf="canDeleteEvent()">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4.5 10l4 4 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    Aucun paiement validé — suppression autorisée
                  </div>
                  <div class="consequence-item blocked" *ngIf="!canDeleteEvent()">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    <strong>Suppression bloquée :</strong> {{ deleteBlockedReason() }}
                  </div>
                </div>

                <!-- Conseil archivage -->
                <div class="danger-tip">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#92400e" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="#92400e" stroke-width="1.8" stroke-linecap="round"/></svg>
                  <span>Vous souhaitez juste cacher cet événement ? Utilisez plutôt <strong>l'archivage</strong> ci-dessus — toutes vos données seront conservées.</span>
                </div>

                <!-- Bouton supprimer -->
                <button
                  class="btn-delete-final"
                  [disabled]="!canDeleteEvent() || vm().deleteLoading"
                  (click)="facade.openDeleteModal()"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ vm().deleteLoading ? 'Suppression...' : 'Supprimer définitivement' }}
                </button>
              </div>
            </div>

          </div>
        </div>

      </ng-container>

      <!-- MODALS -->
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

    </div>
  `,
  styles: [`
    :host { display: block; }
    .detail-page { background: #f9fafb; min-height: calc(100vh - 64px); }

    /* LOADING */
    .loading-screen { min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; background: #000; }
    .loading-inner { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .loading-spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #FFD700; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-inner p { color: rgba(255,255,255,0.5); font-size: 0.9rem; }

    /* ERROR */
    .error-screen { min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; padding: 24px; }
    .error-inner { text-align: center; max-width: 400px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .error-icon { font-size: 3rem; }
    .error-inner h2 { font-size: 1.3rem; font-weight: 800; color: #111; margin: 0; }
    .error-inner p { color: #6b7280; margin: 0; }
    .btn-back { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; background: #111; color: white; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.88rem; }

    /* HERO */
    .event-hero { background: #000; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .event-hero-inner { max-width: 1280px; margin: 0 auto; padding: 28px 24px; display: flex; flex-direction: column; gap: 24px; }

    .hero-top-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: color 0.2s; }
    .back-link:hover { color: white; }
    .hero-top-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .archived-pill { background: rgba(255,215,0,0.15); color: #FFD700; border: 1px solid rgba(255,215,0,0.3); padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .btn-action-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.15); border-radius: 9px; background: transparent; color: rgba(255,255,255,0.7); font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-action-ghost:hover { border-color: rgba(255,255,255,0.4); color: white; }

    .hero-content { display: flex; flex-direction: column; gap: 12px; }
    .hero-main { display: flex; flex-direction: column; gap: 10px; }
    .hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .role-badge { padding: 4px 12px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
    .role-organizer { background: rgba(255,215,0,0.2); color: #FFD700; border: 1px solid rgba(255,215,0,0.3); }
    .role-co-organizer { background: rgba(168,85,247,0.2); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); }
    .role-guest { background: rgba(99,102,241,0.2); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
    .event-date-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); font-size: 0.78rem; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); }
    .hero-main h1 { font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 900; color: white; margin: 0; letter-spacing: -0.02em; line-height: 1.1; }
    .hero-desc { color: rgba(255,255,255,0.5); font-size: 0.9rem; line-height: 1.6; margin: 0; max-width: 640px; }
    .hero-desc.muted { color: rgba(255,255,255,0.25); font-style: italic; }
    .organizer-tag { display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; align-self: flex-start; }
    .org-avatar { width: 28px; height: 28px; border-radius: 8px; background: #FFD700; color: #000; font-weight: 900; font-size: 0.72rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .org-label { font-size: 0.7rem; color: rgba(255,255,255,0.4); }
    .org-name { font-size: 0.85rem; font-weight: 700; color: white; }

    /* Stats */
    .hero-stats-row { display: flex; align-items: stretch; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }
    .stat-block { flex: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 4px; }
    .stat-divider { width: 1px; background: rgba(255,255,255,0.08); flex-shrink: 0; margin: 12px 0; }
    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); font-weight: 700; }
    .stat-value { font-size: 1.3rem; font-weight: 900; color: white; }
    .stat-value.accent { color: #FFD700; }
    .stat-sub { font-size: 0.72rem; color: rgba(255,255,255,0.3); }

    /* Progress */
    .global-progress { display: flex; flex-direction: column; gap: 8px; }
    .progress-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: rgba(255,255,255,0.4); }
    .progress-pct { color: #FFD700; font-weight: 800; }
    .progress-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #FFD700, #FFA500); border-radius: 999px; transition: width 0.6s ease; max-width: 100%; }

    /* Invite */
    .invite-section { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; flex-wrap: wrap; }
    .invite-left { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.6); font-size: 0.85rem; font-weight: 600; }
    .invite-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .invite-link-box { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 6px 6px 6px 12px; }
    .invite-input { background: transparent; border: 0; color: rgba(255,255,255,0.7); font: inherit; font-size: 0.8rem; outline: 0; min-width: 0; width: 240px; font-family: monospace; }
    .btn-copy { display: flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(255,255,255,0.08); border: 0; border-radius: 7px; color: white; font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-copy:hover { background: rgba(255,255,255,0.15); }
    .btn-generate { padding: 8px 16px; border: 1px solid rgba(255,215,0,0.3); border-radius: 10px; background: rgba(255,215,0,0.1); color: #FFD700; font: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-generate:hover { background: rgba(255,215,0,0.2); }

    /* BODY */
    .event-body { padding: 32px 0; }
    .event-body-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }

    /* Feedback */
    .payment-feedback { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 14px; font-size: 0.88rem; font-weight: 600; }
    .payment-feedback.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .payment-feedback.pending { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .payment-feedback.failed { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    /* ========================== */
    /* SECTION ARCHIVAGE          */
    /* ========================== */
    .action-card {
      background: white; border: 1.5px solid #f3f4f6; border-radius: 20px;
      padding: 24px; display: flex; align-items: center; justify-content: space-between;
      gap: 24px; flex-wrap: wrap;
    }
    .archive-card { border-color: #e0e7ff; background: #f5f3ff; }
    .action-card-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 0; }
    .action-card-icon { font-size: 2rem; flex-shrink: 0; }
    .action-card-text { display: flex; flex-direction: column; gap: 6px; }
    .action-card-title { font-size: 1rem; font-weight: 800; color: #111; }
    .action-card-desc { font-size: 0.88rem; color: #6b7280; line-height: 1.6; }
    .action-card-desc strong { color: #374151; }
    .archived-notice { display: flex; align-items: flex-start; gap: 6px; color: #6d28d9; }
    .action-card-right { flex-shrink: 0; }

    .btn-archive {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 22px; border: 0; border-radius: 12px;
      background: #6d28d9; color: white; font: inherit; font-size: 0.88rem;
      font-weight: 700; cursor: pointer; transition: 0.2s;
    }
    .btn-archive:hover:not(:disabled) { background: #5b21b6; }
    .btn-archive:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-unarchive {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 22px; border: 1.5px solid #6d28d9; border-radius: 12px;
      background: white; color: #6d28d9; font: inherit; font-size: 0.88rem;
      font-weight: 700; cursor: pointer; transition: 0.2s;
    }
    .btn-unarchive:hover:not(:disabled) { background: #f5f3ff; }
    .btn-unarchive:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ========================== */
    /* ZONE DANGER                */
    /* ========================== */
    .danger-zone {
      border: 2px solid #fecaca; border-radius: 20px;
      overflow: hidden;
    }
    .danger-zone-header {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 24px; background: #fef2f2;
      border-bottom: 1px solid #fecaca;
      font-size: 0.88rem; font-weight: 800; color: #ef4444;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .danger-zone-body { padding: 24px; background: white; display: flex; flex-direction: column; gap: 20px; }
    .danger-zone-title { font-size: 1rem; font-weight: 800; color: #111; }
    .danger-zone-subtitle { font-size: 0.85rem; color: #9ca3af; margin-top: -12px; }

    .danger-consequences { display: flex; flex-direction: column; gap: 10px; }
    .consequence-item {
      display: flex; align-items: flex-start; gap: 10px;
      font-size: 0.88rem; line-height: 1.5; padding: 10px 14px;
      border-radius: 10px;
    }
    .consequence-item.bad { background: #fef2f2; color: #7f1d1d; }
    .consequence-item.bad svg { color: #ef4444; flex-shrink: 0; margin-top: 2px; }
    .consequence-item.ok { background: #f0fdf4; color: #166534; }
    .consequence-item.ok svg { color: #22c55e; flex-shrink: 0; margin-top: 2px; }
    .consequence-item.blocked { background: #fffbeb; color: #92400e; }
    .consequence-item.blocked svg { color: #f59e0b; flex-shrink: 0; margin-top: 2px; }

    .danger-tip {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 14px 16px; background: #fffbeb; border: 1px solid #fde68a;
      border-radius: 12px; font-size: 0.85rem; color: #92400e; line-height: 1.6;
    }
    .danger-tip svg { flex-shrink: 0; margin-top: 1px; }
    .danger-tip strong { color: #78350f; }

    .btn-delete-final {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 24px; border: 0; border-radius: 12px;
      background: #ef4444; color: white; font: inherit; font-size: 0.9rem;
      font-weight: 800; cursor: pointer; transition: 0.2s; align-self: flex-start;
    }
    .btn-delete-final:hover:not(:disabled) { background: #dc2626; }
    .btn-delete-final:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }

    /* RESPONSIVE */
    @media (max-width: 900px) {
      .hero-stats-row { flex-wrap: wrap; }
      .stat-block { flex: 1; min-width: 120px; }
      .stat-divider { display: none; }
      .invite-section { flex-direction: column; align-items: flex-start; }
      .invite-input { width: 160px; }
      .action-card { flex-direction: column; }
      .action-card-right { width: 100%; }
      .action-card-right button { width: 100%; justify-content: center; }
    }
    @media (max-width: 640px) {
      .hero-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }
      .stat-block { background: rgba(255,255,255,0.04); }
    }
  `],
})
export class EventUserDetailPageComponent implements OnInit {
  readonly facade = inject(EventUserDetailFacade);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly vm = this.facade.state;
  readonly isManager = this.facade.isManager;
  readonly canDeleteEvent = this.facade.canDeleteEvent;
  readonly deleteBlockedReason = this.facade.deleteBlockedReason;
  readonly canDeleteSelectedItem = this.facade.canDeleteSelectedItem;
  readonly deleteSelectedItemBlockedReason = this.facade.deleteSelectedItemBlockedReason;
  readonly filteredWishlist = this.facade.filteredWishlist;

  readonly archiveLoading = signal(false);

  ngOnInit(): void { this.facade.init(); }

  readonly globalPercent = computed(() => {
    const d = this.vm().data;
    if (!d || !d.summary.totalTargetAmount) return 0;
    return Math.min(100, Math.round((d.summary.totalFundedAmount / d.summary.totalTargetAmount) * 100));
  });

  archiveEvent(): void {
    const id = this.vm().data?.event?.id;
    if (!id || this.archiveLoading()) return;
    this.archiveLoading.set(true);
    this.http.patch(`${environment.apiBaseUrl}/events/${id}/archive`, {}).subscribe({
      next: () => {
        this.archiveLoading.set(false);
        this.toast.success('Événement archivé. Toutes les données sont conservées.');
        this.facade.init();
      },
      error: (err: any) => {
        this.archiveLoading.set(false);
        this.toast.error(err?.error?.message ?? 'Impossible d\'archiver cet événement.');
      },
    });
  }

  unarchiveEvent(): void {
    const id = this.vm().data?.event?.id;
    if (!id || this.archiveLoading()) return;
    this.archiveLoading.set(true);
    this.http.patch(`${environment.apiBaseUrl}/events/${id}/unarchive`, {}).subscribe({
      next: () => {
        this.archiveLoading.set(false);
        this.toast.success('Événement désarchivé.');
        this.facade.init();
      },
      error: (err: any) => {
        this.archiveLoading.set(false);
        this.toast.error(err?.error?.message ?? 'Impossible de désarchiver.');
      },
    });
  }

  fmt(amount: number): string { return formatAmount(amount); }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatRoleLabel(role: string): string {
    const map: Record<string, string> = { ORGANIZER: 'Organisateur', CO_ORGANIZER: 'Co-organisateur', GUEST: 'Invité' };
    return map[role] ?? role;
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'ORGANIZER') return 'role-badge role-organizer';
    if (role === 'CO_ORGANIZER') return 'role-badge role-co-organizer';
    return 'role-badge role-guest';
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}