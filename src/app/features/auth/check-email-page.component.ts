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
          <span class="eyebrow">Vérification</span>
          <h1>Email envoyé</h1>
          <p class="lead">
            Votre compte a bien été créé. Vérifiez votre boîte mail pour activer
            votre compte.
          </p>

          <div class="email-box" *ngIf="email">
            Adresse concernée : <strong>{{ email }}</strong>
          </div>

          <div class="info-list">
            <p>• Vérifiez aussi vos spams / courriers indésirables</p>
            <p>• Cliquez sur le lien reçu pour activer votre compte</p>
            <p>• Ensuite, vous pourrez vous connecter normalement</p>
          </div>

          <div class="actions">
            <button class="primary-btn" (click)="resend()" [disabled]="loading || !email">
              {{ loading ? 'Envoi...' : 'Renvoyer l’email' }}
            </button>

            <a routerLink="/login" class="secondary-link">Aller à la connexion</a>
          </div>

          <div class="success-box" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="error-box" *ngIf="errorMessage">
            {{ errorMessage }}
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

    .container {
      width: min(760px, calc(100% - 32px));
      margin: 0 auto;
    }

    .auth-shell {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 0 56px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.18), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.12), transparent 30%);
    }

    .card {
      background: white;
      border: 1px solid #f0e5df;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
      border-radius: 28px;
      padding: 32px;
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

    h1 {
      margin: 0 0 10px;
      color: #111827;
      font-size: 2rem;
    }

    .lead {
      margin: 0;
      color: #4b5563;
      line-height: 1.7;
    }

    .email-box {
      margin-top: 18px;
      padding: 14px 16px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 14px;
      color: #9a3412;
    }

    .info-list {
      margin-top: 18px;
      color: #6b7280;
      line-height: 1.7;
    }

    .info-list p {
      margin: 0 0 8px;
    }

    .actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 24px;
    }

    .primary-btn {
      height: 46px;
      padding: 0 18px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 700;
      font: inherit;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
    }

    .primary-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .secondary-link {
      color: #ff7a59;
      font-weight: 700;
      text-decoration: none;
    }

    .secondary-link:hover {
      text-decoration: underline;
    }

    .success-box {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }

    .error-box {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #fff7f7;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }
  `],
})
export class CheckEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
  }

  resend(): void {
    if (!this.email || this.loading) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.resendVerification(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Email de vérification renvoyé.';
      },
      error: (error: unknown) => {
        this.loading = false;

        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Erreur lors du renvoi de l’email.';

        this.errorMessage = message;
      },
    });
  }
}
