import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <!-- Panneau gauche -->
      <div class="auth-panel">
        <div class="panel-content">
          <a routerLink="/" class="panel-logo"><span class="z">Z</span>Wish</a>
          <div class="panel-body">
            <h2>Créez votre compte.<br/>Lancez-vous dès aujourd'hui.</h2>
            <p>Rejoignez des centaines d'organisateurs qui font confiance à ZWish pour leurs moments importants.</p>
            <div class="panel-steps">
              <div class="ps-item">
                <div class="ps-num">1</div>
                <span>Créez votre compte en 30 secondes</span>
              </div>
              <div class="ps-item">
                <div class="ps-num">2</div>
                <span>Vérifiez votre email</span>
              </div>
              <div class="ps-item">
                <div class="ps-num">3</div>
                <span>Lancez votre premier événement</span>
              </div>
            </div>
          </div>
          <div class="panel-cta">
            Déjà inscrit ? <a routerLink="/login" class="panel-link">Se connecter →</a>
          </div>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="auth-form-side">
        <div class="form-wrap">
          <div class="form-header">
            <h1>Créer un compte</h1>
            <p>Déjà inscrit ? <a routerLink="/login" class="link">Se connecter →</a></p>
          </div>

          <div class="alert alert-error" *ngIf="errorMessage">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            {{ errorMessage }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label>Nom complet</label>
              <input type="text" formControlName="name" placeholder="Marie Dupont" [class.invalid]="isInvalid('name')" autocomplete="name" />
              <span class="field-err" *ngIf="isInvalid('name')">Nom requis.</span>
            </div>

            <div class="field">
              <label>Adresse email</label>
              <input type="email" formControlName="email" placeholder="vous@exemple.com" [class.invalid]="isInvalid('email')" autocomplete="email" />
              <span class="field-err" *ngIf="isInvalid('email')">Email invalide.</span>
            </div>

            <div class="field">
              <label>Mot de passe</label>
              <div class="password-wrap">
                <input [type]="showPw ? 'text' : 'password'" formControlName="password" placeholder="8 caractères minimum" [class.invalid]="isInvalid('password')" autocomplete="new-password" />
                <button type="button" class="toggle-pw" (click)="showPw = !showPw" tabindex="-1">
                  <svg *ngIf="!showPw" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg>
                  <svg *ngIf="showPw" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                </button>
              </div>
              <span class="field-err" *ngIf="isInvalid('password')">8 caractères minimum.</span>
              <!-- Force du mot de passe -->
              <div class="pw-strength" *ngIf="form.get('password')?.value">
                <div class="pw-bar">
                  <div class="pw-fill" [style.width]="pwStrength() + '%'" [ngClass]="pwClass()"></div>
                </div>
                <span class="pw-label" [ngClass]="pwClass()">{{ pwLabel() }}</span>
              </div>
            </div>

            <div class="field">
              <label>Confirmer le mot de passe</label>
              <input [type]="showPw ? 'text' : 'password'" formControlName="confirmPassword" placeholder="••••••••" [class.invalid]="isInvalid('confirmPassword') || mismatch()" autocomplete="new-password" />
              <span class="field-err" *ngIf="mismatch()">Les mots de passe ne correspondent pas.</span>
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading">
              <span *ngIf="!loading">Créer mon compte</span>
              <span *ngIf="loading" class="loading-dots"><span></span><span></span><span></span></span>
            </button>

            <p class="terms">En créant un compte, vous acceptez nos <a href="#" class="terms-link">Conditions d'utilisation</a> et notre <a href="#" class="terms-link">Politique de confidentialité</a>.</p>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-page { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }

    .auth-panel {
      background: #000; position: relative; overflow: hidden;
      background-image: radial-gradient(ellipse 70% 60% at 20% 30%, rgba(255,215,0,0.1) 0%, transparent 55%),
                        radial-gradient(ellipse 60% 70% at 85% 75%, rgba(255,100,0,0.07) 0%, transparent 50%);
    }
    .panel-content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; padding: 40px 48px; gap: 40px; }
    .panel-logo { font-size: 1.6rem; font-weight: 900; color: white; text-decoration: none; letter-spacing: -0.02em; }
    .z { color: #FFD700; }
    .panel-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 24px; }
    .panel-body h2 { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 900; color: white; line-height: 1.2; letter-spacing: -0.03em; margin: 0; }
    .panel-body p { color: rgba(255,255,255,0.5); font-size: 1rem; line-height: 1.7; margin: 0; }
    .panel-steps { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
    .ps-item { display: flex; align-items: center; gap: 14px; color: rgba(255,255,255,0.7); font-size: 0.9rem; }
    .ps-num { width: 28px; height: 28px; border-radius: 50%; background: #FFD700; color: #000; font-weight: 900; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .panel-cta { color: rgba(255,255,255,0.4); font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; }
    .panel-link { color: #FFD700; font-weight: 700; text-decoration: none; }

    .auth-form-side { background: #fff; display: flex; align-items: center; justify-content: center; padding: 40px 24px; overflow-y: auto; }
    .form-wrap { width: min(440px, 100%); display: flex; flex-direction: column; gap: 24px; }

    .form-header h1 { font-size: 2rem; font-weight: 900; color: #111; margin: 0 0 8px; letter-spacing: -0.02em; }
    .form-header p { color: #6b7280; margin: 0; font-size: 0.9rem; }
    .link { color: #111; font-weight: 700; text-decoration: none; }

    .alert { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; border-radius: 12px; font-size: 0.88rem; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .alert svg { flex-shrink: 0; margin-top: 1px; }

    .field { display: flex; flex-direction: column; gap: 7px; }
    label { font-size: 0.85rem; font-weight: 700; color: #374151; }
    input { padding: 12px 16px; border: 1.5px solid #e5e7eb; border-radius: 12px; font: inherit; font-size: 0.95rem; background: #f9fafb; transition: 0.2s; outline: 0; }
    input:focus { border-color: #111; background: white; }
    input.invalid { border-color: #ef4444; background: #fff5f5; }
    .field-err { font-size: 0.78rem; color: #ef4444; }

    .password-wrap { position: relative; }
    .password-wrap input { width: 100%; box-sizing: border-box; padding-right: 48px; }
    .toggle-pw { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: 0; border: 0; cursor: pointer; color: #9ca3af; padding: 4px; }

    .pw-strength { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
    .pw-bar { flex: 1; height: 4px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
    .pw-fill { height: 100%; border-radius: 999px; transition: width 0.3s, background 0.3s; }
    .pw-fill.weak { background: #ef4444; }
    .pw-fill.medium { background: #f59e0b; }
    .pw-fill.strong { background: #22c55e; }
    .pw-label { font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
    .pw-label.weak { color: #ef4444; }
    .pw-label.medium { color: #f59e0b; }
    .pw-label.strong { color: #22c55e; }

    .btn-submit { width: 100%; padding: 14px; border: 0; border-radius: 12px; background: #111; color: white; font: inherit; font-size: 1rem; font-weight: 800; cursor: pointer; transition: 0.2s; margin-top: 4px; }
    .btn-submit:hover:not(:disabled) { background: #000; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .loading-dots { display: flex; align-items: center; justify-content: center; gap: 5px; }
    .loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: white; animation: bounce 1.2s infinite; }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,80%,100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }

    .terms { color: #9ca3af; font-size: 0.78rem; text-align: center; margin: 0; line-height: 1.6; }
    .terms-link { color: #6b7280; }

    @media (max-width: 768px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-panel { display: none; }
    }
  `],
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  loading = false;
  showPw = false;
  errorMessage = '';

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  mismatch(): boolean {
    const pw = this.form.get('password')?.value;
    const cpw = this.form.get('confirmPassword')?.value;
    return !!(this.form.get('confirmPassword')?.touched && pw && cpw && pw !== cpw);
  }

  pwStrength(): number {
    const pw = this.form.get('password')?.value ?? '';
    if (pw.length < 6) return 25;
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return 55;
    return 100;
  }

  pwClass(): string {
    const s = this.pwStrength();
    if (s < 40) return 'weak';
    if (s < 80) return 'medium';
    return 'strong';
  }

  pwLabel(): string {
    const c = this.pwClass();
    if (c === 'weak') return 'Faible';
    if (c === 'medium') return 'Moyen';
    return 'Fort';
  }

  submit(): void {
    if (this.form.invalid || this.mismatch()) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    const { name, email, password } = this.form.getRawValue();
    this.auth.register({ name: name!, email: email!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/check-email'], { queryParams: { email } });
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Erreur lors de l\'inscription.';
      },
    });
  }
}