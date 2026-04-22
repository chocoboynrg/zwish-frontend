import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminUsersService, AdminUserDetail } from '../services/admin-users.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-detail-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">

      <a routerLink="/admin/users" class="back-link">← Retour utilisateurs</a>

      <div *ngIf="loading()" class="loading-state">Chargement...</div>
      <div *ngIf="error()" class="error-state">{{ error() }}</div>

      <ng-container *ngIf="user() as u">

        <!-- Header profil -->
        <div class="profile-header">
          <div class="profile-avatar">{{ getInitials(u.name) }}</div>
          <div class="profile-info">
            <h1>{{ u.name }}</h1>
            <p>{{ u.email }}</p>
            <div class="badges">
              <span class="badge" [ngClass]="getRoleBadge(u.platformRole)">{{ u.platformRole }}</span>
              <span class="badge" [ngClass]="u.isSuspended ? 'badge-red' : 'badge-green'">{{ u.isSuspended ? 'Suspendu' : 'Actif' }}</span>
              <span class="badge" [ngClass]="u.emailVerifiedAt ? 'badge-green' : 'badge-gray'">{{ u.emailVerifiedAt ? 'Email vérifié' : 'Non vérifié' }}</span>
            </div>
          </div>
          <div class="profile-actions">
            <button
              *ngIf="!u.isSuspended && canSuspend(u)"
              class="btn-warn"
              (click)="showSuspendModal = true"
            >
              Suspendre
            </button>
            <button
              *ngIf="u.isSuspended && canSuspend(u)"
              class="btn-success"
              (click)="doUnsuspend()"
              [disabled]="actionLoading()"
            >
              {{ actionLoading() ? '...' : 'Réactiver' }}
            </button>
            <button
              *ngIf="isSuperAdmin() && u.platformRole !== 'SUPER_ADMIN' && u.id !== currentUserId()"
              class="btn-role"
              (click)="showRoleModal = true; newRole = u.platformRole === 'ADMIN' ? 'USER' : 'ADMIN'"
            >
              Changer rôle
            </button>
          </div>
        </div>

        <!-- Infos & Stats -->
        <div class="two-cols">
          <div class="card">
            <h2>Informations</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">ID</span>
                <span class="info-value">#{{ u.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Téléphone</span>
                <span class="info-value">{{ u.phoneNumber || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Inscrit le</span>
                <span class="info-value">{{ u.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="info-item" *ngIf="u.isSuspended">
                <span class="info-label">Suspendu le</span>
                <span class="info-value warn">{{ u.suspendedAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="info-item" *ngIf="u.isSuspended && u.suspensionReason">
                <span class="info-label">Raison</span>
                <span class="info-value warn">{{ u.suspensionReason }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Statistiques</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ u.summary.organizedEventsCount }}</span>
                <span class="stat-label">Événements organisés</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ u.summary.contributionsCount }}</span>
                <span class="stat-label">Contributions</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ u.summary.paymentsCount }}</span>
                <span class="stat-label">Paiements</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ u.summary.reservationsCount }}</span>
                <span class="stat-label">Réservations</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Événements organisés -->
        <div class="card" *ngIf="u.organizedEvents && u.organizedEvents.length > 0">
          <h2>Événements organisés ({{ u.organizedEvents.length }})</h2>
          <div class="list">
            <div class="list-item" *ngFor="let e of u.organizedEvents">
              <span class="list-title">{{ e.title }}</span>
              <span class="list-meta">{{ e.eventDate | date:'dd/MM/yyyy' }}</span>
              <a [routerLink]="['/admin/events', e.id]" class="list-link">Voir →</a>
            </div>
          </div>
        </div>

        <!-- Dernières contributions — backend retourne latestContributions -->
        <div class="card" *ngIf="u.latestContributions && u.latestContributions.length > 0">
          <h2>Dernières contributions ({{ u.latestContributions.length }})</h2>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Événement</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of u.latestContributions">
                  <td>{{ c.wishlistItem?.name ?? '—' }}</td>
                  <td>{{ c.event?.title ?? '—' }}</td>
                  <td>{{ c.amount | number }} {{ c.currencyCode }}</td>
                  <td><span class="badge badge-gray">{{ c.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Derniers paiements — backend retourne latestPayments -->
        <div class="card" *ngIf="u.latestPayments && u.latestPayments.length > 0">
          <h2>Derniers paiements ({{ u.latestPayments.length }})</h2>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Montant</th>
                  <th>Provider</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of u.latestPayments">
                  <td>#{{ p.id }}</td>
                  <td>{{ p.amount | number }} {{ p.currencyCode }}</td>
                  <td>{{ p.provider }}</td>
                  <td><span class="badge badge-gray">{{ p.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Dernières réservations — backend retourne latestReservations -->
        <div class="card" *ngIf="u.latestReservations && u.latestReservations.length > 0">
          <h2>Dernières réservations ({{ u.latestReservations.length }})</h2>
          <div class="list">
            <div class="list-item" *ngFor="let r of u.latestReservations">
              <span class="list-title">{{ r.wishlistItem?.name ?? '—' }}</span>
              <span class="list-meta">{{ r.event?.title ?? '—' }}</span>
              <span class="badge badge-gray">{{ r.status }}</span>
            </div>
          </div>
        </div>

        <!-- Audit log -->
        <div class="card" *ngIf="u.latestAuditLogs && u.latestAuditLogs.length > 0">
          <h2>Activité récente</h2>
          <div class="list">
            <div class="list-item" *ngFor="let log of u.latestAuditLogs">
              <span class="list-title">{{ log.action }}</span>
              <span class="list-meta">{{ log.entityType }}</span>
              <span class="list-meta">{{ log.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>
        </div>

      </ng-container>

      <!-- Modal suspension -->
      <div class="modal-backdrop" *ngIf="showSuspendModal" (click)="showSuspendModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Suspendre cet utilisateur</h2>
          <label>
            Raison <span class="required">*</span>
            <input type="text" [(ngModel)]="suspendReason" placeholder="Ex: Violation des CGU" />
          </label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="showSuspendModal = false">Annuler</button>
            <button class="btn-danger" (click)="doSuspend()" [disabled]="!suspendReason.trim() || actionLoading()">
              {{ actionLoading() ? '...' : 'Suspendre' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal rôle -->
      <div class="modal-backdrop" *ngIf="showRoleModal" (click)="showRoleModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Changer le rôle</h2>
          <label>
            Nouveau rôle
            <select [(ngModel)]="newRole">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="showRoleModal = false">Annuler</button>
            <button class="btn-primary" (click)="doRoleChange()" [disabled]="actionLoading()">
              {{ actionLoading() ? '...' : 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 0; }
    .back-link { display: inline-flex; color: #6b7280; text-decoration: none; font-weight: 600; font-size: 0.9rem; margin-bottom: 20px; }
    .back-link:hover { color: #111827; }
    .loading-state, .error-state { padding: 40px; text-align: center; color: #6b7280; }
    .error-state { color: #b91c1c; }

    .profile-header {
      display: flex; align-items: flex-start; gap: 20px;
      background: white; border: 1px solid #e5e7eb; border-radius: 20px;
      padding: 28px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .profile-avatar {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; font-weight: 800; flex-shrink: 0;
    }
    .profile-info { flex: 1; }
    .profile-info h1 { margin: 0 0 4px; font-size: 1.5rem; font-weight: 800; color: #111827; }
    .profile-info p { margin: 0 0 12px; color: #6b7280; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .profile-actions { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }

    .card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .card h2 { margin: 0 0 20px; font-size: 1.1rem; font-weight: 700; color: #111827; }

    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 768px) { .two-cols { grid-template-columns: 1fr; } }

    .info-grid { display: flex; flex-direction: column; gap: 0; }
    .info-item { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .info-item:last-child { border-bottom: 0; }
    .info-label { color: #6b7280; font-size: 0.88rem; font-weight: 600; }
    .info-value { color: #111827; font-weight: 500; text-align: right; }
    .info-value.warn { color: #b91c1c; }

    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stat-item { padding: 16px; background: #f9fafb; border-radius: 12px; }
    .stat-value { display: block; font-size: 1.8rem; font-weight: 800; color: #111827; }
    .stat-label { display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 4px; }

    .list { display: flex; flex-direction: column; gap: 8px; }
    .list-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .list-title { flex: 1; font-weight: 600; color: #111827; }
    .list-meta { color: #9ca3af; font-size: 0.85rem; white-space: nowrap; }
    .list-link { color: #6366f1; font-weight: 600; text-decoration: none; font-size: 0.85rem; }

    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px 12px; text-align: left; font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; background: #f9fafb; }
    td { padding: 12px; border-top: 1px solid #f3f4f6; color: #374151; font-size: 0.9rem; }

    .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-gray { background: #f3f4f6; color: #6b7280; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-purple { background: #ede9fe; color: #6d28d9; }

    .btn-warn, .btn-success, .btn-role {
      padding: 10px 18px; border: 0; border-radius: 10px;
      font: inherit; font-weight: 700; cursor: pointer; transition: opacity 0.15s;
    }
    .btn-warn:disabled, .btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-warn { background: #fef3c7; color: #92400e; }
    .btn-success { background: #dcfce7; color: #166534; }
    .btn-role { background: #ede9fe; color: #6d28d9; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
    .modal { background: white; border-radius: 20px; padding: 32px; width: min(480px, 100%); display: flex; flex-direction: column; gap: 16px; }
    .modal h2 { margin: 0; font-size: 1.2rem; color: #111827; }
    .modal label { display: flex; flex-direction: column; gap: 8px; font-weight: 600; font-size: 0.9rem; color: #374151; }
    .required { color: #ef4444; }
    .modal input, .modal select { padding: 10px 14px; border: 1.5px solid #d1d5db; border-radius: 10px; font: inherit; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancel { padding: 10px 18px; border: 1px solid #d1d5db; border-radius: 10px; background: white; font: inherit; font-weight: 600; cursor: pointer; }
    .btn-danger { padding: 10px 18px; border: 0; border-radius: 10px; background: #ef4444; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { padding: 10px 18px; border: 0; border-radius: 10px; background: #6366f1; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class UserDetailAdminPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usersService = inject(AdminUsersService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly user = signal<AdminUserDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionLoading = signal(false);

  readonly currentUserId = () => this.auth.getCurrentUserSnapshot()?.id ?? null;
  readonly isSuperAdmin = () => this.auth.getCurrentUserSnapshot()?.platformRole === 'SUPER_ADMIN';

  showSuspendModal = false;
  suspendReason = '';
  showRoleModal = false;
  newRole = 'USER';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.usersService.getUserById(id).subscribe({
      next: (u) => { this.user.set(u); this.loading.set(false); },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Impossible de charger cet utilisateur.');
        this.loading.set(false);
      },
    });
  }

  canSuspend(u: AdminUserDetail): boolean {
    const me = this.auth.getCurrentUserSnapshot();
    if (!me || u.id === me.id) return false;
    if (u.platformRole === 'SUPER_ADMIN') return false;
    if (me.platformRole === 'ADMIN' && u.platformRole === 'ADMIN') return false;
    return true;
  }

  doSuspend(): void {
    const u = this.user();
    if (!u || !this.suspendReason.trim()) return;
    this.actionLoading.set(true);
    this.usersService.suspend(u.id, this.suspendReason.trim()).subscribe({
      next: (updated) => {
        this.user.update((prev) => prev ? { ...prev, ...updated } : prev);
        this.actionLoading.set(false);
        this.showSuspendModal = false;
        this.suspendReason = '';
        this.toast.success('Utilisateur suspendu.');
      },
      error: (e) => { this.actionLoading.set(false); this.toast.error(e?.error?.message ?? 'Erreur.'); },
    });
  }

  doUnsuspend(): void {
    const u = this.user();
    if (!u) return;
    this.actionLoading.set(true);
    this.usersService.unsuspend(u.id).subscribe({
      next: (updated) => {
        this.user.update((prev) => prev ? { ...prev, ...updated } : prev);
        this.actionLoading.set(false);
        this.toast.success('Utilisateur réactivé.');
      },
      error: (e) => { this.actionLoading.set(false); this.toast.error(e?.error?.message ?? 'Erreur.'); },
    });
  }

  doRoleChange(): void {
    const u = this.user();
    if (!u) return;
    this.actionLoading.set(true);
    this.usersService.updateRole(u.id, this.newRole).subscribe({
      next: (updated) => {
        this.user.update((prev) => prev ? { ...prev, ...updated } : prev);
        this.actionLoading.set(false);
        this.showRoleModal = false;
        this.toast.success(`Rôle mis à jour : ${updated.platformRole}`);
      },
      error: (e) => { this.actionLoading.set(false); this.toast.error(e?.error?.message ?? 'Erreur.'); },
    });
  }

  getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  getRoleBadge(role: string): string {
    if (role === 'SUPER_ADMIN') return 'badge-purple';
    if (role === 'ADMIN') return 'badge-blue';
    return 'badge-gray';
  }
}