import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-check-email-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-shell">
      <div class="container">
        <div class="card">

          <!-- Icône envelope animée -->
          <div class="envelope-icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="14" width="56" height="38" rx="6" fill="#fff1eb" stroke="#ff7a59" stroke-width="2.5"/>
              <path d="M4 20l28 20 28-20" stroke="#ff7a59" stroke-width="2.5" stroke-linecap="round"/>
              <circle *ngIf="fromLogin" cx="50" cy="16" r="8" fill="#ef4444"/>
              <text *ngIf="fromLogin" x="50" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">!</text>
            </svg>
          </div>

          <!-- Cas 1 : vient du LOGIN (email non vérifié) -->
          <ng-container *ngIf="fromLogin; else afterRegister">
            <span class="eyebrow warning">Action requise</span>
            <h1>Vérifiez votre email</h1>
            <p class="lead">
              Votre compte n'est pas encore activé. Vous devez vérifier votre adresse email avant de pouvoir vous connecter.
            </p>

            <div class="email-box" *ngIf="email">
              <span class="email-label">Email concerné</span>
              <strong>{{ email }}</strong>
            </div>

            <div class="alert-banner">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#92400e" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="#92400e" stroke-width="1.8" stroke-linecap="round"/></svg>
              Le lien de vérification est valable <strong>24 heures</strong>. Si votre lien a expiré, renvoyez un nouvel email ci-dessous.
            </div>

            <div class="actions primary-action">
              <button
                class="primary-btn"
                (click)="resend()"
                [disabled]="loading || cooldown > 0"
              >
                <svg *ngIf="!loading && cooldown === 0" width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M2 4l8 6 8-6" stroke="white" stroke-width="1.8" stroke-linecap="round"/><rect x="2" y="4" width="16" height="13" rx="2" stroke="white" stroke-width="1.8"/></svg>
                <span class="spinner" *ngIf="loading"></span>
                <span *ngIf="!loading && cooldown === 0">Renvoyer l'email de vérification</span>
                <span *ngIf="!loading && cooldown > 0">Renvoyer dans {{ cooldown }}s</span>
                <span *ngIf="loading">Envoi en cours...</span>
              </button>
            </div>

            <div class="info-list">
              <div class="info-item">
                <span class="bullet">①</span>
                Cliquez sur le bouton ci-dessus pour recevoir un nouveau lien
              </div>
              <div class="info-item">
                <span class="bullet">②</span>
                Vérifiez votre boîte mail (et les <strong>spams</strong>)
              </div>
              <div class="info-item">
                <span class="bullet">③</span>
                Cliquez sur le lien dans l'email pour activer votre compte
              </div>
            </div>
          </ng-container>

          <!-- Cas 2 : vient de l'INSCRIPTION -->
          <ng-template #afterRegister>
            <span class="eyebrow">Vérification</span>
            <h1>Email envoyé !</h1>
            <p class="lead">
              Votre compte a bien été créé. Un email de vérification a été envoyé à votre adresse.
            </p>

            <div class="email-box" *ngIf="email">
              <span class="email-label">Email concerné</span>
              <strong>{{ email }}</strong>
            </div>

            <div class="info-list">
              <div class="info-item">
                <span class="bullet">①</span>
                Vérifiez votre boîte mail (et les <strong>spams</strong>)
              </div>
              <div class="info-item">
                <span class="bullet">②</span>
                Cliquez sur le lien dans l'email pour activer votre compte
              </div>
              <div class="info-item">
                <span class="bullet">③</span>
                Ensuite, vous pourrez vous connecter normalement
              </div>
            </div>

            <div class="resend-section">
              <p class="resend-label">Vous n'avez pas reçu l'email ?</p>
              <button
                class="secondary-btn"
                (click)="resend()"
                [disabled]="loading || cooldown > 0"
              >
                <span class="spinner small" *ngIf="loading"></span>
                <span *ngIf="!loading && cooldown === 0">Renvoyer l'email</span>
                <span *ngIf="!loading && cooldown > 0">Renvoyer dans {{ cooldown }}s</span>
                <span *ngIf="loading">Envoi...</span>
              </button>
            </div>
          </ng-template>

          <!-- Messages retour -->
          <div class="success-box" *ngIf="successMessage">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#166534" stroke-width="1.5"/><path d="M6.5 10.5l2.5 2.5 5-5" stroke="#166534" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ successMessage }}
          </div>

          <div class="error-box" *ngIf="errorMessage">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#b91c1c" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="#b91c1c" stroke-width="1.8" stroke-linecap="round"/></svg>
            {{ errorMessage }}
          </div>

          <div class="footer-link">
            <a routerLink="/login">← Retour à la connexion</a>
          </div>

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

    .auth-shell {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px 56px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.18), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.12), transparent 30%);
    }

    .container {
      width: min(520px, 100%);
    }

    .card {
      background: white;
      border: 1px solid #f0e5df;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.07);
      border-radius: 28px;
      padding: 40px 36px;
    }

    /* Enveloppe */
    .envelope-icon {
      width: 72px;
      height: 72px;
      margin: 0 0 20px;
    }

    .envelope-icon svg {
      width: 100%;
      height: 100%;
    }

    /* Badges */
    .eyebrow {
      display: inline-block;
      margin-bottom: 10px;
      padding: 6px 14px;
      border-radius: 999px;
      background: #fff1eb;
      color: #e85d3e;
      font-weight: 700;
      font-size: 0.82rem;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .eyebrow.warning {
      background: #fef3c7;
      color: #92400e;
    }

    h1 {
      margin: 0 0 10px;
      color: #111827;
      font-size: 1.8rem;
      font-weight: 800;
      line-height: 1.2;
    }

    .lead {
      margin: 0 0 20px;
      color: #4b5563;
      line-height: 1.7;
      font-size: 0.97rem;
    }

    /* Email box */
    .email-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 20px;
      padding: 14px 16px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 14px;
      color: #9a3412;
      font-size: 0.95rem;
    }

    .email-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.7;
      font-weight: 600;
    }

    /* Alerte lien expiré */
    .alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 24px;
      padding: 14px 16px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 14px;
      color: #78350f;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .alert-banner svg {
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Actions */
    .actions {
      margin-bottom: 24px;
    }

    .primary-action {
      margin-bottom: 28px;
    }

    .primary-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      height: 52px;
      padding: 0 20px;
      border: none;
      border-radius: 16px;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 700;
      font-size: 1rem;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 10px 28px rgba(255, 122, 89, 0.3);
      transition: opacity 0.2s, transform 0.15s;
    }

    .primary-btn:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .primary-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
    }

    /* Renvoi discret (après inscription) */
    .resend-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .resend-label {
      margin: 0;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .secondary-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1.5px solid #fed7aa;
      border-radius: 10px;
      background: transparent;
      color: #ea580c;
      font-weight: 600;
      font-size: 0.88rem;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }

    .secondary-btn:hover:not(:disabled) {
      background: #fff7ed;
    }

    .secondary-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Info steps */
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 8px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: #374151;
      font-size: 0.93rem;
      line-height: 1.6;
    }

    .bullet {
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff1eb;
      color: #ea580c;
      border-radius: 50%;
      font-size: 0.78rem;
      font-weight: 800;
      margin-top: 1px;
    }

    /* Feedback */
    .success-box,
    .error-box {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 14px;
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .success-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }

    .error-box {
      background: #fff7f7;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    /* Footer */
    .footer-link {
      margin-top: 24px;
      text-align: center;
    }

    .footer-link a {
      color: #9ca3af;
      font-size: 0.88rem;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.15s;
    }

    .footer-link a:hover {
      color: #ff7a59;
    }

    /* Spinner */
    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .spinner.small {
      width: 14px;
      height: 14px;
      border-color: rgba(234,88,12,0.3);
      border-top-color: #ea580c;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .card {
        padding: 28px 20px;
      }
      h1 { font-size: 1.5rem; }
    }
  `],
})
export class CheckEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  email = '';
  fromLogin = false; // true = vient du login (email non vérifié), false = vient de l'inscription
  loading = false;
  successMessage = '';
  errorMessage = '';
  cooldown = 0;

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    // Le paramètre ?from=login est passé par le login-page quand emailVerified === false
    this.fromLogin = this.route.snapshot.queryParamMap.get('from') === 'login';
  }

  resend(): void {
    if (!this.email || this.loading || this.cooldown > 0) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.resendVerification(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Un nouvel email de vérification a été envoyé. Pensez à vérifier vos spams.';
        this.startCooldown(60);
      },
      error: (error: unknown) => {
        this.loading = false;

        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Erreur lors du renvoi de l\'email. Réessayez dans quelques instants.';

        this.errorMessage = message;
      },
    });
  }

  private startCooldown(seconds: number): void {
    this.cooldown = seconds;
    this.cooldownTimer = setInterval(() => {
      this.cooldown--;
      if (this.cooldown <= 0) {
        this.cooldown = 0;
        if (this.cooldownTimer) clearInterval(this.cooldownTimer);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }
}