import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ParticipantsService } from '../services/participants.service';
import { EventsService, SharedEventPreview } from '../services/events.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-join-event-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <section class="join-hero">
      <div class="container">
        <div class="hero-card" *ngIf="loading()">
          <div class="state-title">Chargement de l’invitation...</div>
          <div class="state-text">
            Nous préparons les informations de l’événement.
          </div>
        </div>

        <div class="hero-card error-card" *ngIf="!loading() && errorMessage()">
          <div class="state-title">Impossible de charger cette invitation</div>
          <div class="state-text">{{ errorMessage() }}</div>

          <div class="hero-actions">
            <a routerLink="/" class="secondary-btn">Retour à l’accueil</a>
          </div>
        </div>

        <ng-container *ngIf="!loading() && !errorMessage() && preview() as event">
          <div class="hero-grid">
            <div class="hero-main">
              <span class="eyebrow">Invitation ZWish</span>
              <h1>{{ event.title }}</h1>

              <p class="hero-description">
                {{
                  event.description ||
                    'Vous avez été invité à découvrir cet événement sur ZWish.'
                }}
              </p>

              <div class="hero-meta">
                <div class="meta-card">
                  <span class="meta-label">Date</span>
                  <strong>{{ event.eventDate | date:'fullDate' }}</strong>
                </div>

                <div class="meta-card">
                  <span class="meta-label">Organisateur</span>
                  <strong>{{ event.organizer?.name || '—' }}</strong>
                </div>
              </div>

              <div *ngIf="successMessage()" class="success-box">
                {{ successMessage() }}
              </div>

              <div class="hero-actions" *ngIf="!successMessage()">
                <ng-container *ngIf="isAuthenticated(); else guestBlock">
                  <button
                    type="button"
                    class="primary-btn"
                    (click)="joinEvent()"
                    [disabled]="joinLoading()"
                  >
                    {{
                      joinLoading()
                        ? 'Participation...'
                        : 'Rejoindre l’événement'
                    }}
                  </button>
                </ng-container>

                <ng-template #guestBlock>
                  <a
                    class="primary-btn"
                    [routerLink]="['/login']"
                    [queryParams]="{ returnUrl: '/join/' + shareToken() }"
                  >
                    Se connecter pour rejoindre
                  </a>
                </ng-template>

                <a routerLink="/catalog" class="secondary-btn">
                  Explorer le catalogue
                </a>
              </div>
            </div>

            <div class="hero-side">
              <div class="info-card">
                <h3>Pourquoi rejoindre cet événement ?</h3>
                <ul>
                  <li>Consulter la wishlist de l’organisateur</li>
                  <li>Réserver ou contribuer selon les besoins</li>
                  <li>Participer simplement depuis un lien partagé</li>
                  <li>Suivre une expérience claire et centralisée</li>
                </ul>
              </div>

              <div class="info-card">
                <h3>Accès rapide</h3>
                <p>
                  Une fois connecté, vous pourrez rejoindre l’événement et
                  retrouver son espace dans votre tableau de bord.
                </p>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </section>

    <section
      class="details-section"
      *ngIf="!loading() && !errorMessage() && preview() as event"
    >
      <div class="container details-grid">
        <article class="content-card">
          <h2>À propos de cet événement</h2>
          <p>
            {{
              event.description ||
                'Cet événement est prêt à accueillir des invités, des réservations et des contributions.'
            }}
          </p>
        </article>

        <article class="content-card">
          <h2>Comment participer</h2>

          <div class="steps-list">
            <div class="step-item">
              <div class="step-number">1</div>
              <div>
                <strong>Ouvrez l’invitation</strong>
                <p>Consultez les informations principales de l’événement.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">2</div>
              <div>
                <strong>Connectez-vous</strong>
                <p>Identifiez-vous pour être rattaché à l’événement.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">3</div>
              <div>
                <strong>Participez</strong>
                <p>Accédez ensuite à la wishlist et contribuez facilement.</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section
      class="cta-section"
      *ngIf="!loading() && !errorMessage() && preview()"
    >
      <div class="container">
        <div class="cta-card">
          <div>
            <span class="eyebrow small">Participation</span>
            <h2>Prêt à rejoindre cet événement ?</h2>
            <p>
              Utilisez votre compte ZWish pour accéder à l’espace événement et
              participer simplement.
            </p>
          </div>

          <ng-container *ngIf="isAuthenticated(); else ctaGuest">
            <button
              type="button"
              class="primary-btn"
              (click)="joinEvent()"
              [disabled]="joinLoading()"
            >
              {{
                joinLoading()
                  ? 'Participation...'
                  : 'Rejoindre maintenant'
              }}
            </button>
          </ng-container>

          <ng-template #ctaGuest>
            <a
              class="primary-btn"
              [routerLink]="['/login']"
              [queryParams]="{ returnUrl: '/join/' + shareToken() }"
            >
              Se connecter
            </a>
          </ng-template>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100%;
      background: #fffaf8;
    }

    .container {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .join-hero {
      padding: 40px 0 24px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.18), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.12), transparent 30%);
    }

    .hero-card,
    .hero-main,
    .hero-side,
    .info-card,
    .content-card,
    .cta-card,
    .meta-card {
      background: white;
      border: 1px solid #f0e5df;
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .hero-card {
      padding: 24px;
    }

    .hero-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
      align-items: start;
    }

    .hero-main,
    .hero-side {
      padding: 28px;
    }

    .hero-side {
      display: grid;
      gap: 16px;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .eyebrow.small {
      margin-bottom: 8px;
      font-size: 0.82rem;
    }

    .hero-main h1 {
      margin: 0 0 14px;
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1.08;
      color: #111827;
    }

    .hero-description {
      margin: 0 0 20px;
      color: #4b5563;
      line-height: 1.75;
      font-size: 1.04rem;
    }

    .hero-meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .meta-card {
      padding: 16px;
    }

    .meta-label {
      display: block;
      color: #6b7280;
      font-size: 0.85rem;
      margin-bottom: 6px;
    }

    .meta-card strong {
      color: #111827;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .primary-btn,
    .secondary-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 18px;
      border-radius: 14px;
      border: none;
      text-decoration: none;
      cursor: pointer;
      font-weight: 700;
      transition: 0.2s ease;
    }

    .primary-btn {
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
    }

    .secondary-btn {
      background: #111827;
      color: white;
    }

    .primary-btn:hover,
    .secondary-btn:hover {
      transform: translateY(-1px);
    }

    .primary-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .info-card {
      padding: 22px;
    }

    .info-card h3 {
      margin: 0 0 12px;
      color: #111827;
      font-size: 1.2rem;
    }

    .info-card ul {
      margin: 0;
      padding-left: 18px;
      color: #4b5563;
      line-height: 1.8;
    }

    .info-card p {
      margin: 0;
      color: #4b5563;
      line-height: 1.7;
    }

    .details-section {
      padding: 8px 0 24px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .content-card {
      padding: 24px;
    }

    .content-card h2 {
      margin: 0 0 12px;
      color: #111827;
      font-size: 1.4rem;
    }

    .content-card p {
      margin: 0;
      color: #4b5563;
      line-height: 1.75;
    }

    .steps-list {
      display: grid;
      gap: 14px;
    }

    .step-item {
      display: grid;
      grid-template-columns: 52px 1fr;
      gap: 14px;
      align-items: start;
    }

    .step-number {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 800;
    }

    .step-item strong {
      display: block;
      margin-bottom: 4px;
      color: #111827;
    }

    .step-item p {
      margin: 0;
      color: #6b7280;
      line-height: 1.6;
    }

    .cta-section {
      padding: 0 0 48px;
    }

    .cta-card {
      padding: 26px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      background: linear-gradient(135deg, #fff5f0, #ffffff);
    }

    .cta-card h2 {
      margin: 0 0 8px;
      color: #111827;
    }

    .cta-card p {
      margin: 0;
      color: #6b7280;
      line-height: 1.7;
      max-width: 760px;
    }

    .state-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
    }

    .state-text {
      color: #6b7280;
      line-height: 1.65;
    }

    .error-card {
      background: #fff7f7;
      border-color: #fecaca;
    }

    .success-box {
      background: #f0fdf4;
      color: #15803d;
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 18px;
      font-weight: 600;
    }

    @media (max-width: 980px) {
      .hero-grid,
      .details-grid {
        grid-template-columns: 1fr;
      }

      .hero-meta {
        grid-template-columns: 1fr;
      }

      .cta-card {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    @media (max-width: 640px) {
      .hero-actions {
        flex-direction: column;
      }

      .primary-btn,
      .secondary-btn {
        width: 100%;
      }
    }
  `],
})
export class JoinEventPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly participantsService = inject(ParticipantsService);
  private readonly eventsService = inject(EventsService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly toastService = inject(ToastService);

  readonly shareToken = signal('');
  readonly preview = signal<SharedEventPreview | null>(null);
  readonly loading = signal(true);
  readonly joinLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('shareToken') ?? '';

    this.shareToken.set(token);

    if (!token) {
      this.errorMessage.set('Lien d’invitation invalide');
      this.loading.set(false);
      return;
    }

    this.loadPreview(token);
  }

  loadPreview(token: string): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.eventsService.getEventPreviewByShareToken(token).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Impossible de charger cette invitation';

        this.errorMessage.set(message);
        this.loading.set(false);
      },
    });
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getToken();
  }

  joinEvent(): void {
    const token = this.shareToken();

    if (!token || this.joinLoading()) {
      return;
    }

    this.joinLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.participantsService.joinByShareToken(token).subscribe({
      next: () => {
        this.joinLoading.set(false);
        this.successMessage.set('Vous avez rejoint l’événement avec succès.');
        this.toastService.success('Participation enregistrée.');

        setTimeout(() => {
          this.router.navigateByUrl('/app');
        }, 1200);
      },
      error: (error: unknown) => {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Impossible de rejoindre cet événement';

        this.joinLoading.set(false);
        this.errorMessage.set(message);
      },
    });
  }
}