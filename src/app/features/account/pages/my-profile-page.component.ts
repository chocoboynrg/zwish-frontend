import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
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
      <div class="page-hero">
        <div class="page-hero-inner">
          <div class="page-eyebrow">Mon espace</div>
          <h1>Mon profil</h1>
          <p>Modifiez vos informations personnelles.</p>
        </div>
      </div>

      <div class="page-body">

        <!-- ── Informations générales ── -->
        <div class="card">
          <h2 class="card-title">Informations personnelles</h2>

          <!-- Avatar -->
          <div class="avatar-block">
            <div class="avatar-wrap" (click)="triggerAvatarInput()" title="Changer la photo">
              @if (user()?.avatarUrl) {
                <img class="avatar-img" [src]="avatarPreview() || user()!.avatarUrl!" alt="Avatar" />
              } @else if (avatarPreview()) {
                <img class="avatar-img" [src]="avatarPreview()!" alt="Avatar" />
              } @else {
                <div class="avatar-circle">{{ initials() }}</div>
              }
              <div class="avatar-overlay">
                <span>📷</span>
              </div>
              @if (avatarUploading()) {
                <div class="avatar-loading"><div class="spinner-sm"></div></div>
              }
            </div>
            <input #avatarInput type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="onAvatarSelected($event)" />
            <div class="avatar-meta">
              <div class="avatar-name">{{ user()?.name }}</div>
              <div class="avatar-email">{{ user()?.email }}</div>
              <div class="avatar-role">{{ roleLabel() }}</div>
              <div class="avatar-hint">Cliquez sur la photo pour la modifier (max 5 Mo)</div>
            </div>
          </div>

          @if (avatarError()) {
            <div class="alert-error mb">{{ avatarError() }}</div>
          }
          @if (avatarSuccess()) {
            <div class="alert-success mb">{{ avatarSuccess() }}</div>
          }

          <!-- Formulaire infos -->
          <form class="profile-form" (ngSubmit)="saveProfile()">
            <div class="form-group">
              <label class="form-label" for="name">Nom complet</label>
              <input id="name" class="form-input" type="text" [(ngModel)]="name" name="name" maxlength="120" placeholder="Votre nom" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="phone">Numéro de téléphone</label>
              <input id="phone" class="form-input" type="tel" [(ngModel)]="phone" name="phone" maxlength="30" placeholder="+229 97 00 00 00" />
            </div>
            <div class="form-group">
              <label class="form-label">Adresse e-mail</label>
              <input class="form-input form-input-disabled" type="email" [value]="user()?.email ?? ''" disabled />
              <div class="form-hint">L'adresse e-mail ne peut pas être modifiée.</div>
            </div>

            @if (profileError()) { <div class="alert-error">{{ profileError() }}</div> }
            @if (profileSuccess()) { <div class="alert-success">{{ profileSuccess() }}</div> }

            <div class="form-actions">
              <button class="btn-primary" type="submit" [disabled]="profileSaving()">
                @if (profileSaving()) { <span class="btn-spinner"></span> }
                {{ profileSaving() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>

        <!-- ── Mot de passe ── -->
        <div class="card">
          <h2 class="card-title">Changer le mot de passe</h2>
          <form class="profile-form" (ngSubmit)="changePassword()">
            <div class="form-group">
              <label class="form-label" for="currentPwd">Mot de passe actuel</label>
              <div class="input-wrap">
                <input
                  id="currentPwd"
                  class="form-input"
                  [type]="showCurrent() ? 'text' : 'password'"
                  [(ngModel)]="currentPassword"
                  name="currentPassword"
                  placeholder="••••••••"
                  required
                />
                <button type="button" class="eye-btn" (click)="showCurrent.set(!showCurrent())">
                  {{ showCurrent() ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="newPwd">Nouveau mot de passe</label>
              <div class="input-wrap">
                <input
                  id="newPwd"
                  class="form-input"
                  [type]="showNew() ? 'text' : 'password'"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  placeholder="Minimum 8 caractères"
                  minlength="8"
                  required
                />
                <button type="button" class="eye-btn" (click)="showNew.set(!showNew())">
                  {{ showNew() ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="confirmPwd">Confirmer le mot de passe</label>
              <div class="input-wrap">
                <input
                  id="confirmPwd"
                  class="form-input"
                  [type]="showConfirm() ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                />
                <button type="button" class="eye-btn" (click)="showConfirm.set(!showConfirm())">
                  {{ showConfirm() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                <div class="form-hint error">Les mots de passe ne correspondent pas.</div>
              }
            </div>

            @if (pwdError()) { <div class="alert-error">{{ pwdError() }}</div> }
            @if (pwdSuccess()) { <div class="alert-success">{{ pwdSuccess() }}</div> }

            <div class="form-actions">
              <button class="btn-primary" type="submit"
                [disabled]="pwdSaving() || newPassword !== confirmPassword || !currentPassword || newPassword.length < 8">
                @if (pwdSaving()) { <span class="btn-spinner"></span> }
                {{ pwdSaving() ? 'Modification...' : 'Changer le mot de passe' }}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-wrap { min-height: 100vh; background: #f8f9fb; }

    .page-hero { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 2.5rem 1.5rem 2rem; color: #fff; }
    .page-hero-inner { max-width: 700px; margin: 0 auto; }
    .page-eyebrow { font-size: .75rem; text-transform: uppercase; letter-spacing: .1em; color: #f0c040; margin-bottom: .4rem; font-weight: 600; }
    h1 { font-size: 1.8rem; font-weight: 700; margin: 0 0 .4rem; }
    p { color: rgba(255,255,255,.65); margin: 0; font-size: .95rem; }

    .page-body { max-width: 700px; margin: 0 auto; padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }

    .card { background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
    .card-title { font-size: 1.05rem; font-weight: 700; color: #1a1a2e; margin: 0 0 1.5rem; padding-bottom: .75rem; border-bottom: 1px solid #f0f0f0; }

    /* Avatar */
    .avatar-block { display: flex; align-items: flex-start; gap: 1.25rem; margin-bottom: 1.75rem; }
    .avatar-wrap { position: relative; width: 80px; height: 80px; border-radius: 50%; cursor: pointer; flex-shrink: 0; }
    .avatar-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; display: block; }
    .avatar-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #f0c040, #e0a800); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.6rem; color: #1a1a2e; }
    .avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; opacity: 0; transition: opacity .2s; }
    .avatar-wrap:hover .avatar-overlay { opacity: 1; }
    .avatar-loading { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; }
    .avatar-meta { flex: 1; }
    .avatar-name { font-weight: 700; font-size: 1.1rem; color: #1a1a2e; }
    .avatar-email { font-size: .85rem; color: #666; margin-top: .15rem; }
    .avatar-role { display: inline-block; margin-top: .35rem; font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; background: #f0f4ff; color: #4361ee; padding: .15rem .6rem; border-radius: 999px; }
    .avatar-hint { font-size: .78rem; color: #aaa; margin-top: .4rem; }

    /* Form */
    .profile-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: .4rem; }
    .form-label { font-size: .85rem; font-weight: 600; color: #333; }
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-wrap .form-input { flex: 1; padding-right: 2.5rem; }
    .eye-btn { position: absolute; right: .6rem; background: none; border: none; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; }
    .form-input { padding: .65rem .9rem; border: 1.5px solid #e0e0e0; border-radius: .5rem; font-size: .95rem; transition: border-color .2s; outline: none; width: 100%; box-sizing: border-box; }
    .form-input:focus { border-color: #4361ee; }
    .form-input-disabled { background: #f5f5f5; color: #888; cursor: not-allowed; }
    .form-hint { font-size: .8rem; color: #999; }
    .form-hint.error { color: #e74c3c; }

    .alert-error { padding: .75rem 1rem; background: #fff2f2; border: 1px solid #ffcdd2; border-radius: .5rem; color: #c0392b; font-size: .9rem; }
    .alert-success { padding: .75rem 1rem; background: #f0fff4; border: 1px solid #b2dfdb; border-radius: .5rem; color: #1e7e5a; font-size: .9rem; }
    .mb { margin-bottom: .75rem; }

    .form-actions { display: flex; justify-content: flex-end; margin-top: .5rem; }
    .btn-primary { padding: .7rem 1.75rem; background: #f0c040; color: #1a1a2e; border: none; border-radius: .5rem; font-weight: 700; font-size: .95rem; cursor: pointer; display: flex; align-items: center; gap: .5rem; transition: opacity .2s; }
    .btn-primary:hover:not(:disabled) { opacity: .85; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

    .spinner-sm { width: 18px; height: 18px; border: 2.5px solid rgba(0,0,0,.15); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
    .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(26,26,46,.3); border-top-color: #1a1a2e; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 600px) {
      .page-hero { padding: 1.5rem 1rem 1.25rem; }
      .page-body { padding: 1.25rem 1rem; }
      .card { padding: 1.25rem; }
    }
  `],
})
export class MyProfilePageComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly user = signal<CurrentUser | null>(null);

  // Infos
  name = '';
  phone = '';
  readonly profileSaving = signal(false);
  readonly profileError = signal('');
  readonly profileSuccess = signal('');

  // Avatar
  readonly avatarPreview = signal<string | null>(null);
  readonly avatarUploading = signal(false);
  readonly avatarError = signal('');
  readonly avatarSuccess = signal('');

  // Mot de passe
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);
  readonly pwdSaving = signal(false);
  readonly pwdError = signal('');
  readonly pwdSuccess = signal('');

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

  triggerAvatarInput(): void {
    this.avatarInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.avatarError.set('Le fichier dépasse 5 Mo.');
      return;
    }

    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    this.avatarError.set('');
    this.avatarSuccess.set('');
    this.avatarUploading.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<{ data: { avatarUrl: string } }>(`${environment.apiBaseUrl}/users/me/avatar`, formData).subscribe({
      next: (res) => {
        const updated = { ...this.user()!, avatarUrl: res.data.avatarUrl };
        this.user.set(updated);
        this.tokenStorage.setUser(updated);
        this.avatarPreview.set(null);
        this.avatarUploading.set(false);
        this.avatarSuccess.set('Photo de profil mise à jour.');
        setTimeout(() => this.avatarSuccess.set(''), 3000);
      },
      error: () => {
        this.avatarPreview.set(null);
        this.avatarUploading.set(false);
        this.avatarError.set("Erreur lors de l'upload. Vérifiez le format (JPEG, PNG, WebP).");
      },
    });
  }

  saveProfile(): void {
    if (this.profileSaving()) return;
    this.profileError.set('');
    this.profileSuccess.set('');
    this.profileSaving.set(true);

    this.http.patch<ItemResponse<CurrentUser>>(`${environment.apiBaseUrl}/users/me/profile`, {
      name: this.name.trim() || undefined,
      phoneNumber: this.phone.trim() || undefined,
    }).subscribe({
      next: (res) => {
        const updated = res.data.item;
        this.user.set(updated);
        this.tokenStorage.setUser(updated);
        this.profileSaving.set(false);
        this.profileSuccess.set('Profil mis à jour avec succès.');
        setTimeout(() => this.profileSuccess.set(''), 3000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.profileSaving.set(false);
        this.profileError.set(err?.error?.message ?? 'Une erreur est survenue.');
      },
    });
  }

  changePassword(): void {
    if (this.pwdSaving() || this.newPassword !== this.confirmPassword) return;
    this.pwdError.set('');
    this.pwdSuccess.set('');
    this.pwdSaving.set(true);

    this.http.patch(`${environment.apiBaseUrl}/users/me/password`, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.pwdSaving.set(false);
        this.pwdSuccess.set('Mot de passe modifié avec succès.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => this.pwdSuccess.set(''), 4000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.pwdSaving.set(false);
        this.pwdError.set(err?.error?.message ?? 'Une erreur est survenue.');
      },
    });
  }
}
