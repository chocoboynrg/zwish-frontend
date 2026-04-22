import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AdminDashboard {
  summary: {
    totalUsers: number;
    totalEvents: number;
    totalWishlists: number;
    totalWishlistItems: number;
    totalContributions: number;
    succeededPayments: number;
  };
}

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1>Dashboard admin</h1>

      <p *ngIf="loading">Chargement...</p>
      <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>

      <div class="stats-grid" *ngIf="dashboard">
        <div class="card">
          <h3>Utilisateurs</h3>
          <p>{{ dashboard.summary.totalUsers ?? 0 }}</p>
        </div>

        <div class="card">
          <h3>Événements</h3>
          <p>{{ dashboard.summary.totalEvents ?? 0 }}</p>
        </div>

        <div class="card">
          <h3>Wishlists</h3>
          <p>{{ dashboard.summary.totalWishlists ?? 0 }}</p>
        </div>

        <div class="card">
          <h3>Items</h3>
          <p>{{ dashboard.summary.totalWishlistItems ?? 0 }}</p>
        </div>

        <div class="card">
          <h3>Contributions</h3>
          <p>{{ dashboard.summary.totalContributions ?? 0 }}</p>
        </div>

        <div class="card">
          <h3>Paiements réussis</h3>
          <p>{{ dashboard.summary.succeededPayments ?? 0 }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-top: 20px;
      }

      .card {
        background: white;
        border-radius: 14px;
        padding: 18px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }

      .card h3 {
        margin: 0 0 8px;
        font-size: 14px;
        color: #6b7280;
      }

      .card p {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }

      .error {
        color: #c62828;
      }
    `,
  ],
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly http = inject(HttpClient);

  loading = false;
  errorMessage = '';
  dashboard: AdminDashboard | null = null;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(`${environment.apiBaseUrl}/dashboard/admin`).subscribe({
      next: (response) => {
        this.dashboard = response?.data ?? null;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Impossible de charger le dashboard admin';
        this.loading = false;
      },
    });
  }
}