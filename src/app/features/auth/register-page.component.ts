import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-shell">
      <div class="container auth-grid">
        <div class="auth-aside">
          <span class="eyebrow">Créer un compte</span>
          <h1>Organisez vos événements et centralisez les contributions</h1>
          <p>
            Créez votre compte pour gérer vos wishlists, suivre les participations
            et partager facilement vos événements avec vos proches.
          </p>

          <div class="benefits">
            <div class="benefit-card">
              <strong>Événements centralisés</strong>
              <span>Créez et gérez vos événements depuis un seul espace.</span>
            </div>

            <div class="benefit-card">
              <strong>Wishlist claire</strong>
              <span>Ajoutez des produits, suivez leur financement et évitez les doublons.</span>
            </div>

            <div class="benefit-card">
              <strong>Parcours simple</strong>
              <span>Une expérience pensée pour les organisateurs comme pour les invités.</span>
            </div>
          </div>
        </div>

        <div class="auth-card">
          <div class="card-head">
            <span class="eyebrow small">Bienvenue</span>
            <h2>Créer mon compte</h2>
            <p class="subtitle">
              Renseignez vos informations pour démarrer.
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="form-grid">
              <div class="form-group">
                <label for="name">Nom</label>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  placeholder="Votre nom"
                  [class.invalid]="isFieldInvalid('name')"
                />
                <small class="field-error" *ngIf="isFieldInvalid('name')">
                  Le nom est requis.
                </small>
              </div>

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
                <label for="phone">Téléphone <span>(optionnel)</span></label>
                <input
                  id="phone"
                  type="text"
                  formControlName="phone"
                  placeholder="Ex : +22670000000"
                />
              </div>

              <div class="form-group">
                <label for="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  placeholder="Choisissez un mot de passe"
                  [class.invalid]="isFieldInvalid('password')"
                />
                <small class="field-error" *ngIf="isFieldInvalid('password')">
                  Le mot de passe est requis.
                </small>
              </div>

              <div class="form-group full-width">
                <label for="confirmPassword">Confirmer le mot de passe</label>
                <input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  placeholder="Retapez votre mot de passe"
                  [class.invalid]="passwordMismatch"
                />
                <small class="field-error" *ngIf="passwordMismatch">
                  Les mots de passe ne correspondent pas.
                </small>
              </div>
            </div>

            <button type="submit" class="primary-btn" [disabled]="loading">
              {{ loading ? 'Création...' : 'Créer mon compte' }}
            </button>
          </form>

          <div class="success-box" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="error-box" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="helper-links">
            <a routerLink="/login">Déjà un compte ? Se connecter</a>
            <a routerLink="/">Retour à l’accueil</a>
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

    .auth-shell {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      padding: 40px 0 56px;
      background:
        radial-gradient(circle at top right, rgba(255, 179, 71, 0.18), transparent 28%),
        radial-gradient(circle at bottom left, rgba(255, 122, 89, 0.12), transparent 30%);
    }

    .auth-grid {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 24px;
      align-items: center;
    }

    .auth-aside,
    .auth-card,
    .benefit-card {
      background: white;
      border: 1px solid #f0e5df;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.06);
    }

    .auth-aside,
    .auth-card {
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

    .auth-aside h1 {
      margin: 0 0 14px;
      font-size: clamp(2rem, 4vw, 3.2rem);
      line-height: 1.08;
      color: #111827;
    }

    .auth-aside p {
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

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    label {
      font-weight: 700;
      color: #374151;
      font-size: 0.95rem;
    }

    label span {
      color: #9ca3af;
      font-weight: 600;
      font-size: 0.85rem;
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
      .auth-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .auth-aside,
      .auth-card {
        padding: 22px;
        border-radius: 24px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .helper-links {
        flex-direction: column;
        gap: 10px;
      }
    }
  `],
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';
  successMessage = '';

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  get passwordMismatch(): boolean {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;

    return !!password && !!confirmPassword && password !== confirmPassword;
  }

  isFieldInvalid(
    fieldName: 'name' | 'email' | 'password' | 'confirmPassword',
  ): boolean {
    const control = this.form.controls[fieldName];
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    if (this.form.invalid || this.loading || this.passwordMismatch) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      name: this.form.controls.name.value!.trim(),
      email: this.form.controls.email.value!.trim(),
      password: this.form.controls.password.value!,
      phone: this.form.controls.phone.value?.trim() || undefined,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/check-email'], {
          queryParams: { email: payload.email },
        });
      },
      error: (error: unknown) => {
        this.loading = false;

        const message =
          typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
            ? (error as any).error.message
            : 'Erreur lors de la création du compte';

        this.errorMessage = message;
      },
    });
  }
}