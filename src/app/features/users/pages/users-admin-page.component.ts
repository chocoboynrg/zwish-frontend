import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminUsersService, AdminUser, AdminUsersResponse } from '../services/admin-users.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-users-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Utilisateurs</h1>
          <p class="subtitle">{{ response()?.summary?.totalCount ?? 0 }} comptes au total</p>
        </div>
        <button class="btn-export" (click)="exportCsv()" [disabled]="exporting()">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 3v10M6 9l4 4 4-4M4 17h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ exporting() ? 'Export...' : 'Export CSV' }}
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row" *ngIf="response() as r">
        <div class="stat">
          <span class="stat-value">{{ r.summary.activeCount }}</span>
          <span class="stat-label">Actifs</span>
        </div>
        <div class="stat stat-warn">
          <span class="stat-value">{{ r.summary.suspendedCount }}</span>
          <span class="stat-label">Suspendus</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ r.summary.verifiedCount }}</span>
          <span class="stat-label">Email vérifié</span>
        </div>
        <div class="stat stat-muted">
          <span class="stat-value">{{ r.summary.unverifiedCount }}</span>
          <span class="stat-label">Non vérifiés</span>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-bar">
        <input
          class="search-input"
          type="text"
          placeholder="Rechercher par nom ou email..."
          [(ngModel)]="search"
          (ngModelChange)="onSearchChange()"
        />

        <select [(ngModel)]="roleFilter" (ngModelChange)="loadUsers()">
          <option value="">Tous les rôles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>

        <select [(ngModel)]="verifiedFilter" (ngModelChange)="loadUsers()">
          <option value="">Vérification</option>
          <option value="true">Email vérifié</option>
          <option value="false">Non vérifié</option>
        </select>

        <select [(ngModel)]="suspendedFilter" (ngModelChange)="loadUsers()">
          <option value="">Statut</option>
          <option value="false">Actifs</option>
          <option value="true">Suspendus</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-card">
        <div class="loading-bar" *ngIf="loading()"></div>

        <p class="empty-state" *ngIf="!loading() && users().length === 0">
          Aucun utilisateur trouvé.
        </p>

        <div class="table-wrapper" *ngIf="users().length > 0">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Email</th>
                <th>Inscrit le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users()" [class.row-suspended]="user.isSuspended">
                <td>
                  <div class="user-cell">
                    <div class="avatar">{{ getInitials(user.name) }}</div>
                    <div>
                      <div class="user-name">{{ user.name }}</div>
                      <div class="user-email">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="getRoleBadge(user.platformRole)">
                    {{ user.platformRole }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="user.isSuspended ? 'badge-red' : 'badge-green'">
                    {{ user.isSuspended ? 'Suspendu' : 'Actif' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="user.emailVerifiedAt ? 'badge-green' : 'badge-gray'">
                    {{ user.emailVerifiedAt ? 'Vérifié' : 'Non vérifié' }}
                  </span>
                </td>
                <td class="date-cell">{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                <td>
                  <div class="actions-cell">
                    <a [routerLink]="['/admin/users', user.id]" class="btn-sm btn-view">Voir</a>

                    <button
                      *ngIf="!user.isSuspended && canSuspend(user)"
                      class="btn-sm btn-warn"
                      (click)="openSuspendModal(user)"
                    >
                      Suspendre
                    </button>

                    <button
                      *ngIf="user.isSuspended && canSuspend(user)"
                      class="btn-sm btn-success"
                      (click)="unsuspend(user)"
                      [disabled]="actionLoading() === user.id"
                    >
                      {{ actionLoading() === user.id ? '...' : 'Réactiver' }}
                    </button>

                    <button
                      *ngIf="isSuperAdmin() && user.platformRole !== 'SUPER_ADMIN' && user.id !== currentUserId()"
                      class="btn-sm btn-role"
                      (click)="openRoleModal(user)"
                    >
                      Rôle
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages() > 1">
          <button (click)="goToPage(page() - 1)" [disabled]="page() === 1">←</button>
          <span>Page {{ page() }} / {{ totalPages() }}</span>
          <button (click)="goToPage(page() + 1)" [disabled]="page() === totalPages()">→</button>
        </div>
      </div>

      <!-- Modal suspension -->
      <div class="modal-backdrop" *ngIf="suspendTarget()" (click)="closeSuspendModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Suspendre {{ suspendTarget()?.name }}</h2>
          <p class="modal-sub">Cette action empêchera l'utilisateur de se connecter.</p>
          <label>
            Raison <span class="required">*</span>
            <input type="text" [(ngModel)]="suspendReason" placeholder="Ex: Violation des CGU" />
          </label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeSuspendModal()">Annuler</button>
            <button class="btn-danger" (click)="confirmSuspend()" [disabled]="!suspendReason.trim() || actionLoading() !== null">
              {{ actionLoading() !== null ? '...' : 'Confirmer la suspension' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal rôle -->
      <div class="modal-backdrop" *ngIf="roleTarget()" (click)="closeRoleModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Changer le rôle de {{ roleTarget()?.name }}</h2>
          <p class="modal-sub">Rôle actuel : <strong>{{ roleTarget()?.platformRole }}</strong></p>
          <label>
            Nouveau rôle
            <select [(ngModel)]="newRole">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeRoleModal()">Annuler</button>
            <button class="btn-primary" (click)="confirmRole()" [disabled]="actionLoading() !== null">
              {{ actionLoading() !== null ? '...' : 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 0; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    h1 { margin: 0 0 4px; font-size: 1.8rem; font-weight: 800; color: #111827; }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.95rem; }

    .btn-export {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      background: white;
      color: #374151;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: 0.15s;
      white-space: nowrap;
    }
    .btn-export:hover:not(:disabled) { background: #f9fafb; }
    .btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Stats */
    .stats-row {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .stat {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 16px 22px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;
    }
    .stat-warn { border-color: #fde68a; background: #fffbeb; }
    .stat-muted { opacity: 0.7; }
    .stat-value { font-size: 1.8rem; font-weight: 800; color: #111827; }
    .stat-label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Filtres */
    .filters-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 10px 14px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      font: inherit;
      font-size: 0.95rem;
    }
    .search-input:focus { outline: none; border-color: #6366f1; }
    select {
      padding: 10px 14px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      font: inherit;
      background: white;
      color: #374151;
      cursor: pointer;
    }

    /* Table card */
    .table-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
    }

    .loading-bar {
      height: 3px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1);
      background-size: 200%;
      animation: shimmer 1.2s infinite;
    }
    @keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }

    .empty-state { text-align: center; color: #9ca3af; padding: 48px; margin: 0; }

    .table-wrapper { overflow-x: auto; }

    table { width: 100%; border-collapse: collapse; }
    thead { background: #f9fafb; }
    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 0.78rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    td { padding: 14px 16px; border-top: 1px solid #f3f4f6; vertical-align: middle; }
    tr.row-suspended td { background: #fef9f9; }
    tr:hover td { background: #fafafa; }
    tr.row-suspended:hover td { background: #fef2f2; }

    /* User cell */
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .user-name { font-weight: 600; color: #111827; font-size: 0.95rem; }
    .user-email { color: #9ca3af; font-size: 0.82rem; }
    .date-cell { color: #6b7280; font-size: 0.88rem; white-space: nowrap; }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-gray { background: #f3f4f6; color: #6b7280; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-purple { background: #ede9fe; color: #6d28d9; }
    .badge-orange { background: #ffedd5; color: #c2410c; }

    /* Action buttons */
    .actions-cell { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn-sm {
      padding: 6px 12px;
      border-radius: 8px;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: 0;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-view { background: #f3f4f6; color: #374151; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-view:hover { background: #e5e7eb; }
    .btn-warn { background: #fef3c7; color: #92400e; }
    .btn-warn:hover { background: #fde68a; }
    .btn-success { background: #dcfce7; color: #166534; }
    .btn-success:hover { background: #bbf7d0; }
    .btn-role { background: #ede9fe; color: #6d28d9; }
    .btn-role:hover { background: #ddd6fe; }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 16px;
      border-top: 1px solid #f3f4f6;
      color: #6b7280;
      font-size: 0.9rem;
    }
    .pagination button {
      padding: 8px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font: inherit;
    }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    .modal {
      background: white;
      border-radius: 20px;
      padding: 32px;
      width: min(480px, 100%);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal h2 { margin: 0; font-size: 1.3rem; color: #111827; }
    .modal-sub { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .modal label { display: flex; flex-direction: column; gap: 8px; font-weight: 600; font-size: 0.9rem; color: #374151; }
    .required { color: #ef4444; }
    .modal input, .modal select {
      padding: 10px 14px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      font: inherit;
      font-size: 0.95rem;
    }
    .modal input:focus, .modal select:focus { outline: none; border-color: #6366f1; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .btn-cancel { padding: 10px 20px; border: 1px solid #d1d5db; border-radius: 10px; background: white; font: inherit; font-weight: 600; cursor: pointer; }
    .btn-danger { padding: 10px 20px; border: 0; border-radius: 10px; background: #ef4444; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { padding: 10px 20px; border: 0; border-radius: 10px; background: #6366f1; color: white; font: inherit; font-weight: 700; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class UsersAdminPageComponent implements OnInit {
  private readonly usersService = inject(AdminUsersService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  readonly response = signal<AdminUsersResponse | null>(null);
  readonly loading = signal(false);
  readonly actionLoading = signal<number | null>(null);
  readonly exporting = signal(false);

  readonly users = computed(() => this.response()?.items ?? []);
  readonly totalPages = computed(() => {
    const r = this.response();
    if (!r) return 1;
    return Math.ceil(r.summary.totalCount / r.summary.limit);
  });

  readonly currentUserId = computed(() => this.auth.getCurrentUserSnapshot()?.id ?? null);
  readonly isSuperAdmin = computed(() => this.auth.getCurrentUserSnapshot()?.platformRole === 'SUPER_ADMIN');

  // Filtres
  search = '';
  roleFilter = '';
  verifiedFilter = '';
  suspendedFilter = '';
  page = signal(1);

  // Modals
  readonly suspendTarget = signal<AdminUser | null>(null);
  suspendReason = '';
  readonly roleTarget = signal<AdminUser | null>(null);
  newRole = 'USER';

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    const query: any = { page: this.page(), limit: 20 };
    if (this.search.trim()) query.search = this.search.trim();
    if (this.roleFilter) query.role = this.roleFilter;
    if (this.verifiedFilter !== '') query.verified = this.verifiedFilter === 'true';
    if (this.suspendedFilter !== '') query.suspended = this.suspendedFilter === 'true';

    this.usersService.getUsers(query).subscribe({
      next: (r) => { this.response.set(r); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Impossible de charger les utilisateurs.'); },
    });
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.loadUsers(); }, 400);
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadUsers();
  }

  canSuspend(user: AdminUser): boolean {
    const me = this.auth.getCurrentUserSnapshot();
    if (!me) return false;
    if (user.id === me.id) return false;
    if (user.platformRole === 'SUPER_ADMIN') return false;
    if (me.platformRole === 'ADMIN' && user.platformRole === 'ADMIN') return false;
    return true;
  }

  openSuspendModal(user: AdminUser): void {
    this.suspendTarget.set(user);
    this.suspendReason = '';
  }

  closeSuspendModal(): void {
    this.suspendTarget.set(null);
    this.suspendReason = '';
  }

  confirmSuspend(): void {
    const target = this.suspendTarget();
    if (!target || !this.suspendReason.trim()) return;
    this.actionLoading.set(target.id);
    this.usersService.suspend(target.id, this.suspendReason.trim()).subscribe({
      next: (updated) => {
        this.updateUser(updated);
        this.actionLoading.set(null);
        this.closeSuspendModal();
        this.toast.success(`${updated.name} a été suspendu.`);
      },
      error: (e) => {
        this.actionLoading.set(null);
        this.toast.error(e?.error?.message ?? 'Erreur lors de la suspension.');
      },
    });
  }

  unsuspend(user: AdminUser): void {
    this.actionLoading.set(user.id);
    this.usersService.unsuspend(user.id).subscribe({
      next: (updated) => {
        this.updateUser(updated);
        this.actionLoading.set(null);
        this.toast.success(`${updated.name} a été réactivé.`);
      },
      error: (e) => {
        this.actionLoading.set(null);
        this.toast.error(e?.error?.message ?? 'Erreur lors de la réactivation.');
      },
    });
  }

  openRoleModal(user: AdminUser): void {
    this.roleTarget.set(user);
    this.newRole = user.platformRole === 'ADMIN' ? 'USER' : 'ADMIN';
  }

  closeRoleModal(): void {
    this.roleTarget.set(null);
  }

  confirmRole(): void {
    const target = this.roleTarget();
    if (!target) return;
    this.actionLoading.set(target.id);
    this.usersService.updateRole(target.id, this.newRole).subscribe({
      next: (updated) => {
        this.updateUser(updated);
        this.actionLoading.set(null);
        this.closeRoleModal();
        this.toast.success(`Rôle de ${updated.name} mis à jour : ${updated.platformRole}`);
      },
      error: (e) => {
        this.actionLoading.set(null);
        this.toast.error(e?.error?.message ?? 'Erreur lors du changement de rôle.');
      },
    });
  }

  exportCsv(): void {
    this.exporting.set(true);
    const query: any = {};
    if (this.roleFilter) query.role = this.roleFilter;
    if (this.verifiedFilter !== '') query.verified = this.verifiedFilter === 'true';
    if (this.suspendedFilter !== '') query.suspended = this.suspendedFilter === 'true';
    if (this.search.trim()) query.search = this.search.trim();

    this.usersService.exportCsv(query).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => { this.exporting.set(false); this.toast.error('Erreur lors de l\'export.'); },
    });
  }

  private updateUser(updated: AdminUser): void {
    this.response.update((r) => {
      if (!r) return r;
      return { ...r, items: r.items.map((u) => u.id === updated.id ? updated : u) };
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