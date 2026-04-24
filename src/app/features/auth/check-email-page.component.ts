import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-check-email-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="auth-centered">
      <div class="check-card">
        <!-- Logo -->
        <a routerLink="/" class="card-logo"><span class="z">Z</span>Wish</a>

        <!-- Icône email animée -->
        <div class="email-icon" [class.warning]="fromLogin">
          <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
            <rect x="4" y="16" width="56" height="38" rx="8"
              [attr.fill]="fromLogin ? '#fff7ed' : '#f0fdf4'"
              [attr.stroke]="fromLogin ? '#f59e0b' : '#22c55e'"
              stroke-width="2"/>
            <path d="M4 24l28 18 28-18"
              [attr.stroke]="fromLogin ? '#f59e0b' : '#22c55e'"
              stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <div class="icon-badge" *ngIf="fromLogin">!</div>
        </div>

        <ng-container *ngIf="fromLogin; else afterRegister">
          <h1>Vérifiez votre email</h1>
          <p class="card-desc">
            Votre compte n'est pas encore activé. Cliquez sur le lien dans l'email que nous vous avons envoyé à :
          </p>
          <div class="email-highlight" *ngIf="email">{{ email }}</div>
          <div class="alert-banner">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            Le lien est valable <strong>24 heures</strong>. Après expiration, renvoyez un nouvel email.
          </div>
        </ng-container>

        <ng-template #afterRegister>
          <h1>Email envoyé ! 🎉</h1>
          <p class="card-desc">
            Nous avons envoyé un lien de vérification à :
          </p>
          <div class="email-highlight" *ngIf="email">{{ email }}</div>
          <p class="card-desc small">Cliquez sur le lien dans l'email pour activer votre compte et commencer à utiliser ZWish.</p>
        </ng-template>

        <!-- Alerte succès/erreur renvoie -->
        <div class="alert alert-success" *ngIf="resendSuccess">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          Email renvoyé avec succès !
        </div>
        <div class="alert alert-error" *ngIf="resendError">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          {{ resendError }}
        </div>

        <div class="card-actions">
          <button class="btn-primary" (click)="resend()" [disabled]="resendLoading || resendSuccess">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10a6 6 0 016-6 6 6 0 015.66 4M16 4v4h-4M16 10a6 6 0 01-6 6 6 6 0 01-5.66-4M4 16v-4h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            {{ resendLoading ? 'Envoi...' : 'Renvoyer l\'email' }}
          </button>
          <a routerLink="/login" class="btn-ghost">← Retour à la connexion</a>
        </div>

        <div class="check-tip">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#9ca3af" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round"/></svg>
          Vérifiez aussi vos spams si vous ne trouvez pas l'email.
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f9fafb; }
    .auth-centered { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }

    .check-card {
      background: white; border: 1px solid #e5e7eb; border-radius: 24px; padding: 48px 40px;
      width: min(480px, 100%); display: flex; flex-direction: column; align-items: center;
      gap: 20px; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.06);
    }

    .card-logo { font-size: 1.4rem; font-weight: 900; color: #111; text-decoration: none; }
    .z { color: #FFD700; }

    .email-icon { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 20px; background: #f9fafb; border: 1px solid #e5e7eb; }
    .email-icon.warning { background: #fffbeb; border-color: #fde68a; }
    .icon-badge { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: white; font-size: 0.8rem; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

    h1 { font-size: 1.8rem; font-weight: 900; color: #111; margin: 0; letter-spacing: -0.02em; }
    .card-desc { color: #6b7280; line-height: 1.7; margin: 0; font-size: 0.92rem; }
    .card-desc.small { font-size: 0.85rem; }

    .email-highlight {
      background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 10px;
      padding: 10px 20px; font-weight: 700; color: #111; font-size: 0.95rem;
      word-break: break-all;
    }

    .alert-banner {
      display: flex; align-items: flex-start; gap: 8px;
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 12px 14px; font-size: 0.82rem; color: #92400e; text-align: left; width: 100%; box-sizing: border-box;
    }
    .alert-banner svg { flex-shrink: 0; margin-top: 1px; }

    .alert { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; font-size: 0.85rem; width: 100%; box-sizing: border-box; }
    .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    .card-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
    .btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 13px 24px; border: 0; border-radius: 12px; background: #111;
      color: white; font: inherit; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: 0.2s; width: 100%;
    }
    .btn-primary:hover:not(:disabled) { background: #000; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { padding: 12px 24px; border: 1.5px solid #e5e7eb; border-radius: 12px; color: #374151; text-decoration: none; font-weight: 600; font-size: 0.88rem; transition: 0.2s; }
    .btn-ghost:hover { background: #f9fafb; }

    .check-tip { display: flex; align-items: center; gap: 6px; color: #9ca3af; font-size: 0.78rem; }
  `],
})
export class CheckEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  email = '';
  fromLogin = false;
  resendLoading = false;
  resendSuccess = false;
  resendError = '';

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] ?? '';
    this.fromLogin = this.route.snapshot.queryParams['from'] === 'login';
  }

  resend(): void {
    if (!this.email) return;
    this.resendLoading = true;
    this.resendError = '';
    this.auth.resendVerification(this.email).subscribe({
      next: () => { this.resendLoading = false; this.resendSuccess = true; },
      error: (err: any) => {
        this.resendLoading = false;
        this.resendError = err?.error?.message ?? 'Erreur lors de l\'envoi.';
      },
    });
  }
}