import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <div class="auth-centered">
      <div class="verify-card">
        <a routerLink="/" class="card-logo"><span class="z">Z</span>Wish</a>

        <!-- Loading -->
        @if (loading) {
          <div class="verify-state">
            <div class="spinner"></div>
            <h1>Activation en cours...</h1>
            <p>Veuillez patienter quelques instants.</p>
          </div>
        }

        <!-- Succès -->
        @if (!loading && success) {
          <div class="verify-state">
            <div class="state-icon state-success">
              <lucide-icon name="check" [size]="36" color="#22c55e" [strokeWidth]="2" />
            </div>
            <h1>Email vérifié !</h1>
            <p>
              Votre compte est maintenant actif. Vous pouvez vous connecter et commencer à utiliser
              ZWish.
            </p>
            <a routerLink="/login" class="btn-primary"> Se connecter maintenant → </a>
            <a routerLink="/" class="btn-ghost">Retour à l'accueil</a>
          </div>
        }

        <!-- Erreur -->
        @if (!loading && !success && errorMessage) {
          <div class="verify-state">
            <div class="state-icon state-error">
              <lucide-icon name="x" [size]="36" color="#ef4444" [strokeWidth]="2" />
            </div>
            <h1>Lien invalide</h1>
            <p>{{ errorMessage }}</p>
            <a routerLink="/login" class="btn-primary">Aller à la connexion</a>
            <a routerLink="/" class="btn-ghost">Retour à l'accueil</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f9fafb;
      }
      .auth-centered {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
      }
      .verify-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        padding: 48px 40px;
        width: min(440px, 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        text-align: center;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.06);
      }
      .card-logo {
        font-size: 1.4rem;
        font-weight: 900;
        color: #111;
        text-decoration: none;
      }
      .z {
        color: #ffd700;
      }
      .verify-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        width: 100%;
      }
      h1 {
        font-size: 1.8rem;
        font-weight: 900;
        color: #111;
        margin: 0;
        letter-spacing: -0.02em;
      }
      p {
        color: #6b7280;
        line-height: 1.7;
        margin: 0;
        font-size: 0.92rem;
      }
      .spinner {
        width: 48px;
        height: 48px;
        border: 3px solid #f3f4f6;
        border-top-color: #111;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .state-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .state-success {
        background: #f0fdf4;
        border: 2px solid #bbf7d0;
      }
      .state-error {
        background: #fef2f2;
        border: 2px solid #fecaca;
      }
      .btn-primary {
        display: inline-flex;
        align-items: center;
        padding: 13px 28px;
        border: 0;
        border-radius: 12px;
        background: #111;
        color: white;
        font: inherit;
        font-size: 0.95rem;
        font-weight: 700;
        text-decoration: none;
        transition: 0.2s;
        width: 100%;
        justify-content: center;
      }
      .btn-primary:hover {
        background: #000;
      }
      .btn-ghost {
        color: #6b7280;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .btn-ghost:hover {
        color: #111;
      }
    `,
  ],
})
export class VerifyEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  loading = true;
  success = false;
  errorMessage = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.loading = false;
      this.errorMessage = 'Lien de vérification manquant ou invalide.';
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message ?? 'Lien expiré ou invalide. Demandez un nouvel email.';
      },
    });
  }
}
