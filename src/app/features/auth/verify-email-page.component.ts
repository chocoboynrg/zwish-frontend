import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-shell">
      <div class="container">
        <div class="card">
          <span class="eyebrow">Activation du compte</span>
          <h1>Vérification de votre email</h1>

          <p class="lead" *ngIf="loading">
            Vérification en cours...
          </p>

          <div class="success-box" *ngIf="!loading && successMessage">
            {{ successMessage }}
          </div>

          <div class="error-box" *ngIf="!loading && errorMessage">
            {{ errorMessage }}
          </div>

          <div class="actions" *ngIf="!loading">
            <a routerLink="/login" class="primary-link">Aller à la connexion</a>
            <a routerLink="/" class="secondary-link">Retour à l’accueil</a>
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

    .actions {
      margin-top: 24px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .primary-link,
    .secondary-link {
      text-decoration: none;
      color: #ff7a59;
      font-weight: 700;
    }

    .primary-link:hover,
    .secondary-link:hover {
      text-decoration: underline;
    }
  `],
})
export class VerifyEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  loading = true;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!token) {
      this.loading = false;
      this.errorMessage = 'Lien de vérification invalide.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (message) => {
        this.loading = false;
        this.successMessage = message || 'Votre email a été vérifié avec succès.';
      },
      error: (error: unknown) => {
        this.loading = false;

        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Impossible de vérifier votre email.';

        this.errorMessage = message;
      },
    });
  }
}
