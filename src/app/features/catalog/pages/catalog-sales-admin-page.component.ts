import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService, SalesReport, SalesReportProduct } from '../services/catalog.service';

@Component({
  selector: 'app-catalog-sales-admin-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <a routerLink="/admin/catalog" class="back-link">← Catalogue</a>
          <h1>Point des ventes</h1>
          <p class="subtitle">Contributions sur produits catalogue terminés · Gains réalisés</p>
        </div>
        <button class="btn-refresh" (click)="load()" [disabled]="loading()">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M17 10A7 7 0 116.23 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M14 1v5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Actualiser
        </button>
      </div>

      @if (loading()) {
        <div class="loading-bar"></div>
      }

      @if (!loading() && report()) {
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-blue">
            <div class="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ report()!.summary.totalCompleted }}</div>
              <div class="kpi-label">Produits terminés</div>
            </div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="6" width="22" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>
                <path d="M1 10h22" stroke="currentColor" stroke-width="1.8"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ report()!.summary.totalCollected | number }} <span class="kpi-currency">XOF</span></div>
              <div class="kpi-label">Total collecté</div>
            </div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value" [class.positive]="report()!.summary.totalGain >= 0" [class.negative]="report()!.summary.totalGain < 0">
                {{ report()!.summary.totalGain >= 0 ? '+' : '' }}{{ report()!.summary.totalGain | number }} <span class="kpi-currency">XOF</span>
              </div>
              <div class="kpi-label">Gain total net</div>
            </div>
          </div>
          <div class="kpi-card kpi-gray">
            <div class="kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="7" cy="17" r="2" stroke="currentColor" stroke-width="1.8"/>
                <circle cx="17" cy="17" r="2" stroke="currentColor" stroke-width="1.8"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ report()!.products.length }}</div>
              <div class="kpi-label">Produits avec ventes</div>
            </div>
          </div>
        </div>

        <!-- Courbe mensuelle -->
        @if (report()!.monthly.length > 0) {
          <div class="section-card">
            <div class="section-header">
              <h2>Évolution mensuelle</h2>
            </div>
            <div class="monthly-table">
              <table>
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th class="num">Terminés</th>
                    <th class="num">Collecté</th>
                    <th class="num">Coût réel</th>
                    <th class="num">Gain net</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of report()!.monthly; track m.month) {
                    <tr>
                      <td class="month-cell">{{ formatMonth(m.month) }}</td>
                      <td class="num">{{ m.completedItems }}</td>
                      <td class="num amount">{{ m.totalCollected | number }} XOF</td>
                      <td class="num cost">{{ m.totalRealCost | number }} XOF</td>
                      <td class="num" [class.gain-pos]="m.totalGain >= 0" [class.gain-neg]="m.totalGain < 0">
                        {{ m.totalGain >= 0 ? '+' : '' }}{{ m.totalGain | number }} XOF
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td>Total</td>
                    <td class="num">{{ report()!.summary.totalCompleted }}</td>
                    <td class="num amount">{{ report()!.summary.totalCollected | number }} XOF</td>
                    <td class="num cost">{{ totalRealCost() | number }} XOF</td>
                    <td class="num" [class.gain-pos]="report()!.summary.totalGain >= 0" [class.gain-neg]="report()!.summary.totalGain < 0">
                      {{ report()!.summary.totalGain >= 0 ? '+' : '' }}{{ report()!.summary.totalGain | number }} XOF
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        }

        <!-- Par produit -->
        <div class="section-card">
          <div class="section-header">
            <h2>Détail par produit</h2>
            <span class="count-badge">{{ report()!.products.length }} produit(s)</span>
          </div>
          @if (report()!.products.length === 0) {
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 4h14" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p>Aucun produit catalogue lié à des ventes terminées.</p>
              <p class="empty-hint">Les ventes apparaissent ici quand des wishlist items liés à des produits du catalogue sont entièrement financés.</p>
            </div>
          }
          @if (report()!.products.length > 0) {
            <div class="products-table-wrap">
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th class="num">Prix réel</th>
                    <th class="num">Prix vente</th>
                    <th class="num">Items liés</th>
                    <th class="num">Terminés</th>
                    <th class="num">Collecté</th>
                    <th class="num">Coût réel</th>
                    <th class="num">Gain net</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of report()!.products; track p.productId) {
                    <tr [class.row-positive]="p.totalGain > 0" [class.row-negative]="p.totalGain < 0">
                      <td class="product-name-cell">
                        <div class="product-name">{{ p.productName }}</div>
                        @if (p.completedItems > 0) {
                          <div class="completion-bar">
                            <div class="completion-fill" [style.width.%]="(p.completedItems / p.totalItems) * 100"></div>
                          </div>
                          <div class="completion-text">{{ p.completedItems }}/{{ p.totalItems }} terminés</div>
                        }
                      </td>
                      <td class="num price-col">
                        @if (p.realPrice != null) {
                          {{ p.realPrice | number }} <span class="curr">{{ p.currencyCode }}</span>
                        } @else {
                          <span class="na">—</span>
                        }
                      </td>
                      <td class="num price-col">
                        @if (p.sellingPrice != null) {
                          {{ p.sellingPrice | number }} <span class="curr">{{ p.currencyCode }}</span>
                        } @else {
                          <span class="na">—</span>
                        }
                      </td>
                      <td class="num">{{ p.totalItems }}</td>
                      <td class="num">
                        <span class="badge-count" [class.badge-count-green]="p.completedItems > 0">{{ p.completedItems }}</span>
                      </td>
                      <td class="num amount">{{ p.totalCollected | number }} <span class="curr">{{ p.currencyCode }}</span></td>
                      <td class="num cost">{{ p.totalRealCost | number }} <span class="curr">{{ p.currencyCode }}</span></td>
                      <td class="num gain-cell" [class.gain-pos]="p.totalGain >= 0" [class.gain-neg]="p.totalGain < 0">
                        <span class="gain-value">
                          {{ p.totalGain >= 0 ? '+' : '' }}{{ p.totalGain | number }}
                        </span>
                        <span class="curr">{{ p.currencyCode }}</span>
                        @if (p.totalRealCost > 0) {
                          <div class="gain-pct">
                            {{ ((p.totalGain / p.totalRealCost) * 100) | number:'1.0-1' }}%
                          </div>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      @if (!loading() && !report()) {
        <div class="error-state">
          <p>Impossible de charger le rapport. Vérifiez la connexion au serveur.</p>
          <button class="btn-primary" (click)="load()">Réessayer</button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page { padding: 32px 24px; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .back-link {
      display: inline-block;
      font-size: 0.82rem;
      color: #6b7280;
      text-decoration: none;
      margin-bottom: 6px;
    }
    .back-link:hover { color: #111827; }
    h1 {
      margin: 0 0 4px;
      font-size: 1.8rem;
      font-weight: 800;
      color: #111827;
    }
    .subtitle { margin: 0; color: #6b7280; font-size: 0.9rem; }

    .btn-refresh {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border: 1.5px solid #d1d5db;
      border-radius: 10px;
      background: white;
      font: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      color: #374151;
    }
    .btn-refresh:hover:not(:disabled) { background: #f9fafb; }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

    .loading-bar {
      height: 3px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1);
      background-size: 200%;
      animation: shimmer 1.2s infinite;
      margin-bottom: 24px;
      border-radius: 2px;
    }
    @keyframes shimmer { 0% { background-position: -200%; } 100% { background-position: 200%; } }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: white;
      border: 1.5px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-blue .kpi-icon { background: #eff6ff; color: #2563eb; }
    .kpi-purple .kpi-icon { background: #f5f3ff; color: #7c3aed; }
    .kpi-green .kpi-icon { background: #f0fdf4; color: #16a34a; }
    .kpi-gray .kpi-icon { background: #f9fafb; color: #374151; }
    .kpi-content { flex: 1; min-width: 0; }
    .kpi-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: #111827;
      line-height: 1.2;
    }
    .kpi-value.positive { color: #16a34a; }
    .kpi-value.negative { color: #dc2626; }
    .kpi-currency { font-size: 0.75rem; font-weight: 600; color: #6b7280; }
    .kpi-label { font-size: 0.82rem; color: #6b7280; margin-top: 3px; }

    /* Section cards */
    .section-card {
      background: white;
      border: 1.5px solid #e5e7eb;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }
    .section-header h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: #111827;
    }
    .count-badge {
      background: #f3f4f6;
      color: #6b7280;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    /* Monthly table */
    .monthly-table { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    th {
      text-align: left;
      padding: 10px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 2px solid #f3f4f6;
    }
    th.num { text-align: right; }
    td {
      padding: 12px 12px;
      border-bottom: 1px solid #f9fafb;
      color: #374151;
    }
    td.num { text-align: right; }
    tr:last-child td { border-bottom: none; }
    .month-cell { font-weight: 600; color: #111827; }
    .amount { color: #7c3aed; font-weight: 600; }
    .cost { color: #6b7280; }
    .gain-pos { color: #16a34a; font-weight: 700; }
    .gain-neg { color: #dc2626; font-weight: 700; }
    tfoot .total-row td {
      border-top: 2px solid #e5e7eb;
      font-weight: 700;
      background: #f9fafb;
    }

    /* Products table */
    .products-table-wrap { overflow-x: auto; }
    .products-table { min-width: 800px; }
    .products-table th { white-space: nowrap; }
    .product-name-cell { min-width: 180px; }
    .product-name { font-weight: 700; color: #111827; margin-bottom: 4px; }
    .completion-bar {
      height: 4px;
      background: #f3f4f6;
      border-radius: 2px;
      margin: 4px 0 2px;
      overflow: hidden;
    }
    .completion-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      border-radius: 2px;
      transition: width 0.3s;
    }
    .completion-text { font-size: 0.72rem; color: #6b7280; }
    .price-col { color: #374151; }
    .curr { font-size: 0.72rem; color: #9ca3af; margin-left: 2px; }
    .na { color: #d1d5db; }
    .badge-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #6b7280;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0 6px;
    }
    .badge-count-green { background: #dcfce7; color: #166534; }
    .row-positive { background: #fafffe; }
    .row-negative { background: #fffafa; }
    .gain-cell { vertical-align: top; }
    .gain-value { font-size: 0.95rem; font-weight: 800; }
    .gain-pct {
      font-size: 0.7rem;
      color: #6b7280;
      margin-top: 2px;
    }
    .gain-pos .gain-value { color: #16a34a; }
    .gain-neg .gain-value { color: #dc2626; }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #9ca3af;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .empty-state p { margin: 0; color: #6b7280; }
    .empty-hint { font-size: 0.82rem; color: #9ca3af; max-width: 480px; }

    .error-state {
      text-align: center;
      padding: 48px;
      color: #6b7280;
    }
    .btn-primary {
      margin-top: 12px;
      padding: 10px 20px;
      border: 0;
      border-radius: 10px;
      background: #111827;
      color: white;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .page { padding: 16px; }
      .kpi-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CatalogSalesAdminPageComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  readonly loading = signal(false);
  readonly report = signal<SalesReport | null>(null);

  readonly totalRealCost = computed(() =>
    (this.report()?.monthly ?? []).reduce((sum, m) => sum + m.totalRealCost, 0)
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.catalogService.getSalesReport().subscribe({
      next: (data) => {
        this.report.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.report.set(null);
        this.loading.set(false);
      },
    });
  }

  formatMonth(ym: string): string {
    const [year, month] = ym.split('-');
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${months[Number(month) - 1]} ${year}`;
  }
}
