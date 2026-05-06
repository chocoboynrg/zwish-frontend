import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { CurrentUser } from '../../../core/models/current-user.model';
import { environment } from '../../../../environments/environment';
import { ItemResponse } from '../../../core/types/api-response.types';

@Component({
  selector: 'app-my-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <!-- Hero -->
      <div class="page-hero">
        <div class="page-hero-inner">
          <div>
            <div class="page-eyebrow">Mon espace</div>
            <h1>Mon profil</h1>
            <p>Modifiez vos informations personnelles.</p>
          </div>
        </div>
      </div>

      <div class="page-body">
        <div class="profile-card">
          <!-- Avatar initiales -->
          <div class="avatar-block">
            <div class="avatar-circle">{{ initials() }}</div>
            <div class="avatar-info">
              <div class="avatar-name">{{ user()?.name }}</div>
              <div class="avatar-email">{{ user()?.email }}</div>
              <div class="avatar-role">{{ roleLabel() }}</div>
            </div>
          </div>

          <!-- Formulaire -->
          <form class="profile-form" (ngSubmit)="save()" #f="ngForm">
            <div class="form-group">
              <label class="form-label" for="name">Nom complet</label>
              <input
                id="name"
                class="form-input"
                type="text"
                [(ngModel)]="name"
                name="name"
                maxlength="120"
                placeholder="Votre nom"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="phone">Numéro de téléphone</label>
              <input
                id="phone"
                class="form-input"
                type="tel"
                [(ngModel)]="phone"
                name="phone"
                maxlength="30"
                placeholder="+229 97 00 00 00"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Adresse e-mail</label>
              <input class="form-input form-input-disabled" type="email" [value]="user()?.email ?? ''" disabled />
              <div class="form-hint">L'adresse e-mail ne peut pas être modifiée.</div>
            </div>

            @if (errorMsg()) {
              <div class="alert-error">{{ errorMsg() }}</div>
            }
            @if (successMsg()) {
              <div class="alert-success">{{ successMsg() }}</div>
            }

            <div class="form-actions">
              <button class="btn-save" type="submit" [disabled]="saving()">
                @if (saving()) {
                  <span class="btn-spinner"></span>
                }
                {{ saving() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap { min-height: 100vh; background: #f8f9fb; }

    .page-hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 2.5rem 1.5rem 2rem;
      color: #fff;
    }
    .page-hero-inner { max-width: 700px; margin: 0 auto; }
    .page-eyebrow { font-size: .75rem; text-transform: uppercase; letter-spacing: .1em; color: #f0c040; margin-bottom: .4rem; font-weight: 600; }
    h1 { font-size: 1.8rem; font-weight: 700; margin: 0 0 .4rem; }
    p { color: rgba(255,255,255,.65); margin: 0; font-size: .95rem; }

    .page-body { max-width: 700px; margin: 0 auto; padding: 2rem 1.5rem; }

    .profile-card {
      background: #fff;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
    }

    .avatar-block {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .avatar-circle {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f0c040, #e0a800);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.4rem; color: #1a1a2e;
      flex-shrink: 0;
    }
    .avatar-name { font-weight: 700; font-size: 1.1rem; color: #1a1a2e; }
    .avatar-email { font-size: .85rem; color: #666; margin-top: .15rem; }
    .avatar-role {
      display: inline-block; margin-top: .35rem;
      font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
      background: #f0f4ff; color: #4361ee; padding: .15rem .6rem; border-radius: 999px;
    }

    .profile-form { display: flex; flex-direction: column; gap: 1.25rem; }

    .form-group { display: flex; flex-direction: column; gap: .4rem; }
    .form-label { font-size: .85rem; font-weight: 600; color: #333; }
    .form-input {
      padding: .65rem .9rem;
      border: 1.5px solid #e0e0e0;
      border-radius: .5rem;
      font-size: .95rem;
      transition: border-color .2s;
      outline: none;
    }
    .form-input:focus { border-color: #4361ee; }
    .form-input-disabled { background: #f5f5f5; color: #888; cursor: not-allowed; }
    .form-hint { font-size: .8rem; color: #999; }

    .alert-error {
      padding: .75rem 1rem; background: #fff2f2; border: 1px solid #ffcdd2;
      border-radius: .5rem; color: #c0392b; font-size: .9rem;
    }
    .alert-success {
      padding: .75rem 1rem; background: #f0fff4; border: 1px solid #b2dfdb;
      border-radius: .5rem; color: #1e7e5a; font-size: .9rem;
    }

    .form-actions { display: flex; justify-content: flex-end; margin-top: .5rem; }
    .btn-save {
      padding: .7rem 1.75rem;
      background: #f0c040; color: #1a1a2e;
      border: none; border-radius: .5rem;
      font-weight: 700; font-size: .95rem;
      cursor: pointer; display: flex; align-items: center; gap: .5rem;
      transition: opacity .2s;
    }
    .btn-save:hover:not(:disabled) { opacity: .85; }
    .btn-save:disabled { opacity: .6; cursor: not-allowed; }

    .btn-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(26,26,46,.3);
      border-top-color: #1a1a2e;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 600px) {
      .page-hero { padding: 1.5rem 1rem 1.25rem; }
      .page-body { padding: 1.25rem 1rem; }
      .profile-card { padding: 1.25rem; }
    }
  `],
})
export class MyProfilePageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly user = signal<CurrentUser | null>(null);
  readonly saving = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');

  name = '';
  phone = '';

  readonly initials = () => {
    const n = this.user()?.name ?? '';
    return n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  readonly roleLabel = () => {
    const r = this.user()?.platformRole;
    if (r === 'ADMIN') return 'Admin';
    if (r === 'SUPER_ADMIN') return 'Super Admin';
    return 'Utilisateur';
  };

  ngOnInit(): void {
    const u = this.authService.getCurrentUserSnapshot();
    this.user.set(u);
    this.name = u?.name ?? '';
    this.phone = u?.phoneNumber ?? '';
  }

  save(): void {
    if (this.saving()) return;
    this.errorMsg.set('');
    this.successMsg.set('');
    this.saving.set(true);

    this.http
      .patch<ItemResponse<CurrentUser>>(`${environment.apiBaseUrl}/users/me/profile`, {
        name: this.name.trim() || undefined,
        phoneNumber: this.phone.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          const updated = res.data.item;
          this.user.set(updated);
          this.tokenStorage.setUser(updated);
          this.saving.set(false);
          this.successMsg.set('Profil mis à jour avec succès.');
          setTimeout(() => this.successMsg.set(''), 3000);
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving.set(false);
          this.errorMsg.set(err?.error?.message ?? 'Une erreur est survenue.');
        },
      });
  }
}
