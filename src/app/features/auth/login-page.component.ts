import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUser } from '../../core/models/current-user.model';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="login-shell">
      <div class="container login-grid">
        <div class="login-aside">
          <span class="eyebrow">Connexion ZWish</span>
          <h1>Retrouvez vos événements, wishlists et contributions</h1>
          <p>
            Connectez-vous pour accéder à votre espace utilisateur ou administrateur,
            gérer vos événements et participer facilement à ceux de vos proches.
          </p>

          <div class="benefits">
            <div class="benefit-card">
              <strong>Wishlist centralisée</strong>
              <span>Accédez rapidement à vos événements et à leurs besoins.</span>
            </div>

            <div class="benefit-card">
              <strong>Contributions suivies</strong>
              <span>Retrouvez vos paiements, réservations et progressions en temps réel.</span>
            </div>

            <div class="benefit-card">
              <strong>Expérience simple</strong>
              <span>Une interface claire pensée pour les organisateurs comme pour les invités.</span>
            </div>
          </div>
        </div>

        <div class="login-card">
          <div class="card-head">
            <span class="eyebrow small">Bienvenue</span>
            <h2>Se connecter</h2>
            <p class="subtitle">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          <div class="auth-links">
            <a routerLink="/register">Créer un compte</a>
          </div>

          <div class="auth-links" *ngIf="showResend">
            <a href="" (click)="onResendClick($event)">
              Renvoyer l'email de vérification
            </a>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="votre@email.com"
                [class.invalid]="isFieldInvalid('email')"
              />

              <small class="field-error" *ngIf="isFieldInvalid('email')">
                Veuillez saisir une adresse email valide.
              </small>
            </div>

            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="Votre mot de passe"
                [class.invalid]="isFieldInvalid('password')"
              />

              <small class="field-error" *ngIf="isFieldInvalid('password')">
                Le mot de passe est requis.
              </small>
            </div>

            <button type="submit" class="primary-btn" [disabled]="loading">
              {{ loading ? 'Connexion...' : 'Se connecter' }}
            </button>
          </form>

          <div class="success-box" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="error-box" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="helper-links">
            <a routerLink="/">Retour à l’accueil</a>
            <a routerLink="/catalog">Voir le catalogue</a>
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
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
    }

    .login-shell {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      padding: 40px 0 56px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.18), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.12), transparent 30%);
    }

    .login-grid {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 24px;
      align-items: center;
    }

    .login-aside,
    .login-card,
    .benefit-card {
      background: white;
      border: 1px solid #f0e5df;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .login-aside,
    .login-card {
      border-radius: 28px;
      padding: 28px;
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

    .login-aside h1 {
      margin: 0 0 14px;
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1.08;
      color: #111827;
    }

    .login-aside p {
      margin: 0;
      color: #4b5563;
      line-height: 1.75;
      font-size: 1.02rem;
      max-width: 720px;
    }

    .benefits {
      display: grid;
      gap: 14px;
      margin-top: 22px;
    }

    .benefit-card {
      border-radius: 20px;
      padding: 18px 20px;
    }

    .benefit-card strong {
      display: block;
      margin-bottom: 6px;
      color: #111827;
    }

    .benefit-card span {
      color: #6b7280;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .card-head {
      margin-bottom: 18px;
    }

    .card-head h2 {
      margin: 0 0 8px;
      color: #111827;
      font-size: 1.8rem;
    }

    .subtitle {
      margin: 0;
      color: #6b7280;
      line-height: 1.6;
    }

    .auth-links {
      margin-bottom: 12px;
    }

    .auth-links a {
      text-decoration: none;
      color: #ff7a59;
      font-weight: 700;
      cursor: pointer;
    }

    .auth-links a:hover {
      text-decoration: underline;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    label {
      font-weight: 700;
      color: #374151;
      font-size: 0.95rem;
    }

    input {
      width: 100%;
      height: 48px;
      padding: 0 14px;
      border: 1px solid #e7ddd7;
      border-radius: 14px;
      box-sizing: border-box;
      background: white;
      outline: none;
      font: inherit;
      color: #111827;
      transition: 0.2s ease;
    }

    input:focus {
      border-color: #ffb8a6;
      box-shadow: 0 0 0 4px rgba(255, 122, 89, 0.10);
    }

    input.invalid {
      border-color: #fca5a5;
      background: #fffdfd;
    }

    .field-error {
      color: #b91c1c;
      font-size: 0.82rem;
      line-height: 1.4;
    }

    .primary-btn {
      margin-top: 6px;
      height: 48px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #ff7a59, #ffb347);
      color: white;
      font-weight: 700;
      font: inherit;
      cursor: pointer;
      transition: 0.2s ease;
      box-shadow: 0 10px 25px rgba(255, 122, 89, 0.22);
    }

    .primary-btn:hover {
      transform: translateY(-1px);
    }

    .primary-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .success-box {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .error-box {
      margin-top: 16px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #fff7f7;
      border: 1px solid #fecaca;
      color: #b91c1c;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .helper-links {
      margin-top: 18px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .helper-links a {
      text-decoration: none;
      color: #ff7a59;
      font-weight: 700;
    }

    .helper-links a:hover {
      text-decoration: underline;
    }

    @media (max-width: 980px) {
      .login-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .login-aside,
      .login-card {
        padding: 22px;
        border-radius: 24px;
      }

      .helper-links {
        flex-direction: column;
        gap: 10px;
      }
    }
  `],
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private returnUrl = '/app';

  loading = false;
  errorMessage = '';
  successMessage = '';
  showResend = false;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const requested =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/app';

    this.returnUrl = requested.startsWith('/') ? requested : '/app';
  }

  isFieldInvalid(fieldName: 'email' | 'password'): boolean {
    const control = this.form.controls[fieldName];
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
  if (this.form.invalid || this.loading) {
    this.form.markAllAsTouched();
    return;
  }

  this.loading = true;
  this.errorMessage = '';
  this.successMessage = '';
  this.showResend = false;

  const payload = this.form.getRawValue() as {
    email: string;
    password: string;
  };

  this.authService.login(payload).subscribe({
    next: (response) => {
      this.loading = false;

      const user = response.user;

      if (!user) {
        this.errorMessage = 'Erreur de réponse serveur';
        return;
      }

      const isVerified =
        (user as CurrentUser & { emailVerified?: boolean }).emailVerified === true;

      if (!isVerified) {
        this.router.navigate(['/check-email'], {
          queryParams: { email: user.email, from: 'login' },
        });
        return;
      }

      const role = user.platformRole;

      if (this.returnUrl && this.returnUrl !== '/app') {
        this.router.navigateByUrl(this.returnUrl);
        return;
      }

      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        this.router.navigateByUrl('/admin');
        return;
      }

      this.router.navigateByUrl('/app');
    },
    error: (error: unknown) => {
      this.loading = false;

      const message =
        typeof error === 'object' &&
        error !== null &&
        'error' in error &&
        typeof (error as any).error?.message === 'string'
          ? (error as any).error.message
          : 'Connexion impossible';

      this.errorMessage = message;

      const lower = message.toLowerCase();
      if (
        lower.includes('non vérifié') ||
        lower.includes('non verifie') ||
        lower.includes('not verified') ||
        lower.includes('verify')
      ) {
        this.showResend = true;
      }
    },
  });
}

  onResendClick(event: Event): void {
    event.preventDefault();
    this.resendVerification();
  }

  resendVerification(): void {
    const email = this.form.controls.email.value?.trim();

    this.errorMessage = '';
    this.successMessage = '';

    if (!email) {
      this.errorMessage = 'Veuillez entrer votre email avant de renvoyer le message.';
      this.form.controls.email.markAsTouched();
      return;
    }

    if (this.form.controls.email.invalid) {
      this.errorMessage = 'Veuillez saisir une adresse email valide.';
      this.form.controls.email.markAsTouched();
      return;
    }

    this.authService.resendVerification(email).subscribe({
      next: () => {
        this.successMessage = 'Email de vérification envoyé.';
      },
      error: (error: unknown) => {
        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Erreur lors de l’envoi de l’email de vérification.';

        this.errorMessage = message;
      },
    });
  }
}
