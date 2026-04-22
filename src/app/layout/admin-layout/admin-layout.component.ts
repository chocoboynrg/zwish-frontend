import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">Wishlist Admin</div>

        <nav class="nav">
            <a routerLink="/admin">Dashboard</a>
            <a routerLink="/admin/events">Événements</a>
            <a routerLink="/admin/catalog">Catalogue</a>
            <a routerLink="/admin/product-requests">Demandes produit</a>
            <a routerLink="/admin/notifications">Notifications</a>
        </nav>

        <button class="logout-btn" (click)="logout()">Déconnexion</button>
      </aside>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 240px 1fr;
        background: #f5f7fb;
      }

      .sidebar {
        background: #111827;
        color: white;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .brand {
        font-size: 20px;
        font-weight: 700;
      }

      .nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .nav a {
        color: #d1d5db;
        text-decoration: none;
        padding: 10px 12px;
        border-radius: 10px;
      }

      .nav a:hover {
        background: #1f2937;
        color: white;
      }

      .logout-btn {
        margin-top: auto;
        height: 42px;
        border: 0;
        border-radius: 10px;
        background: #dc2626;
        color: white;
        cursor: pointer;
      }

      .content {
        padding: 24px;
      }
    `,
  ],
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}