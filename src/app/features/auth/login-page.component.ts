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
    <div class="auth-page">
      <!-- Panneau gauche décoratif -->
      <div class="auth-panel">
        <div class="panel-content">
          <a routerLink="/" class="panel-logo"><span class="z">Z</span>Wish</a>
          <div class="panel-body">
            <h2>Organisez vos événements.<br/>Recevez ce qui compte.</h2>
            <p>La plateforme wishlist événementielle qui simplifie la vie des organisateurs et de leurs invités.</p>
            <div class="panel-features">
              <div class="pf-item">
                <div class="pf-icon">🎁</div>
                <div>
                  <div class="pf-title">Wishlist centralisée</div>
                  <div class="pf-desc">Gérez tous vos cadeaux au même endroit</div>
                </div>
              </div>
              <div class="pf-item">
                <div class="pf-icon">💳</div>
                <div>
                  <div class="pf-title">Contributions suivies</div>
                  <div class="pf-desc">Paiements et progressions en temps réel</div>
                </div>
              </div>
              <div class="pf-item">
                <div class="pf-icon">🔗</div>
                <div>
                  <div class="pf-title">Partage simplifié</div>
                  <div class="pf-desc">Un lien unique pour vos invités</div>
                </div>
              </div>
            </div>
          </div>
          <div class="panel-quote">"Le meilleur cadeau est celui qu'on reçoit vraiment."</div>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="auth-form-side">
        <div class="form-wrap">
          <div class="form-header">
            <h1>Connexion</h1>
            <p>Pas encore de compte ? <a routerLink="/register" class="link">Créer un compte →</a></p>
          </div>

          <!-- Erreur / Succès -->
          <div class="alert alert-error" *ngIf="errorMessage">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            {{ errorMessage }}
          </div>
          <div class="alert alert-success" *ngIf="successMessage">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            {{ successMessage }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label>Adresse email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="vous@exemple.com"
                [class.invalid]="isInvalid('email')"
                autocomplete="email"
              />
              <span class="field-err" *ngIf="isInvalid('email')">Email invalide.</span>
            </div>

            <div class="field">
              <label>
                Mot de passe
                <a routerLink="/forgot-password" class="label-link">Mot de passe oublié ?</a>
              </label>
              <div class="password-wrap">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  [class.invalid]="isInvalid('password')"
                  autocomplete="current-password"
                />
                <button type="button" class="toggle-pw" (click)="showPassword = !showPassword" tabindex="-1">
                  <svg *ngIf="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg>
                  <svg *ngIf="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                </button>
              </div>
              <span class="field-err" *ngIf="isInvalid('password')">Mot de passe requis.</span>
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading">
              <span *ngIf="!loading">Se connecter</span>
              <span *ngIf="loading" class="loading-dots">
                <span></span><span></span><span></span>
              </span>
            </button>
          </form>

          <div class="resend-wrap" *ngIf="showResend">
            <p>Email non vérifié ?</p>
            <button class="btn-resend" (click)="resendVerification()">Renvoyer l'email de vérification →</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-page { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }

    /* PANEL GAUCHE */
    .auth-panel {
      background: #000; position: relative; overflow: hidden;
      background-image: radial-gradient(ellipse 80% 60% at 30% 40%, rgba(255,215,0,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 80% at 80% 80%, rgba(255,100,0,0.07) 0%, transparent 50%);
    }
    .panel-content {
      position: relative; z-index: 1; height: 100%;
      display: flex; flex-direction: column; padding: 40px 48px; gap: 40px;
    }
    .panel-logo {
      font-size: 1.6rem; font-weight: 900; color: white; text-decoration: none;
      letter-spacing: -0.02em;
    }
    .z { color: #FFD700; }
    .panel-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 24px; }
    .panel-body h2 { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 900; color: white; line-height: 1.2; letter-spacing: -0.03em; margin: 0; }
    .panel-body p { color: rgba(255,255,255,0.5); font-size: 1rem; line-height: 1.7; margin: 0; }
    .panel-features { display: flex; flex-direction: column; gap: 20px; margin-top: 8px; }
    .pf-item { display: flex; align-items: flex-start; gap: 16px; }
    .pf-icon { font-size: 1.5rem; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; flex-shrink: 0; }
    .pf-title { color: white; font-weight: 700; font-size: 0.92rem; margin-bottom: 3px; }
    .pf-desc { color: rgba(255,255,255,0.45); font-size: 0.82rem; }
    .panel-quote { color: rgba(255,255,255,0.3); font-style: italic; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; }

    /* FORM SIDE */
    .auth-form-side { background: #fff; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
    .form-wrap { width: min(440px, 100%); display: flex; flex-direction: column; gap: 28px; }

    .form-header h1 { font-size: 2rem; font-weight: 900; color: #111; margin: 0 0 8px; letter-spacing: -0.02em; }
    .form-header p { color: #6b7280; margin: 0; font-size: 0.9rem; }
    .link { color: #111; font-weight: 700; text-decoration: none; }
    .link:hover { text-decoration: underline; }

    /* Alerts */
    .alert { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; border-radius: 12px; font-size: 0.88rem; line-height: 1.5; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .alert svg { flex-shrink: 0; margin-top: 1px; }

    /* Fields */
    .field { display: flex; flex-direction: column; gap: 7px; }
    label {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.85rem; font-weight: 700; color: #374151;
    }
    .label-link { font-weight: 600; color: #6b7280; text-decoration: none; font-size: 0.8rem; }
    .label-link:hover { color: #111; }
    input {
      padding: 12px 16px; border: 1.5px solid #e5e7eb; border-radius: 12px;
      font: inherit; font-size: 0.95rem; background: #f9fafb;
      transition: border-color 0.2s, background 0.2s; outline: 0;
    }
    input:focus { border-color: #111; background: white; }
    input.invalid { border-color: #ef4444; background: #fff5f5; }
    .field-err { font-size: 0.78rem; color: #ef4444; }

    .password-wrap { position: relative; }
    .password-wrap input { width: 100%; box-sizing: border-box; padding-right: 48px; }
    .toggle-pw { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: 0; border: 0; cursor: pointer; color: #9ca3af; padding: 4px; }
    .toggle-pw:hover { color: #374151; }

    .btn-submit {
      width: 100%; padding: 14px; border: 0; border-radius: 12px;
      background: #111; color: white; font: inherit; font-size: 1rem; font-weight: 800;
      cursor: pointer; transition: 0.2s; margin-top: 4px;
    }
    .btn-submit:hover:not(:disabled) { background: #000; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .loading-dots { display: flex; align-items: center; justify-content: center; gap: 5px; }
    .loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: white; animation: bounce 1.2s infinite; }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,80%,100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }

    .resend-wrap { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .resend-wrap p { margin: 0; font-size: 0.85rem; color: #92400e; font-weight: 600; }
    .btn-resend { background: 0; border: 0; color: #92400e; font: inherit; font-size: 0.85rem; font-weight: 700; cursor: pointer; padding: 0; text-decoration: underline; }

    @media (max-width: 768px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-panel { display: none; }
    }
  `],
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  showPassword = false;
  showResend = false;
  errorMessage = '';
  successMessage = '';
  private returnUrl = '';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? '/app';
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: (response) => {
        const user = response.user;
        this.loading = false;
        const isVerified = (user as any).emailVerified === true;
        if (!isVerified) {
          this.router.navigate(['/check-email'], { queryParams: { email: user.email, from: 'login' } });
          return;
        }
        const role = user.platformRole;
        if (this.returnUrl && this.returnUrl !== '/app') { this.router.navigateByUrl(this.returnUrl); return; }
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') { this.router.navigateByUrl('/admin'); return; }
        this.router.navigateByUrl('/app');
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message ?? 'Connexion impossible';
        this.errorMessage = msg;
        const lower = msg.toLowerCase();
        if (lower.includes('vérifié') || lower.includes('verifie') || lower.includes('verify')) {
          this.showResend = true;
        }
      },
    });
  }

  resendVerification(): void {
    const email = this.form.get('email')?.value?.trim();
    if (!email) { this.errorMessage = 'Entrez votre email d\'abord.'; return; }
    this.auth.resendVerification(email).subscribe({
      next: () => { this.successMessage = 'Email de vérification envoyé !'; this.showResend = false; },
      error: (err: any) => { this.errorMessage = err?.error?.message ?? 'Erreur lors de l\'envoi.'; },
    });
  }
}
