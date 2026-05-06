import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface DashSummary {
  totalUsers: number;
  verifiedUsers: number;
  newUsersLast7Days: number;
  totalEvents: number;
  totalWishlists: number;
  totalWishlistItems: number;
  totalContributions: number;
  confirmedContributions: number;
  confirmedContributionsAmount: number;
  totalPayments: number;
  succeededPayments: number;
  succeededPaymentsAmount: number;
  failedPayments: number;
  conversionRate: number;
  anomaliesCount: number;
}
interface RevenueDay {
  date: string;
  amount: number;
}
interface LatestPayment {
  id: number;
  amount: number;
  currencyCode: string;
  status: string;
  createdAt: string;
  payer: { name: string };
  event: { title: string } | null;
}
interface AdminDashboard {
  summary: DashSummary;
  analytics: { revenueByDay: RevenueDay[] };
  latestPayments: LatestPayment[];
}

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dash">
      <!-- Header -->
      <div class="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p class="dash-date">{{ today }}</p>
        </div>
        <div class="header-pills">
          @if (d && d.summary.anomaliesCount === 0) {
            <span class="pill-ok">✓ Aucune anomalie</span>
          }
          @if (d && d.summary.anomaliesCount > 0) {
            <span class="pill-warn">⚠ {{ d.summary.anomaliesCount }} anomalie(s)</span>
          }
        </div>
      </div>

      @if (loading) {
        <div class="loading">Chargement...</div>
      }

      @if (d) {
        <!-- KPI row -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-blue">
            <div class="kpi-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.6" />
                <path
                  d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ d.summary.totalUsers }}</div>
              <div class="kpi-label">Utilisateurs</div>
            </div>
            <div class="kpi-sub">+{{ d.summary.newUsersLast7Days }} cette semaine</div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect
                  x="1"
                  y="5"
                  width="18"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
                <path d="M1 9h18" stroke="currentColor" stroke-width="1.6" />
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ formatAmount(d.summary.succeededPaymentsAmount) }}</div>
              <div class="kpi-label">Revenus totaux (XOF)</div>
            </div>
            <div class="kpi-sub">{{ d.summary.succeededPayments }} paiements réussis</div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2l2.4 5 5.6.8-4 3.9.9 5.5L10 14.5l-4.9 2.7.9-5.5-4-3.9 5.6-.8z"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ pct(d.summary.conversionRate) }}%</div>
              <div class="kpi-label">Taux de conversion</div>
            </div>
            <div class="kpi-sub">
              {{ d.summary.confirmedContributions }} contributions confirmées
            </div>
          </div>
          <div class="kpi-card kpi-amber">
            <div class="kpi-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect
                  x="2"
                  y="4"
                  width="16"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
                <path
                  d="M6 2v4M14 2v4M2 9h16"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ d.summary.totalEvents }}</div>
              <div class="kpi-label">Événements</div>
            </div>
            <div class="kpi-sub">
              {{ d.summary.totalWishlists }} wishlists · {{ d.summary.totalWishlistItems }} items
            </div>
          </div>
        </div>
        <!-- Revenue bar chart + Recent payments -->
        <div class="bottom-grid">
          <!-- Revenue chart -->
          <div class="panel">
            <div class="panel-head">
              <span class="panel-title">Revenus (30 jours)</span>
              <span class="panel-total"
                >{{ formatAmount(d.summary.succeededPaymentsAmount) }} XOF</span
              >
            </div>
            @if (chartBars.length > 0) {
              <div class="chart-wrap">
                <div class="bars">
                  @for (b of chartBars; track b.label) {
                    <div class="bar-col" [title]="b.label + ': ' + formatAmount(b.amount) + ' XOF'">
                      <div class="bar-fill" [style.height]="b.pct + '%'"></div>
                      <div class="bar-label">{{ b.label }}</div>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="empty-chart">Aucun revenu sur la période</div>
            }
          </div>
          <!-- Recent payments -->
          <div class="panel">
            <div class="panel-head">
              <span class="panel-title">Derniers paiements</span>
              <a routerLink="/admin/payments" class="panel-link">Voir tout →</a>
            </div>
            <div class="pay-list">
              @for (p of d.latestPayments.slice(0, 6); track p.id) {
                <div class="pay-row">
                  <div
                    class="pay-avatar"
                    [class.av-success]="p.status === 'SUCCEEDED'"
                    [class.av-fail]="p.status === 'FAILED'"
                  >
                    {{ initials(p.payer.name) }}
                  </div>
                  <div class="pay-info">
                    <div class="pay-name">{{ p.payer.name }}</div>
                    <div class="pay-event">{{ p.event?.title ?? '—' }}</div>
                  </div>
                  <div class="pay-right">
                    <div class="pay-amount">
                      {{ p.amount | number: '1.0-0' }} <span>{{ p.currencyCode }}</span>
                    </div>
                    <span
                      class="pay-badge"
                      [class.badge-ok]="p.status === 'SUCCEEDED'"
                      [class.badge-fail]="p.status === 'FAILED'"
                      [class.badge-pend]="p.status === 'INITIATED'"
                    >
                      {{
                        p.status === 'SUCCEEDED'
                          ? 'Réussi'
                          : p.status === 'FAILED'
                            ? 'Échoué'
                            : 'En cours'
                      }}
                    </span>
                  </div>
                </div>
              }
              @if (d.latestPayments.length === 0) {
                <div class="empty-list">Aucun paiement récent.</div>
              }
            </div>
          </div>
        </div>
        <!-- Quick actions -->
        <div class="quick-actions">
          <a routerLink="/admin/jackpot" class="qa-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2c0 0-7 3.5-7 9a7 7 0 0014 0c0-5.5-7-9-7-9z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Cagnottes
          </a>
          <a routerLink="/admin/product-requests" class="qa-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 3H6a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V7l-3-4z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Demandes produit
          </a>
          <a routerLink="/admin/users" class="qa-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Utilisateurs
          </a>
          <a routerLink="/admin/reconciliation" class="qa-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 6h12M4 10h8M4 14h10"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            Réconciliation
          </a>
          <a routerLink="/admin/audit" class="qa-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"
                stroke="currentColor"
                stroke-width="1.6"
              />
            </svg>
            Audit logs
          </a>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dash {
        padding: 32px;
        max-width: 1200px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* Header */
      .dash-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      h1 {
        font-size: 1.6rem;
        font-weight: 900;
        color: #0f172a;
        margin: 0 0 4px;
      }
      .dash-date {
        color: #94a3b8;
        font-size: 0.82rem;
        margin: 0;
      }
      .header-pills {
        display: flex;
        gap: 8px;
        align-items: center;
        padding-top: 4px;
      }
      .pill-ok {
        background: #dcfce7;
        color: #166534;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .pill-warn {
        background: #fef3c7;
        color: #92400e;
        padding: 5px 12px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .loading {
        color: #94a3b8;
        font-size: 0.9rem;
        padding: 48px;
        text-align: center;
      }

      /* KPI cards */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }
      .kpi-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        border: 1px solid #f1f5f9;
        position: relative;
        overflow: hidden;
      }
      .kpi-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
      }
      .kpi-blue::before {
        background: #6366f1;
      }
      .kpi-green::before {
        background: #10b981;
      }
      .kpi-purple::before {
        background: #8b5cf6;
      }
      .kpi-amber::before {
        background: #f59e0b;
      }
      .kpi-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .kpi-blue .kpi-icon {
        background: #eef2ff;
        color: #6366f1;
      }
      .kpi-green .kpi-icon {
        background: #ecfdf5;
        color: #10b981;
      }
      .kpi-purple .kpi-icon {
        background: #f5f3ff;
        color: #8b5cf6;
      }
      .kpi-amber .kpi-icon {
        background: #fffbeb;
        color: #f59e0b;
      }
      .kpi-body {
        flex: 1;
      }
      .kpi-val {
        font-size: 1.8rem;
        font-weight: 900;
        color: #0f172a;
        line-height: 1;
        margin-bottom: 4px;
      }
      .kpi-label {
        font-size: 0.78rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .kpi-sub {
        font-size: 0.75rem;
        color: #94a3b8;
        padding-top: 4px;
        border-top: 1px solid #f1f5f9;
      }

      /* Bottom grid */
      .bottom-grid {
        display: grid;
        grid-template-columns: 1fr 1.4fr;
        gap: 16px;
      }
      .panel {
        background: white;
        border: 1px solid #f1f5f9;
        border-radius: 16px;
        padding: 20px;
      }
      .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .panel-title {
        font-size: 0.88rem;
        font-weight: 800;
        color: #0f172a;
      }
      .panel-total {
        font-size: 0.82rem;
        font-weight: 700;
        color: #10b981;
      }
      .panel-link {
        font-size: 0.78rem;
        font-weight: 700;
        color: #6366f1;
        text-decoration: none;
      }
      .panel-link:hover {
        text-decoration: underline;
      }

      /* Chart */
      .chart-wrap {
        height: 140px;
      }
      .bars {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 120px;
        padding-bottom: 24px;
        position: relative;
      }
      .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
        gap: 4px;
      }
      .bar-fill {
        width: 100%;
        background: linear-gradient(180deg, #6366f1, #818cf8);
        border-radius: 4px 4px 0 0;
        min-height: 3px;
        transition: height 0.3s;
      }
      .bar-label {
        font-size: 0.58rem;
        color: #94a3b8;
        white-space: nowrap;
      }
      .empty-chart {
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        font-size: 0.82rem;
      }

      /* Payments list */
      .pay-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pay-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .pay-avatar {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.72rem;
        font-weight: 800;
        flex-shrink: 0;
      }
      .av-success {
        background: #dcfce7;
        color: #166534;
      }
      .av-fail {
        background: #fee2e2;
        color: #991b1b;
      }
      .pay-info {
        flex: 1;
        min-width: 0;
      }
      .pay-name {
        font-size: 0.82rem;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pay-event {
        font-size: 0.72rem;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pay-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 3px;
        flex-shrink: 0;
      }
      .pay-amount {
        font-size: 0.82rem;
        font-weight: 800;
        color: #0f172a;
      }
      .pay-amount span {
        font-size: 0.7rem;
        color: #94a3b8;
        font-weight: 600;
      }
      .pay-badge {
        padding: 2px 7px;
        border-radius: 999px;
        font-size: 0.65rem;
        font-weight: 700;
      }
      .badge-ok {
        background: #dcfce7;
        color: #166534;
      }
      .badge-fail {
        background: #fee2e2;
        color: #991b1b;
      }
      .badge-pend {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .empty-list {
        color: #94a3b8;
        font-size: 0.82rem;
        text-align: center;
        padding: 24px;
      }

      /* Quick actions */
      .quick-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .qa-btn {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 9px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        background: white;
        color: #374151;
        text-decoration: none;
        font-size: 0.82rem;
        font-weight: 700;
        transition: 0.15s;
      }
      .qa-btn:hover {
        border-color: #6366f1;
        color: #6366f1;
        background: #eef2ff;
      }

      @media (max-width: 1100px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 768px) {
        .bottom-grid {
          grid-template-columns: 1fr;
        }
        .kpi-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly http = inject(HttpClient);

  loading = true;
  d: AdminDashboard | null = null;
  chartBars: { label: string; amount: number; pct: number }[] = [];
  today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/dashboard/admin`).subscribe({
      next: (r) => {
        this.d = r?.data ?? null;
        this.buildChart();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  buildChart(): void {
    const days = this.d?.analytics?.revenueByDay ?? [];
    if (!days.length) return;
    const max = Math.max(...days.map((d) => d.amount), 1);
    this.chartBars = days.slice(-14).map((d) => ({
      label: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      amount: d.amount,
      pct: Math.max(4, Math.round((d.amount / max) * 100)),
    }));
  }

  formatAmount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
    return String(n);
  }

  pct(r: number): number {
    return Math.round(r * 100);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
